"use client";

import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { MotionDiv, StaggerContainer, StaggerItem, fadeInUp } from "@/lib/motion";
import { Eyebrow } from "@/components/app-ui";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      {/* hero */}
      <section>
        <MotionDiv variants={fadeInUp}>
          <Eyebrow>Confidential Disperse Protocol</Eyebrow>
        </MotionDiv>
        <MotionDiv variants={fadeInUp} transition={{ duration: 0.5, delay: 0.05 }}>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-7xl">
            Pay a list of people{" "}
            <span className="rounded-2xl bg-accent px-3 py-0.5 text-background">privately</span>.
            On a public chain.
          </h1>
        </MotionDiv>
        <MotionDiv variants={fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Veil hides <span className="text-foreground">how much</span> with Zama FHE and{" "}
            <span className="text-foreground">who</span> with stealth addresses. Observers see
            encrypted amounts flowing to unlinkable, one-time addresses. Nothing else.
          </p>
        </MotionDiv>
        <MotionDiv variants={fadeInUp} transition={{ duration: 0.5, delay: 0.15 }}>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/send" className="group relative inline-flex items-center">
              <span className="absolute inset-y-0 right-0 w-[calc(100%-1.5rem)] rounded-2xl bg-accent" />
              <span className="relative z-10 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-medium text-background">
                Disperse confidentially
              </span>
              <span className="relative z-10 -left-px flex h-12 w-12 items-center justify-center rounded-2xl text-black">
                <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" />
              </span>
            </Link>
            <Link
              href="/claim"
              className="rounded-2xl border border-border bg-muted px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              Claim a payment
            </Link>
          </div>
        </MotionDiv>
      </section>

      {/* two privacy layers bento */}
      <StaggerContainer className="mt-24 grid grid-cols-1 gap-4 md:grid-cols-12">
        <StaggerItem className="md:col-span-7">
          <div className="flex h-full flex-col justify-between gap-10 rounded-3xl border border-border bg-frame p-8">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Layer 1 — Amount
            </span>
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-foreground">Encrypted with FHE</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Each amount lives onchain as a{" "}
                <span className="font-mono text-foreground">euint64</span> ciphertext (ERC-7984).
                Reduces to IND-CPA plus threshold decryption. The number never appears in the clear.
              </p>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem className="md:col-span-5">
          <div className="flex h-full flex-col justify-between gap-10 rounded-3xl border border-border bg-card-secondary p-8">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-card-foreground-muted">
              Layer 2 — Recipient
            </span>
            <div>
              <h3 className="text-3xl font-semibold tracking-tight text-card-foreground">Hidden with stealth</h3>
              <p className="mt-3 text-sm leading-relaxed text-card-foreground-muted">
                Every recipient gets a fresh one-time address via ECDH (ERC-5564). Unlinkable to
                identity; reduces to DDH on secp256k1.
              </p>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* how it works */}
      <StaggerContainer className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { n: "01", t: "Register", d: "Publish a stealth meta-address once." },
          { n: "02", t: "Send", d: "Upload recipients, encrypt, disperse in one tx." },
          { n: "03", t: "Claim", d: "Scan, decrypt only your own slice." },
        ].map((s) => (
          <StaggerItem key={s.n}>
            <div className="h-full rounded-3xl border border-border bg-frame p-7">
              <div className="font-mono text-xs text-muted-foreground">{s.n}</div>
              <div className="mt-2 text-lg font-semibold text-foreground">{s.t}</div>
              <div className="mt-1.5 text-sm text-muted-foreground">{s.d}</div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </main>
  );
}
