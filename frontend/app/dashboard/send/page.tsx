"use client";
import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { maxUint48 } from "viem";
import {
  ADDRESSES,
  announcerAbi,
  cTokenAbi,
  registryAbi,
  SCHEME_ID,
} from "@/lib/chain";
import {
  deriveStealthAddress,
  generateStealthKeys,
  encodeMetadata,
} from "@/lib/stealth";
import { getDisperseClient } from "@/lib/disperse";
import { BalancePanel } from "@/components/balance-panel";
import {
  Card,
  PageHeader,
  PrimaryButton,
  Field,
  Step,
  Mono,
  inputClass,
} from "@/components/app-ui";

type Row = {
  raw: string;
  meta: string | null;
  amount: bigint | null;
  error?: string;
};
type Phase =
  "idle" | "derive" | "operator" | "submit" | "announce" | "done" | "error";

const META_RE = /^0x[0-9a-fA-F]{132}$/;
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

// Real-world distribution templates. Each one-click preset fills the recipient
// list with the shape a real team would run — the exact use cases the bounty
// calls out (payroll, investor rounds, community rewards, vesting unlocks).
const SCENARIOS: {
  label: string;
  blurb: string;
  amounts: number[];
  pad: number;
}[] = [
  {
    label: "Payroll run",
    blurb: "Pay a team confidentially — no salary is legible onchain.",
    amounts: [4200, 3800, 5100, 2750, 3600],
    pad: 0,
  },
  {
    label: "Investor distribution",
    blurb: "Pro-rata payout to a cap table without revealing check sizes.",
    amounts: [25000, 15000, 10000, 5000],
    pad: 0,
  },
  {
    label: "Community rewards",
    blurb: "Airdrop equal grants; pad with decoys to hide the true count.",
    amounts: [150, 150, 150, 150, 150, 150],
    pad: 8,
  },
  {
    label: "Vesting unlock",
    blurb: "Release a cliff tranche to founders — amounts stay private.",
    amounts: [8000, 8000, 8000],
    pad: 0,
  },
];

