import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "Veil: A Backend-Agnostic Protocol for Confidential Token Distribution on Public Blockchains.",
};

export default function WhitepaperPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pt-28 pb-16 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-accent" />
            Whitepaper
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Confidential Token Distribution
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A backend-agnostic protocol composing FHE confidential tokens (ERC-7984) with
            stealth addresses (ERC-5564) to hide both amount and recipient onchain.
          </p>
        </div>
        <a
          href="/whitepaper.html"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Open full page
        </a>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-white">
        <iframe
          src="/whitepaper.html"
          title="Veil Whitepaper"
          className="h-[85vh] w-full"
        />
      </div>
    </main>
  );
}
