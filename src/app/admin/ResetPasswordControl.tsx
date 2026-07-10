"use client";

import { useActionState, useState } from "react";
import { resetKennelUserPassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = { error: null };

export default function ResetPasswordControl({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    resetKennelUserPassword,
    initialState
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-saddle/30 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
      >
        Reset password
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="user_id" value={userId} />
      <div className="flex gap-2">
        <input
          type="text"
          name="password"
          placeholder="New temp password"
          required
          minLength={8}
          autoComplete="off"
          className="w-40 border border-saddle/25 bg-paper px-2 py-1 text-xs text-onlight outline-none focus:border-saddle dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border border-saddle bg-saddle px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-paper hover:bg-saddle-2 disabled:opacity-50 dark:border-brass dark:bg-brass dark:text-ink dark:hover:bg-brass-dim"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-saddle/30 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wide hover:bg-saddle/5 dark:border-brass/30 dark:hover:bg-brass/10"
        >
          Cancel
        </button>
      </div>
      {state.error && (
        <p className="text-[0.68rem] text-oxblood dark:text-oxblood-2">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-[0.68rem] text-hunter dark:text-hunter-2">
          Password updated — share it with the owner.
        </p>
      )}
    </form>
  );
}
