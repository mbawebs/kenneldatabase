import type { SocialPlatform } from "@/lib/supabase/types";

// Iconos simples, dibujados a mano (outline, 24x24), mismo estilo que
// el resto de la app. Un icono por plataforma; se elige por nombre
// via <SocialIcon platform="instagram" />.

function base(children: React.ReactNode, className = "h-4 w-4") {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SocialIcon({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case "whatsapp":
      return base(
        <>
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" />
          <path d="M8.5 8.5c.3-.7.6-.7.9-.7h.5c.2 0 .4 0 .5.4.2.5.7 1.7.7 1.8.1.1.1.3 0 .4-.1.2-.2.3-.3.4-.1.2-.3.3-.4.5-.1.2-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 1.9 1.2 2.2 1.4.3.1.5.1.6-.1.2-.2.6-.7.8-.9.2-.2.4-.2.6-.1.3.1 1.5.7 1.8.8.3.1.4.2.5.3.1.2.1.9-.2 1.6-.4.7-1.4 1.2-2 1.2-.5 0-1.1 0-1.8-.3-.4-.1-1-.4-1.6-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1-1.4-1-2.7 0-1.3.7-1.9.9-2.2z" />
        </>,
        className
      );
    case "instagram":
      return base(
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
        </>,
        className
      );
    case "facebook":
      return base(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M13.5 21v-7.5h2l.3-2.5h-2.3V9.2c0-.7.2-1.2 1.3-1.2H16V5.8c-.3 0-1.2-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6V11H8.5v2.5h1.9V21" />
        </>,
        className
      );
    case "tiktok":
      return base(
        <>
          <path d="M14 3v10.8a2.8 2.8 0 1 1-2-2.7" />
          <path d="M14 6.5c.6 1.6 2 2.7 3.5 2.9" />
        </>,
        className
      );
    case "youtube":
      return base(
        <>
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
          <path d="M10 9l5 3-5 3z" />
        </>,
        className
      );
    case "x":
      return base(<path d="M4 4l16 16M20 4L4 20" />, className);
    case "website":
      return base(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
        </>,
        className
      );
  }
}
