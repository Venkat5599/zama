"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ConnectButton } from "@/components/connect-button";

const ease = [0.23, 1, 0.32, 1] as const;
const links = [
  { href: "/", label: "Home" },
  { href: "/register", label: "Register" },
  { href: "/send", label: "Send" },
  { href: "/claim", label: "Claim" },
];

const CornerSVG = ({ className }: { className: string }) => (
  <svg className={className} width="50" height="50" viewBox="0 0 50 50" fill="none" aria-hidden="true">
    <path d="M5.50871e-06 0C-0.00788227 37.3001 8.99616 50.0116 50 50H5.50871e-06V0Z" fill="currentColor" />
  </svg>
);

export function Header(): ReactNode {
  const path = usePathname();
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="fixed left-1/2 top-2.5 z-9998 w-full max-w-5xl -translate-x-1/2 rounded-b-4xl bg-frame shadow-2xl/20 max-[850px]:left-0 max-[850px]:right-0 max-[850px]:top-0 max-[850px]:w-full max-[850px]:max-w-none max-[850px]:translate-x-0 max-[850px]:rounded-none"
    >
      <div className="flex h-20 items-center justify-between px-6 max-[850px]:h-18">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-full bg-foreground" />
          <span className="text-lg font-semibold leading-none text-foreground">Veil</span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground max-[850px]:hidden">
            CDP
          </span>
        </Link>

        <nav className="flex items-center gap-1 max-[850px]:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                "rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (path === l.href
                  ? "bg-foreground/5 text-foreground"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground")
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>

      <CornerSVG className="pointer-events-none absolute top-0 -left-12.25 rotate-180 text-frame max-[850px]:hidden" />
      <CornerSVG className="pointer-events-none absolute top-0 -right-12.25 rotate-90 text-frame max-[850px]:hidden" />
    </motion.header>
  );
}
