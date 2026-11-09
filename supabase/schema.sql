-- =============================================================================
-- Sistema Integral de Gestión Odontológica - Esquema de base de datos (Supabase / PostgreSQL)
--
-- Cómo usarlo: Supabase → SQL Editor → New query → pega TODO este archivo → Run.
-- Es seguro volver a ejecutarlo (usa "if not exists", "or replace" y "drop ... if exists").
--
-- Qué garantiza el SERVIDOR (no se puede saltar desde el navegador):
--   1. Solo usuarios autenticados con un perfil válido acceden a los datos.
--   2. Roles: admin, odontologo, recepcionista (ver políticas RLS más abajo).
--   3. Las notas de evolución las firma solo un odontólogo; el servidor fija autor,
--      cédula, fecha/hora y calcula el hash SHA-256 de sellado.
--   4. Notas, consentimientos y bitácora de auditoría son INMUTABLES (sin UPDATE/DELETE).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Perfiles de usuario (extiende auth.users con nombre, rol y cédula)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text not null default '',
  role        text not null default 'recepcionista'
              check (role in ('admin', 'odontologo', 'recepcionista')),
  license     text,                       -- cédula profesional (odontólogos)
  created_at  timestamptz not null default now()
);

-- Todo usuario nuevo nace como 'recepcionista'. El rol NUNCA se toma de lo que envíe
-- el navegador: solo un admin puede cambiarlo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Perfiles para usuarios que ya existieran antes de ejecutar este script
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- 2. Funciones auxiliares de rol
-- -----------------------------------------------------------------------------
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_role() in ('admin', 'odontologo', 'recepcionista'), false)
$$;

create or replace function public.is_clinician()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_role() in ('admin', 'odontologo'), false)
$$;


