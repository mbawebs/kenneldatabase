import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "List Your Kennel — Kennel Database",
  description:
    "Join the Kennel Database and give your kennel a professional online presence with its own dedicated page.",
};

const INSTAGRAM_URL = "https://www.instagram.com/marckbarrera_art/";

const INCLUDED_ITEMS = [
  "Your own dedicated kennel page",
  "Sections for studs, females, productions, breedings, available dogs, and contact information",
  "Your kennel logo, description, location, and contact information",
  "Direct links to Instagram, Facebook, website, and more",
  "Placement inside the searchable Kennel Database directory",
  "Owner dashboard access to update kennel information and dogs",
];

const STEPS = [
  "Contact us through Instagram.",
  "Send us your kennel logo, information, social media, and dog photos.",
  "We'll send you the secure payment link.",
  "Your kennel page will be created and published.",
];

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

          {/* Precio */}
          <section className="mt-20">
            <h2 className="text-center font-impact text-3xl uppercase text-onlight sm:text-4xl">
              Pricing
            </h2>
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
              <PricingCard
                price="$99"
                title="One-Time Activation"
                description="Includes the creation and initial setup of your kennel page."
              />
              <PricingCard
                price="$1.99"
                period="/month"
                title="Directory Maintenance"
                note="First 30 days free"
                description="Keeps your kennel active in the directory and helps cover platform hosting and maintenance."
              />
            </div>
            <p className="mx-auto mt-6 max-w-md text-center text-sm font-medium text-onlight-dim">
              $99 one-time activation. Your first 30 days of directory
              maintenance are free, then $1.99/month to stay listed in the
              directory.
            </p>
          </section>

          {/* Como funciona */}
          <section className="mt-20">
            <h2 className="text-center font-impact text-3xl uppercase text-onlight sm:text-4xl">
              How It Works
            </h2>
            <ol className="mx-auto mt-8 max-w-2xl space-y-5">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saddle font-body text-sm font-bold text-paper">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-sm text-onlight sm:text-base">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* CTA final — unica accion de la pagina: contactar por
            Instagram. Sin boton de compra, sin checkout. */}
        <div className="bg-gradient-to-br from-[#1e5490] via-[#123a68] to-[#0a1a2f] px-6 py-16 text-center sm:px-10">
          <h2 className="font-impact text-3xl uppercase text-white sm:text-4xl">
            Ready to List Your Kennel?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            Send us a DM and we&apos;ll help you get started.
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-full border border-brass bg-brass px-8 py-3 font-body text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brass-dim"
          >
            Message Us on Instagram
          </a>
        </div>
      </main>
    </>
  );
}

function PricingCard({
  price,
  period,
  title,
  note,
  description,
}: {
  price: string;
  period?: string;
  title: string;
  note?: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center border border-saddle/20 bg-parchment/40 p-8 text-center">
      <p className="font-impact text-4xl uppercase text-saddle">
        {price}
        {period && (
          <span className="font-body text-base font-bold normal-case text-onlight-dim">
            {period}
          </span>
        )}
      </p>
      <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-onlight">
        {title}
      </p>
      {note && (
        <p className="mt-1 font-body text-xs font-bold uppercase tracking-wide text-hunter">
          {note}
        </p>
      )}
      <p className="mt-3 text-sm text-onlight-dim">{description}</p>
    </div>
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
