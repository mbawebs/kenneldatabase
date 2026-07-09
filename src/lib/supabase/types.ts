export type DogCategory =
  | "stud"
  | "female"
  | "available"
  | "production"
  | "puppy";

export type KennelPlan = "demo" | "dashboard" | "multipage";

export const KENNEL_PLANS: KennelPlan[] = ["demo", "dashboard", "multipage"];

export type SocialPlatform =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "x"
  | "website";

export interface SocialLink {
  platform: SocialPlatform;
  value: string;
}

export const SOCIAL_PLATFORMS: {
  value: SocialPlatform;
  label: string;
  placeholder: string;
}[] = [
  { value: "whatsapp", label: "WhatsApp", placeholder: "+1 555 123 4567" },
  { value: "instagram", label: "Instagram", placeholder: "@yourkennel" },
  { value: "facebook", label: "Facebook", placeholder: "Page username or link" },
  { value: "tiktok", label: "TikTok", placeholder: "@yourkennel" },
  { value: "youtube", label: "YouTube", placeholder: "Channel link" },
  { value: "x", label: "X (Twitter)", placeholder: "@yourkennel" },
  { value: "website", label: "Website", placeholder: "https://yourkennel.com" },
];

export interface Kennel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_photo_url: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  social_links: SocialLink[];
  status: string;
  plan: KennelPlan;
  accent_color: string;
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
  date_of_birth: string | null;
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
