import type { SocialLink } from "./supabase/types";

// Arma el href final de un link social segun su plataforma. El valor
// guardado puede ser un numero (whatsapp), un @usuario, o una URL
// completa pegada directo — se acepta cualquiera de las dos formas.
export function buildSocialHref(link: SocialLink): string {
  const value = link.value.trim();

  if (link.platform === "whatsapp") {
    const digits = value.replace(/\D/g, "");
    return `https://wa.me/${digits}`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const handle = value.replace(/^@/, "");
  switch (link.platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "youtube":
      return `https://youtube.com/${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "website":
      return `https://${handle}`;
    default:
      return value;
  }
}
