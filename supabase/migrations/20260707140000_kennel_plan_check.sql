-- Restringe kennels.plan a los 3 valores que ofrece el dropdown del
-- admin, igual que ya hacemos con dogs.category. Los kennels
-- existentes usan 'demo' (el default), asi que este constraint no
-- rompe datos actuales.
alter table public.kennels
  add constraint kennels_plan_check
  check (plan in ('demo', 'dashboard', 'multipage'));
