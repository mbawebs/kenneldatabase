"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

// Publica a proposito (NEXT_PUBLIC_*): es el correo al que un dueño
// de kennel sin acceso (contraseña olvidada, cuenta sin vincular,
// etc.) puede escribir. No hay recuperacion de contraseña por email
// todavia, asi que esta es la unica salida para alguien sin sesion.
const ADMIN_CONTACT_EMAIL = process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL;

function buildContactMailto(email: string) {
  const subject = "Kennel Database — Login help";
  const body =
    "Hi,\n\nI'm having trouble logging into my Kennel Database dashboard.\n\nKennel name: \nWhat's happening: ";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 text-ink-text">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-12 w-12 rotate-45 items-center justify-center bg-brass text-ink"
            aria-hidden="true"
          >
            <span className="-rotate-45 font-display text-sm font-semibold">
              KD
            </span>
          </div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-brass">
            Kennel Database
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-5 border border-brass/20 bg-ink-2 p-8"
        >
          <div>
            <h1 className="font-display text-2xl text-ink-text">Log in</h1>
            <p className="mt-1 text-sm text-ink-text-dim">
              Access for registered kennels.
            </p>
          </div>

          {state.error && (
            <p className="border border-oxblood-2 bg-oxblood/20 p-3 text-sm text-ink-text">
              {state.error}
            </p>
          )}
          <Suspense fallback={null}>
            <PasswordChangedBanner />
          </Suspense>

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-text-dim"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-brass/25 bg-ink px-3 py-2.5 text-sm text-ink-text outline-none transition-colors focus:border-brass"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-text-dim"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full border border-brass/25 bg-ink px-3 py-2.5 pr-10 text-sm text-ink-text outline-none transition-colors focus:border-brass"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-text-dim hover:text-brass"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full border border-brass bg-brass px-4 py-2.5 font-mono text-xs uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brass-dim disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Log in"}
          </button>

          {ADMIN_CONTACT_EMAIL && (
            <a
              href={buildContactMailto(ADMIN_CONTACT_EMAIL)}
              className="block text-center text-xs text-ink-text-dim underline decoration-ink-text-dim/40 underline-offset-2 transition-colors hover:text-brass hover:decoration-brass"
            >
              Can&apos;t log in? Contact administration
            </a>
          )}
        </form>
      </div>
    </main>
  );
}

function PasswordChangedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("passwordChanged") !== "1") return null;

  return (
    <p className="border border-hunter-2 bg-hunter/20 p-3 text-sm text-ink-text">
      Password updated. Log in with your new password.
    </p>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.6 17.6 0 0 1-2.16 3.19m-3.35 2.6A9.12 9.12 0 0 1 12 20c-7 0-11-8-11-8a17.6 17.6 0 0 1 4.22-5.94" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
