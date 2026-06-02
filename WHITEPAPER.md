# Veil: A Backend-Agnostic Protocol for Confidential Token Distribution on Public Blockchains

**Draft v0.1 — Zama Developer Program, Season 3**

## Abstract

Token distributions on public blockchains — airdrops, payroll, investor
distributions, vesting — leak two sensitive dimensions: *how much* each
recipient receives and *who* the recipients are. Existing confidential-token
schemes based on fully homomorphic encryption (FHE) hide amounts but leave
recipient addresses, and therefore the distribution graph, fully public. We
present **Veil**, a protocol that composes FHE-based confidential tokens
(ERC-7984) with stealth-address cryptography (ERC-5564 / ERC-6538) to hide both
dimensions simultaneously. An onchain observer learns only that a distribution
occurred and an upper bound on its size; recipients independently scan, detect,
and decrypt **only their own allocation** through an EIP-712 user-decryption
flow. We formalize the protocol, analyze its security by reduction to the
hardness of the underlying primitives, and explicitly characterize its residual
leakage. Finally, we abstract the confidential-compute backend behind a narrow
interface, showing that FHE is one instantiation and that secure multi-party
computation (MPC) backends are a drop-in alternative — positioning Veil as an
application-layer payments protocol rather than a compute network.

---

## 1. Introduction

Public blockchains are radically transparent by design. That transparency is an
asset for auditability and a liability for finance. When an organization runs
payroll onchain, every salary is public. When a project runs an airdrop, the
full recipient list and per-recipient amounts are permanently legible to
competitors, attackers, and the recipients' own counterparties.

FHE-based confidential tokens (ERC-7984, enabled by the Zama Protocol) solve
*half* of this: balances and transfer amounts become ciphertexts (`euint64`)
that only authorized parties can decrypt. But the **recipient address remains in
the clear**. An observer who cannot read amounts can still reconstruct the
*shape* of a distribution — who received something, how many recipients there
were, and how the recipients relate to other onchain identities. For payroll and
airdrops, the recipient graph is often as sensitive as the amounts.

Veil closes the gap by routing each confidential transfer to a **one-time
stealth address** unlinkable to the recipient's public identity, and announcing
it through the ERC-5564 stealth-announcement standard so the recipient — and
only the recipient — can detect it. The result: amounts hidden by FHE, identities
hidden by stealth addresses, and a clean self-service claim flow for recipients.

**Contributions.**
1. A protocol composing ERC-7984 confidential tokens with ERC-5564/6538 stealth
   addresses for fully confidential disperse (§5).
2. A security analysis reducing each privacy property to a standard assumption,
   plus an honest leakage characterization and a decoy-padding mitigation (§6).
3. A backend-abstraction argument showing the confidential-compute layer (FHE
   today, MPC tomorrow) is replaceable behind a narrow interface (§7).

---

## 2. Threat Model

**Parties.** A *sender* (distribution organizer), a set of *recipients*, and the
*Zama coprocessor / threshold decryption network* (the confidential-compute
backend). An optional *relayer* submits transactions on the sender's behalf.

**Adversary.** A computationally bounded observer with full read access to chain
state and the public mempool. The adversary may control some recipients and may
collude with a relayer. We assume the threshold decryption committee is honest
below its corruption threshold (inherited from the Zama Protocol).

**Goals (in scope).**
- *Amount confidentiality*: the adversary learns nothing about any honest
  recipient's amount.
- *Recipient unlinkability*: the adversary cannot link a stealth address to a
  recipient's published meta-address or any other onchain identity.

**Out of scope (stated honestly, mitigations in §6).**
- The recipient *count* (or a padded upper bound).
- Sender identity (the sender signs the disperse transaction).
- Network-level metadata (timing, IP, gas-pattern side channels).

---

## 3. Background

