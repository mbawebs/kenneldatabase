-- Contador de visitas por kennel, para mostrar prueba social en las
-- tarjetas del Home ("128 visits"). Se incrementa via una funcion
-- security definer (no una policy publica de UPDATE en kennels, que
-- abriria la puerta a modificar cualquier columna): asi un visitante
-- anonimo puede sumar una visita sin tener permiso de escritura
-- general sobre la tabla.
alter table public.kennels
  add column view_count integer not null default 0;

create or replace function public.increment_kennel_views(target_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.kennels set view_count = view_count + 1 where id = target_id;
$$;

grant execute on function public.increment_kennel_views(uuid) to anon, authenticated;
