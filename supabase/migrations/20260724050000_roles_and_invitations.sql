-- Module 21 (Roles and Permissions), first slice. The full spec (composable multi-role
-- grants, scope dimensions — self/team/department/location/reporting-hierarchy/custom
-- population —, segregation-of-duties conflict detection, time-boxed access) is a large,
-- separate build; this is deliberately just enough to make "admin" vs "employee" a real,
-- enforceable distinction: a single role per user, checked in RPC functions and reflected in
-- the UI. Building more of the full model now, with only one real role distinction actually
-- needed anywhere in the product yet, would be building ahead of any concrete requirement.
--
-- This slice also had to solve a prerequisite gap: until now there was no way for a second
-- person to join an existing tenant at all — every signup created a brand-new tenant via
-- provision_tenant(). Role-based permissions are meaningless with only one user per tenant
-- ever existing, so invite_user()/accept_pending_invitation() below exist to make a second
-- user possible in the first place, not as a Module 21 nice-to-have.

alter table public.profiles add column role text not null default 'employee' check (role in ('admin', 'employee'));

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  email text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index invitations_email_idx on public.invitations (email) where accepted_at is null;

alter table public.invitations enable row level security;
create policy "tenant_isolation" on public.invitations
  using (tenant_id = public.get_current_tenant_id());

-- provision_tenant() now makes its caller an admin of the tenant they're creating — they're
-- the one bootstrapping the company, so this is the one case where the role assignment isn't
-- itself gated by an existing admin (there isn't one yet).
create or replace function public.provision_tenant(company_name text, legal_entity_name text)
returns table (tenant_id uuid, organisation_id uuid, legal_entity_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_org_id uuid;
  v_legal_entity_id uuid;
begin
  if auth.uid() is null then
    raise exception 'provision_tenant requires an authenticated user';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and profiles.tenant_id is not null) then
    raise exception 'This account is already part of a tenant';
  end if;

  insert into public.tenants (name, status) values (company_name, 'active') returning id into v_tenant_id;
  insert into public.organisations (tenant_id, name) values (v_tenant_id, company_name) returning id into v_org_id;
  insert into public.legal_entities (tenant_id, organisation_id, name)
    values (v_tenant_id, v_org_id, legal_entity_name) returning id into v_legal_entity_id;

  insert into public.profiles (id, tenant_id, role)
    values (auth.uid(), v_tenant_id, 'admin')
    on conflict (id) do update set tenant_id = excluded.tenant_id, role = excluded.role;

  return query select v_tenant_id, v_org_id, v_legal_entity_id;
end;
$$;

-- Admin-only: create a pending invitation for an email to join the caller's tenant with a
-- given role. SECURITY INVOKER — the admin-check below runs as the caller, and the insert is
-- covered by the ordinary tenant_isolation policy like everything else.
create or replace function public.invite_user(p_email text, p_role text default 'employee')
returns public.invitations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_current_tenant_id();
  v_caller_role text;
  v_invitation public.invitations;
begin
  if v_tenant_id is null then
    raise exception 'No tenant context for the current user';
  end if;

  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can invite users';
  end if;

  if p_role not in ('admin', 'employee') then
    raise exception 'Invalid role: %', p_role;
  end if;

  insert into public.invitations (tenant_id, email, role, invited_by)
  values (v_tenant_id, lower(p_email), p_role, auth.uid())
  returning * into v_invitation;

  return v_invitation;
end;
$$;

-- SECURITY DEFINER, deliberately, for the same reason provision_tenant() is: a user who just
-- signed up has no tenant_id yet, so normal RLS blocks them from reading `invitations` at all
-- (tenant_isolation requires get_current_tenant_id(), which requires a tenant, which is exactly
-- what they don't have yet). This is the one place a lookup by email across all tenants is
-- intentional, not a bypass to be closed. Returns zero rows if there's no pending invitation —
-- the frontend's job is to fall back to the provision_tenant ("create a company") flow when
-- that happens, not this function's.
create or replace function public.accept_pending_invitation()
returns table (tenant_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_invitation record;
begin
  if auth.uid() is null then
    raise exception 'accept_pending_invitation requires an authenticated user';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and profiles.tenant_id is not null) then
    raise exception 'This account is already part of a tenant';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  select * into v_invitation from public.invitations
    where lower(email) = lower(v_email) and accepted_at is null
    order by created_at desc
    limit 1;

  if v_invitation.id is null then
    return;
  end if;

  update public.invitations set accepted_at = now() where id = v_invitation.id;

  insert into public.profiles (id, tenant_id, role)
    values (auth.uid(), v_invitation.tenant_id, v_invitation.role)
    on conflict (id) do update set tenant_id = excluded.tenant_id, role = excluded.role;

  return query select v_invitation.tenant_id, v_invitation.role;
end;
$$;
