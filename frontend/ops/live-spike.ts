// REAL onchain spike on Sepolia: relayer-encrypted disperse to 2 stealth
// recipients, then relayer user-decrypt proves each sees only its own amount.
import { readFileSync } from "node:fs";
import { JsonRpcProvider, Wallet, Contract, hexlify } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import {
  generateStealthKeys,
  deriveStealthAddress,
  checkStealthAddress,
  encodeMetadata,
} from "../lib/stealth";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const DISPERSE = "0xB6E0497dfD8FDbfFB25F6AE3DC8104c46bBE8329";
const CUSDT = "0x4E7B06D78965594eB5EF5414c357ca21E1554491";
const MAX48 = 281474976710655;

const disperseAbi = [
  "function disperse(address[] stealthAddresses, bytes32[] encAmounts, bytes inputProof, bytes[] ephemeralPubKeys, bytes[] metadata)",
];
const cAbi = [
  "function setOperator(address operator, uint48 until)",
  "function isOperator(address holder, address spender) view returns (bool)",
  "function confidentialBalanceOf(address account) view returns (bytes32)",
];

async function main() {
  const pk = readFileSync(".env", "utf8").match(/PRIVATE_KEY=(\w+)/)![1];
  const provider = new JsonRpcProvider(RPC);
  const sender = new Wallet(pk, provider);
  console.log("Sender:", sender.address);

  const cusdt = new Contract(CUSDT, cAbi, sender);
  const disperse = new Contract(DISPERSE, disperseAbi, sender);

  // 1) authorize disperse as operator
  if (!(await cusdt.isOperator(sender.address, DISPERSE))) {
    console.log("setOperator...");
    await (await cusdt.setOperator(DISPERSE, MAX48)).wait();
  }
  console.log("operator ok");

  // 2) two fresh recipients
  const alice = generateStealthKeys();
  const bob = generateStealthKeys();
  const pA = deriveStealthAddress(alice.stealthMetaAddress);
  const pB = deriveStealthAddress(bob.stealthMetaAddress);
  console.log("Alice stealth:", pA.stealthAddress, "-> 300");
  console.log("Bob   stealth:", pB.stealthAddress, "-> 700");

  // 3) relayer-encrypt [300, 700] bound to the disperse contract + sender
  console.log("encrypting via relayer...");
  const fhe = await createInstance({ ...SepoliaConfig, network: RPC });
  const input = fhe.createEncryptedInput(DISPERSE, sender.address);
  input.add64(300);
  input.add64(700);
  const enc = await input.encrypt();
  const handles = enc.handles.map((h: Uint8Array) => hexlify(h));
  const proof = hexlify(enc.inputProof);

  // 4) REAL disperse tx
  console.log("disperse tx...");
  const tx = await disperse.disperse(
    [pA.stealthAddress, pB.stealthAddress],
    handles,
    proof,
    [pA.ephemeralPublicKey, pB.ephemeralPublicKey],
    [encodeMetadata(pA.viewTag), encodeMetadata(pB.viewTag)]
  );
  const rc = await tx.wait();
  console.log("disperse mined:", rc.hash, "block", rc.blockNumber);

  // 5) each recipient recovers stealth key + relayer user-decrypts own balance
  for (const [name, keys, pay, expect] of [
    ["Alice", alice, pA, 300n],
    ["Bob", bob, pB, 700n],
  ] as const) {
    const m = checkStealthAddress(
      pay.stealthAddress,
      pay.ephemeralPublicKey,
      pay.viewTag,
      keys.viewingPrivateKey,
      keys.spendingPublicKey,
      keys.spendingPrivateKey
    );
    if (!m) throw new Error(name + " failed to match own payment");
    const stealth = new Wallet(m.stealthPrivateKey);

    const handle = await cusdt.confidentialBalanceOf(pay.stealthAddress);
    const { publicKey, privateKey } = fhe.generateKeypair();
    const start = Math.floor(Date.now() / 1000);
    const days = 1;
    const eip712 = fhe.createEIP712(publicKey, [CUSDT], start, days);
    const types = { ...(eip712.types as any) };
    delete types.EIP712Domain;
    const sig = await stealth.signTypedData(
      eip712.domain as any,
      types,
      eip712.message as any
    );

    const res = await fhe.userDecrypt(
      [{ handle, contractAddress: CUSDT }],
      privateKey,
      publicKey,
      sig.replace(/^0x/, ""),
      [CUSDT],
      pay.stealthAddress,
      start,
      days
    );
    const clear = BigInt(res[handle] as any);
    const ok = clear === expect ? "OK" : "MISMATCH";
    console.log(`${name} decrypted: ${clear} (expected ${expect}) ${ok}`);
  }
  console.log("REAL onchain spike complete.");
}

main().catch((e) => {
  console.error("ERR", e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
