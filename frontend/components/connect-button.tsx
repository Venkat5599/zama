"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

function short(a?: string) {
  return a ? `${a.slice(0, 5)}...${a.slice(-4)}` : "";
}

export function ConnectButton(): React.ReactNode {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected)
    return (
      <button
        onClick={() => disconnect()}
        className="border-border bg-muted text-foreground hover:bg-foreground/5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
      >
        <span className="bg-accent h-1.5 w-1.5 rounded-full" />
        <span className="font-mono text-xs">{short(address)}</span>
      </button>
    );

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="group relative inline-flex items-center"
    >
      <span className="bg-accent absolute inset-y-0 right-0 w-[calc(100%-1.5rem)] rounded-xl" />
      <span className="bg-foreground text-background relative z-10 rounded-xl px-5 py-3 text-sm font-medium">
        Connect
      </span>
    </button>
  );
}
