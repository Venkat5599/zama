# Veil — Build Plan

## Thesis

Win the Zama Season 3 Special Bounty (TokenOps) with a **focused, polished confidential-disperse product**, and carry the Arcium-tier ambition in a **whitepaper** that proposes a backend-agnostic confidential-payments protocol.

Do **not** try to build an MPC network. Arcium is infrastructure with years of work behind it. Veil is a layer up: an application-layer *protocol* that could run on FHE (today) or MPC (tomorrow). That positioning makes a 5-week dApp punch above its weight without scope suicide.

## Scope discipline

- Demo with **5–10 recipients** per disperse. FHE batch ops are costly — never promise a 10k airdrop.
- **Sepolia only.** Rules allow it. Skip mainnet.
- Use the **official ERC-7984 cToken** from the Zama Wrappers Registry — not a self-minted mock. (The Bounty Track literally penalizes ecosystem fragmentation from self-minted tokens.)
- Stealth addresses are the **headline feature**, front-loaded into the week-1 spike so they can't derail the build later.

## The one critical risk

When encrypted tokens land on a freshly-derived stealth address, the FHE access-control list (ACL) must explicitly grant that address decrypt rights via `FHE.allow(amount, stealthAddr)` inside the disperse call. The stealth address has never touched the ACL. Miss this and the recipient holds tokens they can **never** decrypt. **Prove this end-to-end in week 1 before writing any UI.**

## Other risks

1. **TokenOps SDK surface unknown** → spike day 1–2. Decide: does the SDK own the transfer primitive, or do you? Everything downstream depends on the answer.
2. **Recipient scanning UX** → view tags reject 255/256 announcements cheaply. A simple event scan is fine at demo scale; don't build an indexer.

## Roadmap (now → Jul 7)

| Week | Dates | Product track | Paper track |
|------|-------|--------------|-------------|
| **1** | Jun 2–8 | Spike: TokenOps SDK + ERC-7984 + relayer SDK. **Prove `FHE.allow` → stealth → EIP-712 decrypt end-to-end on Sepolia.** | Draft §3–5 (model + protocol) — forces the design correct before coding. |
| **2** | Jun 9–15 | `ConfidentialDisperse` + ERC-5564/6538 wiring. FHEVM-mock tests: 5 stealth recipients each decrypt own slice. | Draft §6 security + leakage table. |
| **3** | Jun 16–22 | Sender UI: CSV → resolve meta-addresses → client encrypt → submit disperse on Sepolia. | Draft §7 backend abstraction. |
| **4** | Jun 23–29 | **Claim portal** (demo money shot): scan → view-tag → derive key → EIP-712 decrypt → reveal slice. Polish hardest. | Draft §8–9 implementation + gas/scan evals with real numbers. |
| **5** | Jun 30–Jul 6 | Edge cases, README, 3-min video, stable deploy. Buffer. | Finish §1–2, 10–12. Post to arXiv. Link in submission + X. |

## Win conditions ("no matter what" decoded)

1. **The claim portal must feel magical.** Judges score UX. "Log in, decrypt only your slice" is the whole game. Spend 80% of polish budget here.
2. **Official cToken** from the Wrappers Registry — free credibility.
3. **Whitepaper link** in the submission — almost no entry will have one. The separator.
4. **Honest leakage section** — signals protocol designer, not demo hacker.
5. **Decoy padding** (even minimal) — turns "we hide amounts" into "we hide the whole distribution."

## Brand

**Veil** — Confidential Disperse Protocol (CDP). (Umbra/Penumbra taken.)
