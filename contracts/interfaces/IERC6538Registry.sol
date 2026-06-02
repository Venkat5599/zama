// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC6538Registry — stealth meta-address registry.
/// @notice Recipients register their meta-address (spending + viewing public
///         keys) once so senders can resolve them by identity.
interface IERC6538Registry {
    /// @param registrant the recipient's identity (address or other id).
    /// @param schemeId    cryptographic scheme (1 = secp256k1).
    /// @return the registered stealth meta-address bytes, or empty if unset.
    function stealthMetaAddressOf(
        bytes memory registrant,
        uint256 schemeId
    ) external view returns (bytes memory);

    function registerKeys(
        uint256 schemeId,
        bytes calldata stealthMetaAddress
    ) external;
}