### 3.1 FHE and confidential tokens (ERC-7984)
Fully homomorphic encryption permits computation directly on ciphertexts. The
Zama Protocol exposes FHE to EVM contracts through a coprocessor: contracts
manipulate ciphertext *handles* (`euint64`, etc.) while the actual TFHE
operations execute off-chain and results are attested back. ERC-7984 is the
confidential fungible-token standard: balances are encrypted, and access to
decrypt a given ciphertext is governed by an onchain **access-control list (ACL)**
managed via `FHE.allow`.

### 3.2 User decryption (EIP-712)
A user reads their own ciphertext by signing an EIP-712 request authorizing the
threshold network to re-encrypt the value under the user's key. Only a party the
ACL has granted access to can obtain a valid decryption.

### 3.3 Stealth addresses (ERC-5564 / ERC-6538)
A recipient publishes a **meta-address** `M = (P_spend, P_view)` to the ERC-6538
registry. A sender derives a fresh, single-use **stealth address** for the
recipient using Diffie–Hellman against `P_view`, and posts an **announcement**
(ERC-5564) containing an ephemeral public key and a one-byte *view tag*. The
recipient scans announcements with their viewing key; the view tag lets them
reject ~255/256 of irrelevant announcements before doing elliptic-curve work.

---

## 4. Notation

| Symbol | Meaning |
|--------|---------|
| `G`, `n` | secp256k1 generator and group order |
| `H(·)` | hash to scalar mod `n` |
| `M_i = (P_spend,i, P_view,i)` | recipient `i` meta-address (public) |
| `(p_spend,i, p_view,i)` | recipient `i` private keys |
| `(r_i, R_i = r_i·G)` | sender ephemeral keypair for recipient `i` |
| `s_i` | ECDH shared secret for recipient `i` |
| `A_i` | stealth address for recipient `i` |
| `v_i` | one-byte view tag |
| `ct_i` | FHE ciphertext of amount for recipient `i` |

---

## 5. The Veil Protocol

### 5.1 Registration (recipient, once)
Recipient `i` publishes `M_i = (P_spend,i, P_view,i)` to the ERC-6538 registry.

### 5.2 Disperse (sender)
For each recipient `i` with amount `m_i`:

```
1. (r_i, R_i = r_i·G)                          // fresh ephemeral keypair
2. s_i = H( r_i · P_view,i )                    // ECDH against viewing key
3. A_i = addr( P_spend,i + H(s_i)·G )           // one-time stealth address
4. v_i = s_i[0]                                 // 1-byte view tag
5. ct_i = FHE.encrypt(m_i)  → (handle_i, π)     // client-side; π = ZK input proof
6. submit disperse(A[], handle[], π, R[], v[])
```

Onchain, for each `i`, the contract:
```
amt_i = FHE.fromExternal(handle_i, π)           // verify input proof
token.confidentialTransferFrom(sender, A_i, amt_i)
FHE.allow(balanceOf[A_i], A_i)                  // grant stealth addr decrypt rights
announcer.announce(SCHEME_ID, A_i, R_i, v_i)    // ERC-5564
```

`FHE.allow` is essential: the stealth address is newly derived and has no prior
ACL entry, so without an explicit grant the recipient could never decrypt the
received balance.

### 5.3 Scan & Claim (recipient)
```
for each Announcement (A, R, v):
    s = H( p_view · R )                         // ECDH against ephemeral key
    if s[0] != v: continue                      // view-tag fast reject
    if addr(P_spend + H(s)·G) == A:             // it's mine
        p = (p_spend + H(s)) mod n              // stealth private key
        balance = userDecrypt(token, A)         // EIP-712 → "you received m_i"
```

---

## 6. Security Analysis

### 6.1 Amount confidentiality
Amounts are encrypted under TFHE and only decryptable by parties the ACL
authorizes. An adversary distinguishing two amounts breaks TFHE IND-CPA or the
threshold-decryption security of the Zama network. Honest recipients' amounts
are therefore semantically hidden from any observer not granted ACL access.

