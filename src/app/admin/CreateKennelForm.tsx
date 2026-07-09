"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createKennel, type CreateKennelState } from "./actions";
import ImageUploadField from "@/components/kennel-editor/ImageUploadField";
import { KENNEL_PLANS } from "@/lib/supabase/types";

const initialState: CreateKennelState = { error: null };

const inputClass =
  "w-full border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "font-mono text-[0.68rem] uppercase tracking-[0.12em] text-onlight-dim dark:text-ink-text-dim";

export default function CreateKennelForm() {
  const [state, formAction, isPending] = useActionState(
    createKennel,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Se genera en el navegador (no en el servidor) para evitar un
  // mismatch de hidratación: el mismo valor tiene que aparecer tanto
  // en la carpeta de Storage donde se sube el logo/portada como en el
  // "id" que finalmente recibe el kennel al crearse.
  const [pendingId, setPendingId] = useState<string | null>(null);
  useEffect(() => {
    setPendingId(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // Nuevo id para el siguiente kennel que se cree; al cambiar el
      // "key" de los campos de imagen, React los vuelve a montar
      // desde cero (sin esto, seguirían mostrando el logo ya subido).
      setPendingId(crypto.randomUUID());
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 border border-saddle/20 bg-white p-6 dark:border-brass/20 dark:bg-ink-2"
    >
      <input type="hidden" name="id" value={pendingId ?? ""} />

      {state.error && (
        <p className="border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="border border-hunter/40 bg-hunter/5 p-3 text-sm text-hunter dark:border-hunter-2 dark:bg-hunter/20 dark:text-ink-text">
          Kennel created successfully.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className={labelClass}>
            Name *
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="slug" className={labelClass}>
            Slug * (for the URL: /my-kennel)
          </label>
          <input id="slug" name="slug" required className={inputClass} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pendingId ? (
          <>
            <ImageUploadField
              key={`${pendingId}-logo`}
              name="logo_url"
              label="Logo"
              kennelId={pendingId}
              folder="logo"
            />
            <ImageUploadField
              key={`${pendingId}-cover`}
              name="cover_photo_url"
              label="Cover photo"
              kennelId={pendingId}
              folder="cover"
            />
          </>
        ) : (
          <>
            <div className="h-24 animate-pulse bg-parchment dark:bg-ink-3" />
            <div className="h-24 animate-pulse bg-parchment dark:bg-ink-3" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="country" className={labelClass}>
            Country
          </label>
          <input id="country" name="country" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <input id="city" name="city" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input id="phone" name="phone" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="whatsapp" className={labelClass}>
            WhatsApp
          </label>
          <input id="whatsapp" name="whatsapp" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="instagram" className={labelClass}>
            Instagram (username or URL)
          </label>
          <input id="instagram" name="instagram" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label htmlFor="facebook" className={labelClass}>
            Facebook (username or URL)
          </label>
          <input id="facebook" name="facebook" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="active"
            className={inputClass}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="plan" className={labelClass}>
            Plan
          </label>
          <select
            id="plan"
            name="plan"
            defaultValue="demo"
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

      <button
        type="submit"
        disabled={isPending || !pendingId}
        className="border border-saddle bg-saddle px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim"
      >
        {isPending ? "Creating..." : "Create kennel"}
      </button>
    </form>
  );
}
