-- =============================================================================
-- Golf Tracker — Esquema PostgreSQL para Supabase
-- =============================================================================
--
-- Cómo ejecutar:
--   1. Abrí el SQL Editor en tu proyecto Supabase
--   2. Pegá y ejecutá este archivo completo
--
-- Requisitos:
--   - Proyecto Supabase con Auth habilitado (magic link)
--   - Ejecutar una sola vez en un proyecto vacío
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones
-- -----------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------

create type public.round_status as enum (
  'in_progress',
  'completed'
);

create type public.tri_state as enum (
  'yes',
  'no',
  'na'
);

-- -----------------------------------------------------------------------------
-- Tablas de referencia (canchas y hoyos)
-- -----------------------------------------------------------------------------

create table public.clubs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.clubs is 'Clubes de golf. Seed inicial: Jockey Club de Tucumán.';

create table public.courses (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs (id) on delete restrict,
  name         text not null,
  par          smallint not null check (par > 0),
  total_yards  integer not null check (total_yards > 0),
  created_at   timestamptz not null default now(),

  unique (club_id, name)
);

comment on table public.courses is 'Canchas de 18 hoyos. Seed inicial: Country y Alpa Sumaj.';

create table public.course_holes (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  number     smallint not null check (number between 1 and 18),
  par        smallint not null check (par between 3 and 5),
  hcp        smallint not null check (hcp between 1 and 18),
  yards      integer not null check (yards > 0),
  created_at timestamptz not null default now(),

  unique (course_id, number)
);

comment on table public.course_holes is 'Definición fija de cada hoyo (par, HCP de stroke index, yardas).';
comment on column public.course_holes.hcp is 'Handicap de stroke index del hoyo (1 = más difícil), no el HCP del jugador.';

create index course_holes_course_id_idx on public.course_holes (course_id);

-- -----------------------------------------------------------------------------
-- Perfiles de jugadores (extiende auth.users)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text,
  last_name   text,
  handicap    numeric(4, 1) check (handicap is null or handicap >= 0),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil del jugador. first_name, last_name y handicap se completan en el onboarding.';
comment on column public.profiles.handicap is 'HCP index del jugador. Acepta decimales (ej. 12.4).';

-- -----------------------------------------------------------------------------
-- Rondas
-- -----------------------------------------------------------------------------

create table public.rounds (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  course_id       uuid not null references public.courses (id) on delete restrict,
  played_on       date not null default current_date,
  status          public.round_status not null default 'in_progress',
  handicap_used   numeric(4, 1) not null check (handicap_used >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.rounds is 'Ronda de 18 hoyos. Una sola en progreso por jugador.';
comment on column public.rounds.played_on is 'Fecha de la ronda. Editable después de creada.';
comment on column public.rounds.handicap_used is 'HCP usado para calcular el score neto de esta ronda. Congelado al crear/editar la ronda.';

-- Un jugador solo puede tener una ronda en progreso a la vez
create unique index rounds_one_in_progress_per_user_idx
  on public.rounds (user_id)
  where status = 'in_progress';

create index rounds_user_id_played_on_idx on public.rounds (user_id, played_on desc);
create index rounds_user_id_status_idx on public.rounds (user_id, status);
create index rounds_course_id_idx on public.rounds (course_id);

-- -----------------------------------------------------------------------------
-- Estadísticas por hoyo dentro de una ronda
-- -----------------------------------------------------------------------------

create table public.hole_scores (
  id                 uuid primary key default gen_random_uuid(),
  round_id           uuid not null references public.rounds (id) on delete cascade,
  course_hole_id     uuid not null references public.course_holes (id) on delete restrict,
  score              smallint not null check (score between 1 and 15),
  fairway            public.tri_state not null default 'na',
  penalty_from_tee   public.tri_state not null default 'na',
  gir                boolean not null,
  putts              smallint not null check (putts between 0 and 10),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (round_id, course_hole_id)
);

comment on table public.hole_scores is 'Datos cargados por el jugador para un hoyo dentro de una ronda.';
comment on column public.hole_scores.fairway is 'Sí / No / No aplica. No aplica no entra en % fairways.';
comment on column public.hole_scores.penalty_from_tee is 'Sí / No / No aplica. No aplica no entra en stats de driving.';

create index hole_scores_round_id_idx on public.hole_scores (round_id);
create index hole_scores_course_hole_id_idx on public.hole_scores (course_hole_id);

-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

comment on function public.handle_new_user is 'Crea un perfil vacío cuando un jugador se registra vía magic link.';

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger rounds_set_updated_at
  before update on public.rounds
  for each row execute function public.set_updated_at();

create trigger hole_scores_set_updated_at
  before update on public.hole_scores
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------

alter table public.clubs enable row level security;
alter table public.courses enable row level security;
alter table public.course_holes enable row level security;
alter table public.profiles enable row level security;
alter table public.rounds enable row level security;
alter table public.hole_scores enable row level security;

-- Referencia: lectura para usuarios autenticados
create policy "clubs_select_authenticated"
  on public.clubs for select
  to authenticated
  using (true);

create policy "courses_select_authenticated"
  on public.courses for select
  to authenticated
  using (true);

create policy "course_holes_select_authenticated"
  on public.course_holes for select
  to authenticated
  using (true);

-- Perfil: cada jugador solo ve y edita el suyo
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Rondas: cada jugador solo gestiona las suyas
create policy "rounds_select_own"
  on public.rounds for select
  to authenticated
  using (user_id = auth.uid());

create policy "rounds_insert_own"
  on public.rounds for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "rounds_update_own"
  on public.rounds for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "rounds_delete_own"
  on public.rounds for delete
  to authenticated
  using (user_id = auth.uid());

-- Hole scores: solo si la ronda pertenece al jugador
create policy "hole_scores_select_own"
  on public.hole_scores for select
  to authenticated
  using (
    exists (
      select 1
      from public.rounds r
      where r.id = hole_scores.round_id
        and r.user_id = auth.uid()
    )
  );

create policy "hole_scores_insert_own"
  on public.hole_scores for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.rounds r
      where r.id = hole_scores.round_id
        and r.user_id = auth.uid()
    )
  );

