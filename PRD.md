# Veil — Product Requirements Document

**Status:** Draft v0.1 · **Owner:** Venkat5599 · **Target:** Zama Developer Program S3, Special Bounty (TokenOps) · **Deadline:** 2026-07-07 (23:59 AOE)

---

## 1. Problem

Token distributions on public chains — payroll, airdrops, investor payouts,
vesting — leak two things: **how much** each recipient gets and **who** the
recipients are. Zama's ERC-7984 hides the amount. Nothing in the Zama ecosystem
hides the *recipient*, so the distribution graph stays public even when amounts
are encrypted. For payroll and airdrops, the recipient list is as sensitive as
the numbers.

## 2. Goal

Ship a polished dApp that runs a **confidential disperse**: a sender pays a list
of recipients such that onchain observers learn neither the amounts (FHE) nor the
recipient identities (stealth addresses), and each recipient self-serves a claim
portal to decrypt **only their own allocation**.

Built on the **TokenOps SDK** + **Zama Protocol** per bounty requirements.

## 3. Non-goals

- Not building an MPC network or general confidential-compute layer (that's
  Arcium's territory; ours is application-layer). Vision lives in the whitepaper.
- Not inventing new cryptography. FHE+stealth has prior art (FHE-DKSAP). We ship
  the applied product and cite the research.
- Not mainnet. Sepolia only.
- Not large-scale (10k+) airdrops. Demo scale: 5–10 recipients per disperse.

## 4. Users & jobs-to-be-done

| Persona | Job |
|---------|-----|
| **Distributor** (sender) | "Pay my team / airdrop my community without exposing salaries or the recipient list onchain." |
| **Recipient** | "Find out if I got paid and how much, without anyone else learning either." |

## 5. Key user stories

- **U1 (sender):** As a distributor, I upload a CSV of recipients + amounts and
  disperse confidentially in one flow, so amounts and the recipient list stay
  private onchain.
- **U2 (sender):** As a distributor, I pad my disperse with decoys, so observers
  cannot even learn how many people I paid.
- **U3 (recipient):** As a recipient, I register a stealth meta-address once, so
  distributors can pay me confidentially.
- **U4 (recipient):** As a recipient, I open a claim portal, scan for payments
  with my viewing key, and decrypt only my own allocation.
- **U5 (recipient):** As a recipient, I verify the payment is genuinely mine
  before/while decrypting (EIP-712 user-decryption).

## 6. Functional requirements

### Sender (`/send`)
- FR1 Connect wallet; show own confidential balance (encrypted, decrypt on toggle).
- FR2 Upload/paste CSV `identifier,amount`; inline validation with row errors.
- FR3 Resolve each identifier → ERC-6538 meta-address; flag unregistered.
- FR4 Decoy padding option (pad to fixed N; decoys carry encrypted 0).
- FR5 Client-side encrypt amounts via relayer SDK; derive stealth addresses (ECDH).
- FR6 Submit single `disperse` tx; stream per-step progress.
- FR7 Produce per-recipient claim links to share privately.

### Recipient (`/register`, `/claim`)
- FR8 Generate spending+viewing keypairs; publish meta-address to ERC-6538.
- FR9 Scan ERC-5564 announcements; view-tag fast filter; show scan funnel.
- FR10 Detect own payment; derive stealth private key.
- FR11 EIP-712 user-decryption → reveal own amount with count-up animation.
- FR12 Empty-state with recovery (register, request link) — never a dead end.

### Contract
- FR13 `disperse(stealthAddrs[], encAmounts[], inputProof, ephemeralPubs[], viewTags[])`.
- FR14 Verify input proof, encrypted transfer, `FHE.allow` to stealth addr, emit announcement.
- FR15 Revert on length mismatch / empty disperse.

## 7. Non-functional requirements

- NFR1 **UX is the win condition** — bounty judged primarily on UX/frontend.
- NFR2 Use **official ERC-7984 cToken** from Zama Wrappers Registry (no self-mint).
- NFR3 Mobile-responsive claim portal (recipients on phones).
- NFR4 No secrets in repo; keys client-side only; `.env` gitignored.
- NFR5 Deploys reproducibly on Sepolia.

## 8. Privacy requirements

- PR1 Amounts unreadable onchain (TFHE IND-CPA + threshold decryption).
- PR2 Recipient addresses unlinkable to identity (ECDH / ERC-5564).
- PR3 Recipient count hideable via decoy padding.
- PR4 Disclose residual leakage honestly (sender identity, timing, gas) — see whitepaper §6.4.

## 9. Success metrics (bounty)

- Working Sepolia dApp, contracts + frontend.
- Claim portal demo: two recipients of one disperse each decrypt a *different*
  amount, neither sees the other's.
- Whitepaper linked (arXiv), citing FHE-DKSAP prior art.
- 3-min video; X post tagging `@zama` `#ZamaDeveloperProgram`.

## 10. Risks

| Risk | Mitigation |
|------|-----------|
| TokenOps SDK owns the transfer primitive — reshapes contract | Week-1 spike decides SDK vs custom transfer |
| `FHE.allow` → fresh stealth addr ACL fails | Prove end-to-end in week 1 before UI |
| Prior art (FHE-DKSAP) seen as "not novel" | Position as applied product; cite in Related Work |
| FHE batch cost limits recipient count | Demo at 5–10; document limit in evals |

## 11. Out of scope for v1 (future)

Relayer/meta-tx for sender anonymity; indexer for fast scanning at scale; vesting
schedules; multi-chain; formal game-based security proof.

## 12. Milestones

See `PLAN.md` for the week-by-week roadmap (Jun 2 → Jul 7).
