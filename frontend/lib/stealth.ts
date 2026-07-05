/**
 * Veil - ERC-5564 stealth addresses (scheme 1, secp256k1).
 *
 * Client-only crypto. Spending / viewing private keys never leave the browser.
 * Sender derives a one-time stealth address + ephemeral pubkey + view tag from a
 * recipient's public meta-address. Recipient scans announcements with the viewing
 * key, rejects non-matches cheaply via the view tag, and recovers the stealth
 * private key for the EIP-712 user-decryption of their ERC-7984 slice.
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-5564  (schemeId = 1)
 */
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak256, computeAddress, getBytes, hexlify } from "ethers";

const Point = secp256k1.Point;
const N = Point.Fn.ORDER; // secp256k1 group order

export const SCHEME_ID = 1;

export interface StealthKeys {
  spendingPrivateKey: string; // 0x... 32 bytes
  viewingPrivateKey: string; // 0x... 32 bytes
  spendingPublicKey: string; // 0x... 33 bytes compressed
  viewingPublicKey: string; // 0x... 33 bytes compressed
  stealthMetaAddress: string; // 0x... 66 bytes = spendPub||viewPub
}

export interface StealthPayment {
  stealthAddress: string; // 0x... 20-byte one-time address
  ephemeralPublicKey: string; // 0x... 33 bytes compressed (R)
  viewTag: number; // 0..255, first byte of the shared-secret hash
}

export interface ScanMatch {
  stealthAddress: string;
  stealthPrivateKey: string; // 0x... 32 bytes, controls the one-time address
}

// ---- helpers ---------------------------------------------------------------

function toHex(bytes: Uint8Array): string {
  return hexlify(bytes);
}

function bigToBytes32(x: bigint): Uint8Array {
  return getBytes("0x" + x.toString(16).padStart(64, "0"));
}

/** keccak256 of the compressed shared-secret point -> 32-byte hash. */
function sharedSecretHash(sharedPointCompressed: Uint8Array): Uint8Array {
  return getBytes(keccak256(sharedPointCompressed));
}

// ---- key generation --------------------------------------------------------

/** Generate a fresh spending+viewing keypair and its ERC-6538 meta-address. */
export function generateStealthKeys(): StealthKeys {
  const spendingPrivateKey = secp256k1.utils.randomSecretKey();
  const viewingPrivateKey = secp256k1.utils.randomSecretKey();
  const spendingPublicKey = secp256k1.getPublicKey(spendingPrivateKey, true);
  const viewingPublicKey = secp256k1.getPublicKey(viewingPrivateKey, true);
  const meta = new Uint8Array(66);
  meta.set(spendingPublicKey, 0);
  meta.set(viewingPublicKey, 33);
  return {
    spendingPrivateKey: toHex(spendingPrivateKey),
    viewingPrivateKey: toHex(viewingPrivateKey),
    spendingPublicKey: toHex(spendingPublicKey),
    viewingPublicKey: toHex(viewingPublicKey),
    stealthMetaAddress: toHex(meta),
  };
}

/** Split a 66-byte meta-address into its compressed spend/view pubkeys. */
export function parseMetaAddress(metaAddress: string): {
  spendingPublicKey: Uint8Array;
  viewingPublicKey: Uint8Array;
} {
  const b = getBytes(metaAddress);
  if (b.length !== 66) throw new Error("meta-address must be 66 bytes");
  return { spendingPublicKey: b.slice(0, 33), viewingPublicKey: b.slice(33, 66) };
}

// ---- sender side -----------------------------------------------------------

/**
 * Derive a one-time stealth address for a recipient meta-address.
 * @param ephemeralPrivateKey optional 0x-32-byte key (defaults to random).
 */
export function deriveStealthAddress(
  metaAddress: string,
  ephemeralPrivateKey?: string
): StealthPayment {
  const { spendingPublicKey, viewingPublicKey } = parseMetaAddress(metaAddress);

  const r = ephemeralPrivateKey
    ? getBytes(ephemeralPrivateKey)
    : secp256k1.utils.randomSecretKey();
  const R = secp256k1.getPublicKey(r, true); // ephemeral pubkey

  // shared secret S = r * P_view
  const Pview = Point.fromBytes(viewingPublicKey);
  const S = Pview.multiply(BigInt(hexlify(r))).toBytes(true);
  const hash = sharedSecretHash(S);
  const viewTag = hash[0];

  // stealth pubkey P_stealth = P_spend + hash*G
  const hashScalar = BigInt(keccak256(S)) % N;
  const Pstealth = Point.fromBytes(spendingPublicKey).add(Point.BASE.multiply(hashScalar));
  const stealthAddress = computeAddress(toHex(Pstealth.toBytes(true)));

  return { stealthAddress, ephemeralPublicKey: toHex(R), viewTag };
}

// ---- recipient side --------------------------------------------------------

/**
 * Test one announcement against the recipient's keys. Returns the recovered
 * stealth private key on a match, or null. Cheap view-tag reject first.
 */
export function checkStealthAddress(
  announcedStealthAddress: string,
  ephemeralPublicKey: string,
  viewTag: number,
  viewingPrivateKey: string,
  spendingPublicKey: string,
  spendingPrivateKey: string
): ScanMatch | null {
  // shared secret S = p_view * R
  const R = Point.fromBytes(getBytes(ephemeralPublicKey));
  const S = R.multiply(BigInt(viewingPrivateKey)).toBytes(true);
  const hash = sharedSecretHash(S);

  if (hash[0] !== viewTag) return null; // fast reject ~255/256

  const hashScalar = BigInt(keccak256(S)) % N;
  const Pstealth = Point.fromBytes(getBytes(spendingPublicKey)).add(
    Point.BASE.multiply(hashScalar)
  );
  const derived = computeAddress(toHex(Pstealth.toBytes(true)));
  if (derived.toLowerCase() !== announcedStealthAddress.toLowerCase()) return null;

  // stealth private key = (p_spend + hash) mod n
  const stealthPriv = (BigInt(spendingPrivateKey) + hashScalar) % N;
  return {
    stealthAddress: derived,
    stealthPrivateKey: toHex(bigToBytes32(stealthPriv)),
  };
}

/** ERC-5564 metadata payload: view tag byte (+ optional extra). */
export function encodeMetadata(viewTag: number, extra: Uint8Array = new Uint8Array()): string {
  const out = new Uint8Array(1 + extra.length);
  out[0] = viewTag & 0xff;
  out.set(extra, 1);
  return toHex(out);
}
