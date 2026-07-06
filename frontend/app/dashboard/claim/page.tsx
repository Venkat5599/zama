"use client";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { Wallet, getBytes } from "ethers";
import { ADDRESSES, announcerAbi, cTokenAbi, SCHEME_ID } from "@/lib/chain";
import { checkStealthAddress, type StealthKeys } from "@/lib/stealth";
import { loadKeys } from "@/lib/storage";
import { getFhe } from "@/lib/fhe";
import {
  Card,
  PageHeader,
  PrimaryButton,
  GhostButton,
  Field,
  Mono,
  inputClass,
} from "@/components/app-ui";

const START_BLOCK = BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK ?? "0");

type Found = {
  stealthAddress: string;
  stealthPrivateKey: string;
  amount?: bigint;
  decrypting?: boolean;
  error?: string;
};
type Funnel = { scanned: number; owned: number };

export default function ClaimPage() {
  const publicClient = usePublicClient();
  const [keys, setKeys] = useState<StealthKeys | null>(null);
  const [manual, setManual] = useState({ spend: "", view: "" });
  const [phase, setPhase] = useState<"idle" | "scanning" | "done" | "error">(
    "idle"
  );
  const [funnel, setFunnel] = useState<Funnel>({ scanned: 0, owned: 0 });
  const [found, setFound] = useState<Found[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setKeys(loadKeys()), []);

  function activeKeys(): {
    spendPriv: string;
    spendPub: string;
    viewPriv: string;
  } | null {
    if (keys)
      return {
        spendPriv: keys.spendingPrivateKey,
        spendPub: keys.spendingPublicKey,
        viewPriv: keys.viewingPrivateKey,
      };
    if (
      /^0x[0-9a-fA-F]{64}$/.test(manual.spend) &&
      /^0x[0-9a-fA-F]{64}$/.test(manual.view)
    ) {
      const spendPub = new Wallet(manual.spend).signingKey.compressedPublicKey;
      return { spendPriv: manual.spend, spendPub, viewPriv: manual.view };
    }
    return null;
  }

  async function scan() {
    const ak = activeKeys();
    if (!ak || !publicClient) return;
    setErr(null);
    setFound([]);
    setFunnel({ scanned: 0, owned: 0 });
    setPhase("scanning");
    try {
      const logs = await publicClient.getLogs({
        address: ADDRESSES.erc5564Announcer,
        event: announcerAbi[1],
        args: { schemeId: SCHEME_ID },
        fromBlock: START_BLOCK,
        toBlock: "latest",
      });

      const hits: Found[] = [];
      for (const log of logs) {
        const a = log.args as {
          stealthAddress?: string;
          ephemeralPubKey?: string;
          metadata?: string;
        };
        if (!a.stealthAddress || !a.ephemeralPubKey || !a.metadata) continue;
        const viewTag = getBytes(a.metadata)[0] ?? 0;
        const match = checkStealthAddress(
          a.stealthAddress,
          a.ephemeralPubKey,
          viewTag,
          ak.viewPriv,
          ak.spendPub,
          ak.spendPriv
        );
        if (match)
          hits.push({
            stealthAddress: match.stealthAddress,
            stealthPrivateKey: match.stealthPrivateKey,
          });
      }
      setFunnel({ scanned: logs.length, owned: hits.length });
      setFound(hits);
      setPhase("done");
      hits.forEach((_, i) => decrypt(i, hits));
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "scan failed");
      setPhase("error");
    }
  }

  async function decrypt(index: number, list: Found[]) {
    const item = list[index];
    if (!item) return;
    setFound((prev) =>
      prev.map((f, i) => (i === index ? { ...f, decrypting: true } : f))
    );
    try {
      if (!publicClient) throw new Error("no client");
      const handle = (await publicClient.readContract({
        address: ADDRESSES.cToken,
        abi: cTokenAbi,
        functionName: "confidentialBalanceOf",
        args: [item.stealthAddress as `0x${string}`],
      })) as string;

      const fhe = await getFhe();
      const { publicKey, privateKey } = fhe.generateKeypair();
      const start = Math.floor(Date.now() / 1000);
      const days = 1;
      const eip712 = fhe.createEIP712(
        publicKey,
        [ADDRESSES.cToken],
        start,
        days
      );

      const wallet = new Wallet(item.stealthPrivateKey);
      const types = { ...(eip712.types as Record<string, unknown>) };
      delete (types as any).EIP712Domain;
      const signature = await wallet.signTypedData(
        eip712.domain as any,
        types as any,
        eip712.message as any
      );

      const res = await fhe.userDecrypt(
        [{ handle, contractAddress: ADDRESSES.cToken }],
        privateKey,
        publicKey,
        signature.replace(/^0x/, ""),
        [ADDRESSES.cToken],
        item.stealthAddress,
        start,
        days
      );
      const clear = BigInt(
        res[handle as `0x${string}`] as string | number | bigint
      );
      setFound((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, amount: clear, decrypting: false } : f
        )
      );
    } catch (e: any) {
      setFound((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                decrypting: false,
                error: e?.shortMessage ?? e?.message ?? "decrypt failed",
              }
            : f
        )
      );
    }
  }

  const ready = !!activeKeys();

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pt-12 pb-24 sm:px-8">
      <PageHeader
        eyebrow="Recipient"
        title="Claim portal"
        sub="Scan announcements with your viewing key, detect payments addressed to you, and decrypt only your own slice. Everything below happens in your browser."
      />

      {!keys && (
        <Card className="mb-4 space-y-4">
          <p className="text-muted-foreground text-sm">
            No keys found on this device.{" "}
            <a href="/dashboard/register" className="text-foreground underline">
              Register
            </a>{" "}
            to generate them, or paste your private keys to scan on this device.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Spending private key">
              <input
                value={manual.spend}
                onChange={(e) =>
                  setManual((m) => ({ ...m, spend: e.target.value.trim() }))
                }
                placeholder="0x... 64 hex"
                className={inputClass + " font-mono"}
              />
            </Field>
            <Field label="Viewing private key">
              <input
                value={manual.view}
                onChange={(e) =>
                  setManual((m) => ({ ...m, view: e.target.value.trim() }))
                }
                placeholder="0x... 64 hex"
                className={inputClass + " font-mono"}
              />
            </Field>
          </div>
        </Card>
      )}

      <Card className="space-y-5">
        <PrimaryButton onClick={scan} disabled={!ready || phase === "scanning"}>
          {phase === "scanning" ? "Scanning" : "Scan for my payments"}
        </PrimaryButton>

        {phase !== "idle" && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <Funnelstat label="Announcements" value={funnel.scanned} />
            <Funnelstat label="Mine" value={funnel.owned} accent />
            <Funnelstat
              label="Decrypted"
              value={found.filter((f) => f.amount != null).length}
              accent
            />
          </div>
        )}
        {err && <p className="text-xs text-red-500">{err}</p>}
      </Card>

      {phase === "done" && found.length === 0 && (
        <Card className="mt-4 text-center">
          <p className="text-muted-foreground text-sm">
            No payments found for these keys yet. If a sender just paid you,
            wait for the block to settle and scan again, or double-check you
            shared the right meta-address.
          </p>
          <div className="mt-4 flex justify-center">
            <GhostButton href="/dashboard/register">
              My meta-address
            </GhostButton>
          </div>
        </Card>
      )}

      {found.map((f, i) => (
        <div key={f.stealthAddress} className="mt-4">
          <RevealCard found={f} onRetry={() => decrypt(i, found)} />
        </div>
      ))}
    </main>
  );
}

