"use client";
// Live confidential-balance panel. Reads the connected wallet's ERC-7984 cUSDT
// balance (an encrypted handle) and decrypts it on demand via the same EIP-712
// user-decryption flow recipients use — signed by the connected wallet.
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { ADDRESSES, cTokenAbi } from "@/lib/chain";
import { getFhe } from "@/lib/fhe";
import { Card, PrimaryButton, Mono } from "@/components/app-ui";

const ZERO_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export function BalancePanel() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [handle, setHandle] = useState<string | null>(null);
  const [clear, setClear] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setClear(null);
    setErr(null);
    setHandle(null);
    if (!address || !publicClient) return;
    publicClient
      .readContract({
        address: ADDRESSES.cToken,
        abi: cTokenAbi,
        functionName: "confidentialBalanceOf",
        args: [address],
      })
      .then((h) => setHandle(h as string))
      .catch(() => setHandle(null));
  }, [address, publicClient]);

  async function decrypt() {
    if (!address || !handle) return;
    setBusy(true);
    setErr(null);
    try {
      const fhe = await getFhe();
      const { publicKey, privateKey } = fhe.generateKeypair();
      const start = Math.floor(Date.now() / 1000);
      const days = 1;
      const eip712 = fhe.createEIP712(publicKey, [ADDRESSES.cToken], start, days);
      const types = { ...(eip712.types as Record<string, unknown>) };
      delete (types as Record<string, unknown>).EIP712Domain;

      const signer = await new BrowserProvider(
        (globalThis as unknown as { ethereum: never }).ethereum
      ).getSigner();
      const sig = await signer.signTypedData(
        eip712.domain as never,
        types as never,
        eip712.message as never
      );

      const res = await fhe.userDecrypt(
        [{ handle, contractAddress: ADDRESSES.cToken }],
        privateKey,
        publicKey,
        sig.replace(/^0x/, ""),
        [ADDRESSES.cToken],
        address,
        start,
        days
      );
      setClear(BigInt(res[handle as `0x${string}`] as string | number | bigint));
    } catch (e) {
      const m = e as { shortMessage?: string; message?: string };
      setErr(m?.shortMessage ?? m?.message ?? "decrypt failed");
    } finally {
      setBusy(false);
    }
  }

  if (!isConnected) return null;
  const uninitialized = !handle || handle === ZERO_HANDLE;

  return (
    <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Your confidential cUSDT
        </div>
        <div className="mt-1.5 text-lg font-semibold text-foreground">
          {clear !== null ? (
            <>
              {clear.toString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">cUSDT</span>
            </>
          ) : uninitialized ? (
            <span className="text-muted-foreground">No balance yet</span>
          ) : (
            <span className="text-muted-foreground">•••••• encrypted onchain</span>
          )}
        </div>
        {!uninitialized && clear === null && (
          <div className="mt-1">
            <Mono>{handle}</Mono>
          </div>
        )}
        {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      </div>
      {!uninitialized && clear === null && (
        <PrimaryButton onClick={decrypt} disabled={busy}>
          {busy ? "Decrypting" : "Decrypt my balance"}
        </PrimaryButton>
      )}
    </Card>
  );
}