export default function SendPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [csv, setCsv] = useState("");
  const [padTo, setPadTo] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [scenario, setScenario] = useState<string | null>(null);

  function applyScenario(s: (typeof SCENARIOS)[number]) {
    const lines = s.amounts.map(
      (a) => `${generateStealthKeys().stealthMetaAddress},${a}`
    );
    setCsv(lines.join("\n"));
    setPadTo(s.pad);
    setScenario(s.label);
  }

  const rows = useMemo<Row[]>(() => parseCsv(csv), [csv]);
  const valid = rows.filter((r) => r.meta && r.amount != null);
  const decoys = Math.max(0, padTo - valid.length);

  async function resolveMeta(value: string): Promise<string | null> {
    if (META_RE.test(value)) return value;
    if (ADDR_RE.test(value) && publicClient && ADDRESSES.erc6538Registry) {
      try {
        const meta = (await publicClient.readContract({
          address: ADDRESSES.erc6538Registry,
          abi: registryAbi,
          functionName: "stealthMetaAddressOf",
          args: [value as `0x${string}`, SCHEME_ID],
        })) as string;
        return META_RE.test(meta) ? meta : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async function run() {
    if (!walletClient || !publicClient || !address) return;
    setErr(null);
    setLinks([]);
    try {
      setPhase("derive");
      const resolved: { meta: string; amount: bigint }[] = [];
      for (const r of valid) {
        const meta = await resolveMeta(r.meta!);
        if (!meta)
          throw new Error(`Unregistered or invalid recipient: ${r.raw}`);
        resolved.push({ meta, amount: r.amount! });
      }
      for (let i = 0; i < decoys; i++)
        resolved.push({
          meta: generateStealthKeys().stealthMetaAddress,
          amount: 0n,
        });

      setPhase("derive");
      const stealthAddrs: `0x${string}`[] = [];
      const ephemerals: `0x${string}`[] = [];
      const metadatas: `0x${string}`[] = [];
      const realLinks: string[] = [];
      for (let i = 0; i < resolved.length; i++) {
        const p = deriveStealthAddress(resolved[i].meta);
        stealthAddrs.push(p.stealthAddress as `0x${string}`);
        ephemerals.push(p.ephemeralPublicKey as `0x${string}`);
        metadatas.push(encodeMetadata(p.viewTag) as `0x${string}`);
        if (resolved[i].amount > 0n)
          realLinks.push(
            `${location.origin}/dashboard/claim?a=${p.stealthAddress}&r=${p.ephemeralPublicKey}&v=${p.viewTag}`
          );
      }

      // TokenOps SDK client — routes the disperse through the official
      // ConfidentialDisperse singleton on Sepolia (auto-resolved by chain id).
      const client = await getDisperseClient(publicClient, walletClient);

      setPhase("operator");
      const isOp = (await publicClient.readContract({
        address: ADDRESSES.cToken,
        abi: cTokenAbi,
        functionName: "isOperator",
        args: [address, client.address],
      })) as boolean;
      if (!isOp) {
        const opHash = await walletClient.writeContract({
          address: ADDRESSES.cToken,
          abi: cTokenAbi,
          functionName: "setOperator",
          args: [client.address, Number(maxUint48)],
        });
        await publicClient.waitForTransactionReceipt({ hash: opHash });
      }

      // SDK encrypts amounts (via our relayer-backed encryptor, one batched
      // input proof) and transfers the encrypted euint64 to each stealth
      // address; the singleton grants each recipient FHE-ACL to user-decrypt.
      setPhase("submit");
      await client.disperse({
        token: ADDRESSES.cToken,
        mode: "direct",
        recipients: stealthAddrs,
        amounts: resolved.map((r) => r.amount),
      });

      // ERC-5564: announce each stealth payment so recipients can scan + claim.
      setPhase("announce");
      for (let i = 0; i < stealthAddrs.length; i++) {
        const annHash = await walletClient.writeContract({
          address: ADDRESSES.erc5564Announcer,
          abi: announcerAbi,
          functionName: "announce",
          args: [SCHEME_ID, stealthAddrs[i], ephemerals[i], metadatas[i]],
        });
        await publicClient.waitForTransactionReceipt({ hash: annHash });
      }

      setLinks(realLinks);
      setPhase("done");
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "disperse failed");
      setPhase("error");
    }
  }

  const busy = phase !== "idle" && phase !== "done" && phase !== "error";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pt-12 pb-24 sm:px-8">
      <PageHeader
        eyebrow="Distributor"
        title="Confidential disperse"
        sub="Run payroll, investor payouts, community rewards or vesting unlocks — confidentially. One line per recipient: meta-address,amount (or address,amount if they registered). Amounts are encrypted in your browser and dispersed through the TokenOps SDK; recipients receive one-time stealth addresses."
      />

      <BalancePanel />

      <Card className="space-y-5">
        <div>
          <div className="text-muted-foreground mb-2 text-xs font-medium">
            Start from a real-world distribution
          </div>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => applyScenario(s)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                  (scenario === s.label
                    ? "border-accent bg-accent text-black"
                    : "border-border bg-background text-foreground hover:border-accent")
                }
              >
                {s.label}
              </button>
            ))}
          </div>
          {scenario && (
            <p className="text-muted-foreground mt-2 text-xs">
              {SCENARIOS.find((s) => s.label === scenario)?.blurb} Example
              recipients are prefilled — edit freely before dispersing.
            </p>
          )}
        </div>

        <Field
          label="Recipients (CSV)"
          hint="Demo scale: 5-10 rows. FHE batch ops are costly."
        >
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            placeholder={"0x... (132 hex meta-address),100\n0x...,250"}
            className={inputClass + " font-mono"}
          />
        </Field>

        <div className="flex flex-wrap items-end gap-5">
          <Field label="Decoy padding (hide the count)">
            <input
              type="number"
              min={0}
              value={padTo}
              onChange={(e) => setPadTo(Number(e.target.value))}
              className={inputClass + " w-32"}
            />
          </Field>
          <div className="text-muted-foreground pb-3 text-xs">
            {valid.length} real
            {decoys > 0 ? ` + ${decoys} decoys (encrypted 0)` : ""},{" "}
            {valid.length + decoys} total onchain
          </div>
        </div>

        {rows.some((r) => r.error) && (
          <div className="space-y-1 text-xs text-red-500">
            {rows
              .filter((r) => r.error)
              .map((r, i) => (
                <div key={i}>
                  - {r.raw || "(empty)"}: {r.error}
                </div>
              ))}
          </div>
        )}

        <PrimaryButton
          onClick={run}
          disabled={!isConnected || valid.length === 0 || busy}
        >
          {busy
            ? "Working"
            : `Disperse to ${valid.length + decoys} recipient(s)`}
        </PrimaryButton>
        {!isConnected && (
          <p className="text-muted-foreground text-xs">
            Connect a wallet to disperse.
          </p>
        )}
      </Card>

      {phase !== "idle" && (
        <Card className="mt-4 space-y-3">
          <Step
            n={1}
            label="Derive stealth addresses"
            state={stepState(phase, "derive")}
          />
          <Step
            n={2}
            label="Authorize TokenOps singleton (operator)"
            state={stepState(phase, "operator")}
          />
          <Step
            n={3}
            label="Encrypt + disperse via TokenOps SDK"
            state={stepState(phase, "submit")}
          />
          <Step
            n={4}
            label="Announce stealth payments (ERC-5564)"
            state={stepState(phase, "announce")}
          />
          {err && <p className="text-xs text-red-500">{err}</p>}
        </Card>
      )}

      {links.length > 0 && (
        <Card className="mt-4 space-y-3">
          <h3 className="text-foreground text-sm font-medium">
            Dispersed. Private claim links
          </h3>
          <p className="text-muted-foreground text-xs">
            Share each link privately with its recipient. The link only reveals
            the announcement; only the holder of the matching viewing key can
            decrypt the amount.
          </p>
          <div className="space-y-2">
            {links.map((l, i) => (
              <div
                key={i}
                className="border-border bg-background rounded-xl border p-2.5"
              >
                <Mono>{l}</Mono>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}

function parseCsv(csv: string): Row[] {
  return csv
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((raw) => {
      const [id, amt] = raw.split(",").map((s) => s.trim());
      const isMeta = META_RE.test(id ?? "");
      const isAddr = ADDR_RE.test(id ?? "");
      if (!isMeta && !isAddr)
        return {
          raw,
          meta: null,
          amount: null,
          error: "bad meta-address/address",
        };
      let amount: bigint | null = null;
      try {
        amount = BigInt(amt);
        if (amount < 0n) throw new Error();
      } catch {
        return { raw, meta: id, amount: null, error: "bad amount (uint64)" };
      }
      return { raw, meta: id, amount };
    });
}

function stepState(
  phase: Phase,
  target: string
): "idle" | "active" | "done" | "error" {
  const order = ["derive", "operator", "submit", "announce", "done"];
  if (phase === "error") return target === "derive" ? "error" : "idle";
  const pi = order.indexOf(phase === "done" ? "done" : phase);
  const ti = order.indexOf(target);
  if (pi > ti) return "done";
  if (pi === ti) return "active";
  return "idle";
}
