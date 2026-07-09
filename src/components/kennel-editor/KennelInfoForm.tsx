"use client";

import { useActionState, useId, useState } from "react";
import { updateKennel, type UpdateKennelState } from "./actions";
import ImageUploadField from "./ImageUploadField";
import SocialLinksField from "./SocialLinksField";
import {
  ACCENT_COLOR_PRESETS,
  KENNEL_PLANS,
  type Kennel,
} from "@/lib/supabase/types";

const initialState: UpdateKennelState = { error: null };

const inputClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-3 text-base text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "block text-sm font-semibold text-onlight dark:text-ink-text";
const groupTitleClass =
  "text-xs font-bold uppercase tracking-wide text-saddle dark:text-brass";

export default function KennelInfoForm({
  kennel,
  isAdmin = false,
  onDraftChange,
}: {
  kennel: Kennel;
  // El campo Plan solo se muestra cuando esta vista la abre un
  // super-admin (ver /admin/kennels/[id]). En /dashboard este prop
  // no se pasa, asi que el cliente nunca lo ve.
  isAdmin?: boolean;
  // Se llama en cada cambio de cualquier campo (antes de guardar) para
  // que el panel de "Vista previa" lo refleje al instante.
  onDraftChange?: (draft: Kennel) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateKennel,
    initialState
  );
  const uid = useId();
  const fieldId = (name: string) => `${uid}-${name}`;
  const [draft, setDraft] = useState<Kennel>(kennel);

  function update<K extends keyof Kennel>(field: K, value: Kennel[K]) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    onDraftChange?.(next);
  }

  return (
    <form action={formAction} className="space-y-8 pb-28">
      <input type="hidden" name="kennel_id" value={kennel.id} />

      {state.error && (
        <p className="rounded-lg border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg border border-hunter/40 bg-hunter/5 p-3 text-sm text-hunter dark:border-hunter-2 dark:bg-hunter/20 dark:text-ink-text">
          Changes saved.
        </p>
      )}

      <div className="space-y-4">
        <p className={groupTitleClass}>The basics</p>
        <div className="space-y-1.5">
          <label htmlFor={fieldId("name")} className={labelClass}>
            Kennel name
          </label>
          <input
            id={fieldId("name")}
            name="name"
            required
            value={draft.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={fieldId("description")} className={labelClass}>
            Tell buyers about your kennel
          </label>
          <textarea
            id={fieldId("description")}
            name="description"
            rows={4}
            placeholder="A short introduction to your kennel, your bloodlines, your experience..."
            value={draft.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className={groupTitleClass}>Photos</p>
        <div className="flex flex-wrap gap-6">
          <ImageUploadField
            name="logo_url"
            label="Logo"
            hint="Square works best"
            kennelId={kennel.id}
            folder="logo"
            aspect="square"
            value={draft.logo_url ?? ""}
            onChange={(url) => update("logo_url", url || null)}
          />
          <div className="min-w-[240px] flex-1">
            <ImageUploadField
              name="cover_photo_url"
              label="Cover photo"
              hint="A wide photo for the top of your page"
              kennelId={kennel.id}
              folder="cover"
              aspect="wide"
              value={draft.cover_photo_url ?? ""}
              onChange={(url) => update("cover_photo_url", url || null)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className={groupTitleClass}>Brand color</p>
        <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
          Used for buttons and highlights on your public page. Pick one that
          matches your logo.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          {ACCENT_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => update("accent_color", preset.value)}
              aria-label={preset.label}
              aria-pressed={draft.accent_color.toLowerCase() === preset.value}
              className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: preset.value,
                borderColor:
                  draft.accent_color.toLowerCase() === preset.value
                    ? "currentColor"
                    : "transparent",
              }}
            />
          ))}
          <input
            type="color"
            value={draft.accent_color}
            onChange={(e) => update("accent_color", e.target.value)}
            aria-label="Custom brand color"
            className="h-10 w-12 cursor-pointer rounded-lg border border-saddle/25 bg-transparent p-0 dark:border-brass/25"
          />
        </div>
        <input type="hidden" name="accent_color" value={draft.accent_color} />
      </div>

      <div className="space-y-4">
        <p className={groupTitleClass}>Location</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={fieldId("country")} className={labelClass}>
              Country
            </label>
            <input
              id={fieldId("country")}
              name="country"
              value={draft.country ?? ""}
              onChange={(e) => update("country", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={fieldId("city")} className={labelClass}>
              City
            </label>
            <input
              id={fieldId("city")}
              name="city"
              value={draft.city ?? ""}
              onChange={(e) => update("city", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className={groupTitleClass}>Direct contact</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={fieldId("phone")} className={labelClass}>
              Phone number
            </label>
            <input
              id={fieldId("phone")}
              name="phone"
              value={draft.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={fieldId("email")} className={labelClass}>
              Email
            </label>
            <input
              id={fieldId("email")}
              name="email"
              type="email"
              value={draft.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className={groupTitleClass}>Social &amp; links</p>
        <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
          Add as many or as few as you use — WhatsApp, Instagram, Facebook,
          TikTok, YouTube, X, or your own website.
        </p>
        <SocialLinksField
          links={draft.social_links}
          onChange={(links) => update("social_links", links)}
        />
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <p className={groupTitleClass}>Plan</p>
          <div className="space-y-1.5 sm:w-1/2">
            <label htmlFor={fieldId("plan")} className={labelClass}>
              Plan
            </label>
            <select
              id={fieldId("plan")}
              name="plan"
              value={draft.plan}
              onChange={(e) =>
                update("plan", e.target.value as Kennel["plan"])
              }
              className={inputClass}
            >
              {KENNEL_PLANS.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-saddle/15 bg-white/95 p-4 backdrop-blur dark:border-brass/15 dark:bg-ink-2/95 sm:sticky sm:bottom-0 sm:mt-2 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full border border-saddle bg-saddle px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim sm:w-auto"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
