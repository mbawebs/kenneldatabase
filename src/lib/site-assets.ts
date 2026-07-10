// Id fijo (no es un kennel real) usado como primer segmento de ruta
// al subir imagenes del Home publico (hero, banners) al bucket
// "kennel-media": la policy de storage exige que ese segmento sea un
// uuid valido, pero no que corresponda a un kennel de verdad — solo
// hace falta que is_admin() sea cierto para quien sube.
export const SITE_ASSETS_ID = "00000000-0000-0000-0000-000000000000";
