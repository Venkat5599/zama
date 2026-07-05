import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import type { Signer } from "ethers";

// Veil - core invariant test:
// One confidential disperse pays two stealth recipients DIFFERENT amounts.
// Each recipient decrypts ONLY their own slice via EIP-712 user-decryption;
// neither can read the other's. Proves the ERC-7984 ACL grant reaches the
// freshly-derived stealth address (the make-or-break spike concern).
describe("ConfidentialDisperse", () => {
  const SCHEME_ID = 1n;
  const uintMax48 = 2n ** 48n - 1n;

  let sender: Signer, alice: Signer, bob: Signer;
  let senderAddr: string, aliceAddr: string, bobAddr: string;
  let token: any, announcer: any, disperse: any;
  let tokenAddr: string, disperseAddr: string;

  beforeEach(async () => {
    // stealth addresses are just distinct accounts for the ACL test;
    // real ECDH derivation is client-side (tested separately).
    [sender, alice, bob] = await ethers.getSigners();
    [senderAddr, aliceAddr, bobAddr] = await Promise.all([
      sender.getAddress(),
      alice.getAddress(),
      bob.getAddress(),
    ]);

    token = await (await ethers.getContractFactory("MockConfidentialToken")).deploy();
    announcer = await (await ethers.getContractFactory("MockAnnouncer")).deploy();
    tokenAddr = await token.getAddress();

    disperse = await (
      await ethers.getContractFactory("ConfidentialDisperse")
    ).deploy(tokenAddr, await announcer.getAddress());
    disperseAddr = await disperse.getAddress();

    // fund the sender with 1000 confidential units
    const mintInput = await fhevm
      .createEncryptedInput(tokenAddr, senderAddr)
      .add64(1000)
      .encrypt();
    await token
      .connect(sender)
      .mint(senderAddr, mintInput.handles[0], mintInput.inputProof);

    // sender authorizes the disperse contract to move their balance
    await token.connect(sender).setOperator(disperseAddr, uintMax48);
  });

  it("pays two stealth recipients different amounts; each decrypts only their own", async () => {
    // batch-encrypt [300, 700] bound to the token (it calls fromExternal) + sender
    const enc = await fhevm
      .createEncryptedInput(disperseAddr, senderAddr)
      .add64(300)
      .add64(700)
      .encrypt();

    const tag = (b: number) => "0x" + b.toString(16).padStart(2, "0");

    await expect(
      disperse.connect(sender).disperse(
        [aliceAddr, bobAddr],
        [enc.handles[0], enc.handles[1]],
        enc.inputProof,
        ["0x01", "0x02"], // ephemeral pubkeys (placeholder bytes for the test)
        [tag(0xaa), tag(0xbb)] // metadata: view tag byte
      )
    )
      .to.emit(disperse, "Dispersed")
      .withArgs(senderAddr, 2);

    // Alice decrypts her own balance handle => 300
    const aliceHandle = await token.confidentialBalanceOf(aliceAddr);
    const aliceClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      aliceHandle,
      tokenAddr,
      alice
    );
    expect(aliceClear).to.equal(300n);

    // Bob decrypts his own balance handle => 700
    const bobHandle = await token.confidentialBalanceOf(bobAddr);
    const bobClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      bobHandle,
      tokenAddr,
      bob
    );
    expect(bobClear).to.equal(700n);

    // Cross-read must fail: Alice is not ACL-authorized on Bob's handle
    await expect(
      fhevm.userDecryptEuint(FhevmType.euint64, bobHandle, tokenAddr, alice)
    ).to.be.rejected;
  });

  it("reverts on empty disperse", async () => {
    await expect(
      disperse.connect(sender).disperse([], [], "0x", [], [])
    ).to.be.revertedWithCustomError(disperse, "EmptyDisperse");
  });

  it("reverts on length mismatch", async () => {
    const enc = await fhevm
      .createEncryptedInput(disperseAddr, senderAddr)
      .add64(100)
      .encrypt();
    await expect(
      disperse
        .connect(sender)
        .disperse([aliceAddr, bobAddr], [enc.handles[0]], enc.inputProof, ["0x01"], ["0xaa"])
    ).to.be.revertedWithCustomError(disperse, "LengthMismatch");
  });
});
