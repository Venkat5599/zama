import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { Wallet } from "ethers";
import * as fs from "fs";
import * as path from "path";
import {
  generateStealthKeys,
  deriveStealthAddress,
  encodeMetadata,
} from "../lib/stealth";

// Week-1 spike, live on Sepolia:
//   fund a stealth address with an encrypted amount through disperse, then prove
//   the freshly-derived stealth key can EIP-712 user-decrypt its own slice.
// Precondition: the sender (PRIVATE_KEY) already holds a confidential cToken
// balance, and addresses.sepolia.json has cToken + announcer + disperse set.
async function main() {
  const cfg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "addresses.sepolia.json"), "utf8")
  );
  const [sender] = await ethers.getSigners();
  const senderAddr = await sender.getAddress();
  console.log("Sender:", senderAddr);

  const cToken = await ethers.getContractAt("IERC7984", cfg.cToken);
  const disperse = await ethers.getContractAt("ConfidentialDisperse", cfg.confidentialDisperse);

  // 1) authorize disperse as operator (once)
  const isOp = await (cToken as any).isOperator(senderAddr, cfg.confidentialDisperse);
  if (!isOp) {
    console.log("Setting operator...");
    await (await (cToken as any).setOperator(cfg.confidentialDisperse, 2 ** 48 - 1)).wait();
  }

  // 2) fresh recipient stealth keys + derived address
  const keys = generateStealthKeys();
  const pay = deriveStealthAddress(keys.stealthMetaAddress);
  console.log("Stealth address:", pay.stealthAddress);

  // 3) encrypt one amount (42), bound to the disperse contract + sender
  const AMOUNT = 42n;
  const enc = await fhevm
    .createEncryptedInput(cfg.confidentialDisperse, senderAddr)
    .add64(AMOUNT)
    .encrypt();

  // 4) disperse
  console.log("Dispersing...");
  await (
    await disperse.disperse(
      [pay.stealthAddress],
      [enc.handles[0]],
      enc.inputProof,
      [pay.ephemeralPublicKey],
      [encodeMetadata(pay.viewTag)]
    )
  ).wait();

  // 5) recipient recovers the stealth key and decrypts its own balance
  const match = keys; // in a real flow the recipient scans; here we hold the keys
  const stealthPriv = (
    // recompute the stealth private key from the announcement
    await import("../lib/stealth")
  ).checkStealthAddress(
    pay.stealthAddress,
    pay.ephemeralPublicKey,
    pay.viewTag,
    match.viewingPrivateKey,
    match.spendingPublicKey,
    match.spendingPrivateKey
  );
  if (!stealthPriv) throw new Error("recipient failed to match own payment");

  const handle = await (cToken as any).confidentialBalanceOf(pay.stealthAddress);
  const stealthSigner = new Wallet(stealthPriv.stealthPrivateKey, ethers.provider);
  const clear = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    handle,
    cfg.cToken,
    stealthSigner
  );

  console.log(`Decrypted amount: ${clear}  (expected ${AMOUNT})`);
  if (clear !== AMOUNT) throw new Error("SPIKE FAILED: amount mismatch");
  console.log("SPIKE PASSED   ACL grant reached the fresh stealth address.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
