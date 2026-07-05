import { sepolia } from "viem/chains";

export const CHAIN = sepolia;

// Fill these from addresses.sepolia.json after deploy. cToken = official ERC-7984
// from the Zama Wrappers Registry; announcer/registry = ERC-5564/6538 singletons.
export const ADDRESSES = {
  confidentialDisperse: (process.env.NEXT_PUBLIC_DISPERSE ?? "") as `0x${string}`,
  cToken: (process.env.NEXT_PUBLIC_CTOKEN ?? "") as `0x${string}`,
  erc5564Announcer: (process.env.NEXT_PUBLIC_ANNOUNCER ?? "") as `0x${string}`,
  erc6538Registry: (process.env.NEXT_PUBLIC_REGISTRY ?? "") as `0x${string}`,
};

export const SCHEME_ID = 1n;

export const disperseAbi = [
  {
    type: "function",
    name: "disperse",
    stateMutability: "nonpayable",
    inputs: [
      { name: "stealthAddresses", type: "address[]" },
      { name: "encAmounts", type: "bytes32[]" },
      { name: "inputProof", type: "bytes" },
      { name: "ephemeralPubKeys", type: "bytes[]" },
      { name: "metadata", type: "bytes[]" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Dispersed",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "count", type: "uint256", indexed: false },
    ],
  },
] as const;

export const cTokenAbi = [
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

export const announcerAbi = [
  {
    type: "event",
    name: "Announcement",
    inputs: [
      { name: "schemeId", type: "uint256", indexed: true },
      { name: "stealthAddress", type: "address", indexed: true },
      { name: "caller", type: "address", indexed: true },
      { name: "ephemeralPubKey", type: "bytes", indexed: false },
      { name: "metadata", type: "bytes", indexed: false },
    ],
  },
] as const;

export const registryAbi = [
  {
    type: "function",
    name: "registerKeys",
    stateMutability: "nonpayable",
    inputs: [
      { name: "schemeId", type: "uint256" },
      { name: "stealthMetaAddress", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "stealthMetaAddressOf",
    stateMutability: "view",
    inputs: [
      { name: "registrant", type: "bytes" },
      { name: "schemeId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes" }],
  },
] as const;
