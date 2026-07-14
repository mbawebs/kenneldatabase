-- Reemplaza kennels.featured (boolean) por featured_position (1-6, o
-- null si no esta destacado), para poder vender distintos lugares del
-- home a distinto precio en vez de un simple si/no.
alter table public.kennels
  add column if not exists featured_position integer
    check (featured_position is null or featured_position between 1 and 6);

alter table public.kennels drop column if exists featured;

-- Garantiza a nivel de base de datos que dos kennels nunca compartan
-- la misma posicion. Es un indice unico PARCIAL: solo aplica a filas
-- con featured_position no-null, asi que los muchos kennels sin
-- posicion asignada (NULL) no chocan entre si.
create unique index if not exists kennels_featured_position_unique
  on public.kennels (featured_position)
  where featured_position is not null;
