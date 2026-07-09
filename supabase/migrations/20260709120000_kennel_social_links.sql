-- Reemplaza los campos fijos whatsapp/instagram/facebook por una
-- lista flexible de links (social_links jsonb: [{platform, value}]).
-- Esto permite agregar cualquier combinacion de WhatsApp, Instagram,
-- Facebook, YouTube, TikTok, X o un sitio web propio, todos opcionales,
-- en vez de forzar campos especificos que no le sirven a todo mundo
-- (ej. WhatsApp casi no se usa en EUA).

alter table public.kennels
  add column social_links jsonb not null default '[]'::jsonb;

-- Migra los datos existentes (whatsapp/instagram/facebook) al nuevo
-- formato antes de borrar las columnas viejas, para no perder nada.
update public.kennels k
set social_links = coalesce(
  (
    select jsonb_agg(elem)
    from (
      values
        (case when k.whatsapp is not null then jsonb_build_object('platform', 'whatsapp', 'value', k.whatsapp) end),
        (case when k.instagram is not null then jsonb_build_object('platform', 'instagram', 'value', k.instagram) end),
        (case when k.facebook is not null then jsonb_build_object('platform', 'facebook', 'value', k.facebook) end)
    ) as t(elem)
    where elem is not null
  ),
  '[]'::jsonb
);

alter table public.kennels drop column whatsapp;
alter table public.kennels drop column instagram;
alter table public.kennels drop column facebook;
