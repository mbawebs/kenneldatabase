export type DogCategory =
  | "stud"
  | "female"
  | "available"
  | "production"
  | "puppy";

// "demo"/"dashboard"/"multipage": kennels dados de alta a mano desde
// /admin (flujo original), sin ningun limite. "free"/"pro": modelo
// freemium del registro publico (/signup) — "free" trae limites de
// cantidad por seccion, "pro" los quita. Ver Fase 2/3. "frozen":
// kennels manuales que ya traian mas contenido del que el plan free
// permitiria — el dueño puede seguir editando/reordenando/borrando
// TODO lo que ya tiene (nada se oculta, ni en el dashboard ni en la
// pagina publica), pero no puede agregar perros ni breedings nuevos
// hasta actualizar a pro. Ver isFrozenPlan en plan-limits.ts.
export type KennelPlan =
  | "demo"
  | "dashboard"
  | "multipage"
  | "free"
  | "pro"
  | "frozen";

export const KENNEL_PLANS: KennelPlan[] = [
  "demo",
  "dashboard",
  "multipage",
  "free",
  "pro",
  "frozen",
];

export type SocialPlatform =
  | "whatsapp"
  | "phone"
  | "phone_text"
  | "email"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "spotify"
  | "website"
  | "custom";

export interface SocialLink {
  platform: SocialPlatform;
  value: string;
  // Solo se usa (y solo se muestra el campo en el editor) cuando
  // platform === "custom": el nombre que el dueño le pone a su link
  // ("Supplements", "Merch store"...) en vez de mostrar siempre el
  // generico "Custom link".
  label?: string;
}

export const SOCIAL_PLATFORMS: {
  value: SocialPlatform;
  label: string;
  placeholder: string;
}[] = [
  { value: "whatsapp", label: "WhatsApp", placeholder: "+1 555 123 4567" },
  // No todos usan WhatsApp (sobre todo en EE. UU.) — estas dos dejan
  // agregar una llamada directa o un correo como link mas, aparte del
  // telefono/email unico de "Direct contact".
  { value: "phone", label: "Phone (call)", placeholder: "+1 555 123 4567" },
  { value: "phone_text", label: "Phone (text only)", placeholder: "+1 555 123 4567" },
  { value: "email", label: "Email", placeholder: "you@example.com" },
  { value: "instagram", label: "Instagram", placeholder: "@yourkennel" },
  { value: "facebook", label: "Facebook", placeholder: "Page username or link" },
  { value: "tiktok", label: "TikTok", placeholder: "@yourkennel" },
  { value: "youtube", label: "YouTube", placeholder: "Channel link" },
  { value: "x", label: "X (Twitter)", placeholder: "@yourkennel" },
  { value: "spotify", label: "Spotify", placeholder: "Paste your Spotify link" },
  { value: "website", label: "Website", placeholder: "https://yourkennel.com" },
  // Para cualquier otro link que no encaje en las opciones de arriba
  // (linktree, pagina de reservas, etc.) — igual que Website pero con
  // su propia etiqueta, para poder agregar mas de uno.
  { value: "custom", label: "Custom link", placeholder: "https://..." },
];

export interface Kennel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_photo_url: string | null;
  // 0-100, ver comentario en la migracion 20260711120000: es el % Y
  // de object-position, para que el dueño pueda arrastrar la portada
  // y elegir que parte de la foto se ve dentro del marco.
  cover_photo_position: number;
  description: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  social_links: SocialLink[];
  status: string;
  plan: KennelPlan;
  accent_color: string;
  view_count: number;
  // Solo editable desde /admin (nunca desde el dashboard del dueño):
  // 1-6 = posicion destacada en el home (1 primero), null = sin
  // destacar. Un indice unico parcial en la base de datos garantiza
  // que nunca haya dos kennels con la misma posicion.
  featured_position: number | null;
  // Quien se registro y creo este kennel via /signup. Solo se usa
  // para hacer valer "un usuario, un kennel" a nivel de RLS — el
  // acceso del dia a dia lo decide kennel_users, no esta columna.
  // Null en los kennels dados de alta a mano desde /admin.
  owner_id: string | null;
  // Se llenan solos desde el webhook de Stripe (nunca editables por
  // el dueño del kennel — ver el trigger protect_kennel_plan_and_owner
  // en la migracion de Fase 3). Null hasta que el kennel haga su
  // primer checkout de PRO.
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

// Paleta sugerida para el selector de color de acento del kennel-editor
// (KennelInfoForm). El campo tambien acepta cualquier hex via el color
// picker nativo, esta lista es solo para accesos rapidos comunes.
export const ACCENT_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Red", value: "#d21f1f" },
  { label: "Orange", value: "#e8720c" },
  { label: "Gold", value: "#c6a15b" },
  { label: "Yellow", value: "#e0b400" },
  { label: "Green", value: "#1f7a3d" },
  { label: "Blue", value: "#1f5fd2" },
  { label: "Purple", value: "#6b21d2" },
];

export interface Dog {
  id: string;
  kennel_id: string;
  name: string;
  category: DogCategory;
  breed: string | null;
  color: string | null;
  age: string | null;
  price: string | null;
  description: string | null;
  pedigree_url: string | null;
  photos: string[] | null;
  status: string;
  display_order: number;
  created_at: string;
}

export interface Breeding {
  id: string;
  kennel_id: string;
  title: string | null;
  sire_name: string | null;
  dam_name: string | null;
  description: string | null;
  photos: string[] | null;
  date: string | null;
  display_order: number;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  kennel_id: string;
  photo_url: string;
  show_on_home: boolean;
  display_order: number;
  created_at: string;
}

// Fila unica (id siempre = true) con la configuracion visual del Home
// publico: imagen del hero, banner de anuncio arriba, y los dos
// banners verticales laterales vendibles como publicidad.
export interface SiteSettings {
  hero_image_url: string | null;
  top_banner_text: string | null;
  top_banner_link: string | null;
  banner_left_image_url: string | null;
  banner_left_link: string | null;
  banner_right_image_url: string | null;
  banner_right_link: string | null;
  // Los banners laterales se ocultan en movil/tablet (no caben sin
  // apretar el buscador); estos dos son su reemplazo horizontal,
  // visibles solo por debajo de ese mismo punto de quiebre.
  mobile_banner_top_image_url: string | null;
  mobile_banner_top_link: string | null;
  mobile_banner_bottom_image_url: string | null;
  mobile_banner_bottom_link: string | null;
}
