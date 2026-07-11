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
    case "phone":
      return base(
        <path d="M4.5 5.2c.2-1 1-1.7 2-1.7h1.6c.5 0 .9.3 1 .8l.9 3c.1.5-.1 1-.5 1.3l-1.6 1.2a13.5 13.5 0 0 0 5.9 5.9l1.2-1.6c.3-.4.8-.6 1.3-.5l3 .9c.5.1.8.5.8 1v1.6c0 1-.7 1.8-1.7 2-1.2.2-3 .2-5.4-.9-2-1-4.2-2.6-6.2-4.6s-3.6-4.2-4.6-6.2c-1.1-2.4-1.1-4.2-.9-5.4z" />,
        className
      );
    case "phone_text":
      return base(
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4h-1A2.5 2.5 0 0 1 4 13.5z" />
          <path d="M8 8.5h8M8 11.5h5" />
        </>,
        className
      );
    case "email":
      return base(
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M4 6.5l8 6.5 8-6.5" />
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
    case "spotify":
      return base(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 10.3c3-1 7-.6 9.3.8" />
          <path d="M7.5 13.2c2.5-.8 5.8-.5 7.8.7" />
          <path d="M8 16c2-.6 4.5-.4 6 .5" />
        </>,
        className
      );
    case "website":
      return base(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
        </>,
        className
      );
    case "custom":
      return base(
        <>
          <path d="M9.5 14.5l5-5" />
          <path d="M13 6.5l1.4-1.4a3.3 3.3 0 0 1 4.7 4.7L17.7 11" />
          <path d="M11 17.5l-1.4 1.4a3.3 3.3 0 0 1-4.7-4.7L6.3 13" />
        </>,
        className
      );
  }
}
