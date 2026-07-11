import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FilterForm from "./FilterForm";
import type { SiteSettings } from "@/lib/supabase/types";

interface DirectoryKennel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  city: string | null;
  view_count: number;
}

// Cada criadero escribe la raza a su manera ("Mini Bully", "XL Bully",
// "Designer Frenchie", "Big Rope Frenchie"...) — de raza libre, sin
// catalogo fijo. En vez de mostrar cada variante suelta en el filtro,
// se agrupan por palabra clave bajo un nombre canonico. Para bullies
// solo deben quedar dos opciones visibles: "American Bully" (todo lo
// grande/estandar: pocket, standard, extreme, XL, XXL...) y "Exotic
// Bully" (todo lo chico/enano: mini, micro, nano, designer, merle).
// "American Bully" trae ademas un ultimo keyword generico ("bully")
// que actua de red de seguridad: cualquier variante nueva que nadie
// prevea aqui pero traiga "bully" en el nombre cae ahi por default,
// en vez de aparecer como su propia raza suelta en el filtro.
//
// El orden importa: los grupos mas especificos van primero (Fluffy
// Frenchie antes que French Bulldog, Exotic Bully antes que American
// Bully) porque sus variantes tambien contienen la palabra clave del
// grupo mas amplio — si no, quedarian atrapadas ahi antes de llegar
// al grupo correcto.
const BREED_GROUPS: { canonical: string; keywords: string[] }[] = [
  {
    canonical: "Fluffy Frenchie",
    keywords: [
      "fluffy frenchie",
      "big rope fluffy frenchie",
      "merle fluffy frenchie",
      "big rope fluffy french bulldog",
    ],
  },
  {
    canonical: "French Bulldog",
    keywords: [
      "frenchie",
      "frenchies",
      "big rope frenchie",
      "extreme frenchie",
      "exotic frenchie",
      "merle frenchie",
      "big rope french bulldog",
      "exotic french bulldog",
      "merle french bulldog",
    ],
  },
  {
    canonical: "Exotic Bully",
    keywords: [
      "exotic bully",
      "designer bully",
      "mini bully",
      "miniature bully",
      "mini american bully",
      "micro bully",
      "nano bully",
      "merle bully",
    ],
  },
  {
    canonical: "American Bully",
    keywords: [
      "pocket bully",
      "standard bully",
      "extreme bully",
      "xxl bully",
      "xxxl bully",
      "xl pitbull",
      "xl american bully",
      "american bully xl",
      "bully",
    ],
  },
];

function canonicalizeBreed(breed: string): string {
  // Colapsa espacios dobles/triples ("Exotic  Bully" con dos
  // espacios) antes de comparar, para que un typo de espaciado no
  // haga que una variante se quede fuera de su grupo.
  const lower = breed.toLowerCase().trim().replace(/\s+/g, " ");
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
  const sortParam = firstValue(params.sort);

  const supabase = await createClient();

  // status = 'active' se filtra explicito aqui (no solo confiar en la
  // policy de RLS): esta pagina la puede ver cualquiera, logueado o
  // no, y el directorio publico siempre debe verse igual sin importar
  // quien la esta viendo.
  const { data: kennelRows } = await supabase
    .from("kennels")
    .select("id, name, slug, logo_url, country, city, view_count")
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

  const hasFilters = Boolean(countryFilter || breedFilter || sortParam);

  // "Relevance" (el default) no es un solo numero: se pondera perfil
  // mas completo (mas perros publicados) primero, luego popularidad
  // (mas visitas), con el nombre como ultimo desempate. "Most visited"
  // y "A-Z" son ordenes directos, sin ambiguedad.
  const sortedKennels = [...filteredKennels].sort((a, b) => {
    if (sortParam === "az") {
      return a.name.localeCompare(b.name);
    }
    if (sortParam === "visits") {
      return b.view_count - a.view_count || a.name.localeCompare(b.name);
    }
    const aDogs = dogsByKennel.get(a.id)?.count ?? 0;
    const bDogs = dogsByKennel.get(b.id)?.count ?? 0;
    return (
      bDogs - aDogs ||
      b.view_count - a.view_count ||
      a.name.localeCompare(b.name)
    );
  });

  // Paginado simple: cambiar de filtro/orden siempre resetea a la
  // pagina 1 (el form GET solo manda country/breed/sort, "page" queda
  // fuera del querystring sin necesidad de manejarlo aparte).
  const totalPages = Math.max(1, Math.ceil(sortedKennels.length / PAGE_SIZE));
  const requestedPage = Number(firstValue(params.page)) || 1;
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const pageKennels = sortedKennels.slice(
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

            <FilterForm
              countries={countries}
              breeds={breeds}
              countryFilter={countryFilter}
              breedFilter={breedFilter}
              sortParam={sortParam}
              hasFilters={hasFilters}
            />

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
              sortParam={sortParam}
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
  sortParam,
}: {
  currentPage: number;
  totalPages: number;
  countryFilter: string;
  breedFilter: string;
  sortParam: string;
}) {
  if (totalPages <= 1) return null;

  function buildPageHref(page: number) {
    const qs = new URLSearchParams();
    if (countryFilter) qs.set("country", countryFilter);
    if (breedFilter) qs.set("breed", breedFilter);
    if (sortParam) qs.set("sort", sortParam);
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
      className="group relative flex items-center gap-4 border border-saddle/20 bg-parchment/40 p-5 pb-7 transition-colors hover:border-saddle"
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
      {kennel.view_count > 0 && (
        <span className="absolute bottom-2 right-3 font-body text-[0.65rem] font-bold uppercase tracking-wide text-onlight-dim/60">
          {kennel.view_count} visit{kennel.view_count === 1 ? "" : "s"}
        </span>
      )}
    </Link>
  );
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
