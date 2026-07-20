-- ============================================================
-- Fase 1 del registro publico: cualquiera puede crear su cuenta +
-- kennel desde /signup, sin pasar por el admin.
--
-- Este archivo:
-- 1. Amplia kennels.plan para incluir 'free'/'pro' (el modelo
--    freemium), sin tocar los valores existentes ('demo' sigue
--    siendo valido para los kennels ya dados de alta a mano).
-- 2. Agrega kennels.owner_id: quien se registro y creo este kennel.
--    Solo se usa para la regla "un usuario, un kennel" a nivel RLS —
--    el acceso del dia a dia lo sigue decidiendo kennel_users, no
--    esta columna.
-- 3. Actualiza las policies de insert en kennels/kennel_users para
--    permitir auto-registro, limitado a exactamente un kennel por
--    usuario.
-- 4. Revoca a nivel de columna que un usuario autenticado pueda
--    tocar kennels.plan / kennels.owner_id directo via API — solo
--    admin o service-role (el webhook de Stripe en la Fase 3) podra
--    cambiarlos.
-- ============================================================

alter table public.kennels
  drop constraint if exists kennels_plan_check;
alter table public.kennels
  add constraint kennels_plan_check
  check (plan in ('demo', 'dashboard', 'multipage', 'free', 'pro'));

alter table public.kennels
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

-- ---------- KENNELS: insert ----------
drop policy if exists "kennels_insert_admin_only" on public.kennels;

create policy "kennels_insert_admin_or_self_signup"
  on public.kennels for insert
  with check (
    public.is_admin()
    or (
      owner_id = auth.uid()
      and plan = 'free'
      and status = 'active'
      and not exists (
        select 1 from public.kennels where owner_id = auth.uid()
      )
    )
  );

-- ---------- KENNEL_USERS: insert ----------
drop policy if exists "kennel_users_insert_member_or_admin" on public.kennel_users;

create policy "kennel_users_insert_member_or_admin_or_self_signup"
  on public.kennel_users for insert
  with check (
    public.is_admin()
    or public.is_kennel_member(kennel_id)
    or (
      user_id = auth.uid()
      and role = 'editor'
      and exists (
        select 1 from public.kennels
        where id = kennel_id and owner_id = auth.uid()
      )
      and not exists (
        select 1 from public.kennel_users where user_id = auth.uid()
      )
    )
  );

-- ---------- Blindaje de columnas sensibles ----------
-- Ni RLS ni la app le dan hoy a un usuario normal forma de tocar
-- estas columnas, pero esto lo garantiza tambien a nivel de motor:
-- un UPDATE que intente tocar plan/owner_id como usuario autenticado
-- falla por permisos, sin importar lo que diga la policy de
-- row-level en kennels_update_member_or_admin. Solo admin o
-- service-role (que bypasea RLS y grants) puede cambiarlas.
revoke update (plan, owner_id) on public.kennels from authenticated;
