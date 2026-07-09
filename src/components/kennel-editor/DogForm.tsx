"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { createDog, updateDog, type DogFormState } from "./actions";
import MultiImageUploadField from "./MultiImageUploadField";
import type { Dog, DogCategory } from "@/lib/supabase/types";

const initialState: DogFormState = { error: null };

const CATEGORY_CHIP_LABELS: Record<DogCategory, string> = {
  stud: "Stud",
  female: "Female",
  available: "Available",
  production: "Production dog",
  puppy: "Puppy",
};

const inputClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-3 text-base text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "block text-sm font-semibold text-onlight dark:text-ink-text";

export default function DogForm({
  dog,
  kennelId,
  categories,
  onDone,
  onCancel,
}: {
  dog?: Dog;
  kennelId: string;
  // Categorias validas para la seccion desde la que se abrio este
  // editor. Si solo hay una, la categoria queda implicita (no se le
  // pregunta al usuario). Si hay mas de una (Productions = production +
  // puppy), se muestra como chips en vez de un <select>.
  categories: DogCategory[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = dog ? updateDog : createDog;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const [category, setCategory] = useState<DogCategory>(
    dog?.category ?? categories[0]
  );

  useEffect(() => {
    if (state.success) {
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="space-y-6 pb-28">
      <input type="hidden" name="kennel_id" value={kennelId} />
      <input type="hidden" name="category" value={category} />
      {dog && <input type="hidden" name="dog_id" value={dog.id} />}

      {state.error && (
        <p className="rounded-lg border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}

      {categories.length > 1 && (
        <div className="space-y-1.5">
          <label className={labelClass}>Which one is this?</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                aria-pressed={category === value}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  category === value
                    ? "border-saddle bg-saddle text-paper dark:border-brass dark:bg-brass dark:text-ink"
                    : "border-saddle/25 text-onlight dark:border-brass/25 dark:text-ink-text"
                }`}
              >
                {CATEGORY_CHIP_LABELS[value]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor={fieldId("name")}>
          Name
        </label>
        <input
          id={fieldId("name")}
          name="name"
          required
          defaultValue={dog?.name}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor={fieldId("breed")}>
            What breed?
          </label>
          <input
            id={fieldId("breed")}
            name="breed"
            defaultValue={dog?.breed ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor={fieldId("color")}>
            Color
          </label>
          <input
            id={fieldId("color")}
            name="color"
            defaultValue={dog?.color ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor={fieldId("date_of_birth")}>
            Birthday
          </label>
          <input
            id={fieldId("date_of_birth")}
            name="date_of_birth"
            type="date"
            defaultValue={dog?.date_of_birth ?? ""}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor={fieldId("price")}>
            Price (optional)
          </label>
          <input
            id={fieldId("price")}
            name="price"
            placeholder="$2,500 USD"
            defaultValue={dog?.price ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor={fieldId("description")}>
          Tell buyers more
        </label>
        <textarea
          id={fieldId("description")}
          name="description"
          rows={4}
          placeholder="Temperament, structure, bloodline, achievements..."
          defaultValue={dog?.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor={fieldId("pedigree_url")}>
          Pedigree link (optional)
        </label>
        <input
          id={fieldId("pedigree_url")}
          name="pedigree_url"
          placeholder="Link to a PDF or photo of the pedigree"
          defaultValue={dog?.pedigree_url ?? ""}
          className={inputClass}
        />
      </div>

      <MultiImageUploadField
        name="photos"
        label="Photos"
        kennelId={kennelId}
        folder="dogs"
        defaultValue={dog?.photos}
      />

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-saddle/15 bg-white/95 p-4 backdrop-blur dark:border-brass/15 dark:bg-ink-2/95 sm:sticky sm:bottom-0 sm:mt-2 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-full border border-saddle bg-saddle px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim sm:flex-none"
        >
          {isPending ? "Saving..." : dog ? "Save changes" : "Add"}
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
