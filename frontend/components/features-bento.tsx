"use client";

import { motion, type Transition } from "motion/react";
import { CircleCheck, Star } from "lucide-react";
import type { ReactNode } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

const LAYER_BADGES = [
  { short: "FHE", label: "amount" },
  { short: "5564", label: "recipient" },
];

const DEPLOYMENT_STATS = [
  { icon: "", label: "Encrypted amounts", change: "FHE" },
  { icon: "", label: "Stealth recipients", change: "ERC-5564" },
];

const cardAnimation = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
};

const getCardTransition = (delay = 0): Transition => ({
  duration: 0.8,
  ease: EASE,
  delay,
});

function PhoneMockup({
  children,
  variant = "full",
}: {
  children: ReactNode;
  variant?: "full" | "compact";
}): ReactNode {
  const isCompact = variant === "compact";

  return (
    <div
      className={`bg-background relative z-10 overflow-hidden border-neutral-800 shadow-2xl ${
        isCompact
          ? "h-64 w-44 rounded-3xl border-4 md:h-72 md:w-48"
          : "h-96 w-56 rounded-t-4xl border-6 border-b-0 md:h-115 md:w-64"
      } `}
    >
      <div
        className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-neutral-800 ${isCompact ? "top-2 h-4 w-16" : "top-2 h-5 w-20"} `}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function AvatarStack(): ReactNode {
  return (
    <div className="flex items-center">
      {LAYER_BADGES.map((b, i) => (
        <div
          key={i}
          className="bg-accent -ml-4 flex size-12 flex-col items-center justify-center rounded-full border-2 border-white/25 text-black first:ml-0"
        >
          <span className="text-[11px] leading-none font-semibold">
            {b.short}
          </span>
          <span className="mt-0.5 text-[7px] leading-none">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

function DeploymentStat({
  icon,
  label,
  change,
}: {
  icon: string;
  label: string;
  change: string;
}): ReactNode {
  return (
    <div className="bg-background flex items-center justify-between rounded-xl p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-foreground font-medium">{label}</span>
      </div>
      <span className="text-sm font-medium text-black">{change}</span>
    </div>
  );
}

function DecorativeCircles(): ReactNode {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="border-accent/80 absolute size-56 rounded-full border" />
      <div className="border-accent/60 absolute size-72 rounded-full border" />
      <div className="border-accent/40 absolute size-88 rounded-full border" />
    </div>
  );
}

function StepByStepCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0)}
      className="group bg-card-primary flex min-h-140 flex-col overflow-hidden rounded-4xl p-8 pb-0 md:row-span-2"
    >
      <div className="relative z-10 mb-6 text-center transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="mb-3 text-2xl leading-tight font-medium text-neutral-900 md:text-4xl">
          Confidential By Default
        </h3>
        <p className="text-sm text-neutral-700">
          Amounts encrypted with FHE, recipients hidden behind one-time stealth
          addresses
        </p>
      </div>

      <div className="flex flex-1 items-end justify-center transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        <PhoneMockup variant="full">
          <div className="bg-phone-screen absolute inset-0 px-5 pt-14">
            <h4 className="mt-4 text-3xl leading-none font-medium tracking-tight text-neutral-900">
              Your own
            </h4>
            <h4 className="mb-4 text-3xl leading-none font-medium tracking-tight text-neutral-900">
              slice
            </h4>
            <p className="mb-8 text-sm leading-snug text-neutral-500">
              Only you can decrypt the amount sent to your stealth address.
            </p>

            {/* Project Card */}
            <div className="from-accent via-accent/80 to-accent/50 relative h-52 overflow-hidden rounded-2xl bg-linear-to-br p-4 shadow-xl">
              <ProjectCardContent />
            </div>
          </div>
        </PhoneMockup>
      </div>
    </motion.div>
  );
}

function ProjectCardContent(): ReactNode {
  return (
    <>
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,60 Q30,40 60,50 T100,30"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <path
          d="M0,55 Q40,35 70,45 T100,25"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
        />
      </svg>

      <div className="relative z-10 flex h-full items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-neutral-900">Project</p>
          <p className="text-base font-semibold text-neutral-900">Alpha</p>
        </div>
        <CircleCheck className="text-black opacity-25" aria-hidden="true" />
      </div>

      <div
        className="absolute bottom-3 left-5 flex items-center gap-2 text-xs tracking-widest text-neutral-700"
        aria-hidden="true"
      >
        <span>PRJ</span>
        <span>/</span>
        <span>2024</span>
        <span>/</span>
        <span>LIVE</span>
      </div>
    </>
  );
}

function DashboardCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.1)}
      className="group bg-card-secondary relative flex min-h-80 flex-col overflow-hidden rounded-4xl p-8 md:block"
    >
      <div className="relative z-10 max-w-48 transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="text-card-foreground mb-3 text-xl leading-tight font-medium whitespace-nowrap md:text-2xl">
          Scan and Claim
        </h3>
        <p className="text-card-foreground-muted text-sm">
          Scan announcements, detect your payment, decrypt only your slice
        </p>
      </div>

      <div className="relative mt-8 flex items-center justify-center self-center transition-transform duration-500 ease-out group-hover:scale-105 md:absolute md:top-1/2 md:right-12 md:mt-0 md:-translate-y-1/2 md:self-auto">
        <DecorativeCircles />

        <PhoneMockup variant="compact">
          <div className="bg-phone-screen absolute inset-0 px-3 pt-9">
            <div className="mb-3 flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 py-1.5">
              <span className="text-xs text-neutral-400">
                Search projects...
              </span>
            </div>
            <p className="mb-0.5 text-xs text-neutral-500">Announcements</p>
            <p className="mb-3 text-xl font-medium text-neutral-900">
              scanning
            </p>

            <div className="mb-4 flex gap-1.5">
              <span className="bg-accent rounded-full px-2.5 py-1 text-xs text-black">
                Deploy
              </span>
              <span className="px-2 py-1 text-xs text-neutral-400">Build</span>
              <span className="px-2 py-1 text-xs text-neutral-400">Test</span>
            </div>
          </div>
        </PhoneMockup>

        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 rounded-2xl bg-neutral-900 px-5 py-3 whitespace-nowrap shadow-xl">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-xs text-neutral-400">Build status</span>
            <span className="text-xs text-neutral-500"></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-white">All passing</span>
            <span className="text-accent bg-accent/20 rounded px-2 py-0.5 text-xs font-medium">
              100%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TrustedByCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.2)}
      className="group bg-card-secondary flex min-h-64 flex-col items-center justify-center rounded-4xl p-6 text-center md:p-8"
    >
      <div className="transition-transform duration-500 ease-out group-hover:scale-110">
        <h3 className="text-card-foreground mb-1 text-2xl leading-tight font-medium md:text-3xl">
          Hides Both
        </h3>
        <h3 className="text-card-foreground mb-5 text-2xl leading-tight font-medium md:text-3xl">
          Amount and Who
        </h3>
      </div>

      <div className="transition-transform duration-500 ease-out group-hover:scale-105">
        <AvatarStack />
      </div>

      <div className="text-card-foreground-muted mt-5 flex items-center gap-2 transition-transform duration-500 ease-out group-hover:scale-105">
        <Star className="size-4 fill-current" />
        <span className="text-xs font-medium">
          Two independent privacy layers
        </span>
      </div>
    </motion.div>
  );
}

function IntegrationsCard(): ReactNode {
  return (
    <motion.div
      {...cardAnimation}
      transition={getCardTransition(0.3)}
      className="group bg-card-primary flex min-h-64 flex-col rounded-4xl p-6 md:p-8"
    >
      <div className="mb-auto transition-transform duration-500 ease-out group-hover:scale-105">
        <h3 className="mb-2 text-xl leading-tight font-medium text-neutral-900 md:text-2xl">
          Built for Sepolia
        </h3>
        <p className="text-sm text-neutral-700">
          Demo-scale confidential disperse: 5-10 recipients per transaction
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
        {DEPLOYMENT_STATS.map((stat) => (
          <DeploymentStat key={stat.icon} {...stat} />
        ))}
      </div>
    </motion.div>
  );
}

export function FeaturesBento(): ReactNode {
  return (
    <section className="bg-background mb-32 w-full px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.5fr]">
          <StepByStepCard />
          <DashboardCard />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TrustedByCard />
            <IntegrationsCard />
          </div>
        </div>
      </div>
    </section>
  );
}
