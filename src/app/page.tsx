import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/supabase/types";

interface DirectoryKennel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  city: string | null;
}

// Cada criadero escribe la raza a su manera ("Mini Bully", "XL Bully",
// "Designer Frenchie", "Big Rope Frenchie"...) — de raza libre, sin
// catalogo fijo. En vez de mostrar cada variante suelta en el filtro,
// se agrupan por palabra clave bajo un nombre canonico, para que
// buscar "American Bully" o "French Bulldog" encuentre todas sus
// variantes sin importar como las haya tecleado cada quien.
const BREED_GROUPS: { canonical: string; keywords: string[] }[] = [
  { canonical: "American Bully", keywords: ["bully"] },
  { canonical: "French Bulldog", keywords: ["frenchie", "french bulldog"] },
];

function canonicalizeBreed(breed: string): string {
  const lower = breed.toLowerCase();
  const group = BREED_GROUPS.find((g) => g.keywords.some((kw) => lower.includes(kw)));
  return group?.canonical ?? breed;
}

const EMPTY_SETTINGS: SiteSettings = {
  hero_image_url: null,
  top_banner_text: null,
  top_banner_link: null,
  banner_left_image_url: null,
  banner_left_link: null,
  banner_right_image_url: null,
  banner_right_link: null,
  mobile_banner_top_image_url: null,
  mobile_banner_top_link: null,
  mobile_banner_bottom_image_url: null,
  mobile_banner_bottom_link: null,
};

