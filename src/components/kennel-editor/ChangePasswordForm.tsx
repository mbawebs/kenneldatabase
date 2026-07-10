"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = { error: null };

const inputClass =
  "w-full rounded-lg border border-saddle/25 bg-paper px-4 py-3 text-base text-onlight outline-none transition-colors focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass";
const labelClass =
  "block text-sm font-semibold text-onlight dark:text-ink-text";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-onlight-dim dark:text-ink-text-dim">
        Set a new password for your own login. You&apos;ll be signed out and
        asked to log in again with it.
      </p>

      {state.error && (
        <p className="rounded-lg border border-oxblood/40 bg-oxblood/5 p-3 text-sm text-oxblood dark:border-oxblood-2 dark:bg-oxblood/20 dark:text-ink-text">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="new-password">
          New password
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
        <p className="text-xs text-onlight-dim dark:text-ink-text-dim">
          At least 8 characters.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} htmlFor="confirm-password">
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-saddle bg-saddle px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim sm:w-auto"
      >
        {isPending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
