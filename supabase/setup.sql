-- ============================================================
-- Autolavado Camaro Fraterno - configuracion de base de datos
--
-- Correr ENTERO en Supabase > SQL Editor > New query > Run.
-- Se puede repetir sin problema: no borra datos ni falla si
-- algo ya existe.
--
-- Por que tanta logica vive aca y no en la pagina: si dos
-- personas reservan la misma hora al mismo tiempo, ambas
-- consultan cuantas citas hay, ambas ven lo mismo y ambas
-- insertan. Validar en el navegador no puede evitarlo. Estas
-- funciones usan candados de Postgres para que las reservas de
-- un mismo dia se atiendan de una en una.
-- ============================================================


-- ============================================================
-- 1. Dias que el negocio cierra
-- ============================================================
create table if not exists public.dias_cerrados (
  id bigint generated always as identity primary key,
  fecha date not null unique,
  created_at timestamptz not null default now()
);

alter table public.dias_cerrados enable row level security;

-- Los clientes necesitan saber que dias no pueden agendar
drop policy if exists "dias_cerrados_lectura_publica" on public.dias_cerrados;
create policy "dias_cerrados_lectura_publica"
  on public.dias_cerrados for select using (true);

drop policy if exists "dias_cerrados_insert_admin" on public.dias_cerrados;
create policy "dias_cerrados_insert_admin"
  on public.dias_cerrados for insert
  with check (exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true));

drop policy if exists "dias_cerrados_delete_admin" on public.dias_cerrados;
create policy "dias_cerrados_delete_admin"
  on public.dias_cerrados for delete
  using (exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true));


-- ============================================================
-- 2. Limites del negocio
-- ============================================================
create or replace function public.cupos_por_hora()
returns int language sql immutable as $$ select 2 $$;

create or replace function public.max_opiniones()
returns int language sql immutable as $$ select 2 $$;

-- Horas que deben pasar desde su cita para poder agendar otra
create or replace function public.horas_espera_cita()
returns int language sql immutable as $$ select 2 $$;


-- ============================================================
-- 3. Columnas que faltan
-- ============================================================

-- Las citas no se borran: al pasar quedan como completadas, para que
-- el negocio conserve su historial de trabajo
alter table public.appointments add column if not exists estado text not null default 'pendiente';
alter table public.appointments add column if not exists duracion_minutos int not null default 30;

alter table public.appointments drop constraint if exists appointments_estado_valido;
alter table public.appointments add constraint appointments_estado_valido
  check (estado in ('pendiente', 'completada'));

-- Las citas que agenda el admin para gente que llega al local no
-- pertenecen a ninguna cuenta
alter table public.appointments alter column user_id drop not null;
alter table public.appointments alter column email drop not null;

-- De donde salio la cita: la agendo el cliente o la hizo el negocio
alter table public.appointments add column if not exists origen text not null default 'web';

alter table public.appointments drop constraint if exists appointments_origen_valido;
alter table public.appointments add constraint appointments_origen_valido
  check (origen in ('web', 'local'));

create index if not exists appointments_estado_idx on public.appointments(estado);
create index if not exists appointments_fecha_idx  on public.appointments(appointment_date);

alter table public.testimonials add column if not exists user_id uuid;
alter table public.testimonials add column if not exists customer_phone text;

-- Asociar las opiniones que ya existian, cruzando por correo
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

-- Un telefono, una cuenta. Evita que dos personas registren el mismo
-- numero y hace que buscar la cuenta por telefono no sea ambiguo.
do $ok$
begin
  if exists (
    select 1 from public.perfiles
    where telefono is not null and btrim(telefono) <> ''
    group by telefono having count(*) > 1
  ) then
    raise warning 'Hay telefonos repetidos en perfiles. No se creo la restriccion unica: revisalos y volve a correr este script.';
  else
    create unique index if not exists perfiles_telefono_unico
      on public.perfiles (telefono)
      where telefono is not null and btrim(telefono) <> '';
  end if;
end
$ok$;

create index if not exists testimonials_user_id_idx on public.testimonials(user_id);
create index if not exists testimonials_phone_idx  on public.testimonials(customer_phone);


-- ============================================================
-- 4. Crear cita
--    Valida en una sola operacion: que sea el mismo usuario,
--    que no tenga otra cita, que el dia no este cerrado, que la
--    fecha no haya pasado y que quede cupo en esa hora
-- ============================================================
-- La firma cambio al agregar la duracion: se quita la anterior
drop function if exists public.crear_cita(text,text,text,text,text,date,time,text,text,uuid);

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
  p_user_id         uuid,
  p_duracion        int
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
  v_cierre   time;
  v_fin      time;
