"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { generateStealthKeys, type StealthKeys } from "@/lib/stealth";
import { loadKeys, saveKeys, clearKeys } from "@/lib/storage";
import { ADDRESSES, registryAbi, SCHEME_ID } from "@/lib/chain";
import { Card, PageHeader, PrimaryButton, GhostButton, Field, Mono } from "@/components/app-ui";

export default function RegisterPage() {
  const { isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [keys, setKeys] = useState<StealthKeys | null>(null);
  const [reveal, setReveal] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setKeys(loadKeys()), []);

  function generate() {
    const k = generateStealthKeys();
    saveKeys(k);
    setKeys(k);
    setTxHash(null);
  }

  async function publish() {
    if (!keys) return;
    setErr(null);
    try {
      const hash = await writeContractAsync({
        address: ADDRESSES.erc6538Registry,
        abi: registryAbi,
        functionName: "registerKeys",
        args: [SCHEME_ID, keys.stealthMetaAddress as `0x${string}`],
      });
      setTxHash(hash);
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "register failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-32 pt-32 sm:px-8">
      <PageHeader
        eyebrow="Recipient setup"
        title="Register a stealth meta-address"
        sub="Generate spending and viewing keys once. Publish the public meta-address so senders can pay you confidentially. Keys stay in your browser, never uploaded."
      />

      {!keys ? (
        <Card>
          <p className="text-sm text-muted-foreground">No keys yet on this device.</p>
          <div className="mt-5"><PrimaryButton onClick={generate}>Generate stealth keys</PrimaryButton></div>
        </Card>
      ) : (
        <Card className="space-y-6">
          <Field label="Your stealth meta-address (public, share this)">
            <div className="rounded-2xl border border-border bg-background p-3.5"><Mono>{keys.stealthMetaAddress}</Mono></div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Spending pubkey"><Mono>{keys.spendingPublicKey}</Mono></Field>
            <Field label="Viewing pubkey"><Mono>{keys.viewingPublicKey}</Mono></Field>
          </div>

          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-xs text-yellow-700 dark:text-yellow-200/80">
            Private keys control your funds. Back them up; anyone with them can spend.
            <button onClick={() => setReveal((v) => !v)} className="ml-2 underline">
              {reveal ? "hide" : "reveal"}
            </button>
            {reveal && (
              <div className="mt-3 space-y-1.5">
                <div>spend: <Mono>{keys.spendingPrivateKey}</Mono></div>
                <div>view: <Mono>{keys.viewingPrivateKey}</Mono></div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={publish} disabled={!isConnected || isPending}>
              {isPending ? "Publishing" : "Publish to ERC-6538 registry"}
            </PrimaryButton>
            <GhostButton onClick={generate}>Regenerate</GhostButton>
            <GhostButton onClick={() => { clearKeys(); setKeys(null); }}>Forget on this device</GhostButton>
          </div>
          {!isConnected && <p className="text-xs text-muted-foreground">Connect a wallet to publish.</p>}
          {txHash && <p className="text-xs text-accent">Published. tx {txHash.slice(0, 12)}</p>}
          {err && <p className="text-xs text-red-500">{err}</p>}
        </Card>
      )}
    </main>
  );
}
