"use client";

import { useLightbox } from "./LightboxProvider";

// Miniatura clickeable: abre el lightbox con TODAS las fotos de ese
// perro/breeding (no solo la que se ve en la tarjeta), empezando en
// "index".
export default function ClickableImage({
  src,
  alt,
  photos,
  index,
}: {
  src: string;
  alt: string;
  photos: string[];
  index: number;
}) {
  const { open } = useLightbox();

  return (
    <button
      type="button"
      onClick={() => open(photos, index)}
      aria-label={`View photo of ${alt || "this dog"}`}
      className="group relative block h-full w-full cursor-zoom-in overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-opacity duration-200 group-hover:bg-ink/25 group-hover:opacity-100">
        <ExpandIcon />
      </span>
    </button>
  );
}

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-[var(--color-accent)]"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
