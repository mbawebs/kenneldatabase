"use client";

import { useMemo, useState } from "react";
import ResetPasswordControl from "./ResetPasswordControl";
import { PageNav } from "./KennelsTable";

const PAGE_SIZE = 10;
const inputClass =
  "w-full rounded border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";

export interface OwnerRow {
  id: string;
  user_id: string;
  role: string;
  email: string;
  kennelName: string;
}

// Mismo patron que KennelsTable: filtro y orden viven en el cliente
// y se recalculan al instante en cada tecleo, sin ida y vuelta al
// servidor.
export default function OwnersTable({ owners }: { owners: OwnerRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? owners.filter((o) => o.email.toLowerCase().includes(q)) : owners;
  }, [owners, query]);

  const sorted = useMemo(() => {
    if (sort !== "name") return filtered;
    return [...filtered].sort((a, b) => a.email.localeCompare(b.email));
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageOwners = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasFilters = Boolean(query || sort !== "recent");

  return (
    <div>
      <h2 className="mb-4 font-display text-lg">
        Kennel owners ({sorted.length}
        {query ? ` of ${owners.length}` : ""})
      </h2>

      <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-saddle/15 pb-4 dark:border-brass/15">
        <div className="min-w-[200px] flex-1 space-y-1">
          <label
            htmlFor="oq"
            className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
          >
            Search by email
          </label>
          <input
            id="oq"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="owner@example.com"
            className={inputClass}
          />
        </div>
        <div className="min-w-[170px] space-y-1">
          <label
            htmlFor="osort"
            className="block font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim dark:text-ink-text-dim"
          >
            Sort by
          </label>
          <select
            id="osort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as "recent" | "name");
              setPage(1);
            }}
            className={inputClass}
          >
            <option value="recent">Recently added</option>
            <option value="name">Email (A-Z)</option>
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
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Kennel</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {pageOwners.map((row) => (
              <tr
                key={row.id}
                className="border-t border-saddle/10 dark:border-brass/10"
              >
                <td className="p-3 font-medium">{row.email}</td>
                <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                  {row.kennelName}
                </td>
                <td className="p-3 text-onlight-dim dark:text-ink-text-dim">
                  {row.role}
                </td>
                <td className="p-3 text-right">
                  <ResetPasswordControl userId={row.user_id} />
                </td>
              </tr>
            ))}
            {pageOwners.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-3 text-center text-onlight-dim dark:text-ink-text-dim"
                >
                  {query ? "No owners match that search." : "No kennel owners yet."}
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
