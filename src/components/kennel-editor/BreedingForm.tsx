"use client";

import { useActionState, useEffect, useId, useState } from "react";
import {
  createBreeding,
  updateBreeding,
  type BreedingFormState,
} from "./actions";
import MultiImageUploadField from "./MultiImageUploadField";
import type { Breeding } from "@/lib/supabase/types";

const initialState: BreedingFormState = { error: null };

const inputClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-3 text-base text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "block text-sm font-semibold text-onlight dark:text-ink-text";

export default function BreedingForm({
  breeding,
  kennelId,
  onDone,
  onCancel,
  onDraftChange,
}: {
  breeding?: Breeding;
  kennelId: string;
  onDone: () => void;
  onCancel: () => void;
  // Se llama en cada cambio (antes de guardar) para que el panel de
  // "Vista previa" refleje esta cruza al instante.
  onDraftChange?: (draft: Breeding) => void;
}) {
  const action = breeding ? updateBreeding : createBreeding;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const [tempId] = useState(() => breeding?.id ?? crypto.randomUUID());
  const [draft, setDraft] = useState<Breeding>(
    breeding ?? {
      id: tempId,
      kennel_id: kennelId,
      title: "",
      sire_name: null,
      dam_name: null,
      description: null,
      photos: null,
      display_order: 100,
      date: null,
      created_at: new Date().toISOString(),
    }
  );

  function update<K extends keyof Breeding>(field: K, value: Breeding[K]) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    onDraftChange?.(next);
  }

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="space-y-6 pb-28">
      <input type="hidden" name="kennel_id" value={kennelId} />
      {breeding && (
        <input type="hidden" name="breeding_id" value={breeding.id} />
      )}

      {state.error && (
        <p className="rounded-lg border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor={fieldId("title")}>
          Give this breeding a name
        </label>
        <input
          id={fieldId("title")}
          name="title"
          placeholder="e.g. Thor x Luna litter"
          value={draft.title ?? ""}
          onChange={(e) => update("title", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor={fieldId("sire_name")}>
            Sire (father)
          </label>
          <input
            id={fieldId("sire_name")}
            name="sire_name"
            value={draft.sire_name ?? ""}
            onChange={(e) => update("sire_name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor={fieldId("dam_name")}>
            Dam (mother)
          </label>
          <input
            id={fieldId("dam_name")}
            name="dam_name"
            value={draft.dam_name ?? ""}
            onChange={(e) => update("dam_name", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor={fieldId("date")}>
          Date
        </label>
        <input
          id={fieldId("date")}
          name="date"
          type="date"
          value={draft.date ?? ""}
          onChange={(e) => update("date", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor={fieldId("description")}>
          Tell buyers more
        </label>
        <textarea
          id={fieldId("description")}
          name="description"
          rows={4}
          placeholder="Litter size, bloodline highlights..."
          value={draft.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </div>

      <MultiImageUploadField
        name="photos"
        label="Photos (at least 1 required)"
        kennelId={kennelId}
        folder="breedings"
        value={draft.photos ?? []}
        onChange={(photos) => update("photos", photos)}
      />

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-saddle/15 bg-white/95 p-4 backdrop-blur dark:border-brass/15 dark:bg-ink-2/95 sm:sticky sm:bottom-0 sm:mt-2 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-full border border-saddle bg-saddle px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim sm:flex-none"
        >
          {isPending ? "Saving..." : breeding ? "Save changes" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-saddle/30 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-onlight transition-colors hover:bg-saddle/5 dark:border-brass/30 dark:text-ink-text dark:hover:bg-brass/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
