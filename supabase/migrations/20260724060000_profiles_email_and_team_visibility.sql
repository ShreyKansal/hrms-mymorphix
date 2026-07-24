-- Two gaps found while building the Team page (list teammates + invite):
--
-- 1. `profiles` has no email column, and `auth.users` isn't exposed via PostgREST — there was
--    no way for the client to show "who is this person" for anyone at all. Denormalizing email
--    onto `profiles` at the same moment tenant_id/role get set (provision_tenant(),
--    accept_pending_invitation()) avoids needing a cross-schema RPC just to read a list of
--    teammates' emails.
--
-- 2. profiles_self_select only ever let a user see their OWN profile row (`id = auth.uid()`).
--    That's correct for a single-user tenant, but a Team page needs to see every profile in the
--    tenant. Replaced with the same tenant_isolation shape every other table already uses —
--    get_current_tenant_id() reads profiles via its own SECURITY DEFINER privilege, so this
--    doesn't create circular RLS evaluation, same as it doesn't for any other table.

alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

drop policy "profiles_self_select" on public.profiles;
create policy "profiles_tenant_select" on public.profiles
  for select using (tenant_id = public.get_current_tenant_id());

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
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'provision_tenant requires an authenticated user';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and profiles.tenant_id is not null) then
    raise exception 'This account is already part of a tenant';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into public.tenants (name, status) values (company_name, 'active') returning id into v_tenant_id;
  insert into public.organisations (tenant_id, name) values (v_tenant_id, company_name) returning id into v_org_id;
  insert into public.legal_entities (tenant_id, organisation_id, name)
    values (v_tenant_id, v_org_id, legal_entity_name) returning id into v_legal_entity_id;

  insert into public.profiles (id, tenant_id, role, email)
    values (auth.uid(), v_tenant_id, 'admin', v_email)
    on conflict (id) do update set tenant_id = excluded.tenant_id, role = excluded.role, email = excluded.email;

  return query select v_tenant_id, v_org_id, v_legal_entity_id;
end;
$$;

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

  insert into public.profiles (id, tenant_id, role, email)
    values (auth.uid(), v_invitation.tenant_id, v_invitation.role, v_email)
    on conflict (id) do update set tenant_id = excluded.tenant_id, role = excluded.role, email = excluded.email;

  return query select v_invitation.tenant_id, v_invitation.role;
end;
$$;
