-- ============================================================
-- Tabla: dias_cerrados
-- Guarda las fechas específicas en que el negocio no abrirá.
-- Correr este script en Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.dias_cerrados (
  id bigint generated always as identity primary key,
  fecha date not null unique,
  created_at timestamptz not null default now()
);

alter table public.dias_cerrados enable row level security;

-- Cualquiera puede LEER los días cerrados
-- (los clientes necesitan saber qué días no pueden agendar)
drop policy if exists "dias_cerrados_lectura_publica" on public.dias_cerrados;
create policy "dias_cerrados_lectura_publica"
  on public.dias_cerrados
  for select
  using (true);

-- Solo los administradores pueden CERRAR días
drop policy if exists "dias_cerrados_insert_admin" on public.dias_cerrados;
create policy "dias_cerrados_insert_admin"
  on public.dias_cerrados
  for insert
  with check (
    exists (
      select 1 from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.is_admin = true
    )
  );

-- Solo los administradores pueden REABRIR días
drop policy if exists "dias_cerrados_delete_admin" on public.dias_cerrados;
create policy "dias_cerrados_delete_admin"
  on public.dias_cerrados
  for delete
  using (
    exists (
      select 1 from public.perfiles
      where perfiles.id = auth.uid()
        and perfiles.is_admin = true
    )
  );
