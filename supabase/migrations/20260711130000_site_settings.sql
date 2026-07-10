-- Configuracion visual del Home publico (no es por-kennel, es una
-- sola fila para todo el sitio): imagen del hero, banner de anuncio
-- arriba, y dos banners verticales laterales que se puedan vender
-- como publicidad. "id boolean primary key default true" + el check
-- de abajo es el truco clasico para forzar que esta tabla nunca
-- tenga mas de una fila.
create table public.site_settings (
  id boolean primary key default true,
  hero_image_url text,
  top_banner_text text,
  top_banner_link text,
  banner_left_image_url text,
  banner_left_link text,
  banner_right_image_url text,
  banner_right_link text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

insert into public.site_settings (id) values (true);

alter table public.site_settings enable row level security;

-- Lectura publica: el Home lo ve cualquiera, con o sin sesion.
create policy "site_settings_select_public"
  on public.site_settings for select
  using (true);

create policy "site_settings_update_admin_only"
  on public.site_settings for update
  using (public.is_admin())
  with check (public.is_admin());
