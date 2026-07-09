"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import LightboxProvider from "@/components/lightbox/LightboxProvider";
import ClickableImage from "@/components/lightbox/ClickableImage";
import { SocialIcon } from "@/components/social-icons";
import { buildSocialHref } from "@/lib/social-links";
import {
  SOCIAL_PLATFORMS,
  type Breeding,
  type Dog,
  type Kennel,
  type SocialPlatform,
} from "@/lib/supabase/types";

// Vista presentacional pura de la landing publica de un kennel: sin
// fetch propio, solo props. La usan tanto /[slug]/page.tsx (con datos
// ya guardados) como el panel de "Vista previa" del dashboard (con
// datos en borrador, todavia sin guardar) — mismo componente, mismo
// pixel a pixel, cero duplicacion.
export default function KennelLandingView({
  kennel,
  dogs,
  breedings,
}: {
  kennel: Kennel;
  dogs: Dog[];
  breedings: Breeding[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const studs = dogs.filter((d) => d.category === "stud");
  const females = dogs.filter((d) => d.category === "female");
  const productions = dogs.filter(
    (d) => d.category === "production" || d.category === "puppy"
  );
  const available = dogs.filter((d) => d.category === "available");

  const contactLinks = [
    kennel.phone && { label: "Call", href: `tel:${kennel.phone}` },
    kennel.email && { label: "Email", href: `mailto:${kennel.email}` },
    ...kennel.social_links
      .filter((link) => link.value.trim())
      .map((link) => ({
        label:
          SOCIAL_PLATFORMS.find((p) => p.value === link.platform)?.label ??
          link.platform,
        href: buildSocialHref(link),
        platform: link.platform,
      })),
  ].filter(Boolean) as { label: string; href: string; platform?: SocialPlatform }[];

  const location = [kennel.city, kennel.country].filter(Boolean).join(", ");

  // Bloques de sección: se arman en orden fijo y solo se listan los
  // que tienen contenido. El index resultante alimenta la numeración
  // "01 / 02 / 03..." y la barra de navegación.
  const sectionBlocks: { key: string; label: string; node: React.ReactNode }[] =
    [];
  if (studs.length > 0) {
    sectionBlocks.push({ key: "studs", label: "Studs", node: <CardRow dogs={studs} /> });
  }
  if (females.length > 0) {
    sectionBlocks.push({
      key: "females",
      label: "Females",
      node: <CardRow dogs={females} />,
    });
  }
  if (productions.length > 0) {
    sectionBlocks.push({
      key: "productions",
      label: "Productions",
      node: <CardRow dogs={productions} />,
    });
  }
  if (breedings.length > 0) {
    sectionBlocks.push({
      key: "breedings",
      label: "Breedings",
      node: (
        <CarouselRow count={breedings.length}>
          {breedings.map((breeding) => (
            <BreedingCard key={breeding.id} breeding={breeding} />
          ))}
        </CarouselRow>
      ),
    });
  }
  if (available.length > 0) {
    sectionBlocks.push({
      key: "available",
      label: "Available",
      node: <CardRow dogs={available} />,
    });
  }

  const navLinks = [
    ...sectionBlocks.map((block) => ({ label: block.label, href: `#${block.key}` })),
    contactLinks.length > 0 && { label: "Contact", href: "#contact" },
  ].filter(Boolean) as { label: string; href: string }[];

  const primaryCta =
    available.length > 0
      ? { label: "View Available", href: "#available" }
      : sectionBlocks.length > 0
        ? { label: `View ${sectionBlocks[0].label}`, href: `#${sectionBlocks[0].key}` }
        : null;

  const secondaryCta =
    contactLinks.length > 0 ? { label: "Contact", href: "#contact" } : null;

  // El accent_color de cada kennel se aplica sobreescribiendo la
  // variable CSS en este wrapper; todo lo de abajo usa
  // bg-[var(--color-accent)]/text-[var(--color-accent)]/etc, asi que
  // hereda el color automaticamente sin tocar mas markup.
  const accentStyle = {
    "--color-accent": kennel.accent_color || "#d21f1f",
  } as CSSProperties;

  return (
    <LightboxProvider>
      <main
        id="top"
        style={accentStyle}
        className="min-h-screen bg-ink pb-16 text-ink-text"
      >
        {/* Nav: fija arriba, con anclas a cada seccion con contenido.
            Le da al sitio esa sensacion de "pagina real" con
            estructura, no solo un hero suelto. */}
        <header className="sticky top-0 z-30 border-b border-ink-3 bg-ink/92 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
            <a href="#top" className="flex min-w-0 items-center gap-2.5">
              {kennel.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={kennel.logo_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
                />
              )}
              <span className="truncate font-impact text-xl uppercase tracking-wide text-[var(--color-accent)] sm:text-2xl">
                {kennel.name}
              </span>
            </a>
            <div className="flex shrink-0 items-center gap-4">
              {navLinks.length > 0 && (
                <nav className="hidden items-center gap-6 md:flex">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="font-body text-xs font-bold uppercase tracking-widest text-ink-text-dim transition-colors hover:text-[var(--color-accent)]"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
              )}
              <Link
                href="/login"
                className="rounded-full border border-ink-text-dim/40 px-3 py-1.5 font-body text-[0.65rem] font-bold uppercase tracking-widest text-ink-text-dim transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Owner Login
              </Link>
              {navLinks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-text-dim/40 text-ink-text-dim transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] md:hidden"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4.5 w-4.5"
                  >
                    {mobileMenuOpen ? (
                      <path d="M6 6l12 12M18 6L6 18" />
                    ) : (
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Menu hamburguesa: solo en movil, donde no cabe la nav
              horizontal completa. En escritorio la nav de arriba ya
              muestra todos los links, asi que este panel no aplica. */}
          {mobileMenuOpen && navLinks.length > 0 && (
            <nav className="border-t border-ink-3 px-6 py-2 md:hidden">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block border-b border-ink-3/60 py-3 font-body text-xs font-bold uppercase tracking-widest text-ink-text-dim transition-colors last:border-0 hover:text-[var(--color-accent)]"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </header>

        {/* Hero: cinematica, a pantalla completa. Overlay minimo (solo
            lo necesario para legibilidad) + text-shadow en el titular,
            en vez de oscurecer toda la foto. */}
        <div className="relative flex h-[100svh] min-h-[560px] w-full flex-col justify-end overflow-hidden">
          {kennel.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kennel.cover_photo_url}
              alt={`${kennel.name} cover photo`}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          ) : (
            <div className="hero-fallback absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-start px-6 pb-16 text-left sm:px-10">
            {location && (
              <span className="mb-4 inline-block border-2 border-[var(--color-accent)] px-3 py-1 font-body text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] sm:text-sm">
                {location}
              </span>
            )}
            <h1 className="font-impact text-5xl uppercase leading-[0.88] text-ink-text [text-shadow:0_6px_30px_rgba(0,0,0,0.65)] sm:text-7xl md:text-8xl lg:text-9xl">
              {kennel.name}
            </h1>

            {(primaryCta || secondaryCta) && (
              <div className="mt-9 flex flex-wrap items-center justify-start gap-3">
                {primaryCta && (
                  <a
                    href={primaryCta.href}
                    className="rounded-full bg-[var(--color-accent)] px-7 py-3.5 font-body text-sm font-extrabold uppercase tracking-wide text-ink-text transition-colors hover:bg-[var(--color-accent-dim)]"
                  >
                    {primaryCta.label}
                  </a>
                )}
                {secondaryCta && (
                  <a
                    href={secondaryCta.href}
                    className="rounded-full border-2 border-ink-text px-7 py-3.5 font-body text-sm font-extrabold uppercase tracking-wide text-ink-text transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    {secondaryCta.label}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {kennel.description && (
          <div className="mx-auto max-w-3xl px-6 pt-12 text-center sm:px-10">
            <p className="text-balance text-lg leading-relaxed text-ink-text-dim">
              {kennel.description}
            </p>
          </div>
        )}

        <div className="mx-auto mt-12 max-w-5xl space-y-20 px-6 sm:px-10">
          {sectionBlocks.map((block, i) => (
            <section key={block.key} id={block.key} className="scroll-mt-20">
              <SectionTitle number={String(i + 1).padStart(2, "0")}>
                {block.label}
              </SectionTitle>
              {block.node}
            </section>
          ))}
        </div>

        {/* Ledger strip: contacto */}
        {contactLinks.length > 0 && (
          <div id="contact" className="mt-20 scroll-mt-20 bg-ink-2">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-14 text-center sm:px-10">
              <span className="font-impact text-3xl uppercase text-ink-text sm:text-4xl">
                Get In Touch
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {contactLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 font-body text-sm font-extrabold uppercase tracking-wide text-ink-text transition-colors hover:bg-[var(--color-accent-dim)]"
                  >
                    {link.platform && <SocialIcon platform={link.platform} />}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </LightboxProvider>
  );
}

function SectionTitle({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-7 flex items-end gap-4 border-b-2 border-ink-3 pb-4">
      <span className="font-impact text-3xl leading-none text-[var(--color-accent)] sm:text-4xl">
        {number}
      </span>
      <span className="font-impact text-3xl uppercase leading-none text-ink-text sm:text-5xl">
        {children}
      </span>
    </h2>
  );
}

function CardRow({ dogs }: { dogs: Dog[] }) {
  return (
    <CarouselRow count={dogs.length}>
      {dogs.map((dog) => (
        <DogCard key={dog.id} dog={dog} />
      ))}
    </CarouselRow>
  );
}

// En movil, cada seccion es su propio carrusel horizontal (con
// snap-scroll y una pista de que hay mas si aplica) en vez de una
// pila vertical continua — asi se nota donde termina una seccion y
// empieza la siguiente. En escritorio (sm:) se comporta igual que
// antes: las tarjetas se acomodan en filas centradas, sin scroll.
function CarouselRow({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingInline: "1.5rem" }}
      >
        {children}
      </div>
      {count > 1 && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l from-ink via-ink/70 to-transparent sm:hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-5 w-5 text-ink-text/80"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      )}
    </div>
  );
}

function DogCard({ dog }: { dog: Dog }) {
  const photo = dog.photos?.[0];
  const specRows = [
    dog.breed && { label: "Breed", value: dog.breed },
    dog.color && { label: "Color", value: dog.color },
    dog.date_of_birth && { label: "Born", value: dog.date_of_birth },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="w-[78vw] max-w-[300px] shrink-0 snap-start flex flex-col bg-ink-2 sm:w-[440px] sm:max-w-none sm:shrink sm:flex-row">
      <div className="w-full sm:w-2/5 sm:shrink-0">
        <div className="aspect-video w-full bg-ink-3 sm:aspect-[3/4]">
          {photo ? (
            <ClickableImage
              src={photo}
              alt={dog.name}
              photos={dog.photos ?? [photo]}
              index={0}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-body text-xs font-bold uppercase tracking-wide text-ink-text-dim/60">
              No photo
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.15em] text-ink-text-dim/50">
            Bloodline File
          </p>
          <p className="font-impact text-3xl uppercase leading-[0.95] text-ink-text">
            {dog.name}
          </p>
          {specRows.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-ink-3 pt-3">
              {specRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 font-body text-xs"
                >
                  <span className="font-bold uppercase tracking-wide text-ink-text-dim/50">
                    {row.label}
                  </span>
                  <span className="text-right font-medium text-ink-text-dim">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {dog.description && (
            <p className="mt-3 line-clamp-2 text-sm text-ink-text-dim">
              {dog.description}
            </p>
          )}
        </div>
        {(dog.price || dog.pedigree_url) && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {dog.price && (
              <p className="inline-block bg-[var(--color-accent)] px-3 py-1.5 font-body text-sm font-extrabold text-ink-text">
                {dog.price}
              </p>
            )}
            {dog.pedigree_url && (
              <a
                href={dog.pedigree_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs font-bold uppercase tracking-wide text-ink-text-dim underline decoration-ink-text-dim/40 underline-offset-2 transition-colors hover:text-[var(--color-accent)] hover:decoration-[var(--color-accent)]"
              >
                View pedigree ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BreedingCard({ breeding }: { breeding: Breeding }) {
  const photo = breeding.photos?.[0];
  const specRows = [
    breeding.sire_name && { label: "Sire", value: breeding.sire_name },
    breeding.dam_name && { label: "Dam", value: breeding.dam_name },
    breeding.date && { label: "Date", value: breeding.date },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="w-[78vw] max-w-[300px] shrink-0 snap-start flex flex-col bg-ink-2 sm:w-[440px] sm:max-w-none sm:shrink sm:flex-row">
      <div className="w-full sm:w-2/5 sm:shrink-0">
        <div className="aspect-video w-full bg-ink-3 sm:aspect-[3/4]">
          {photo ? (
            <ClickableImage
              src={photo}
              alt={breeding.title ?? "Breeding"}
              photos={breeding.photos ?? [photo]}
              index={0}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-body text-xs font-bold uppercase tracking-wide text-ink-text-dim/60">
              No photo
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.15em] text-ink-text-dim/50">
            Breeding File
          </p>
          {breeding.title && (
            <p className="font-impact text-3xl uppercase leading-[0.95] text-ink-text">
              {breeding.title}
            </p>
          )}
          {specRows.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-ink-3 pt-3">
              {specRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 font-body text-xs"
                >
                  <span className="font-bold uppercase tracking-wide text-ink-text-dim/50">
                    {row.label}
                  </span>
                  <span className="text-right font-medium text-ink-text-dim">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {breeding.description && (
            <p className="mt-3 line-clamp-2 text-sm text-ink-text-dim">
              {breeding.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
