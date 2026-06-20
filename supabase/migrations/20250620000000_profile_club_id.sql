-- Perfil: club del que el jugador es socio

alter table public.profiles
  add column if not exists club_id uuid references public.clubs (id) on delete restrict;

comment on column public.profiles.club_id is 'Club del que el jugador es socio.';

create index if not exists profiles_club_id_idx on public.profiles (club_id);
