// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {IERC5564Announcer} from "./interfaces/IERC5564Announcer.sol";

/// @title ConfidentialDisperse — Veil's confidential batch-payment primitive.
/// @notice Sends encrypted amounts (ERC-7984 / FHE) to one-time stealth
///         addresses (ERC-5564) in a single transaction. Onchain observers see
///         ciphertext handles going to unlinkable addresses — neither the
///         amounts nor the recipient identities are revealed.
///
/// @dev Flow (resolved in the week-1 spike):
///      This contract is the entry point that receives the batched external
///      ciphertext handles, so the relayer input-proof is bound to THIS address.
///      For each recipient it decodes the handle with `FHE.fromExternal`, grants
///      the token a transient allowance, then calls the ERC-7984 euint64 transfer.
///      The token's `_update` internally calls `FHE.allow(transferred, to)` /
///      `FHE.allow(balance, to)`, so the freshly-derived stealth address is
///      granted decrypt rights automatically — the recipient later decrypts via
///      the EIP-712 user-decryption flow with their stealth key.
///
///      Prerequisite: the sender must call `cToken.setOperator(disperse, until)`
///      once beforehand, authorizing this contract to move their balance.
contract ConfidentialDisperse is ZamaEthereumConfig {
    /// @notice ERC-5564 scheme id for secp256k1 stealth addresses.
    uint256 public constant SCHEME_ID = 1;

    IERC7984 public immutable cToken;
    IERC5564Announcer public immutable announcer;

    /// @param sender the distributor that funded the disperse
    /// @param count  number of recipients (real + decoys) paid in this call
    event Dispersed(address indexed sender, uint256 count);

    error EmptyDisperse();
    error LengthMismatch();

    constructor(IERC7984 cToken_, IERC5564Announcer announcer_) {
        cToken = cToken_;
        announcer = announcer_;
    }

    /// @notice Confidentially pay `stealthAddresses` their `encAmounts`.
    /// @param stealthAddresses one-time recipient addresses (ERC-5564 derived)
    /// @param encAmounts       external euint64 handles, one per recipient
    /// @param inputProof       single batched input proof covering every handle
    /// @param ephemeralPubKeys sender ephemeral pubkeys (33-byte compressed), per recipient
    /// @param metadata         ERC-5564 metadata per recipient; byte[0] is the view tag
    /// @dev Decoys are recipients whose encAmount encrypts 0 — indistinguishable onchain.
    function disperse(
        address[] calldata stealthAddresses,
        externalEuint64[] calldata encAmounts,
        bytes calldata inputProof,
        bytes[] calldata ephemeralPubKeys,
        bytes[] calldata metadata
    ) external {
        uint256 n = stealthAddresses.length;
        if (n == 0) revert EmptyDisperse();
        if (
            encAmounts.length != n ||
            ephemeralPubKeys.length != n ||
            metadata.length != n
        ) revert LengthMismatch();

        for (uint256 i; i < n; ++i) {
            // Decode this recipient's handle against the batched proof (bound to
            // this contract). Grants this contract ACL on the resulting euint64.
            euint64 amount = FHE.fromExternal(encAmounts[i], inputProof);

            // The token needs to operate on the ciphertext during the transfer.
            FHE.allowTransient(amount, address(cToken));

            // Token verifies operator auth + our allowance, moves the encrypted
            // amount, and grants the stealth address FHE-ACL on the result.
            cToken.confidentialTransferFrom(msg.sender, stealthAddresses[i], amount);

            // Recipient scans for this to discover + decrypt their slice.
            announcer.announce(
                SCHEME_ID,
                stealthAddresses[i],
                ephemeralPubKeys[i],
                metadata[i]
            );
        }

        emit Dispersed(msg.sender, n);
    }
}
