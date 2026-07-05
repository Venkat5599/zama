import { expect } from "chai";
import { Wallet } from "ethers";
import {
  generateStealthKeys,
  deriveStealthAddress,
  checkStealthAddress,
} from "../lib/stealth";

// Pure crypto roundtrip - no chain. Sender derives a stealth address from the
// recipient meta-address; recipient recovers the matching private key and proves
// it controls exactly that address.
describe("stealth (ERC-5564 scheme 1)", () => {
  it("sender->recipient roundtrip: recipient recovers a key that controls the stealth address", () => {
    const keys = generateStealthKeys();

    const payment = deriveStealthAddress(keys.stealthMetaAddress);
    expect(payment.stealthAddress).to.match(/^0x[0-9a-fA-F]{40}$/);
    expect(payment.viewTag).to.be.within(0, 255);

    const match = checkStealthAddress(
      payment.stealthAddress,
      payment.ephemeralPublicKey,
      payment.viewTag,
      keys.viewingPrivateKey,
      keys.spendingPublicKey,
      keys.spendingPrivateKey
    );
    expect(match, "recipient should match own payment").to.not.equal(null);

    // the recovered key must actually control the announced stealth address
    const wallet = new Wallet(match!.stealthPrivateKey);
    expect(wallet.address.toLowerCase()).to.equal(
      payment.stealthAddress.toLowerCase()
    );
  });

  it("a different recipient does NOT match the payment", () => {
    const alice = generateStealthKeys();
    const bob = generateStealthKeys();
    const payment = deriveStealthAddress(alice.stealthMetaAddress);

    const match = checkStealthAddress(
      payment.stealthAddress,
      payment.ephemeralPublicKey,
      payment.viewTag,
      bob.viewingPrivateKey,
      bob.spendingPublicKey,
      bob.spendingPrivateKey
    );
    expect(match).to.equal(null);
  });

  it("view tag mismatch is rejected without full derivation", () => {
    const keys = generateStealthKeys();
    const payment = deriveStealthAddress(keys.stealthMetaAddress);
    const wrongTag = (payment.viewTag + 1) & 0xff;
    const match = checkStealthAddress(
      payment.stealthAddress,
      payment.ephemeralPublicKey,
      wrongTag,
      keys.viewingPrivateKey,
      keys.spendingPublicKey,
      keys.spendingPrivateKey
    );
    expect(match).to.equal(null);
  });
});
