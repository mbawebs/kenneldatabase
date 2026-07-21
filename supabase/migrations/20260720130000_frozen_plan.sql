-- 'frozen': kennels dados de alta a mano desde /admin que ya traian
-- mas contenido del que el plan free permitiria. A diferencia de
-- 'free', nunca oculta ni candadea secciones — solo bloquea crear
-- perros/breedings nuevos. Ver isFrozenPlan en src/lib/plan-limits.ts.
alter table public.kennels
  drop constraint if exists kennels_plan_check;
alter table public.kennels
  add constraint kennels_plan_check
  check (plan in ('demo', 'dashboard', 'multipage', 'free', 'pro', 'frozen'));
