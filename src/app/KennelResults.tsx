"use client";

import { useMemo, useState } from "react";
import KennelCard, { type DirectoryKennel } from "./KennelCard";

const PAGE_SIZE = 6;

// "kennels" ya llega del server filtrado por country/breed y
// ordenado (featured_position primero, luego el modo elegido) — lo
// unico que vive del lado del cliente es la busqueda por nombre y el
// paginado sobre el resultado de esa busqueda, para que escribir una
// letra filtre al instante sin ida y vuelta al servidor. El padre
// (HomePage) le pone key={country+breed+sort} a este componente para
// que se reinicie solo si esos filtros cambian.
export default function KennelResults({
  kennels,
  dogCounts,
}: {
  kennels: DirectoryKennel[];
  dogCounts: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? kennels.filter((k) => k.name.toLowerCase().includes(q)) : kennels;
  }, [kennels, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageKennels = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div>
      <div className="mb-6 max-w-sm space-y-1.5">
        <label
          htmlFor="kennelSearch"
          className="block font-body text-[0.65rem] font-bold uppercase tracking-widest text-onlight-dim"
        >
          Search by name
        </label>
        <input
          id="kennelSearch"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search kennels by name…"
          className="w-full rounded-lg border border-saddle/25 bg-paper px-4 py-2.5 text-sm text-onlight outline-none transition-colors focus:border-saddle"
        />
      </div>

      {pageKennels.length === 0 ? (
        <p className="py-16 text-center text-onlight-dim">
          {query
            ? "No kennels match that search."
            : "No kennels match those filters yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {pageKennels.map((kennel) => (
            <KennelCard
              key={kennel.id}
              kennel={kennel}
              dogCount={dogCounts[kennel.id] ?? 0}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-bold transition-colors ${
                p === currentPage
                  ? "bg-saddle text-paper"
                  : "text-onlight-dim hover:bg-parchment"
              }`}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
