-- ============================================================
-- Reservas seguras: máximo 2 vehículos por hora + cierre de días
--
-- POR QUÉ ESTO VA EN LA BASE DE DATOS Y NO EN LA PÁGINA:
-- Si dos personas reservan la misma hora al mismo tiempo, ambas
-- páginas consultan "¿cuántas citas hay?", ambas ven 1, y ambas
-- insertan. Resultado: 3 citas. Validar en el navegador NO puede
-- evitarlo. Estas funciones usan un candado de Postgres para que
-- las reservas de un mismo día se atiendan de una en una.
--
-- Correr en Supabase → SQL Editor → New query → Run
-- ============================================================

-- Cuántos vehículos se pueden atender por hora
create or replace function public.cupos_por_hora()
returns int language sql immutable as $$ select 2 $$;


-- ------------------------------------------------------------
-- Crear una cita validando cupo y día cerrado, todo junto
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
begin
  -- Nadie puede agendar a nombre de otra persona
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;

  -- Candado por día: mientras alguien reserva (o el admin cierra) ese día,
  -- los demás esperan su turno. Días distintos no se estorban entre sí.
  perform pg_advisory_xact_lock(hashtextextended(p_appointment_date::text, 0));

  -- ¿El negocio cerró ese día? (puede haber pasado hace un segundo)
  if exists (select 1 from public.dias_cerrados where fecha = p_appointment_date) then
    raise exception 'DIA_CERRADO';
  end if;

  -- ¿Ya pasó la fecha?
  if p_appointment_date < (now() at time zone 'America/Costa_Rica')::date then
    raise exception 'FECHA_PASADA';
  end if;

  -- ¿Queda cupo en esa hora?
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
-- Cuántas citas hay por hora en un día (para pintar los horarios)
-- ------------------------------------------------------------
create or replace function public.cupos_ocupados(p_fecha date)
returns table (hora time, ocupados bigint)
language sql
security definer
set search_path = public
as $$
  select appointment_time, count(*)
  from public.appointments
  where appointment_date = p_fecha
  group by appointment_time
$$;

grant execute on function public.cupos_ocupados(date) to authenticated, anon;


-- ------------------------------------------------------------
-- Cerrar días: guarda los cierres y cancela las citas de esos días.
-- Devuelve las citas canceladas, incluidas las que entraron en el
-- último segundo, para que el admin pueda avisarles.
-- ------------------------------------------------------------
create or replace function public.cerrar_dias(p_fechas date[])
returns setof public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fecha date;
begin
  if not exists (
    select 1 from public.perfiles
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'NO_AUTORIZADO';
  end if;

  -- El mismo candado que usan las reservas: si un cliente está
  -- reservando ese día justo ahora, se espera a que termine y su
  -- cita aparece en la lista de canceladas.
  foreach v_fecha in array p_fechas loop
    perform pg_advisory_xact_lock(hashtextextended(v_fecha::text, 0));
  end loop;

  insert into public.dias_cerrados (fecha)
  select unnest(p_fechas)
  on conflict (fecha) do nothing;

  return query
  delete from public.appointments
  where appointment_date = any(p_fechas)
  returning *;
end;
$$;

revoke all on function public.cerrar_dias(date[]) from public, anon;
grant execute on function public.cerrar_dias(date[]) to authenticated;


-- ------------------------------------------------------------
-- IMPORTANTE: cerrar la puerta de atrás
--
-- Si se puede seguir insertando directo en 'appointments', alguien
-- podría saltarse el control de cupo llamando a la API por su cuenta.
-- La página ya no inserta directo (usa crear_cita), así que se le
-- quita ese permiso. Leer y borrar sus propias citas sigue igual.
-- ------------------------------------------------------------
revoke insert on table public.appointments from anon, authenticated;
