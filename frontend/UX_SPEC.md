# Veil — Frontend UX Spec

> Judges score this bounty **primarily on UX and frontend quality.** This document is the win condition. The claim portal is the demo centerpiece — the "log in, decrypt only your slice" moment must feel magical.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind + shadcn/ui
- **wagmi / viem** for wallet + chain
- **@zama-fhe/relayer-sdk** — input encryption + EIP-712 user decryption
- **@noble/secp256k1** (or a stealth-address SDK) — ECDH, stealth derivation, scanning
- **papaparse** — CSV parsing

## Two surfaces

```
/                → landing (the pitch, 1 screen, CTA to both flows)
/send            → SENDER: build & submit a confidential disperse
/claim           → RECIPIENT: scan, detect, decrypt own allocation
/register        → RECIPIENT: publish stealth meta-address (one-time)
```

---

## A. Sender flow (`/send`)

The "Stripe of confidential airdrops" feel. Steps as a clean wizard.

1. **Connect wallet.** Show connected confidential-token balance (encrypted →
   "•••• cUSDT", with a "decrypt my balance" toggle).
2. **Upload CSV** `identifier,amount`. Parse + validate inline; show a table with
   row-level errors. Support pasting too.
3. **Resolve recipients.** For each identifier, look up the ERC-6538 meta-address.
   - Green check = registered (can receive confidentially).
   - Amber = not registered → offer a "send them a register link" nudge.
4. **Privacy options.**
   - Decoy padding slider: pad to fixed N (default next power of 2). Tooltip:
     "Hides how many people you actually paid."
5. **Review.** Show total recipients (incl. decoys), encrypted total ("••••"),
   gas estimate. Big "Disperse confidentially" button.
6. **Encrypt + submit.** Progress states: deriving stealth addresses →
   encrypting amounts → awaiting signature → confirming. Stream per-step.
7. **Receipt.** Per recipient: a **claim link** (`/claim?hint=<viewTagPrefix>`)
   to share privately. Make copying/sharing frictionless.

Microcopy carries the privacy story everywhere: "No one onchain can see who you
paid or how much."

---

## B. Claim portal (`/claim`) — THE DEMO MONEY SHOT

This is where 80% of polish budget goes. Emotional arc: *uncertainty → scan →
discovery → reveal*.

### States

1. **Connect / enter viewing key.** Recipient connects the wallet holding their
   stealth keys (or pastes viewing key for scan-only preview).
2. **Scanning.** Animated progress over recent ERC-5564 announcements. Show the
   funnel live:
   ```
   1,284 announcements  →  view-tag filter  →  6 candidates  →  1 match ✓
   ```
   This visualization *is* the privacy pitch made visible — keep it on screen.
3. **Match found.** Card: "A confidential payment is waiting for you." Slightly
   suspenseful before reveal. Single "Decrypt my allocation" button.
4. **EIP-712 decrypt.** Wallet signature prompt with a human-readable reason.
   Then the reveal animation: "••••• cUSDT" → counts up to the real number.
5. **Decrypted.** Show amount, token, sender (if disclosed), and a "the rest of
   this distribution is still private to everyone else" reassurance line.
6. **Empty state.** "No payments found for this key" — never a dead end; link to
   `/register` and "ask the sender for a claim link."

### Why this wins
- The **scan funnel animation** makes an invisible cryptographic property
  visually obvious — judges *see* the privacy working.
- The **count-up reveal** turns an EIP-712 signature into a delightful moment.
- The recipient decrypts **only their slice** — demonstrable live by having a
  second recipient who sees a *different* number from the same disperse.

---

## C. Register (`/register`)

One-time: generate spending + viewing keypairs, publish meta-address to ERC-6538.
Make key backup explicit and safe. Show "you're now reachable confidentially."

---

## Demo script (3-min video)

1. (20s) Problem: onchain payroll/airdrop leaks who + how much. Show a normal
   block explorer exposing amounts.
2. (40s) Sender: upload CSV of 8 recipients, pad with decoys, disperse. Show the
   block explorer again — amounts encrypted, addresses unlinkable.
3. (60s) Recipient A: open claim portal, watch the scan funnel, decrypt → 100.
   Recipient B: same disperse, decrypts → 5,000. Neither sees the other's.
4. (20s) Whitepaper + backend-abstraction one-liner ("FHE today, MPC tomorrow").
5. (20s) Close: "Veil — hide who, hide how much. Onchain."

## Polish checklist
- [ ] Skeleton loaders, never raw spinners
- [ ] Every encrypted value renders as "••••" until decrypted
- [ ] Error toasts with recovery actions, no dead ends
- [ ] Mobile-responsive claim portal (recipients are on phones)
- [ ] Dark theme matching Zama brand
- [ ] One coherent privacy narrative in microcopy across all screens
