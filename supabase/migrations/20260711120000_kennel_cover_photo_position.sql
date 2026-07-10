-- Vertical focal point of the cover photo, as a 0-100 percentage
-- (mirrors CSS object-position's Y%: 0 = top of the image is shown,
-- 100 = bottom of the image is shown). Lets kennel owners drag their
-- cover photo up/down to choose what's visible when the frame's
-- aspect ratio doesn't match the uploaded photo. Defaults to 0
-- (top-anchored) to match the crop behavior already in place before
-- this column existed.
alter table public.kennels
  add column cover_photo_position smallint not null default 0
    check (cover_photo_position >= 0 and cover_photo_position <= 100);