create policy "hole_scores_update_own"
  on public.hole_scores for update
  to authenticated
  using (
    exists (
      select 1
      from public.rounds r
      where r.id = hole_scores.round_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.rounds r
      where r.id = hole_scores.round_id
        and r.user_id = auth.uid()
    )
  );

create policy "hole_scores_delete_own"
  on public.hole_scores for delete
  to authenticated
  using (
    exists (
      select 1
      from public.rounds r
      where r.id = hole_scores.round_id
        and r.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Storage: bucket para avatares
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "avatars_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Convención de path para avatares: avatars/{user_id}/avatar.webp

-- -----------------------------------------------------------------------------
-- Seed: Jockey Club de Tucumán
-- -----------------------------------------------------------------------------

insert into public.clubs (name)
values ('Jockey Club de Tucumán');

-- Country
with club as (
  select id from public.clubs where name = 'Jockey Club de Tucumán'
),
new_course as (
  insert into public.courses (club_id, name, par, total_yards)
  select id, 'Country', 71, 6910 from club
  returning id
)
insert into public.course_holes (course_id, number, par, hcp, yards)
select
  new_course.id,
  v.number,
  v.par,
  v.hcp,
  v.yards
from new_course
cross join (
  values
    (1,  5,  5, 591),
    (2,  3, 17, 179),
    (3,  4,  7, 405),
    (4,  4,  3, 441),
    (5,  5,  9, 502),
    (6,  3, 15, 196),
    (7,  4, 11, 421),
    (8,  4, 13, 348),
    (9,  4,  1, 414),
    (10, 5,  6, 574),
    (11, 4,  4, 452),
    (12, 4, 12, 373),
    (13, 3, 18, 214),
    (14, 4, 14, 387),
    (15, 4,  8, 411),
    (16, 3, 16, 183),
    (17, 4, 10, 384),
    (18, 4,  2, 435)
) as v(number, par, hcp, yards);

-- Alpa Sumaj
with club as (
  select id from public.clubs where name = 'Jockey Club de Tucumán'
),
new_course as (
  insert into public.courses (club_id, name, par, total_yards)
  select id, 'Alpa Sumaj', 71, 6499 from club
  returning id
)
insert into public.course_holes (course_id, number, par, hcp, yards)
select
  new_course.id,
  v.number,
  v.par,
  v.hcp,
  v.yards
from new_course
cross join (
  values
    (1,  4,  3, 442),
    (2,  3, 13, 148),
    (3,  5,  7, 515),
    (4,  4,  9, 385),
    (5,  4,  5, 392),
    (6,  3, 15, 165),
    (7,  4,  1, 455),
    (8,  4, 17, 283),
    (9,  4, 11, 350),
    (10, 4,  8, 423),
    (11, 4,  2, 398),
    (12, 4,  4, 425),
    (13, 3, 14, 182),
    (14, 5, 12, 507),
    (15, 4,  6, 444),
    (16, 3, 16, 164),
    (17, 4, 18, 341),
    (18, 5, 10, 480)
) as v(number, par, hcp, yards);

-- -----------------------------------------------------------------------------
-- Verificación rápida (opcional — podés comentar esta sección)
-- -----------------------------------------------------------------------------

-- select c.name as cancha, count(h.id) as hoyos, c.par, c.total_yards
-- from public.courses c
-- join public.course_holes h on h.course_id = c.id
-- group by c.id, c.name, c.par, c.total_yards
-- order by c.name;
