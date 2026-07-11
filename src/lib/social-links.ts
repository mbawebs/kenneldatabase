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

  if (link.platform === "phone") {
    return `tel:${value.replace(/[^\d+]/g, "")}`;
  }

  if (link.platform === "phone_text") {
    return `sms:${value.replace(/[^\d+]/g, "")}`;
  }

  if (link.platform === "email") {
    return `mailto:${value}`;
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
    case "spotify":
    case "custom":
      // Sin convencion de "@usuario" para estos — se espera que
      // peguen el link completo (ya cubierto arriba); esto solo
      // rescata el caso de que lo hayan pegado sin "https://".
      return `https://${handle}`;
    default:
      return value;
  }
}
