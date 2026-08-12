-- ============================================================
-- Cada cliente solo puede ver y borrar LO SUYO
--
-- Antes bastaba con escribir el teléfono de otra persona para ver
-- sus citas y borrárselas. Esto lo cierra en la base de datos, que
-- es el único lugar donde no se puede esquivar: aunque alguien
-- llame la API por su cuenta, no va a poder tocar datos ajenos.
--
-- Correr en Supabase → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- CITAS: ver y borrar solo las propias (el admin sigue viendo todo)
-- ------------------------------------------------------------
alter table public.appointments enable row level security;

drop policy if exists "appointments_select_propias" on public.appointments;
create policy "appointments_select_propias"
  on public.appointments for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "appointments_delete_propias" on public.appointments;
create policy "appointments_delete_propias"
  on public.appointments for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  );

-- Nota: los horarios disponibles se siguen viendo bien porque
-- cupos_ocupados() es "security definer" y cuenta por su cuenta,
-- sin depender de lo que cada cliente pueda leer.


-- ------------------------------------------------------------
-- OPINIONES: las del cliente que está con la sesión abierta.
-- No hace falta el teléfono: se sabe quién es por su sesión.
-- ------------------------------------------------------------
create or replace function public.mis_opiniones()
returns setof public.testimonials
language sql
security definer
set search_path = public
as $$
  select *
  from public.testimonials
  where user_id = auth.uid()
  order by created_at desc
$$;

grant execute on function public.mis_opiniones() to authenticated;


-- ------------------------------------------------------------
-- (Se deja endurecida por si quedó alguna llamada vieja)
-- ------------------------------------------------------------
create or replace function public.opiniones_por_telefono(p_telefono text)
returns setof public.testimonials
language sql
security definer
set search_path = public
as $$
  select *
  from public.testimonials
  where user_id = auth.uid()
    and customer_phone = p_telefono
  order by created_at desc
$$;

grant execute on function public.opiniones_por_telefono(text) to authenticated;
