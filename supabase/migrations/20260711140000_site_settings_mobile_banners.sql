-- Los banners verticales de los costados se ocultan en movil/tablet
-- (no caben sin apretar el buscador). En su lugar, dos espacios
-- horizontales vendibles solo para esos anchos: uno arriba del
-- buscador y otro hasta abajo de la pagina.
alter table public.site_settings
  add column mobile_banner_top_image_url text,
  add column mobile_banner_top_link text,
  add column mobile_banner_bottom_image_url text,
  add column mobile_banner_bottom_link text;
