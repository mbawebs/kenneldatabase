import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface DirectoryKennel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  city: string | null;
}

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
    if (breed) entry.breeds.add(breed);
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

  return (
    <main className="min-h-screen bg-ink text-ink-text">
      <header className="border-b border-ink-3">
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

      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 sm:py-20">
        <h1 className="font-impact text-5xl uppercase leading-[0.9] text-ink-text sm:text-7xl">
          Find your next <span className="text-brass">champion</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-text-dim">
          Browse studs, females, and litters from breeders across the
          directory.
        </p>

        <form
          method="GET"
          className="mt-10 flex flex-wrap items-end gap-4 border-y border-ink-3 py-6"
        >
          <div className="min-w-[180px] flex-1 space-y-1.5">
            <label
              htmlFor="country"
              className="block font-body text-[0.65rem] font-bold uppercase tracking-widest text-ink-text-dim"
            >
              Country
            </label>
            <select
              id="country"
              name="country"
              defaultValue={countryFilter}
              className="w-full rounded-lg border border-ink-3 bg-ink-2 px-4 py-2.5 text-sm text-ink-text outline-none transition-colors focus:border-brass"
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
              className="block font-body text-[0.65rem] font-bold uppercase tracking-widest text-ink-text-dim"
            >
              Breed
            </label>
            <select
              id="breed"
              name="breed"
              defaultValue={breedFilter}
              className="w-full rounded-lg border border-ink-3 bg-ink-2 px-4 py-2.5 text-sm text-ink-text outline-none transition-colors focus:border-brass"
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
            className="rounded-full border border-brass bg-brass px-6 py-2.5 font-body text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-dim"
          >
            Filter
          </button>
          {hasFilters && (
            <Link
              href="/"
              className="font-body text-xs font-bold uppercase tracking-widest text-ink-text-dim underline decoration-ink-text-dim/40 underline-offset-2 transition-colors hover:text-brass hover:decoration-brass"
            >
              Clear filters
            </Link>
          )}
        </form>

        <div className="mt-10">
          {filteredKennels.length === 0 ? (
            <p className="py-16 text-center text-ink-text-dim">
              No kennels match those filters yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </main>
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
      className="group flex items-center gap-4 border border-ink-3 bg-ink-2 p-5 transition-colors hover:border-brass"
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
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-3 font-impact text-xl text-ink-text-dim"
          aria-hidden="true"
        >
          {kennel.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-impact text-xl uppercase leading-tight text-ink-text group-hover:text-brass">
          {kennel.name}
        </p>
        {location && (
          <p className="truncate text-sm text-ink-text-dim">{location}</p>
        )}
        <p className="text-xs font-bold uppercase tracking-wide text-ink-text-dim/70">
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
