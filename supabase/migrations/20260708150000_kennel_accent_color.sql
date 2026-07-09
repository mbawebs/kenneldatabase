-- Color de acento configurable por kennel (usado en la landing publica
-- /[slug]): cada criadero puede elegir el color que mas combine con su
-- logo, en vez de un dorado/rojo fijo para todos. Se valida el formato
-- hex tanto aqui (defensa en profundidad) como en el Server Action que
-- lo guarda, porque el valor se inyecta directo en un atributo style.
alter table public.kennels
  add column accent_color text not null default '#d21f1f';

alter table public.kennels
  add constraint kennels_accent_color_check
  check (accent_color ~* '^#[0-9a-f]{6}$');
