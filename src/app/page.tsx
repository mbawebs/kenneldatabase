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
};

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

  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .single();
  const settings: SiteSettings = settingsRow ?? EMPTY_SETTINGS;

  return (
    <>
      {settings.top_banner_text && (
        <TopBanner text={settings.top_banner_text} link={settings.top_banner_link} />
      )}

      <header className="border-b border-ink-3 bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
          <span className="font-impact text-xl uppercase tracking-wide text-brass sm:text-2xl">
            Kennel Database
          </span>
          <Link
            href="/login"
            className="rounded-full border border-ink-text-dim/40 px-3 py-1.5 font-body text-[0.65rem] font-bold uppercase tracking-widest text-ink-text-dim transition-colors hover:border-brass hover:text-brass"
          >
            Owner Login
          </Link>
        </div>
      </header>

      {/* Hero: azul (marca de la plataforma en si, no la de un kennel
          especifico) con el nombre grande al centro. Si hay una imagen
          subida desde /admin se usa de fondo con un degradado azul
          encima para contraste; si no, un degradado azul solo. */}
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
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
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
          />

          <div className="mx-auto min-w-0 max-w-5xl flex-1">
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
              {filteredKennels.length === 0 ? (
                <p className="py-16 text-center text-onlight-dim">
                  No kennels match those filters yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {filteredKennels.map((kennel) => (
                    <KennelCard
                      key={kennel.id}
                      kennel={kennel}
                      dogCount={dogsByKennel.get(kennel.id)?.count ?? 0}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <SideBanner
            imageUrl={settings.banner_right_image_url}
            link={settings.banner_right_link}
          />
        </div>
      </main>
    </>
  );
}

function TopBanner({ text, link }: { text: string; link: string | null }) {
  const className =
    "block bg-brass px-4 py-2 text-center font-body text-xs font-bold uppercase tracking-wide text-ink sm:text-sm";

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

// Solo se renderiza si el admin subio una imagen para ese lado desde
// /admin — sin imagen, no deja un hueco vacio en el layout. En
// pantallas angostas se oculta por completo (xl:block): apretaria
// demasiado el buscador y las tarjetas.
function SideBanner({
  imageUrl,
  link,
}: {
  imageUrl: string | null;
  link: string | null;
}) {
  if (!imageUrl) return null;

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
