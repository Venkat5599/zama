"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, UserPlus, Send, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { ConnectButton } from "@/components/connect-button";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/register", label: "Register", icon: UserPlus },
  { href: "/dashboard/send", label: "Send", icon: Send },
  { href: "/dashboard/claim", label: "Claim", icon: Inbox },
];

function NavLinks({ path }: { path: string }): ReactNode {
  return (
    <>
      {nav.map((n) => {
        const active = path === n.href;
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {n.label}
          </Link>
        );
      })}
    </>
  );
}

export function DashboardSidebar(): ReactNode {
  const path = usePathname();
  return (
    <>
      {/* Desktop: fixed left rail */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-border bg-frame px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <div className="h-6 w-6 rounded-full bg-foreground" />
          <span className="text-lg font-semibold leading-none text-foreground">Veil</span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            CDP
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLinks path={path} />
        </nav>

        <div className="mt-4 border-t border-border pt-4">
          <ConnectButton />
        </div>
      </aside>

      {/* Mobile: top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-frame px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-foreground" />
          <span className="text-base font-semibold text-foreground">Veil</span>
        </Link>
        <div className="flex items-center gap-1">
          {nav.slice(1).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors " +
                (path === n.href ? "bg-foreground/10 text-foreground" : "text-foreground/60")
              }
            >
              {n.label}
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}
