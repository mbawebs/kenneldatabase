-- Permite reordenar las cruzas a mano (arrastrando), igual que ya se
-- puede con los perros via dogs.display_order.
alter table public.breedings
  add column display_order integer not null default 100;
