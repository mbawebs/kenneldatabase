import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "List Your Kennel — Kennel Database",
  description:
    "Join the Kennel Database and give your kennel a professional online presence with its own dedicated page.",
};

const INCLUDED_ITEMS = [
  "Your own dedicated kennel page",
  "Sections for studs, females, productions, breedings, available dogs, and contact information",
  "Your kennel logo, description, location, and contact information",
  "Direct links to Instagram, Facebook, website, and more",
  "Placement inside the searchable Kennel Database directory",
  "Owner dashboard access to update kennel information and dogs",
];

// La oferta de pago ($99+$1.99, ahora "We Set It Up For You") ya no
// vive aqui: se mueve al dashboard, justo donde un kennel free choca
// con el candado de Available/Breedings — ahi es donde de verdad
// importa, no en una landing generica que nadie ve dos veces. Esta
// pagina es solo la puerta de entrada al registro gratis.
export default function ListYourKennelPage() {
  return (
    <>
      {/* Mismo tratamiento de hero azul que el home, para que se
          sienta parte del mismo sitio y no una landing suelta. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e5490] via-[#123a68] to-[#0a1a2f]">
        <div className="relative flex items-center justify-between px-6 pt-6 sm:px-10">
          <Link
            href="/"
            className="font-body text-[0.65rem] font-bold uppercase tracking-widest text-white/70 transition-colors hover:text-white"
          >
            ← Kennel Database
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/40 px-3 py-1.5 font-body text-[0.65rem] font-bold uppercase tracking-widest text-white/80 transition-colors hover:border-white hover:text-white"
          >
            Owner Login
          </Link>
        </div>
        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-10 text-center sm:pb-28 sm:pt-14">
          <h1 className="font-impact text-4xl uppercase leading-[0.95] text-white [text-shadow:0_6px_30px_rgba(0,0,0,0.65)] sm:text-6xl">
            Put Your Kennel on the Map
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Join the Kennel Database and give your kennel a professional
            online presence. Your dedicated page makes it easy for breeders,
            buyers, and dog lovers to discover your program and connect with
            you.
          </p>
        </div>
      </div>

      <main className="bg-white text-onlight">
        {/* Start Here: unica accion de la pagina — registro publico
            gratis (/signup). */}
        <section className="border-b border-saddle/15 bg-parchment/40 px-6 py-14 text-center sm:px-10">
          <h2 className="font-impact text-2xl uppercase text-onlight sm:text-3xl">
            Start Here — It&apos;s Free
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-onlight-dim sm:text-base">
            Create your account and get a free kennel page in minutes. No
            credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-full border border-saddle bg-saddle px-8 py-3 font-body text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-saddle-2"
          >
            Sign Up Free
          </Link>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
          {/* Que incluye */}
          <section>
            <h2 className="text-center font-impact text-3xl uppercase text-onlight sm:text-4xl">
              What&apos;s Included
            </h2>
            <ul className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
              {INCLUDED_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border border-saddle/20 bg-parchment/40 p-4"
                >
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-saddle" />
                  <span className="text-sm text-onlight">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}
