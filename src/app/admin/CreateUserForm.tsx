"use client";

import { useActionState, useRef, useEffect } from "react";
import { createKennelUser, type CreateKennelUserState } from "./actions";
import type { Kennel } from "@/lib/supabase/types";

const initialState: CreateKennelUserState = { error: null };

const inputClass =
  "w-full border border-saddle/25 bg-paper px-3 py-2 text-sm text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "font-mono text-[0.68rem] uppercase tracking-[0.12em] text-onlight-dim dark:text-ink-text-dim";

export default function CreateUserForm({ kennels }: { kennels: Kennel[] }) {
  const [state, formAction, isPending] = useActionState(
    createKennelUser,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 border border-saddle/20 bg-white p-6 dark:border-brass/20 dark:bg-ink-2"
    >
      <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
        Creates the user and links them as an editor of the selected kennel.
        Share the email and password with the kennel owner.
      </p>

      {state.error && (
        <p className="border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="border border-hunter/40 bg-hunter/5 p-3 text-sm text-hunter dark:border-hunter-2 dark:bg-hunter/20 dark:text-ink-text">
          User created and linked successfully.
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="kennel_id" className={labelClass}>
          Kennel *
        </label>
        <select
          id="kennel_id"
          name="kennel_id"
          required
          className={inputClass}
        >
          <option value="">Select a kennel</option>
          {kennels.map((kennel) => (
            <option key={kennel.id} value={kennel.id}>
              {kennel.name} (/{kennel.slug})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="user_email" className={labelClass}>
            Email *
          </label>
          <input
            id="user_email"
            name="email"
            type="email"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="user_password" className={labelClass}>
            Temporary password * (min. 8 characters)
          </label>
          <input
            id="user_password"
            name="password"
            type="text"
            required
            minLength={8}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || kennels.length === 0}
        className="border border-saddle bg-saddle px-4 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim"
      >
        {isPending ? "Creating..." : "Create user"}
      </button>
      {kennels.length === 0 && (
        <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
          Create a kennel first before adding a user to it.
        </p>
      )}
    </form>
  );
}
