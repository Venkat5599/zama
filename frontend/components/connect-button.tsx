"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

function short(a?: string) {
  return a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "";
}

export function ConnectButton(): React.ReactNode {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected)
    return (
      <button
        onClick={() => disconnect()}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="font-mono text-xs">{short(address)}</span>
      </button>
    );

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="group relative inline-flex items-center"
    >
      <span className="absolute inset-y-0 right-0 w-[calc(100%-1.5rem)] rounded-xl bg-accent" />
      <span className="relative z-10 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background">
        Connect
      </span>
    </button>
  );
}