### 6.2 Recipient unlinkability
Linking `A_i` to `M_i` requires computing `s_i = H(r_i · P_view,i)` from public
values `R_i` and `P_view,i` — i.e., solving computational Diffie–Hellman on
secp256k1. Under the DDH/CDH assumption, stealth addresses are unlinkable to
meta-addresses and to each other. This is the standard ERC-5564 guarantee.

### 6.3 Combined view
An observer with only chain data learns: (a) that a disperse transaction
occurred, (b) the sender, and (c) the number of announcements. They learn
neither amounts nor recipient identities.

### 6.4 Residual leakage and mitigations

| Leak | Severity | Mitigation |
|------|----------|-----------|
| Recipient **count** | medium | **Decoy padding**: emit dummy announcements to a fixed `N`; decoys carry `FHE.encrypt(0)` so they are indistinguishable onchain. |
| **Sender** identity | medium | Submit via a relayer / meta-transaction / account-abstraction sponsor. |
| **Timing & gas** patterns | low | Fixed batch size + uniform per-recipient ops. |
| Total amount | none (optional) | FHE hides the homomorphic sum if exposed at all. |

Disclosing leakage explicitly is a feature, not a weakness: a protocol that names
its boundaries is auditable; one that claims "fully private" is not.

---

## 7. Backend Abstraction

The protocol uses the confidential-compute backend only to (i) encrypt an amount
to a ciphertext handle with a verifiable input proof, (ii) transfer the handle
under an ACL, and (iii) authorize a per-recipient decryption. This is a narrow
interface:

```
ConfidentialBackend:
    encrypt(m)            -> (handle, proof)
    transfer(from, to, h) -> ()      // ACL-gated
    grant(h, addr)        -> ()      // extend ACL
    userDecrypt(addr, h)  -> m       // authorized only
```

FHE (Zama / ERC-7984) is the instantiation used here. An MPC backend
(secret-shared amounts with a committee performing the transfer and selective
reveal) satisfies the same interface. Veil is therefore an **application-layer
payments protocol**, not a compute network: it composes with whatever
confidential-compute substrate is available. This is the axis on which Veil is
complementary to — not competing with — general MPC networks such as Arcium.

---

## 8. Implementation (planned)

- **Contracts.** `ConfidentialDisperse.sol` (Solidity, FHEVM), reusing the
  standard ERC-5564 announcer and ERC-6538 registry, operating over the official
  ERC-7984 cToken from the Zama Wrappers Registry. Integrates the TokenOps SDK
  for the distribution primitive.
- **Client.** TypeScript + `@zama-fhe/relayer-sdk` for input encryption and
  EIP-712 user decryption; `@noble/secp256k1` (or a stealth-address SDK) for
  ECDH and stealth-key derivation.
- **Deployment.** Sepolia testnet.

## 9. Evaluation (planned)

- Gas per recipient for `disperse` vs. batch size.
- Recipient scan time vs. announcement volume, with and without view tags.
- FHE batch limits → maximum recipients per transaction.

## 10. Related Work

Umbra (stealth payments, amounts public); Tornado Cash / Privacy Pools
(mixers, fungible-set anonymity); Zcash and Aztec (shielded pools);
Fairblock and threshold-encryption mempools; Arcium (general MPC compute
network). Veil is distinguished by composing *amount* privacy (FHE) with
*recipient* privacy (stealth) in a distribution-specific protocol with a
self-service claim flow.

## 11. Limitations & Future Work

Count leakage absent decoy padding; sender anonymity requires relayers;
view-tag scanning cost grows with announcement volume (amortizable via indexers);
a formal game-based proof of the combined construction is left to an extended
version.

## 12. Conclusion

Veil shows that hiding *who* and *how much* in onchain distributions is
achievable today by composing two mature standards. Its backend abstraction
positions confidential distribution as a portable protocol rather than a
property of any single cryptographic substrate.

---

*References to be added: ERC-7984, ERC-5564, ERC-6538, EIP-712, TFHE (Chillotti
et al.), Zama Protocol litepaper, Umbra, Arcium docs.*
