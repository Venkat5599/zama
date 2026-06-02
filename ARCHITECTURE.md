# Veil — Architecture

System design for the Confidential Disperse Protocol. Pairs with `WHITEPAPER.md`
(formal protocol) and `PRD.md` (requirements).

## 1. System context

```
        ┌──────────────────────────────────────────────────────────────┐
        │                        Veil dApp                              │
        │                                                                │
   ┌────┴─────┐   encrypt + derive    ┌──────────────┐   scan + decrypt  │
   │  Sender   │ ───────────────────► │  Frontend     │ ◄─────────────── Recipient
   │  wallet   │                      │  (Next.js)    │                   wallet
   └────┬─────┘                      └──────┬───────┘                    │
        │                                   │                            │
        │            ┌──────────────────────┼──────────────────────┐     │
        ▼            ▼                       ▼                      ▼     ▼
  ┌───────────┐ ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐
  │ Relayer   │ │ ConfidentialD│  │ ERC-5564 Announcer│  │ ERC-6538 Registry │
  │ SDK / GW  │ │ isperse.sol  │  │ (stealth events)  │  │ (meta-addresses)  │
  │ (Zama)    │ │ + TokenOps   │  └───────────────────┘  └──────────────────┘
  └─────┬─────┘ └──────┬───────┘
        │              │ confidentialTransferFrom
        ▼              ▼
  ┌──────────────────────────────┐   ┌────────────────────────────────────┐
  │ Zama FHE Coprocessor + KMS    │   │ ERC-7984 cToken (Wrappers Registry) │
  │ (TFHE ops, threshold decrypt) │   │ encrypted balances (euint64)        │
  └──────────────────────────────┘   └────────────────────────────────────┘
```

## 2. Layers

| Layer | Responsibility | Tech |
|-------|---------------|------|
| **Frontend** | sender wizard, claim portal, scanning, key mgmt | Next.js, wagmi/viem, Tailwind/shadcn |
| **Crypto client** | input encryption, EIP-712 decryption | `@zama-fhe/relayer-sdk` |
| **Stealth client** | ECDH, stealth addr + key derivation, view tags | `@noble/secp256k1` / stealth SDK |
| **Distribution** | confidential disperse primitive | TokenOps SDK |
| **Contracts** | `ConfidentialDisperse`, reuse ERC-5564/6538 | Solidity + FHEVM |
| **Token** | encrypted balances | official ERC-7984 cToken |
| **Confidential compute** | TFHE ops + threshold decryption | Zama coprocessor + KMS |

## 3. Trust boundaries

- **Client-only secrets:** spending key, viewing key, plaintext amounts. Never
  leave the browser except as ciphertext/handles.
- **Onchain (public):** stealth addresses, ephemeral pubkeys, view tags,
  ciphertext handles. None reveal amount or identity.
- **Zama threshold network (honest-below-threshold):** performs decryption only
  for ACL-authorized parties.
- **Relayer:** untrusted for confidentiality (sees handles, not plaintext); could
  censor (liveness only).

## 4. Core flows

### 4.1 Disperse (write path)
```
Sender browser:
  for each recipient i:
    meta_i   = registry.stealthMetaAddressOf(id_i)      // read ERC-6538
    (R_i, A_i, s_i) = deriveStealth(meta_i)              // ECDH, ERC-5564
    v_i      = s_i[0]                                    // view tag
  (handles, proof) = relayer.encrypt([m_1..m_n])         // batched input proof
  tx = disperse(A[], handles[], proof, R[], v[])         // one tx

ConfidentialDisperse.sol (per i):
  amt = FHE.fromExternal(handle_i, proof)
  FHE.allowThis(amt)
  transferred = cToken.confidentialTransferFrom(sender, A_i, amt)
  FHE.allow(transferred, A_i)                            // ← critical ACL grant
  announcer.announce(SCHEME_ID, A_i, R_i, v_i)
```

### 4.2 Claim (read path)
```
Recipient browser:
  for each Announcement (A, R, v):
    s = ecdh(p_view, R)
    if s[0] != v: continue                               // view-tag reject 255/256
    if addr(P_spend + H(s)·G) == A:                       // mine
      p = (p_spend + H(s)) mod n                          // stealth privkey
      h = cToken.confidentialBalanceOf(A)                 // ciphertext handle
      amount = relayer.userDecrypt(h, EIP712 sig by p)    // reveal own slice
```

## 5. Key data structures

```
MetaAddress     = { P_spend: Point, P_view: Point }       // ERC-6538, public
StealthRecord   = { A: address, R: bytes33, viewTag: byte }
DisperseInput   = { stealthAddrs: address[], encAmounts: handle[],
                    inputProof: bytes, ephemeralPubs: bytes[], viewTags: byte[] }
```

## 6. Contracts

- `ConfidentialDisperse.sol` — our code. Stateless aside from immutables; no funds
  custody (pull-then-push within one tx). Emits `Dispersed`.
- ERC-5564 Announcer — standard singleton, reused.
- ERC-6538 Registry — standard singleton, reused.
- ERC-7984 cToken — official, from Wrappers Registry.

**Open question (week-1 spike):** does TokenOps SDK provide the disperse/transfer
primitive directly? If yes, `ConfidentialDisperse` thins to a stealth+announce
wrapper around TokenOps calls. If no, we drive `confidentialTransferFrom`
ourselves. This decision reshapes the contract — resolve first.

## 7. ACL model (the make-or-break detail)

ERC-7984 gates ciphertext access via an onchain ACL (`FHE.allow`). A freshly
derived stealth address has **no ACL entry**. The disperse MUST call
`FHE.allow(balance, stealthAddr)` so the recipient (holding the stealth key) can
later pass EIP-712 user-decryption. Omitting this = funds locked, undecryptable.
This is verified in week 1 before any UI work.

## 8. Privacy properties (summary; full analysis in WHITEPAPER §6)

| Property | Mechanism | Reduces to |
|----------|-----------|-----------|
| Amount hidden | ERC-7984 / TFHE | IND-CPA + threshold decryption |
| Recipient hidden | ERC-5564 stealth / ECDH | DDH on secp256k1 |
| Count hidden | decoy padding (encrypted 0) | indistinguishability of decoys |

Residual leakage (sender identity, timing, gas) disclosed in whitepaper §6.4.

## 9. Deployment

- Network: **Sepolia**.
- Contracts via Hardhat (`fhevm-hardhat-template`).
- Frontend: Vercel.
- Config: addresses for cToken, announcer, registry, disperse in a single
  `addresses.sepolia.json` (committed, non-secret).

## 10. Prior art positioning

FHE + stealth is not novel crypto — see **FHE-DKSAP / HE-DKSAP** (2023). Veil
differs in *architecture* (FHE on the amount via ERC-7984; plain ECDH stealth on
the recipient) and in being a **shipped product** on Zama + TokenOps, not a paper.
Cited in WHITEPAPER §10.
