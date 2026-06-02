# Veil — Confidential Disperse Protocol

> Private token distribution on public chains. Hides **how much** (Zama FHE / ERC-7984) **and who** (stealth addresses / ERC-5564). Built for the Zama Developer Program — Season 3, Special Bounty Track × TokenOps.

A sender uploads a list of recipients and amounts. Onchain, observers see encrypted amounts going to one-time stealth addresses — they cannot read the amounts, cannot link the addresses to identities, and cannot reconstruct the distribution. Each recipient logs into a claim portal, scans announcements with their viewing key, and decrypts **only their own slice** via the EIP-712 user-decryption flow.

## Two privacy layers

| Layer | Hides | Standard |
|-------|-------|----------|
| FHE (Zama) | the **amount** — `euint64` ciphertext onchain | ERC-7984 + FHEVM |
| Stealth (Umbra-style) | the **recipient** — one-time unlinkable addresses | ERC-5564 announcer + ERC-6538 registry |

Most confidential-disperse projects only do the amount half. Veil does both → satisfies the bounty requirement that *"distribution amounts and recipient lists remain confidential onchain."*

## Repo layout

```
veil/
├── README.md                 ← you are here
├── PLAN.md                   ← roadmap, scope, win conditions
├── WHITEPAPER.md             ← formal protocol + security analysis (arXiv-bound)
├── contracts/
│   ├── ConfidentialDisperse.sol
│   └── interfaces/
│       ├── IERC7984.sol
│       ├── IERC5564Announcer.sol
│       └── IERC6538Registry.sol
├── test/
│   └── ConfidentialDisperse.test.ts
└── frontend/
    └── UX_SPEC.md            ← claim portal (the demo centerpiece)
```

## Status

Pre-build. Week-1 spike pending: prove `FHE.allow` → stealth address → EIP-712 decrypt end-to-end on Sepolia before writing UI.

## Deliverables for the bounty

- [ ] dApp: contracts + frontend, deployed on Sepolia
- [ ] Clear documentation
- [ ] 3-minute video pitch
- [ ] Whitepaper (arXiv `cs.CR`) — the differentiator
- [ ] X post tagging `@zama` + `#ZamaDeveloperProgram`

Submission deadline: **July 07, 2026 (23:59 AOE)**. Reward: **2,500 cUSDT**.
