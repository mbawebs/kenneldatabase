"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toggleKennelStatus } from "./actions";
import FeaturedPositionControl from "./FeaturedPositionControl";
import type { Kennel } from "@/lib/supabase/types";

const PAGE_SIZE = 10;
const inputClass =
  "w-full rounded border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";

// kennels llega del server ya ordenado por created_at desc (mas
// recientes primero) — ese es el orden que usa "Recently added", asi
// que solo hace falta reordenar en el cliente cuando se elige A-Z.
// Busqueda y orden filtran/ordenan al instante en cada tecleo, sin
// ida y vuelta al servidor.
export default function KennelsTable({ kennels }: { kennels: Kennel[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? kennels.filter((k) => k.name.toLowerCase().includes(q)) : kennels;
  }, [kennels, query]);

  const sorted = useMemo(() => {
    if (sort !== "name") return filtered;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageKennels = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasFilters = Boolean(query || sort !== "recent");

  return (
    <div>
      <h2 className="mb-4 font-display text-lg">
        Kennels ({sorted.length}
        {query ? ` of ${kennels.length}` : ""})
      </h2>

      <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-saddle/15 pb-4 dark:border-brass/15">
        <div className="min-w-[200px] flex-1 space-y-1">
          <label
            htmlFor="kq"
            className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
          >
            Search by name
          </label>
          <input
            id="kq"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Kennel name…"
            className={inputClass}
          />
        </div>
        <div className="min-w-[170px] space-y-1">
          <label
            htmlFor="ksort"
            className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
          >
            Sort by
          </label>
          <select
            id="ksort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "recent" | "name");
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="recent">Recently added</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSort("recent");
              setPage(1);
            }}
            className="font-mono text-xs uppercase tracking-wide text-onlight-dim underline decoration-onlight-dim/40 underline-offset-2 hover:text-saddle hover:decoration-saddle dark:text-ink-text-dim"
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-saddle/20 dark:border-brass/20">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-saddle/20 bg-parchment font-mono text-[0.68rem] uppercase tracking-[0.1em] text-onlight-dim dark:border-brass/20 dark:bg-ink-2 dark:text-ink-text-dim">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Plan</th>
              <th className="p-3 font-medium">Featured</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {pageKennels.map((kennel) => (
              <tr
                key={kennel.id}
                className="border-t border-saddle/10 dark:border-brass/10"
              >
                <td className="p-3 font-medium">{kennel.name}</td>
                <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                  /{kennel.slug}
                </td>
                <td className="p-3">
                  <span
                    className={`border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide ${
                      kennel.status === "active"
                        ? "border-hunter/40 text-hunter dark:border-hunter-2 dark:text-hunter-2"
                        : "border-onlight-dim/30 text-onlight-dim dark:border-ink-text-dim/30 dark:text-ink-text-dim"
                    }`}
                  >
                    {kennel.status}
                  </span>
                </td>
                <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                  {kennel.plan}
                </td>
                <td className="p-3">
                  <FeaturedPositionControl
                    kennelId={kennel.id}
                    currentPosition={kennel.featured_position}
                  />
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/kennels/${kennel.id}`}
                      className="border border-saddle/30 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
                    >
                      Manage
                    </Link>
                    <form action={toggleKennelStatus}>
                      <input type="hidden" name="id" value={kennel.id} />
                      <input
                        type="hidden"
                        name="nextStatus"
                        value={kennel.status === "active" ? "inactive" : "active"}
                      />
                      <button
                        type="submit"
                        className="border border-saddle/30 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
                      >
                        {kennel.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {pageKennels.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-3 text-center text-onlight-dim dark:text-ink-text-dim"
                >
                  {query ? "No kennels match that search." : "No kennels yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <PageNav
          currentPage={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

export function PageNav({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const arrowClass = (disabled: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm transition-colors ${
      disabled
        ? "cursor-not-allowed text-onlight-dim/30 dark:text-ink-text-dim/20"
        : "text-onlight-dim hover:bg-parchment dark:text-ink-text-dim dark:hover:bg-ink-2"
    }`;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={arrowClass(currentPage === 1)}
      >
        ‹
      </button>
      {pages.map((page) => (
        <button
          type="button"
          key={page}
          onClick={() => onChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold transition-colors ${
            page === currentPage
              ? "bg-saddle text-paper dark:bg-brass dark:text-ink"
              : "text-onlight-dim hover:bg-parchment dark:text-ink-text-dim dark:hover:bg-ink-2"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={arrowClass(currentPage === totalPages)}
      >
        ›
      </button>
    </nav>
  );
}
