import { http, fallback, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Multiple Sepolia RPCs — viem's fallback rotates to the next on failure or
// rate-limit, so a single flaky/throttled endpoint doesn't break reads.
const RPCS = [
  process.env.NEXT_PUBLIC_RPC_URL,
  "https://sepolia.drpc.org",
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://1rpc.io/sepolia",
  "https://rpc.sepolia.org",
].filter(Boolean) as string[];

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: fallback(RPCS.map((url) => http(url))),
  },
  ssr: true,
});
