-- ============================================================
-- Kennel Database: Storage para logos, portadas y fotos de perros
-- ============================================================

-- Bucket publico (las imagenes deben verse en la landing sin sesion).
-- 5 MB por archivo, solo formatos de imagen comunes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kennel-media',
  'kennel-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects ya tiene RLS activado por defecto en Supabase (esa
-- tabla pertenece a supabase_storage_admin, no a postgres, asi que ni
-- siquiera tenemos permiso para tocar ese ajuste con ALTER TABLE).

-- Convencion de rutas: el primer segmento del path SIEMPRE es el
-- kennel_id, ej: "<kennel_id>/logo/archivo.png". Reutilizamos
-- is_admin() e is_kennel_member() (definidas en la migracion
-- anterior) para decidir quien puede subir/borrar dentro de cada
-- carpeta.

-- Lectura publica: el bucket ya es publico (las URLs publicas no
-- pasan por RLS), pero dejamos la policy explicita por consistencia.
create policy "kennel_media_public_read"
  on storage.objects for select
  using (bucket_id = 'kennel-media');

create policy "kennel_media_insert_member_or_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'kennel-media'
    and (
      public.is_admin()
      or public.is_kennel_member(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "kennel_media_update_member_or_admin"
  on storage.objects for update
  using (
    bucket_id = 'kennel-media'
    and (
      public.is_admin()
      or public.is_kennel_member(((storage.foldername(name))[1])::uuid)
    )
  )
  with check (
    bucket_id = 'kennel-media'
    and (
      public.is_admin()
      or public.is_kennel_member(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "kennel_media_delete_member_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'kennel-media'
    and (
      public.is_admin()
      or public.is_kennel_member(((storage.foldername(name))[1])::uuid)
    )
  );
