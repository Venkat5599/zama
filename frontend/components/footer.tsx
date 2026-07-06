"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

const GITHUB_URL = "https://github.com/Venkat5599/zama";

const footerLinks = {
  menu: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "How it works", href: "/#how-it-works" },
  ],
  company: [
    { label: "GitHub", href: GITHUB_URL },
    { label: "Architecture", href: `${GITHUB_URL}/blob/main/ARCHITECTURE.md` },
    { label: "Zama FHEVM", href: "https://docs.zama.ai/fhevm" },
  ],
  social: [
    { label: "GitHub", href: GITHUB_URL },
    { label: "Zama", href: "https://zama.ai" },
  ],
};

export function Footer(): ReactNode {
  return (
    <footer className="relative mx-2.5 mt-24 pt-38 max-[850px]:mx-0">
      <div className="absolute top-0 left-1/2 w-full max-w-5xl -translate-x-1/2">
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl/15">
          <div
            className="absolute inset-0 scale-125 bg-center bg-no-repeat blur brightness-150"
            style={{ backgroundImage: "url(/BG.jpg)", backgroundSize: "150%" }}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center px-12 py-24 text-center max-[850px]:px-6 max-[850px]:py-6 max-[850px]:pt-12">
            <h2 className="mb-14 max-w-2xl text-6xl font-medium tracking-tight text-black max-[850px]:mb-8 max-[850px]:text-3xl">
              Hide the amount and the recipient. Live on Sepolia.
            </h2>

            <div className="flex items-center gap-3 max-[850px]:w-full max-[850px]:flex-col">
              <a
                href="/dashboard"
                className="bg-foreground hover:bg-foreground/90 text-background flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium whitespace-nowrap shadow-lg transition-colors max-[850px]:w-full"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="/whitepaper"
                className="bg-background hover:bg-background/90 text-foreground flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium whitespace-nowrap shadow-lg transition-colors max-[850px]:w-full"
              >
                Read whitepaper
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-accent rounded-tl-[3rem] rounded-tr-[3rem] pt-96 pb-16 max-[850px]:pt-72">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-start justify-between gap-12 max-[850px]:flex-col max-[850px]:gap-10">
            <a
              href="/"
              className="flex items-center gap-2"
              aria-label="Veil home"
            >
              <div className="h-8 w-8 rounded-full bg-neutral-900" />
              <span className="text-xl leading-0 font-semibold text-neutral-900">
                Veil
              </span>
            </a>

            <nav
              className="flex gap-16 max-[850px]:flex-wrap max-[850px]:gap-10"
              aria-label="Footer navigation"
            >
              <div>
                <h3 className="mb-4 text-xs font-medium tracking-wider text-neutral-900/50 uppercase">
                  Menu
                </h3>
                <ul className="space-y-2">
                  {footerLinks.menu.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-neutral-900 transition-colors hover:text-neutral-900/70"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-medium tracking-wider text-neutral-900/50 uppercase">
                  Company
                </h3>
                <ul className="space-y-2">
                  {footerLinks.company.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-neutral-900 transition-colors hover:text-neutral-900/70"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-medium tracking-wider text-neutral-900/50 uppercase">
                  Social
                </h3>
                <ul className="space-y-2">
                  {footerLinks.social.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-neutral-900 transition-colors hover:text-neutral-900/70"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-16 pt-6">
            <p className="text-center text-sm text-neutral-900/50">
              (c) {new Date().getFullYear()} Veil. Confidential token
              distribution on Zama FHEVM.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
