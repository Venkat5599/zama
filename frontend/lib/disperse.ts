"use client";
// TokenOps SDK wiring for Veil's confidential disperse.
//
// The disperse itself runs through the official TokenOps `ConfidentialDisperse`
// singleton (deployed on Sepolia, auto-resolved by the SDK). We adapt Veil's
// existing Zama relayer instance to the SDK's `Encryptor` interface so no
// second FHE SDK / peer dependency is needed.
import type { PublicClient, WalletClient } from "viem";
import {
  createConfidentialDisperseClient,
  type ConfidentialDisperseClient,
  type Encryptor,
} from "@tokenops/sdk/fhe-disperse";
import { getFhe } from "@/lib/fhe";
import { CHAIN } from "@/lib/chain";

/**
 * Wrap Veil's relayer (`@zama-fhe/relayer-sdk`, createEncryptedInput API) so it
 * satisfies the SDK's v3-style `Encryptor` ({ values, contractAddress,
 * userAddress }). The SDK binds the input proof to (singleton, sender); we just
 * forward those through the relayer's batched-input builder.
 */
export async function getEncryptor(): Promise<Encryptor> {
  const fhe = await getFhe();
  return {
    async encrypt({ values, contractAddress, userAddress }) {
      const input = fhe.createEncryptedInput(contractAddress, userAddress);
      for (const v of values) input.add64(BigInt(v.value as bigint));
      const enc = await input.encrypt();
      return { handles: enc.handles, inputProof: enc.inputProof };
    },
  };
}

/** Build a TokenOps ConfidentialDisperse client bound to the current wallet. */
export async function getDisperseClient(
  publicClient: PublicClient,
  walletClient: WalletClient
): Promise<ConfidentialDisperseClient> {
  const encryptor = await getEncryptor();
  return createConfidentialDisperseClient({
    publicClient,
    walletClient,
    chainId: CHAIN.id,
    encryptor,
  });
}