function Funnelstat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="border-border bg-background rounded-2xl border p-4">
      <div
        className={
          "text-3xl font-semibold " +
          (accent ? "text-accent" : "text-foreground")
        }
      >
        {value}
      </div>
      <div className="text-muted-foreground mt-1 text-[11px]">{label}</div>
    </div>
  );
}

function RevealCard({ found, onRetry }: { found: Found; onRetry: () => void }) {
  const shown = useCountUp(found.amount);
  return (
    <Card className="space-y-4">
      <Field label="Paid to your one-time stealth address">
        <Mono>{found.stealthAddress}</Mono>
      </Field>
      {found.amount != null ? (
        <div>
          <div className="text-muted-foreground text-[10px] tracking-[0.2em] uppercase">
            Your amount
          </div>
          <div className="text-foreground mt-1 text-6xl font-semibold tabular-nums">
            {shown.toLocaleString()}
          </div>
        </div>
      ) : found.decrypting ? (
        <div className="bg-muted h-14 w-40 animate-pulse rounded-2xl" />
      ) : found.error ? (
        <div className="space-y-2">
          <p className="text-xs text-red-500">{found.error}</p>
          <GhostButton onClick={onRetry}>Retry decrypt</GhostButton>
        </div>
      ) : null}
    </Card>
  );
}

function useCountUp(target?: bigint): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target == null) return;
    const end = Number(target);
    const dur = 800;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(end * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
