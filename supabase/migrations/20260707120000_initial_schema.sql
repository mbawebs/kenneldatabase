-- ============================================================
-- Kennel Database: esquema inicial
-- Tablas: admins, kennels, dogs, breedings, gallery, kennel_users
-- Incluye Row Level Security (RLS) y sus policies.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- Tablas
-- ============================================================

-- ADMINS: usuarios con acceso total a todos los kennels (super-admin).
-- No tiene columnas extra: la sola presencia de un user_id aqui
-- significa "este usuario es super-admin".
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- KENNELS: cada criadero registrado.
create table public.kennels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  cover_photo_url text,
  description text,
  country text,
  city text,
  phone text,
  email text,
  whatsapp text,
  instagram text,
  facebook text,
  status text not null default 'active',
  plan text not null default 'demo',
  created_at timestamptz not null default now()
);

-- DOGS: perros de cada kennel.
create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  kennel_id uuid not null references public.kennels (id) on delete cascade,
  name text not null,
  category text not null check (
    category in ('stud', 'female', 'available', 'production', 'puppy')
  ),
  breed text,
  color text,
  date_of_birth date,
  price text,
  description text,
  pedigree_url text,
  photos text[],
  status text not null default 'active',
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

-- BREEDINGS: camadas / cruces de cada kennel.
create table public.breedings (
  id uuid primary key default gen_random_uuid(),
  kennel_id uuid not null references public.kennels (id) on delete cascade,
  title text,
  sire_name text,
  dam_name text,
  description text,
  photos text[],
  date date,
  created_at timestamptz not null default now()
);

-- GALLERY: fotos sueltas de cada kennel.
create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  kennel_id uuid not null references public.kennels (id) on delete cascade,
  photo_url text not null,
  show_on_home boolean not null default true,
  display_order integer not null default 100,
  created_at timestamptz not null default now()
);

-- KENNEL_USERS: qué usuario puede editar qué kennel.
create table public.kennel_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kennel_id uuid not null references public.kennels (id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz not null default now(),
  unique (user_id, kennel_id)
);

-- Indices para acelerar los joins/filtros mas comunes.
create index dogs_kennel_id_idx on public.dogs (kennel_id);
create index breedings_kennel_id_idx on public.breedings (kennel_id);
create index gallery_kennel_id_idx on public.gallery (kennel_id);
create index kennel_users_kennel_id_idx on public.kennel_users (kennel_id);
create index kennel_users_user_id_idx on public.kennel_users (user_id);

-- ============================================================
-- Funciones auxiliares (SECURITY DEFINER)
--
-- Se usan dentro de las policies para evitar "recursion": si una
-- policy de kennel_users tuviera que consultar la propia tabla
-- kennel_users mientras Postgres evalua permisos sobre esa misma
-- tabla, se genera un ciclo. Estas funciones corren con permisos
-- elevados (bypasean RLS) solo para responder una pregunta puntual
-- de si/no, y son seguras porque no exponen datos, solo booleanos.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

create or replace function public.is_kennel_member(target_kennel_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.kennel_users
    where kennel_id = target_kennel_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.kennel_is_active(target_kennel_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.kennels
    where id = target_kennel_id
      and status = 'active'
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.admins enable row level security;
alter table public.kennels enable row level security;
alter table public.dogs enable row level security;
alter table public.breedings enable row level security;
alter table public.gallery enable row level security;
alter table public.kennel_users enable row level security;

-- ---------- ADMINS ----------
-- Solo los propios admins pueden ver quien mas es admin.
-- No hay policy de insert/update/delete: otorgar el rol de
-- super-admin es una accion sensible que se hace a mano desde el
-- SQL Editor de Supabase, nunca desde la app.
create policy "admins_select_admin_only"
  on public.admins for select
  using (public.is_admin());

-- ---------- KENNELS ----------
create policy "kennels_select_public_active_or_member"
  on public.kennels for select
  using (
    status = 'active'
    or public.is_admin()
    or public.is_kennel_member(id)
  );

-- Crear un kennel nuevo queda reservado a los admins por ahora:
-- todavia no existe un flujo de auto-registro publico. Cuando lo
-- construyamos, sera a traves de una funcion segura del lado del
-- servidor (no directo desde el navegador).
create policy "kennels_insert_admin_only"
  on public.kennels for insert
  with check (public.is_admin());

create policy "kennels_update_member_or_admin"
  on public.kennels for update
  using (public.is_admin() or public.is_kennel_member(id))
  with check (public.is_admin() or public.is_kennel_member(id));

create policy "kennels_delete_member_or_admin"
  on public.kennels for delete
  using (public.is_admin() or public.is_kennel_member(id));

-- ---------- DOGS ----------
create policy "dogs_select_public_active_or_member"
  on public.dogs for select
  using (
    public.kennel_is_active(kennel_id)
    or public.is_admin()
    or public.is_kennel_member(kennel_id)
  );

create policy "dogs_insert_member_or_admin"
  on public.dogs for insert
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "dogs_update_member_or_admin"
  on public.dogs for update
  using (public.is_admin() or public.is_kennel_member(kennel_id))
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "dogs_delete_member_or_admin"
  on public.dogs for delete
  using (public.is_admin() or public.is_kennel_member(kennel_id));

-- ---------- BREEDINGS ----------
create policy "breedings_select_public_active_or_member"
  on public.breedings for select
  using (
    public.kennel_is_active(kennel_id)
    or public.is_admin()
    or public.is_kennel_member(kennel_id)
  );

create policy "breedings_insert_member_or_admin"
  on public.breedings for insert
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "breedings_update_member_or_admin"
  on public.breedings for update
  using (public.is_admin() or public.is_kennel_member(kennel_id))
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "breedings_delete_member_or_admin"
  on public.breedings for delete
  using (public.is_admin() or public.is_kennel_member(kennel_id));

-- ---------- GALLERY ----------
create policy "gallery_select_public_active_or_member"
  on public.gallery for select
  using (
    public.kennel_is_active(kennel_id)
    or public.is_admin()
    or public.is_kennel_member(kennel_id)
  );

create policy "gallery_insert_member_or_admin"
  on public.gallery for insert
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "gallery_update_member_or_admin"
  on public.gallery for update
  using (public.is_admin() or public.is_kennel_member(kennel_id))
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "gallery_delete_member_or_admin"
  on public.gallery for delete
  using (public.is_admin() or public.is_kennel_member(kennel_id));

-- ---------- KENNEL_USERS ----------
-- No es contenido publico (no se muestra en ninguna landing page),
-- asi que aqui no hay condicion de "kennel activo": solo miembros
-- de ese kennel o admins pueden ver/editar quien pertenece a el.
create policy "kennel_users_select_member_or_admin"
  on public.kennel_users for select
  using (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "kennel_users_insert_member_or_admin"
  on public.kennel_users for insert
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "kennel_users_update_member_or_admin"
  on public.kennel_users for update
  using (public.is_admin() or public.is_kennel_member(kennel_id))
  with check (public.is_admin() or public.is_kennel_member(kennel_id));

create policy "kennel_users_delete_member_or_admin"
  on public.kennel_users for delete
  using (public.is_admin() or public.is_kennel_member(kennel_id));