-- -----------------------------------------------------------------------------
-- 3. Tablas de la clínica
--    Cada tabla guarda el objeto completo de la app en "data" (JSONB) más las
--    columnas necesarias para claves, relaciones, orden y seguridad.
-- -----------------------------------------------------------------------------
create table if not exists public.patients (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.appointments (
  id          text primary key,
  patient_id  text not null references public.patients (id),
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.odontograms (
  patient_id  text primary key references public.patients (id),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.evolution_notes (
  id              text primary key,
  patient_id      text not null references public.patients (id),
  data            jsonb not null,
  integrity_hash  text,
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now()
);

create table if not exists public.signed_consents (
  id          text primary key,
  patient_id  text not null references public.patients (id),
  data        jsonb not null,
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id          text primary key,
  data        jsonb not null,
  user_id     uuid default auth.uid(),
  created_at  timestamptz not null default now()
);

create index if not exists idx_appointments_patient on public.appointments (patient_id);
create index if not exists idx_notes_patient        on public.evolution_notes (patient_id, created_at desc);
create index if not exists idx_consents_patient     on public.signed_consents (patient_id, created_at desc);
create index if not exists idx_audit_created        on public.audit_logs (created_at desc);


-- -----------------------------------------------------------------------------
-- 4. Triggers
-- -----------------------------------------------------------------------------

-- 4.1 updated_at automático
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_patients on public.patients;
create trigger trg_touch_patients before update on public.patients
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_appointments on public.appointments;
create trigger trg_touch_appointments before update on public.appointments
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_odontograms on public.odontograms;
create trigger trg_touch_odontograms before update on public.odontograms
  for each row execute function public.touch_updated_at();

-- 4.2 Sellado de notas de evolución (NOM-004-SSA3-2012)
--     Cuando escribe un usuario autenticado, el servidor impone autor, cédula, fecha y hora
--     (zona America/Mexico_City) y calcula el hash SHA-256 sobre el contenido final.
--     Si se inserta desde el SQL Editor (auth.uid() nulo, por ejemplo el seed), se respetan
--     los datos recibidos y solo se calcula el hash.
create or replace function public.seal_evolution_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p       public.profiles%rowtype;
  payload text;
begin
  if auth.uid() is not null then
    new.created_at := now();
    new.created_by := auth.uid();

    select * into p from public.profiles where id = auth.uid();
    if found then
      new.data := new.data || jsonb_build_object(
        'doctorName',    p.full_name,
        'doctorLicense', coalesce(p.license, '')
      );
    end if;

    new.data := new.data || jsonb_build_object(
      'date',              to_char(now() at time zone 'America/Mexico_City', 'YYYY-MM-DD'),
      'time',              to_char(now() at time zone 'America/Mexico_City', 'HH24:MI'),
      'signatureDate',     to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'isSignedAndLocked', true
    );
  end if;

  new.data := new.data - 'integrityHash';

  payload := new.id || '|' || new.patient_id || '|' || coalesce(new.created_by::text, '') || '|'
          || to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|'
          || new.data::text;

  new.integrity_hash := 'SHA256-' || upper(encode(sha256(convert_to(payload, 'utf8')), 'hex'));
  new.data := new.data || jsonb_build_object('integrityHash', new.integrity_hash);
  return new;
end;
$$;

drop trigger if exists trg_seal_evolution_note on public.evolution_notes;
create trigger trg_seal_evolution_note before insert on public.evolution_notes
  for each row execute function public.seal_evolution_note();

-- 4.3 Inmutabilidad: notas, consentimientos y auditoría no se editan ni se borran
create or replace function public.block_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Registro inmutable: no se permite % sobre %', tg_op, tg_table_name;
end;
$$;

drop trigger if exists trg_immutable_notes on public.evolution_notes;
create trigger trg_immutable_notes before update or delete on public.evolution_notes
  for each row execute function public.block_changes();

drop trigger if exists trg_immutable_consents on public.signed_consents;
create trigger trg_immutable_consents before update or delete on public.signed_consents
  for each row execute function public.block_changes();

drop trigger if exists trg_immutable_audit on public.audit_logs;
create trigger trg_immutable_audit before update or delete on public.audit_logs
  for each row execute function public.block_changes();

-- 4.4 Verificación de integridad: recalcula el hash y lo compara con el guardado.
--     Uso desde la app o la consola:  select public.verify_evolution_note('evo-01');
create or replace function public.verify_evolution_note(note_id text)
returns boolean
language sql
stable
as $$
  select n.integrity_hash = 'SHA256-' || upper(encode(sha256(convert_to(
           n.id || '|' || n.patient_id || '|' || coalesce(n.created_by::text, '') || '|'
           || to_char(n.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US') || '|'
           || (n.data - 'integrityHash')::text, 'utf8')), 'hex'))
  from public.evolution_notes n
  where n.id = note_id
$$;


-- -----------------------------------------------------------------------------
-- 5. Seguridad a nivel de fila (RLS)
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.patients        enable row level security;
alter table public.appointments    enable row level security;
alter table public.odontograms     enable row level security;
alter table public.evolution_notes enable row level security;
alter table public.signed_consents enable row level security;
alter table public.audit_logs      enable row level security;

-- profiles: cada quien ve su perfil; el admin ve y edita todos (incluido el rol)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.app_role() = 'admin');

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

-- patients y appointments: todo el personal lee, crea y modifica
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients for select to authenticated using (public.is_staff());
drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert to authenticated with check (public.is_staff());
drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments for select to authenticated using (public.is_staff());
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert to authenticated with check (public.is_staff());
drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- odontograms: todo el personal lee; solo odontólogo/admin escribe (recepción = solo lectura)
drop policy if exists odontograms_select on public.odontograms;
create policy odontograms_select on public.odontograms for select to authenticated using (public.is_staff());
drop policy if exists odontograms_insert on public.odontograms;
create policy odontograms_insert on public.odontograms for insert to authenticated with check (public.is_clinician());
drop policy if exists odontograms_update on public.odontograms;
create policy odontograms_update on public.odontograms for update to authenticated
  using (public.is_clinician()) with check (public.is_clinician());

-- evolution_notes: todo el personal lee; solo odontólogo/admin crea; nadie edita ni borra
drop policy if exists notes_select on public.evolution_notes;
create policy notes_select on public.evolution_notes for select to authenticated using (public.is_staff());
drop policy if exists notes_insert on public.evolution_notes;
create policy notes_insert on public.evolution_notes for insert to authenticated with check (public.is_clinician());

-- signed_consents: todo el personal lee y registra; nadie edita ni borra
drop policy if exists consents_select on public.signed_consents;
create policy consents_select on public.signed_consents for select to authenticated using (public.is_staff());
drop policy if exists consents_insert on public.signed_consents;
create policy consents_insert on public.signed_consents for insert to authenticated with check (public.is_staff());

-- audit_logs: todo el personal escribe (siempre a su nombre); solo odontólogo/admin consulta
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated using (public.is_clinician());
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (public.is_staff() and user_id = auth.uid());

-- Permisos de tabla (GRANT). Supabase ya no siempre los concede solos en proyectos nuevos,
-- así que se declaran explícitamente. Las políticas RLS de arriba deciden QUÉ FILAS se pueden usar.
grant usage on schema public to authenticated;
grant select, update           on public.profiles                                          to authenticated;
grant select, insert, update   on public.patients, public.appointments, public.odontograms to authenticated;
grant select, insert           on public.evolution_notes, public.signed_consents, public.audit_logs to authenticated;
grant execute on function public.app_role(), public.is_staff(), public.is_clinician() to authenticated;

-- Defensa en profundidad: sin acceso anónimo y sin UPDATE/DELETE/TRUNCATE en tablas inmutables
revoke all on public.profiles, public.patients, public.appointments, public.odontograms,
              public.evolution_notes, public.signed_consents, public.audit_logs from anon;
revoke update, delete, truncate on public.evolution_notes, public.signed_consents, public.audit_logs
  from anon, authenticated;
grant execute on function public.verify_evolution_note(text) to authenticated;


-- -----------------------------------------------------------------------------
-- 6. DESPUÉS de crear tus usuarios (Authentication → Users → Add user), asigna roles.
--    Ejemplos (cambia los correos y la cédula):
--
--    update public.profiles set role = 'admin',
--           full_name = 'Administrador General'
--     where email = 'admin@tu-escuela.mx';
--
--    update public.profiles set role = 'odontologo',
--           full_name = 'Dr. Alejandro Mendoza Herrera', license = '8472910'
--     where email = 'doctor@tu-escuela.mx';
--
--    update public.profiles set full_name = 'Lic. Patricia Morales'
--     where email = 'recepcion@tu-escuela.mx';   -- recepcionista (rol por defecto)
-- -----------------------------------------------------------------------------
