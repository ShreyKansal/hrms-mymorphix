-- Module 13 (Documents and Letters), first slice only: employee document storage + preview.
-- Deliberately scoped down to what's buildable without dependencies that don't exist yet —
-- template-driven letter generation needs Module 17 (Workflow Engine, approval routing) and
-- Module 23 (e-signature); neither exists, so that part of Module 13 isn't started. This slice
-- is just: upload a file against an employee, list it, preview/download it, tenant-isolated.
--
-- Storage bucket is created via plain SQL (storage.buckets is just a table) rather than the
-- Supabase dashboard/CLI storage commands — keeps this in the same migration-driven, verifiable
-- workflow as every other schema change in this project, with no manual dashboard step to
-- forget when setting up a new environment.

insert into storage.buckets (id, name, public)
values ('employee-documents', 'employee-documents', false)
on conflict (id) do nothing;

-- Path convention: {tenant_id}/{employee_id}/{filename}. RLS reads the first path segment as
-- the tenant and compares it to get_current_tenant_id() — same tenant-isolation principle as
-- every table's RLS policy, just expressed via storage.foldername() instead of a tenant_id
-- column, since storage.objects has no such column of its own.
create policy "tenant_isolation_select" on storage.objects
  for select
  using (
    bucket_id = 'employee-documents'
    and (storage.foldername(name))[1] = public.get_current_tenant_id()::text
  );

create policy "tenant_isolation_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'employee-documents'
    and (storage.foldername(name))[1] = public.get_current_tenant_id()::text
  );

-- Metadata table — the bucket only stores bytes; this is what the UI actually lists/queries.
-- storage_path is the exact object path from the bucket, kept in lockstep by the client (single
-- upload flow, not multiple write paths that could drift).
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  employee_id uuid not null references public.employees(id),
  category text not null default 'other'
    check (category in ('resume', 'certificate', 'id_proof', 'offer_letter', 'other')),
  file_name text not null,
  storage_path text not null,
  content_type text,
  uploaded_at timestamptz not null default now()
);

create index documents_employee_idx on public.documents (tenant_id, employee_id);

alter table public.documents enable row level security;
create policy "tenant_isolation" on public.documents
  using (tenant_id = public.get_current_tenant_id());
