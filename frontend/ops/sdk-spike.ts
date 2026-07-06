// REAL onchain spike of the NEW path: disperse through the official TokenOps
// ConfidentialDisperse singleton via @tokenops/sdk/fhe-disperse (direct mode),
// to two ERC-5564 stealth recipients, then user-decrypt proves each sees only
// its own amount (300 / 700). Signs with PRIVATE_KEY from ../.env.
//
// Run from the frontend/ dir:  bun ops/sdk-spike.ts
import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { Wallet } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import {
  createConfidentialDisperseClient,
  type Encryptor,
} from "@tokenops/sdk/fhe-disperse";
import {
  generateStealthKeys,
  deriveStealthAddress,
  checkStealthAddress,
  encodeMetadata,
} from "../lib/stealth";

const env = readFileSync("../.env", "utf8");
const PK = env.match(/PRIVATE_KEY=(\w+)/)![1];
const RPC =
  env.match(/SEPOLIA_RPC_URL=(\S+)/)?.[1]?.trim() ||
  "https://ethereum-sepolia-rpc.publicnode.com";

const CUSDT = "0x4E7B06D78965594eB5EF5414c357ca21E1554491" as const;
const ANNOUNCER = "0x55649E01B5Df198D18D95b5cc5051630cfD45564" as const;
const MAX48 = 281474976710655;

const cTokenAbi = [
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

const announcerAbi = [
  {
    type: "function",
    name: "announce",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthAddress", type: "address" },
      { name: "ephemeralPubKey", type: "bytes" },
      { name: "metadata", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

async function main() {
  const account = privateKeyToAccount(`0x${PK}`);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC),
  });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC),
  });
  console.log("Sender:", account.address);

  // Node relayer, adapted to the SDK Encryptor interface.
  const fhe = await createInstance({ ...SepoliaConfig, network: RPC });
  const encryptor: Encryptor = {
    async encrypt({ values, contractAddress, userAddress }) {
      const input = fhe.createEncryptedInput(contractAddress, userAddress);
      for (const v of values) input.add64(BigInt(v.value as bigint));
      const enc = await input.encrypt();
      return { handles: enc.handles, inputProof: enc.inputProof };
    },
  };

  const client = createConfidentialDisperseClient({
    publicClient,
    walletClient,
    chainId: sepolia.id,
    encryptor,
  });
  const singleton = client.address;
  console.log("TokenOps disperse singleton:", singleton);

  // 1) authorize the singleton as ERC-7984 operator on cUSDT
  const isOp = (await publicClient.readContract({
    address: CUSDT,
    abi: cTokenAbi,
    functionName: "isOperator",
    args: [account.address, singleton],
  })) as boolean;
  if (!isOp) {
    console.log("setOperator(singleton)...");
    const h = await walletClient.writeContract({
      address: CUSDT,
      abi: cTokenAbi,
      functionName: "setOperator",
      args: [singleton, MAX48],
    });
    await publicClient.waitForTransactionReceipt({ hash: h });
  }
  console.log("operator ok");

  // 2) two fresh stealth recipients
  const alice = generateStealthKeys();
  const bob = generateStealthKeys();
  const pA = deriveStealthAddress(alice.stealthMetaAddress);
  const pB = deriveStealthAddress(bob.stealthMetaAddress);
  console.log("Alice stealth:", pA.stealthAddress, "-> 300");
  console.log("Bob   stealth:", pB.stealthAddress, "-> 700");

  // 3) REAL disperse through the TokenOps SDK (direct mode)
  console.log("client.disperse (SDK, direct)...");
  const res = await client.disperse({
    token: CUSDT,
    mode: "direct",
    recipients: [pA.stealthAddress, pB.stealthAddress] as `0x${string}`[],
    amounts: [300n, 700n],
  });
  console.log("disperse mined:", res.hash);

  // 4) ERC-5564 announcements (so recipients can scan)
  for (const p of [pA, pB]) {
    const h = await walletClient.writeContract({
      address: ANNOUNCER,
      abi: announcerAbi,
      functionName: "announce",
      args: [
        1n,
        p.stealthAddress as `0x${string}`,
        p.ephemeralPublicKey as `0x${string}`,
        encodeMetadata(p.viewTag) as `0x${string}`,
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: h });
  }
  console.log("announced");

  // 5) each recipient recovers its stealth key + user-decrypts its own balance
  let allOk = true;
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

    const handle = (await publicClient.readContract({
      address: CUSDT,
      abi: cTokenAbi,
      functionName: "confidentialBalanceOf",
      args: [pay.stealthAddress as `0x${string}`],
    })) as string;

    const { publicKey, privateKey } = fhe.generateKeypair();
    const start = Math.floor(Date.now() / 1000);
    const days = 1;
    const eip712 = fhe.createEIP712(publicKey, [CUSDT], start, days);
    const types = { ...(eip712.types as Record<string, unknown>) };
    delete (types as Record<string, unknown>).EIP712Domain;
    const sig = await stealth.signTypedData(
      eip712.domain as never,
      types as never,
      eip712.message as never
    );

    const dec = await fhe.userDecrypt(
      [{ handle, contractAddress: CUSDT }],
      privateKey,
      publicKey,
      sig.replace(/^0x/, ""),
      [CUSDT],
      pay.stealthAddress,
      start,
      days
    );
    const clear = BigInt(
      dec[handle as `0x${string}`] as string | number | bigint
    );
    const ok = clear === expect;
    allOk &&= ok;
    console.log(
      `${name} decrypted: ${clear} (expected ${expect}) ${ok ? "OK" : "MISMATCH"}`
    );
  }
  console.log(allOk ? "REAL SDK disperse spike PASSED." : "SPIKE FAILED.");
  if (!allOk) process.exit(1);
}

main().catch((e) => {
  console.error("ERR", e?.shortMessage ?? e?.message ?? e);
  process.exit(1);
});
