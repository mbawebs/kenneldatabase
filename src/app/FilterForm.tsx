"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";

const selectClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-2.5 text-sm text-onlight outline-none transition-colors focus:border-saddle";

// Sigue siendo un <form method="GET"> real (no todo-cliente): asi la
// URL resultante (?country=Canada) queda compartible/indexable igual
// que antes. Lo unico que cambia es que elegir un valor ya dispara el
// submit solo — antes habia que acordarse de darle clic a "Filter"
// aparte, y sin eso el filtro elegido no se aplicaba.
export default function FilterForm({
  countries,
  breeds,
  countryFilter,
  breedFilter,
  sortParam,
  hasFilters,
}: {
  countries: string[];
  breeds: string[];
  countryFilter: string;
  breedFilter: string;
  sortParam: string;
  hasFilters: boolean;
}) {
  function autoSubmit(e: ChangeEvent<HTMLSelectElement>) {
    e.currentTarget.form?.requestSubmit();
  }

  return (
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
          onChange={autoSubmit}
          className={selectClass}
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
          onChange={autoSubmit}
          className={selectClass}
        >
          <option value="">All breeds</option>
          {breeds.map((breed) => (
            <option key={breed} value={breed}>
              {breed}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[180px] flex-1 space-y-1.5">
        <label
          htmlFor="sort"
          className="block font-body text-[0.65rem] font-bold uppercase tracking-widest text-onlight-dim"
        >
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={sortParam}
          onChange={autoSubmit}
          className={selectClass}
        >
          <option value="">Relevance</option>
          <option value="visits">Most visited</option>
          <option value="az">A-Z</option>
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
  );
}
