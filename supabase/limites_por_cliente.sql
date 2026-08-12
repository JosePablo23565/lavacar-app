-- ============================================================
-- Límites por cliente:
--   · 1 cita activa (puede volver a agendar 2 h después de la suya)
--   · máximo 2 opiniones
--
-- Igual que el cupo por hora, esto va en la base de datos: si el
-- control estuviera solo en la página, bastaría con recargarla o
-- llamar la API a mano para saltárselo.
--
-- Correr en Supabase → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. Columnas que faltan en testimonials
--    (dueño de la opinión y teléfono para poder buscarlas)
-- ------------------------------------------------------------
alter table public.testimonials add column if not exists user_id uuid;
alter table public.testimonials add column if not exists customer_phone text;

-- Rellenar las opiniones que ya existen, cruzando por correo
update public.testimonials t
set user_id = p.id
from public.perfiles p
where t.user_id is null
  and lower(btrim(t.email)) = lower(btrim(p.email));

update public.testimonials t
set customer_phone = p.telefono
from public.perfiles p
where t.customer_phone is null
  and t.user_id = p.id;

create index if not exists testimonials_user_id_idx on public.testimonials(user_id);
create index if not exists testimonials_phone_idx  on public.testimonials(customer_phone);


-- ------------------------------------------------------------
-- 2. Cuántas opiniones puede dejar cada cliente
-- ------------------------------------------------------------
create or replace function public.max_opiniones()
returns int language sql immutable as $$ select 2 $$;

-- Horas que deben pasar desde la cita para poder agendar otra
create or replace function public.horas_espera_cita()
returns int language sql immutable as $$ select 2 $$;


-- ------------------------------------------------------------
-- 3. Crear cita: cupo por hora + día cerrado + 1 cita por cliente
-- ------------------------------------------------------------
create or replace function public.crear_cita(
  p_customer_name   text,
  p_customer_phone  text,
  p_service_type    text,
  p_vehicle_type    text,
  p_vehicle_model   text,
  p_appointment_date date,
  p_appointment_time time,
  p_notes           text,
  p_email           text,
  p_user_id         uuid
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cita     public.appointments;
  v_ocupados int;
  v_ahora    timestamp;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;

  v_ahora := now() at time zone 'America/Costa_Rica';

  -- Candados: primero el del cliente, después el del día.
  -- Siempre en ese orden, para que no se traben entre sí.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_appointment_date::text, 0));

  -- Una sola cita activa por cliente
  if exists (
    select 1 from public.appointments
    where user_id = p_user_id
      and (appointment_date + appointment_time)
          > (v_ahora - make_interval(hours => public.horas_espera_cita()))
  ) then
    raise exception 'YA_TIENE_CITA';
  end if;

  if exists (select 1 from public.dias_cerrados where fecha = p_appointment_date) then
    raise exception 'DIA_CERRADO';
  end if;

  if p_appointment_date < v_ahora::date then
    raise exception 'FECHA_PASADA';
  end if;

  select count(*) into v_ocupados
  from public.appointments
  where appointment_date = p_appointment_date
    and appointment_time = p_appointment_time;

  if v_ocupados >= public.cupos_por_hora() then
    raise exception 'CUPO_LLENO';
  end if;

  insert into public.appointments (
    customer_name, customer_phone, email, service_type,
    vehicle_type, vehicle_model, appointment_date, appointment_time,
    notes, user_id
  ) values (
    p_customer_name, p_customer_phone, p_email, p_service_type,
    p_vehicle_type, p_vehicle_model, p_appointment_date, p_appointment_time,
    nullif(btrim(coalesce(p_notes, '')), ''), p_user_id
  )
  returning * into v_cita;

  return v_cita;
end;
$$;

revoke all on function public.crear_cita(text,text,text,text,text,date,time,text,text,uuid) from public, anon;
grant execute on function public.crear_cita(text,text,text,text,text,date,time,text,text,uuid) to authenticated;


-- ------------------------------------------------------------
-- 4. La cita activa del cliente (para bloquear el botón y avisarle)
-- ------------------------------------------------------------
create or replace function public.mi_cita_activa()
returns public.appointments
language sql
security definer
set search_path = public
as $$
  select *
  from public.appointments
  where user_id = auth.uid()
    and (appointment_date + appointment_time)
        > ((now() at time zone 'America/Costa_Rica')
           - make_interval(hours => public.horas_espera_cita()))
  order by appointment_date, appointment_time
  limit 1
$$;

grant execute on function public.mi_cita_activa() to authenticated;


-- ------------------------------------------------------------
-- 5. Crear opinión con tope de 2 por cliente
-- ------------------------------------------------------------
create or replace function public.crear_opinion(p_comment text, p_rating int)
returns public.testimonials
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.perfiles;
  v_op     public.testimonials;
  v_total  int;
begin
  if auth.uid() is null then
    raise exception 'NO_AUTORIZADO';
  end if;

  if p_rating < 1 or p_rating > 5 then
    raise exception 'CALIFICACION_INVALIDA';
  end if;

  if btrim(coalesce(p_comment, '')) = '' then
    raise exception 'COMENTARIO_VACIO';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  select count(*) into v_total
  from public.testimonials
  where user_id = auth.uid();

  if v_total >= public.max_opiniones() then
    raise exception 'LIMITE_OPINIONES';
  end if;

  select * into v_perfil from public.perfiles where id = auth.uid();

  insert into public.testimonials (
    customer_name, email, customer_phone, comment, rating, is_approved, user_id
  ) values (
    coalesce(v_perfil.nombre, ''), v_perfil.email, v_perfil.telefono,
    btrim(p_comment), p_rating, false, auth.uid()
  )
  returning * into v_op;

  return v_op;
end;
$$;

revoke all on function public.crear_opinion(text,int) from public, anon;
grant execute on function public.crear_opinion(text,int) to authenticated;


-- ------------------------------------------------------------
-- 6. Buscar las opiniones de un teléfono (para "Mis opiniones")
-- ------------------------------------------------------------
create or replace function public.opiniones_por_telefono(p_telefono text)
returns setof public.testimonials
language sql
security definer
set search_path = public
as $$
  select *
  from public.testimonials
  where customer_phone = p_telefono
  order by created_at desc
$$;

grant execute on function public.opiniones_por_telefono(text) to authenticated;


-- ------------------------------------------------------------
-- 7. Cada cliente puede editar y borrar SOLO sus propias opiniones
-- ------------------------------------------------------------
alter table public.testimonials enable row level security;

-- LECTURA: las aprobadas las ve cualquiera, las propias su dueño,
-- y el admin ve todas (incluidas las pendientes de aprobar)
drop policy if exists "testimonials_select" on public.testimonials;
create policy "testimonials_select"
  on public.testimonials for select
  using (
    is_approved = true
    or user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  );

-- EDICIÓN: el dueño edita la suya y el admin puede aprobar cualquiera
drop policy if exists "testimonials_update_propias" on public.testimonials;
create policy "testimonials_update_propias"
  on public.testimonials for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "testimonials_delete_propias" on public.testimonials;
create policy "testimonials_delete_propias"
  on public.testimonials for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  );

-- Sin esto se podría insertar directo y saltarse el tope de 2
revoke insert on table public.testimonials from anon, authenticated;
