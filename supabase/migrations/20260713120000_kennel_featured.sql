-- Marca kennels como "destacados" para el home. Solo lo toca el
-- super-admin desde /admin; el dueño del kennel nunca ve ni puede
-- editar este campo desde su dashboard.
alter table public.kennels
  add column if not exists featured boolean not null default false;
