// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC5564Announcer — stealth-address announcement standard.
/// @notice Singleton announcer. Anyone may emit an Announcement so recipients
///         can scan for payments addressed to their stealth meta-address.
interface IERC5564Announcer {
    /// @param schemeId        cryptographic scheme (1 = secp256k1, view-tagged).
    /// @param stealthAddress  the one-time recipient address.
    /// @param ephemeralPubKey sender ephemeral public key R (compressed, 33 bytes).
    /// @param metadata        view tag in byte[0]; optional extra data follows.
    event Announcement(
        uint256 indexed schemeId,
        address indexed stealthAddress,
        address indexed caller,
        bytes ephemeralPubKey,
        bytes metadata
    );

    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata metadata
    ) external;
}