const PAGE_SIZE = 6;

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const countryFilter = firstValue(params.country);
  const breedFilter = firstValue(params.breed);

  const supabase = await createClient();

  // status = 'active' se filtra explicito aqui (no solo confiar en la
  // policy de RLS): esta pagina la puede ver cualquiera, logueado o
  // no, y el directorio publico siempre debe verse igual sin importar
  // quien la esta viendo.
  const { data: kennelRows } = await supabase
    .from("kennels")
    .select("id, name, slug, logo_url, country, city")
    .eq("status", "active")
    .order("name", { ascending: true });

  const kennels: DirectoryKennel[] = kennelRows ?? [];
  const activeIds = new Set(kennels.map((k) => k.id));

  const { data: dogRows } = await supabase.from("dogs").select("kennel_id, breed");

  // dogsByKennel: cuenta total de perros + set de razas por kennel.
  // Se filtra por activeIds por si acaso (RLS ya solo deja pasar
  // perros de kennels activos o del propio dueño/admin logueado, pero
  // este directorio no debe mostrar nada fuera de los kennels activos
  // que ya cargamos arriba).
  const dogsByKennel = new Map<string, { count: number; breeds: Set<string> }>();
  for (const row of dogRows ?? []) {
    if (!activeIds.has(row.kennel_id)) continue;
    const entry = dogsByKennel.get(row.kennel_id) ?? {
      count: 0,
      breeds: new Set<string>(),
    };
    entry.count += 1;
    const breed = row.breed?.trim();
    if (breed) entry.breeds.add(canonicalizeBreed(breed));
    dogsByKennel.set(row.kennel_id, entry);
  }

  const countries = uniqueSorted(
    kennels.map((k) => k.country?.trim()).filter((v): v is string => Boolean(v))
  );
  const breeds = uniqueSorted(
    Array.from(dogsByKennel.values()).flatMap((entry) => Array.from(entry.breeds))
  );

  const filteredKennels = kennels.filter((k) => {
    if (countryFilter && k.country?.trim() !== countryFilter) return false;
    if (breedFilter && !dogsByKennel.get(k.id)?.breeds.has(breedFilter)) return false;
    return true;
  });

  const hasFilters = Boolean(countryFilter || breedFilter);

  // Paginado simple: cambiar de filtro siempre resetea a la pagina 1
  // (el form GET solo manda country/breed, "page" queda fuera del
  // querystring sin necesidad de manejarlo aparte).
  const totalPages = Math.max(1, Math.ceil(filteredKennels.length / PAGE_SIZE));
  const requestedPage = Number(firstValue(params.page)) || 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const pageKennels = filteredKennels.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();
  const settings: SiteSettings = settingsRow ?? EMPTY_SETTINGS;

  const adminContactEmail = process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL;

  return (
    <>
      {/* Espacio vendible #1: franja superior. Interactiva cuando el
          admin la configura desde /admin ("Visit the kennel of the
          month" -> enlaza al criadero elegido); si no, invita a
          anunciarse ahi en vez de dejar un hueco vacio que nadie
          notaria que existe. */}
      <TopBanner
        text={settings.top_banner_text}
        link={settings.top_banner_link}
        adminContactEmail={adminContactEmail}
      />

      {/* Hero: azul (marca de la plataforma en si, no la de un kennel
          especifico) con el nombre grande al centro. Si hay una imagen
          subida desde /admin se usa de fondo con un degradado azul
          encima para contraste; si no, un degradado azul solo.
          "Owner Login" vive aqui adentro (esquina superior derecha) —
          ya no hay una barra de header aparte. */}
      <div className="relative overflow-hidden">
        {settings.hero_image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.hero_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a2f]/70 via-[#123a68]/75 to-[#0a1a2f]/95" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e5490] via-[#123a68] to-[#0a1a2f]" />
        )}
        <div className="relative flex justify-end px-6 pt-6 sm:px-10">
          <Link
            href="/login"
            className="rounded-full border border-white/40 px-3 py-1.5 font-body text-[0.65rem] font-bold uppercase tracking-widest text-white/80 transition-colors hover:border-white hover:text-white"
          >
            Owner Login
          </Link>
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-6 text-center sm:pb-32">
          <h1 className="font-impact text-6xl uppercase leading-[0.9] text-white [text-shadow:0_6px_30px_rgba(0,0,0,0.65)] sm:text-8xl">
            Kennel Database
          </h1>
          <p className="mt-5 text-lg text-white/85">
            Browse studs, females, and litters from breeders across the
            directory.
          </p>
        </div>
      </div>

      {/* Resto de la pagina: fondo blanco, buscador + resultados al
          centro, y dos banners verticales vendibles como publicidad
          en los costados (solo en pantallas anchas — en movil o
          tablet apretarian demasiado el contenido). */}
      <main className="bg-white text-onlight">
        <div className="mx-auto flex max-w-[1400px] items-start gap-6 px-4 py-12 sm:px-6 xl:px-10">
          <SideBanner
            imageUrl={settings.banner_left_image_url}
            link={settings.banner_left_link}
            adminContactEmail={adminContactEmail}
          />

          <div className="mx-auto min-w-0 max-w-5xl flex-1">
            <MobileBanner
              imageUrl={settings.mobile_banner_top_image_url}
              link={settings.mobile_banner_top_link}
              adminContactEmail={adminContactEmail}
              placement="mobile top banner"
              className="mb-6"
            />

            <form
              method="GET"
              className="flex flex-wrap items-end gap-4 border-b border-saddle/15 pb-6"
            >
              <div className="min-w-[180px] flex-1 space-y-1.5">
                <label
                  htmlFor="country"
                  className="block font-body text-[0.65rem] font-bold uppercase tracking-widest text-onlight-dim"
                >
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  defaultValue={countryFilter}
                  className="w-full rounded-lg border border-saddle/25 bg-paper px-4 py-2.5 text-sm text-onlight outline-none transition-colors focus:border-saddle"
                >
                  <option value="">All countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[180px] flex-1 space-y-1.5">
                <label
                  htmlFor="breed"
                  className="block font-body text-[0.65rem] font-bold uppercase tracking-widest text-onlight-dim"
                >
                  Breed
                </label>
                <select
                  id="breed"
                  name="breed"
                  defaultValue={breedFilter}
                  className="w-full rounded-lg border border-saddle/25 bg-paper px-4 py-2.5 text-sm text-onlight outline-none transition-colors focus:border-saddle"
                >
                  <option value="">All breeds</option>
                  {breeds.map((breed) => (
                    <option key={breed} value={breed}>
                      {breed}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-full border border-saddle bg-saddle px-6 py-2.5 font-body text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-saddle-2"
              >
                Filter
              </button>
              {hasFilters && (
                <Link
                  href="/"
                  className="font-body text-xs font-bold uppercase tracking-widest text-onlight-dim underline decoration-onlight-dim/40 underline-offset-2 transition-colors hover:text-saddle hover:decoration-saddle"
                >
                  Clear filters
                </Link>
              )}
            </form>

            <div className="mt-10">
              {pageKennels.length === 0 ? (
                <p className="py-16 text-center text-onlight-dim">
                  No kennels match those filters yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {pageKennels.map((kennel) => (
                    <KennelCard
                      key={kennel.id}
                      kennel={kennel}
                      dogCount={dogsByKennel.get(kennel.id)?.count ?? 0}
                    />
                  ))}
                </div>
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              countryFilter={countryFilter}
              breedFilter={breedFilter}
            />

            <MobileBanner
              imageUrl={settings.mobile_banner_bottom_image_url}
              link={settings.mobile_banner_bottom_link}
              adminContactEmail={adminContactEmail}
              placement="mobile bottom banner"
              className="mt-10"
            />
          </div>

          <SideBanner
            imageUrl={settings.banner_right_image_url}
            link={settings.banner_right_link}
            adminContactEmail={adminContactEmail}
          />
        </div>
      </main>
    </>
  );
}

function buildAdvertiseMailto(email: string, placement: string) {
  const subject = `Kennel Database — Advertising inquiry (${placement})`;
  const body = `Hi,\n\nI'm interested in advertising in the ${placement} on the Kennel Database homepage.\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Espacio vendible #1. Si el admin ya lo configuro desde /admin, es
// un texto clickeable (ej. "Visit the kennel of the month" -> ese
// criadero). Si no, invita a anunciarse ahi mismo en vez de dejar la
// franja vacia — asi el espacio se "vende solo" con nada mas verlo.
function TopBanner({
  text,
  link,
  adminContactEmail,
}: {
  text: string | null;
  link: string | null;
  adminContactEmail: string | undefined;
}) {
  const className =
    "block bg-brass px-4 py-2 text-center font-body text-xs font-bold uppercase tracking-wide text-ink sm:text-sm";

  if (text) {
    if (link) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`${className} transition-colors hover:bg-brass-dim`}
        >
          {text}
        </a>
      );
    }
    return <p className={className}>{text}</p>;
  }

  if (!adminContactEmail) return null;

  return (
    <a
      href={buildAdvertiseMailto(adminContactEmail, "top banner")}
      className={`${className} transition-colors hover:bg-brass-dim`}
    >
      Advertise in this space — Contact us
    </a>
  );
}

// Espacios vendibles #2 y #3. Si el admin subio una imagen desde
// /admin, es la imagen (clickeable si tiene link). Si no, un
// recuadro tipo "Advertise Here" que tambien invita a contactar — en
// vez de un hueco vacio que nadie notaria que existe. En pantallas
// angostas se oculta por completo (xl:block): apretaria demasiado el
// buscador y las tarjetas.
function SideBanner({
  imageUrl,
  link,
  adminContactEmail,
}: {
  imageUrl: string | null;
  link: string | null;
  adminContactEmail: string | undefined;
}) {
  if (imageUrl) {
    const image = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="Advertisement" className="w-full rounded-lg object-cover" />
    );
    return (
      <div className="hidden shrink-0 xl:block xl:w-[200px]">
        <div className="sticky top-8">
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer sponsored">
              {image}
            </a>
          ) : (
            image
          )}
        </div>
      </div>
    );
  }

  if (!adminContactEmail) return null;

  return (
    <div className="hidden shrink-0 xl:block xl:w-[200px]">
      <a
        href={buildAdvertiseMailto(adminContactEmail, "side banner")}
        className="sticky top-8 flex aspect-[1/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-saddle/25 bg-parchment/40 p-4 text-center transition-colors hover:border-saddle"
      >
        <span className="font-impact text-lg uppercase leading-tight text-saddle">
          Advertise Here
        </span>
        <span className="text-xs text-onlight-dim">Contact us</span>
      </a>
    </div>
  );
}

// Reemplaza a los banners laterales en pantallas angostas (esos se
// ocultan por debajo de xl:). Mismo patron: imagen si esta
// configurada, si no un placeholder "Advertise Here" que invita a
// contactar — nunca un hueco vacio silencioso.
function MobileBanner({
  imageUrl,
  link,
  adminContactEmail,
  placement,
  className = "",
}: {
  imageUrl: string | null;
  link: string | null;
  adminContactEmail: string | undefined;
  placement: string;
  className?: string;
}) {
  if (imageUrl) {
    const image = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="Advertisement" className="w-full rounded-lg object-cover" />
    );
    return (
      <div className={`block xl:hidden ${className}`}>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer sponsored">
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    );
  }

  if (!adminContactEmail) return null;

  return (
    <a
      href={buildAdvertiseMailto(adminContactEmail, placement)}
      className={`flex aspect-[3/1] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-saddle/25 bg-parchment/40 text-center transition-colors hover:border-saddle xl:hidden ${className}`}
    >
      <span className="font-impact text-lg uppercase leading-tight text-saddle">
        Advertise Here
      </span>
      <span className="text-xs text-onlight-dim">Contact us</span>
    </a>
  );
}

function Pagination({
  currentPage,
  totalPages,
  countryFilter,
  breedFilter,
}: {
  currentPage: number;
  totalPages: number;
  countryFilter: string;
  breedFilter: string;
}) {
  if (totalPages <= 1) return null;

  function buildPageHref(page: number) {
    const qs = new URLSearchParams();
    if (countryFilter) qs.set("country", countryFilter);
    if (breedFilter) qs.set("breed", breedFilter);
    if (page > 1) qs.set("page", String(page));
    const query = qs.toString();
    return query ? `/?${query}` : "/";
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {pages.map((page) => (
        <Link
          key={page}
          href={buildPageHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-bold transition-colors ${
            page === currentPage
              ? "bg-saddle text-paper"
              : "text-onlight-dim hover:bg-parchment"
          }`}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}

function KennelCard({
  kennel,
  dogCount,
}: {
  kennel: DirectoryKennel;
  dogCount: number;
}) {
  const location = [kennel.city, kennel.country].filter(Boolean).join(", ");

  return (
    <Link
      href={`/${kennel.slug}`}
      className="group flex items-center gap-4 border border-saddle/20 bg-parchment/40 p-5 transition-colors hover:border-saddle"
    >
      {kennel.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={kennel.logo_url}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-saddle/10 font-impact text-xl text-saddle"
          aria-hidden="true"
        >
          {kennel.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-impact text-xl uppercase leading-tight text-onlight group-hover:text-saddle">
          {kennel.name}
        </p>
        {location && (
          <p className="truncate text-sm text-onlight-dim">{location}</p>
        )}
        <p className="text-xs font-bold uppercase tracking-wide text-onlight-dim/70">
          {dogCount} dog{dogCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
