export default function KennelNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ink px-8 text-center text-ink-text">
      <div
        className="flex h-16 w-16 rotate-45 items-center justify-center bg-[var(--color-accent)] text-ink-text"
        aria-hidden="true"
      >
        <span className="-rotate-45 font-body text-2xl font-black">×</span>
      </div>
      <h1 className="font-impact text-4xl uppercase tracking-tight">
        Kennel not found
      </h1>
      <p className="max-w-sm text-ink-text-dim">
        This link doesn&apos;t match any active kennel. Please check that the
        address is correct.
      </p>
    </main>
  );
}
