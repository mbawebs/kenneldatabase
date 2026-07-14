"use client";

import { useActionState, useRef, useState } from "react";
import {
  setKennelFeaturedPosition,
  type SetFeaturedPositionState,
} from "./actions";

const initialState: SetFeaturedPositionState = { error: null, conflict: null };
const POSITIONS = [1, 2, 3, 4, 5, 6];

// El <select> es no-controlado (defaultValue), igual que los filtros
// del home — se somete solo al cambiar, sin boton "Guardar" aparte.
// "key" fuerza que vuelva a montar (y por tanto a mostrar de nuevo
// currentPosition) despues de un cambio exitoso o de cancelar un
// conflicto, para que nunca se quede mostrando un valor que en
// realidad no se guardo.
export default function FeaturedPositionControl({
  kennelId,
  currentPosition,
}: {
  kennelId: string;
  currentPosition: number | null;
}) {
  const [state, formAction, isPending] = useActionState(
    setKennelFeaturedPosition,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={kennelId} />
        <input type="hidden" name="force" value="false" />
        <select
          key={`${currentPosition ?? "none"}-${resetCount}`}
          name="position"
          defaultValue={currentPosition ? String(currentPosition) : ""}
          onChange={(e) => {
            setDismissed(false);
            e.currentTarget.form?.requestSubmit();
          }}
          disabled={isPending}
          className="rounded border border-saddle/25 bg-paper px-2 py-1 text-[0.68rem] text-onlight outline-none transition-colors focus:border-saddle disabled:opacity-50 dark:border-brass/25 dark:bg-ink dark:text-ink-text dark:focus:border-brass"
        >
          <option value="">None</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              Feature {p}
            </option>
          ))}
        </select>
      </form>

      {state.conflict && !dismissed && (
        <div className="max-w-[230px] border border-brass/50 bg-brass/5 p-2 text-right text-[0.68rem] text-onlight dark:text-ink-text">
          <p>
            Position {state.conflict.position} already belongs to{" "}
            <strong>{state.conflict.kennelName}</strong>. Take it and give it
            to this kennel instead?
          </p>
          <div className="mt-1.5 flex justify-end gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("id", kennelId);
                fd.set("position", String(state.conflict!.position));
                fd.set("force", "true");
                formAction(fd);
              }}
              className="font-mono text-[0.65rem] font-bold uppercase tracking-wide text-saddle underline disabled:opacity-50 dark:text-brass"
            >
              Yes, reassign
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                setResetCount((c) => c + 1);
              }}
              className="font-mono text-[0.65rem] uppercase tracking-wide text-onlight-dim underline dark:text-ink-text-dim"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.error && (
        <p className="text-[0.68rem] text-oxblood dark:text-oxblood-2">
          {state.error}
        </p>
      )}
    </div>
  );
}
