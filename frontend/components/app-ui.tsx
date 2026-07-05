"use client";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"rounded-3xl border border-border bg-frame p-6 sm:p-8 " + className}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      <span className="h-1 w-1 rounded-full bg-accent" />
      {children}
    </span>
  );
}

export function PrimaryButton({
  children, onClick, disabled, type = "button", full,
}: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={"group relative inline-flex items-center disabled:opacity-40 " + (full ? "w-full justify-center" : "")}
    >
      <span className="absolute inset-0 rounded-2xl bg-accent transition-transform duration-300 group-enabled:group-hover:translate-x-1 group-enabled:group-hover:translate-y-1" />
      <span className="relative z-10 w-full rounded-2xl bg-foreground px-6 py-3.5 text-center text-sm font-medium text-background">
        {children}
      </span>
    </button>
  );
}

export function GhostButton({
  children, onClick, disabled, href,
}: { children: ReactNode; onClick?: () => void; disabled?: boolean; href?: string }) {
  const cls =
    "inline-flex items-center justify-center rounded-2xl border border-border bg-muted px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40";
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button onClick={onClick} disabled={disabled} className={cls}>{children}</button>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

export function Mono({ children }: { children: ReactNode }) {
  return <span className="break-all font-mono text-xs text-foreground/80">{children}</span>;
}

export function Step({ n, label, state }: { n: number; label: string; state: "idle" | "active" | "done" | "error" }) {
  const ring =
    state === "done" ? "border-accent bg-accent text-background"
    : state === "active" ? "border-foreground text-foreground animate-pulse"
    : state === "error" ? "border-red-400 text-red-500"
    : "border-border text-muted-foreground";
  const glyph = state === "error" ? "!" : String(n);
  return (
    <div className="flex items-center gap-3">
      <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] transition-all " + ring}>
        {state === "done" ? "" : glyph}
      </span>
      <span className={"text-sm " + (state === "idle" ? "text-muted-foreground" : "text-foreground")}>{label}</span>
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{sub}</p>
    </div>
  );
}
