"use client";

import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { PageHeader } from "@/components/app-ui";

const routes = [
  {
    href: "/dashboard/register",
    title: "Register",
    body: "Generate spending and viewing keys and publish a stealth meta-address so senders can pay you confidentially.",
  },
  {
    href: "/dashboard/send",
    title: "Send",
    body: "Upload recipients, encrypt amounts with FHE in your browser, and disperse to one-time stealth addresses in a single transaction.",
  },
  {
    href: "/dashboard/claim",
    title: "Claim",
    body: "Scan announcements with your viewing key, detect your payment, and decrypt only your own slice.",
  },
];

export default function DashboardHome() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 pt-12 pb-24 sm:px-8">
      <PageHeader
        eyebrow="Veil dApp"
        title="Confidential disperse"
        sub="Private token distribution on Sepolia. Amounts hidden with Zama FHE, recipients hidden with stealth addresses. Pick a step to begin."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {routes.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group flex flex-col justify-between rounded-3xl border border-border bg-frame p-6 transition-colors hover:border-accent"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{r.title}</h3>
                <ArrowDownRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:-rotate-45" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
