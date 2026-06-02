/**
 * ConfidentialDisperse — FHEVM mock tests (sketch).
 *
 * Goal of week-1 spike: prove the end-to-end pipe BEFORE building UI —
 *   encrypt client-side → disperse → FHE.allow grants stealth addr →
 *   recipient user-decrypts only their own slice.
 *
 * Stack: Hardhat + @fhevm/hardhat-plugin (FHEVM mock) + @zama-fhe/relayer-sdk.
 * Exact API names below are placeholders — reconcile against the live
 * fhevm-hardhat-template during the spike.
 */
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("ConfidentialDisperse", () => {
  let disperse: any;
  let token: any;        // official ERC-7984 cToken from Zama Wrappers Registry
  let announcer: any;    // standard ERC-5564 announcer
  let sender: any, alice: any, bob: any;

  beforeEach(async () => {
    [sender, alice, bob] = await ethers.getSigners();
    // Deploy / attach token + announcer, then ConfidentialDisperse.
    // token = await attachOfficialCToken();
    // announcer = await deployAnnouncer();
    // disperse = await (await ethers.getContractFactory("ConfidentialDisperse"))
    //   .deploy(await token.getAddress(), await announcer.getAddress());
  });

  it("CRITICAL: recipient can decrypt the slice sent to their stealth address", async () => {
    // 1. Off-chain: derive stealth addr for alice from her meta-address (ECDH).
    //    const { stealthAddr, ephemeralPub, viewTag } = deriveStealth(aliceMeta);

    // 2. Client-side encrypt amount = 100 for that stealth address.
    //    const enc = await fhevm.createEncryptedInput(disperseAddr, sender.address)
    //      .add64(100n).encrypt();

    // 3. Sender approves disperse as ERC-7984 operator, then disperses.
    //    await token.setOperator(disperseAddr, deadline);
    //    await disperse.disperse(
    //      [stealthAddr], [enc.handles[0]], enc.inputProof,
    //      [ephemeralPub], [viewTag]
    //    );

    // 4. Recipient (controlling stealth privkey) user-decrypts the balance.
    //    const bal = await fhevm.userDecryptEuint(
    //      FhevmType.euint64, await token.confidentialBalanceOf(stealthAddr),
    //      tokenAddr, stealthSigner
    //    );
    //    expect(bal).to.equal(100n);

    expect(true).to.equal(true); // replace once spike pipe is wired
  });

  it("emits one Announcement per recipient with correct view tag", async () => {
    // assert ERC-5564 Announcement count === recipients and metadata[0] === viewTag
  });

  it("decoy entries (encrypted 0) are indistinguishable onchain", async () => {
    // disperse [realAddr, decoyAddr] with amounts [100, 0];
    // assert both emit announcements; count leak is hidden behind fixed N
  });

  it("reverts on length mismatch", async () => {
    // await expect(disperse.disperse([a], [h1, h2], proof, [p], [t]))
    //   .to.be.revertedWithCustomError(disperse, "LengthMismatch");
  });
});
