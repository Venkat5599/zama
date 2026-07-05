"use client";
// Relayer-SDK (Zama FHEVM) browser instance — encrypt inputs + user-decrypt.
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

/** Lazily init the WASM SDK + a Sepolia instance bound to the injected wallet. */
export async function getFhe(): Promise<FhevmInstance> {
  if (instance) return instance;
  if (!initPromise) {
    initPromise = (async () => {
      const { initSDK, createInstance, SepoliaConfig } = await import(
        "@zama-fhe/relayer-sdk/web"
      );
      await initSDK();
      const eth = (globalThis as any).ethereum;
      instance = await createInstance({ ...SepoliaConfig, network: eth });
      return instance;
    })();
  }
  return initPromise;
}
