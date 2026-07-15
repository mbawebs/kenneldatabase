import Link from "next/link";

export interface DirectoryKennel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  city: string | null;
  view_count: number;
  featured_position: number | null;
}

export default function KennelCard({
  kennel,
  dogCount,
}: {
  kennel: DirectoryKennel;
  dogCount: number;
}) {
  const location = [kennel.city, kennel.country].filter(Boolean).join(", ");
  const isFeatured = kennel.featured_position !== null;

  return (
    <Link
      href={`/${kennel.slug}`}
      className={`group relative flex items-center gap-4 border p-5 pb-7 transition-colors ${
        isFeatured
          ? "border-brass/70 bg-brass/[0.06] hover:border-brass"
          : "border-saddle/20 bg-parchment/40 hover:border-saddle"
      }`}
    >
      {isFeatured && (
        <span className="absolute -top-2.5 left-4 rounded-full border border-brass bg-paper px-2.5 py-0.5 font-body text-[0.6rem] font-bold uppercase tracking-widest text-saddle">
          ★ Featured
        </span>
      )}
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
