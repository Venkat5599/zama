"use client";

import { LogoLoop, type LogoItem } from "@/components/logo-loop";
import { ArrowDownRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import { useRef, type ReactNode, type MouseEvent } from "react";

const ease = [0.23, 1, 0.32, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95, filter: "blur(8px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

// The stack Veil is actually built on — shown in place of mock social proof.
const BUILT_ON = [
  "Zama FHEVM",
  "ERC-7984",
  "ERC-5564",
  "ERC-6538",
  "TokenOps SDK",
  "OpenZeppelin",
  "EIP-712",
  "Ethereum Sepolia",
];

const logos: LogoItem[] = BUILT_ON.map((label) => ({
  node: (
    <span className="text-2xl font-semibold whitespace-nowrap text-white/90">
      {label}
    </span>
  ),
}));

const PARALLAX_INTENSITY = 20;

export function Hero(): ReactNode {
  const sectionRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;

    if (window.innerWidth < 850) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(offsetX * PARALLAX_INTENSITY);
    mouseY.set(offsetY * PARALLAX_INTENSITY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col"
      style={{ colorScheme: "light" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="absolute inset-0 -z-10 rounded-br-4xl rounded-bl-4xl bg-cover bg-center bg-no-repeat brightness-125 min-[850px]:inset-2.5 min-[850px]:scale-105"
        style={{
          backgroundImage: "url(/BG.jpg)",
          x,
          y,
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-center px-6 pt-64 max-[850px]:pt-32">
        <motion.div
          className="flex max-w-4xl flex-col items-center text-center max-[850px]:w-full max-[850px]:items-start max-[850px]:text-left"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white py-1.5 pr-3 pl-4 text-sm font-medium text-black"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Now Available
            <span className="text-accent"></span>
          </motion.div>

          <h1 className="mb-6 text-8xl leading-[1.1] font-medium tracking-tight text-black max-[850px]:text-5xl">
            <motion.span
              className="block"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease }}
            >
              Pay a List
            </motion.span>
            <motion.span
              className="block"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease }}
            >
              of People{" "}
              <span className="text-accent font-serif italic">Privately</span>
            </motion.span>
          </h1>

          <motion.p
            className="mb-8 text-lg text-neutral-600"
            variants={fadeInUp}
            transition={{ duration: 0.8, ease }}
          >
            Confidential token distribution on public chains. Hide how much
            (Zama FHE) and who (stealth addresses).
          </motion.p>

          <motion.a
            href="/dashboard"
            className="group relative inline-flex cursor-pointer items-center max-[850px]:w-full"
            variants={fadeInScale}
            transition={{ duration: 0.8, ease }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="bg-accent absolute inset-y-0 right-0 w-[calc(100%-2rem)] rounded-xl max-[850px]:w-full" />
            <span className="relative z-10 rounded-xl bg-black px-6 py-3 font-medium text-white max-[850px]:flex-1">
              Disperse Confidentially
            </span>
            <span className="relative -left-px z-10 flex h-11 w-11 items-center justify-center rounded-xl text-black">
              <ArrowDownRight className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-45" />
            </span>
          </motion.a>
        </motion.div>
      </div>

      <motion.div
        className="relative mt-24 px-6 max-[850px]:mt-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease }}
      >
        <div className="relative mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 mask-[linear-gradient(to_bottom,black_50%,transparent_100%)] shadow-2xl/5 [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] dark:mix-blend-darken">
            <Image
              src="/dashboardmock.png"
              alt="Dashboard preview"
              width={1920}
              height={1080}
              className="h-auto w-full contrast-125 invert dark:contrast-100 dark:invert-0"
              priority
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="pt-24 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1, ease }}
      >
        <LogoLoop logos={logos} speed={60} logoHeight={42} gap={124} />
      </motion.div>
    </section>
  );
}
