# Veil — Build TODO

> State: contract + tests GREEN. Deadline 2026-07-07. Build now, scope hard.

## 0. Repo scaffold (blocker for everything) — ✅ DONE
- [x] `package.json` + `bun install`: hardhat 2.28, `@fhevm/hardhat-plugin` 0.4.2, `@fhevm/solidity` 0.11, `@zama-fhe/relayer-sdk` 0.4.1, `@openzeppelin/confidential-contracts` 0.5.1, `@noble/curves` 2.2
- [x] `hardhat.config.ts` wired for Sepolia (RPC + deployer key via `.env`)
- [x] `addresses.sepolia.json` — scaffold (fill after deploy)
- [x] Interfaces: `IERC7984.sol`, `IERC5564Announcer.sol`, `IERC6538Registry.sol`

## 1. THE SPIKE — ✅ PROVEN (locally, via FHEVM mock)
- [x] Open question resolved: **the ERC-7984 token owns the transfer + FHE-ACL primitive.** OZ `ERC7984._update` calls `FHE.allow(transferred, to)` + `FHE.allow(balance, to)` → fresh stealth addr auto-granted decrypt rights. Disperse = `fromExternal` → `allowTransient(token)` → euint64 `confidentialTransferFrom`.
- [x] Invariant proven: 2 stealth recipients each decrypt ONLY their own slice (300/700); cross-read rejected. **Funds-lock risk eliminated.**
- [ ] Re-confirm on real Sepolia with official cToken (needs PRIVATE_KEY + funded acct) — `scripts/spike.ts` TODO

## 2. Contract — `ConfidentialDisperse.sol` — ✅ DONE
- [x] `disperse(stealthAddrs[], encAmounts[], inputProof, ephemeralPubs[], metadata[])`
- [x] Per recipient: `FHE.fromExternal` → `allowTransient(cToken)` → `confidentialTransferFrom` → `announcer.announce`
- [x] Revert on length mismatch / empty; emit `Dispersed`
- [x] Tests (FHEVM-mock) GREEN: recipients decrypt own slice, no cross-read + revert cases

## 3. Stealth client lib — ✅ DONE (`lib/stealth.ts`, 3 tests green)
- [x] `generateStealthKeys()` → spend/view keys + 66-byte meta-address
- [x] `deriveStealthAddress(metaAddr)` → (stealthAddr, ephemeralPubKey, viewTag) via ECDH
- [x] `checkStealthAddress(...)` → view-tag reject + recover stealth privkey; roundtrip proven (recovered key controls the address)
- [x] `encodeMetadata(viewTag)` for ERC-5564 announce payload

## 4. Frontend — Next.js 15 + wagmi 2 + Tailwind 3 — ✅ BUILT (green `next build`)
### `/register`
- [x] Generate spend+view keypairs (localStorage), publish meta-address to ERC-6538
### `/send`
- [x] Connect wallet, CSV `meta-address|address,amount` + row validation
- [x] Resolve identifiers → meta-addresses (registry lookup + direct paste)
- [x] Decoy padding (pad to N, decoys = encrypted 0)
- [x] Client encrypt amounts + derive stealth addrs → operator + single `disperse` tx, 4-step live progress
- [x] Emit per-recipient claim links
- [ ] Nice-to-have: show own confidential balance with decrypt-on-toggle
### `/claim` — the money shot
- [x] Scan announcements → owned funnel stats → auto EIP-712 decrypt (signed by stealth key) → **count-up reveal**
- [x] Empty-state with recovery, manual-key paste, responsive
- [ ] Polish pass once live on Sepolia

## 5. Deploy + submission assets
- [x] `scripts/deploy.ts` + `scripts/spike.ts` (live Sepolia e2e) ready
- [ ] Deploy contracts to Sepolia (needs `PRIVATE_KEY` + funded acct + official cToken addr), frontend to Vercel
- [ ] Run `spike.ts` to confirm live ACL grant; fill `addresses.sepolia.json` + `frontend/.env.local`
- [ ] Demo: 2 recipients of 1 disperse each see a *different* amount
- [ ] 3-min video pitch
- [ ] Whitepaper → arXiv (cs.CR), cite FHE-DKSAP
- [ ] X post tagging `@zama` `#ZamaDeveloperProgram`

## How to run (dev)
```
# contracts + crypto (local, no keys needed)
bun install && bunx hardhat test          # 6 passing

# live Sepolia (needs .env: PRIVATE_KEY, SEPOLIA_RPC_URL)
#  fill cToken + erc5564Announcer + erc6538Registry in addresses.sepolia.json
bun run deploy:sepolia                     # deploys ConfidentialDisperse
bun run spike                              # proves e2e ACL on Sepolia

# frontend
cd frontend && bun install
cp .env.local.example .env.local           # paste deployed addresses
bun dev
```

## Cut-if-time-runs-out (in this order)
Decoy padding → indexer (never needed at demo scale) → arXiv posting (link draft instead) → register flow polish. **Never cut: the claim portal.**
