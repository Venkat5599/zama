import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "Veil: A Backend-Agnostic Protocol for Confidential Token Distribution on Public Blockchains.",
};

export default function WhitepaperPage() {
  return (
    <main className="fixed inset-0 z-50 bg-white">
      <iframe
        src="/whitepaper.html"
        title="Veil Whitepaper"
        className="h-full w-full border-0"
      />
    </main>
  );
}
