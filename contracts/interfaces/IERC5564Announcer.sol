// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice ERC-5564 Stealth Address Announcer (standard singleton).
/// Emits an event so recipients can scan for payments addressed to their
/// stealth meta-address without any onchain link to their identity.
interface IERC5564Announcer {
    event Announcement(
        uint256 indexed schemeId,
        address indexed stealthAddress,
        address indexed caller,
        bytes ephemeralPubKey,
        bytes metadata
    );

    /// @param schemeId        stealth scheme id (1 = secp256k1, per ERC-5564)
    /// @param stealthAddress  one-time recipient address
    /// @param ephemeralPubKey sender's ephemeral public key (33 bytes, compressed)
    /// @param metadata        view tag (1 byte) + optional extra data
    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes memory ephemeralPubKey,
        bytes memory metadata
    ) external;
}
