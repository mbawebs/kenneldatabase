"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface LightboxState {
  photos: string[];
  index: number;
}

interface LightboxContextValue {
  open: (photos: string[], index: number) => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function useLightbox() {
  const ctx = useContext(LightboxContext);
  if (!ctx) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return ctx;
}

export default function LightboxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<LightboxState | null>(null);
  const touchStartX = useRef<number | null>(null);

  const open = useCallback((photos: string[], index: number) => {
    if (photos.length === 0) return;
    setState({ photos, index });
  }, []);

  const close = useCallback(() => setState(null), []);

  const step = useCallback((delta: number) => {
    setState((prev) => {
      if (!prev) return prev;
      const nextIndex =
        (prev.index + delta + prev.photos.length) % prev.photos.length;
      return { ...prev, index: nextIndex };
    });
  }, []);

  // Teclado (Escape / flechas) y bloqueo de scroll del fondo mientras
  // el lightbox esta abierto.
  useEffect(() => {
    if (!state) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state, close, step]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    const SWIPE_THRESHOLD = 50;
    if (delta > SWIPE_THRESHOLD) step(-1);
    else if (delta < -SWIPE_THRESHOLD) step(1);
    touchStartX.current = null;
  }

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}

      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 sm:p-10"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[var(--color-accent)]/40 text-ink-text transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
          >
            <CloseIcon />
          </button>

          {state.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[var(--color-accent)]/40 text-ink-text transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 sm:left-6"
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[var(--color-accent)]/40 text-ink-text transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 sm:right-6"
              >
                <ChevronIcon direction="right" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-wide text-ink-text-dim">
                {state.index + 1} / {state.photos.length}
              </div>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={state.index}
            src={state.photos[state.index]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </LightboxContext.Provider>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const d = direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
