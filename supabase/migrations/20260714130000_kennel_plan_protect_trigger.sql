-- El REVOKE UPDATE (plan, owner_id) de la migracion anterior no
-- alcanza: Supabase ya le da a "authenticated" permiso de UPDATE
-- sobre TODA la tabla kennels por default, y ese permiso amplio no
-- se recorta con un REVOKE a nivel de columna (en Postgres, un
-- privilegio a nivel de tabla no queda limitado por un REVOKE mas
-- especifico sobre una columna). Confirmado con una prueba real:
-- un usuario normal SI pudo cambiarse su propio plan a 'pro' via la
-- API directa a pesar del REVOKE.
--
-- Tampoco sirve simplemente revocar UPDATE de la tabla completa:
-- el admin edita "plan" desde /admin/kennels/[id] usando el MISMO
-- rol de Postgres "authenticated" (Supabase no tiene un rol de
-- Postgres separado para "admin" — esa distincion vive en la tabla
-- admins, no en roles de base de datos), asi que un REVOKE a nivel
-- de rol bloquearia tambien al admin.
--
-- La solucion real: un trigger que si distingue "quien" esta
-- editando, no solo "que rol de Postgres" es:
-- - is_admin() en true -> se deja pasar (admin real, verificado
--   contra la tabla admins).
-- - auth.role() = 'service_role' -> se deja pasar (el webhook de
--   Stripe en la Fase 3, que necesita mover plan libremente).
-- - cualquier otro caso -> se rechaza si intenta tocar plan u
--   owner_id.
create or replace function public.protect_kennel_plan_and_owner()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.plan is distinct from old.plan and not public.is_admin() then
    raise exception 'Only an admin or the billing system can change a kennel''s plan.';
  end if;

  if new.owner_id is distinct from old.owner_id and not public.is_admin() then
    raise exception 'owner_id cannot be changed directly.';
  end if;

  return new;
end;
$$;

drop trigger if exists kennels_protect_plan_owner on public.kennels;
create trigger kennels_protect_plan_owner
  before update on public.kennels
  for each row
  execute function public.protect_kennel_plan_and_owner();
