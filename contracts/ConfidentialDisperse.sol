// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "./interfaces/IERC7984.sol";
import {IERC5564Announcer} from "./interfaces/IERC5564Announcer.sol";

/// @title ConfidentialDisperse — Veil Protocol core.
/// @notice Distributes encrypted ERC-7984 amounts to one-time stealth addresses
///         and announces each via ERC-5564, so that both amounts (FHE) and
///         recipients (stealth) stay confidential onchain.
/// @dev    The sender derives stealth addresses and ephemeral keys off-chain
///         (ECDH against each recipient's ERC-6538 meta-address) and encrypts
///         amounts client-side with the Zama relayer SDK. This contract verifies
///         the input proof, performs the encrypted transfer, grants the stealth
///         address decrypt rights, and emits the announcement.
contract ConfidentialDisperse is SepoliaConfig {
    /// secp256k1, view-tagged.
    uint256 public constant SCHEME_ID = 1;

    IERC7984 public immutable token;
    IERC5564Announcer public immutable announcer;

    event Dispersed(address indexed sender, uint256 recipientCount);

    error LengthMismatch();
    error EmptyDisperse();

    constructor(address _token, address _announcer) {
        token = IERC7984(_token);
        announcer = IERC5564Announcer(_announcer);
    }

    /// @notice Confidentially disperse encrypted amounts to stealth addresses.
    /// @param stealthAddrs   one-time addresses, one per recipient (incl. decoys).
    /// @param encAmounts     external ciphertext handles, one per recipient.
    /// @param inputProof     single batched ZK input proof from the relayer SDK
    ///                       covering all handles in `encAmounts`.
    /// @param ephemeralPubs  compressed ephemeral pubkeys R_i (33 bytes each).
    /// @param viewTags       one-byte view tags for recipient fast-scan.
    /// @dev Decoys: to hide the true recipient count, callers may include extra
    ///      entries whose encrypted amount is 0. They are indistinguishable
    ///      onchain from real recipients.
    function disperse(
        address[] calldata stealthAddrs,
        externalEuint64[] calldata encAmounts,
        bytes calldata inputProof,
        bytes[] calldata ephemeralPubs,
        bytes1[] calldata viewTags
    ) external {
        uint256 n = stealthAddrs.length;
        if (n == 0) revert EmptyDisperse();
        if (
            n != encAmounts.length ||
            n != ephemeralPubs.length ||
            n != viewTags.length
        ) revert LengthMismatch();

        for (uint256 i; i < n; ++i) {
            // Verify and import the client-side ciphertext.
            euint64 amt = FHE.fromExternal(encAmounts[i], inputProof);

            // Allow this contract to operate on the ciphertext for the transfer.
            FHE.allowThis(amt);

            // Pull from sender, push to the stealth address (ACL-gated transfer).
            euint64 transferred =
                token.confidentialTransferFrom(msg.sender, stealthAddrs[i], amt);

            // CRITICAL: the stealth address is freshly derived and has no prior
            // ACL entry. Without this grant the recipient can never decrypt the
            // received balance.
            FHE.allow(transferred, stealthAddrs[i]);

            // ERC-5564 announcement: metadata[0] = view tag.
            announcer.announce(
                SCHEME_ID,
                stealthAddrs[i],
                ephemeralPubs[i],
                abi.encodePacked(viewTags[i])
            );
        }

        emit Dispersed(msg.sender, n);
    }
}