begin
  if p_duracion is null or p_duracion <= 0 then
    raise exception 'DURACION_INVALIDA';
  end if;

  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'NO_AUTORIZADO';
  end if;

  v_ahora := now() at time zone 'America/Costa_Rica';

  -- Siempre en este orden para que no se traben entre si
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_appointment_date::text, 0));

  if exists (
    select 1 from public.appointments
    where user_id = p_user_id
      and estado = 'pendiente'
      -- Las que agendo el negocio no cuentan para el limite: el cliente
      -- puede seguir sacando la suya desde la pagina
      and origen = 'web'
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

  -- El trabajo debe caber antes de cerrar
  select to_timestamp(hora_fin, 'HH12:MI AM')::time into v_cierre
  from public.horarios
  where dia_semana = extract(dow from p_appointment_date)::int
    and activo = true;

  if v_cierre is null then
    raise exception 'DIA_NO_DISPONIBLE';
  end if;

  v_fin := p_appointment_time + make_interval(mins => p_duracion);

  if v_fin > v_cierre then
    raise exception 'NO_ALCANZA_EL_TIEMPO';
  end if;

  -- Cuentan las citas que se cruzan con este rango, no solo las que
  -- empiezan a la misma hora: un servicio de 90 min ocupa varias franjas
  select count(*) into v_ocupados
  from public.appointments a
  where a.appointment_date = p_appointment_date
    and a.estado = 'pendiente'
    and (a.appointment_time,
         a.appointment_time + make_interval(mins => a.duracion_minutos))
        overlaps
        (p_appointment_time, v_fin);

  if v_ocupados >= public.cupos_por_hora() then
    raise exception 'CUPO_LLENO';
  end if;

  insert into public.appointments (
    customer_name, customer_phone, email, service_type,
    vehicle_type, vehicle_model, appointment_date, appointment_time,
    notes, user_id, duracion_minutos, estado, origen
  ) values (
    p_customer_name, p_customer_phone, p_email, p_service_type,
    p_vehicle_type, p_vehicle_model, p_appointment_date, p_appointment_time,
    nullif(btrim(coalesce(p_notes, '')), ''), p_user_id, p_duracion, 'pendiente', 'web'
  )
  returning * into v_cita;

  return v_cita;
end;
$$;

revoke all on function public.crear_cita(text,text,text,text,text,date,time,text,text,uuid,int) from public, anon;
grant execute on function public.crear_cita(text,text,text,text,text,date,time,text,text,uuid,int) to authenticated;


-- ============================================================
-- 4b. Cita creada por el administrador
--     Para clientes que llegan al local o llaman por telefono.
--     No aplica el limite de una cita por persona (el cliente puede
--     traer un segundo vehiculo), pero SI el cupo de dos a la vez,
--     porque es lo que el local puede atender fisicamente
-- ============================================================
create or replace function public.crear_cita_admin(
  p_customer_name   text,
  p_customer_phone  text,
  p_service_type    text,
  p_vehicle_type    text,
  p_vehicle_model   text,
  p_appointment_date date,
  p_appointment_time time,
  p_notes           text,
  p_duracion        int
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cita     public.appointments;
  v_ocupados int;
  v_cierre   time;
  v_fin      time;
  v_dueno    uuid;
begin
  if not exists (
    select 1 from public.perfiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'NO_AUTORIZADO';
  end if;

  if btrim(coalesce(p_customer_name, '')) = '' then
    raise exception 'FALTA_NOMBRE';
  end if;

  if p_appointment_date < (now() at time zone 'America/Costa_Rica')::date then
    raise exception 'FECHA_PASADA';
  end if;

  -- El mismo candado que usan los clientes: si varios agendan a la vez
  -- en esa hora, se atienden de uno en uno
  perform pg_advisory_xact_lock(hashtextextended(p_appointment_date::text, 0));

  if exists (select 1 from public.dias_cerrados where fecha = p_appointment_date) then
    raise exception 'DIA_CERRADO';
  end if;

  select to_timestamp(hora_fin, 'HH12:MI AM')::time into v_cierre
  from public.horarios
  where dia_semana = extract(dow from p_appointment_date)::int
    and activo = true;

  if v_cierre is null then
    raise exception 'DIA_NO_DISPONIBLE';
  end if;

  v_fin := p_appointment_time + make_interval(mins => coalesce(p_duracion, 30));

  if v_fin > v_cierre then
    raise exception 'NO_ALCANZA_EL_TIEMPO';
  end if;

  -- El local solo puede atender dos vehiculos a la vez, venga la cita
  -- de la pagina o la haga el negocio
  select count(*) into v_ocupados
  from public.appointments a
  where a.appointment_date = p_appointment_date
    and a.estado = 'pendiente'
    and (a.appointment_time,
         a.appointment_time + make_interval(mins => a.duracion_minutos))
        overlaps
        (p_appointment_time, v_fin);

  if v_ocupados >= public.cupos_por_hora() then
    raise exception 'CUPO_LLENO';
  end if;

  -- Si ese telefono ya tiene cuenta, la cita queda a su nombre y el
  -- cliente la ve en Mis Citas. Si no, queda solo para el negocio.
  if p_customer_phone is not null and btrim(p_customer_phone) <> '' then
    select id into v_dueno
    from public.perfiles
    where telefono = btrim(p_customer_phone)
    limit 1;
  end if;

  insert into public.appointments (
    customer_name, customer_phone, email, service_type,
    vehicle_type, vehicle_model, appointment_date, appointment_time,
    notes, user_id, duracion_minutos, estado, origen
  ) values (
    btrim(p_customer_name), p_customer_phone, null, p_service_type,
    p_vehicle_type, p_vehicle_model, p_appointment_date, p_appointment_time,
    nullif(btrim(coalesce(p_notes, '')), ''), v_dueno,
    coalesce(p_duracion, 30), 'pendiente', 'local'
  )
  returning * into v_cita;

  return v_cita;
end;
$$;

revoke all on function public.crear_cita_admin(text,text,text,text,text,date,time,text,int) from public, anon;
grant execute on function public.crear_cita_admin(text,text,text,text,text,date,time,text,int) to authenticated;


-- ============================================================
-- 5. Consultas que usa la pagina
-- ============================================================

-- Citas del dia con su duracion, para calcular que franjas quedan libres
drop function if exists public.cupos_ocupados(date);

create or replace function public.citas_del_dia(p_fecha date)
returns table (hora time, duracion int)
language sql security definer set search_path = public
as $$
  select appointment_time, duracion_minutos
  from public.appointments
  where appointment_date = p_fecha
    and estado = 'pendiente'
$$;

grant execute on function public.citas_del_dia(date) to authenticated, anon;

-- La cita vigente del cliente, para bloquear el boton de agendar
create or replace function public.mi_cita_activa()
returns public.appointments
language sql security definer set search_path = public
as $$
  select *
  from public.appointments
  where user_id = auth.uid()
    and estado = 'pendiente'
    and origen = 'web'
    and (appointment_date + appointment_time)
        > ((now() at time zone 'America/Costa_Rica')
           - make_interval(hours => public.horas_espera_cita()))
  order by appointment_date, appointment_time
  limit 1
$$;

grant execute on function public.mi_cita_activa() to authenticated;


-- ============================================================
-- 6. Cerrar dias
--    Devuelve las citas canceladas, incluidas las que entraron
--    mientras el admin revisaba la lista
-- ============================================================
create or replace function public.cerrar_dias(p_fechas date[])
returns setof public.appointments
language plpgsql security definer set search_path = public
as $$
declare
  v_fecha date;
begin
  if not exists (
    select 1 from public.perfiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'NO_AUTORIZADO';
  end if;

  -- El mismo candado que usan las reservas
  foreach v_fecha in array p_fechas loop
    perform pg_advisory_xact_lock(hashtextextended(v_fecha::text, 0));
  end loop;

  insert into public.dias_cerrados (fecha)
  select unnest(p_fechas)
  on conflict (fecha) do nothing;

  -- Se borran porque son citas que nunca se atendieron: el negocio
  -- cerro ese dia. El historial guarda el trabajo hecho, no lo cancelado.
  return query
  delete from public.appointments
  where appointment_date = any(p_fechas)
    and estado = 'pendiente'
  returning *;
end;
$$;

revoke all on function public.cerrar_dias(date[]) from public, anon;
grant execute on function public.cerrar_dias(date[]) to authenticated;


-- ============================================================
-- 6b. Cerrar el dia de trabajo
--     Marca como completadas las citas que ya pasaron. No se borran:
--     son el historial del negocio
-- ============================================================
create or replace function public.completar_citas_pasadas()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_total int;
begin
  if not exists (
    select 1 from public.perfiles where id = auth.uid() and is_admin = true
  ) then
    raise exception 'NO_AUTORIZADO';
  end if;

  with hechas as (
    update public.appointments
    set estado = 'completada'
    where estado = 'pendiente'
      -- Se cuenta la hora de FIN: una cita en curso todavia no se cierra
      and (appointment_date + appointment_time
           + make_interval(mins => duracion_minutos))
          < (now() at time zone 'America/Costa_Rica')
    returning 1
  )
  select count(*) into v_total from hechas;

  return v_total;
end;
$$;

revoke all on function public.completar_citas_pasadas() from public, anon;
grant execute on function public.completar_citas_pasadas() to authenticated;


-- ============================================================
-- 7. Opiniones
-- ============================================================
create or replace function public.crear_opinion(p_comment text, p_rating int)
returns public.testimonials
language plpgsql security definer set search_path = public
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

create or replace function public.mis_opiniones()
returns setof public.testimonials
language sql security definer set search_path = public
as $$
  select * from public.testimonials
  where user_id = auth.uid()
  order by created_at desc
$$;

grant execute on function public.mis_opiniones() to authenticated;


-- ============================================================
-- 8. Cada cliente solo ve y toca lo suyo
--    El admin sigue viendo todo
-- ============================================================
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

alter table public.testimonials enable row level security;

-- Las aprobadas las ve cualquiera, las propias su dueno, el admin todas
drop policy if exists "testimonials_select" on public.testimonials;
create policy "testimonials_select"
  on public.testimonials for select
  using (
    is_approved = true
    or user_id = auth.uid()
    or exists (select 1 from public.perfiles where id = auth.uid() and is_admin = true)
  );

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


-- ============================================================
-- 9. Cerrar la puerta de atras
--    Sin esto se podria insertar directo por la API y saltarse
--    el cupo por hora y el tope de opiniones
-- ============================================================
revoke insert on table public.appointments from anon, authenticated;
revoke insert on table public.testimonials from anon, authenticated;
