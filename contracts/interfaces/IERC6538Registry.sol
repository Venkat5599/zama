// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice ERC-6538 Stealth Meta-Address Registry (standard singleton).
/// Maps an identity (address / registrant) to its published stealth
/// meta-address = compressed spending pubkey || compressed viewing pubkey.
interface IERC6538Registry {
    event StealthMetaAddressSet(
        bytes indexed registrant,
        uint256 indexed schemeId,
        bytes stealthMetaAddress
    );

    function stealthMetaAddressOf(
        bytes memory registrant,
        uint256 schemeId
    ) external view returns (bytes memory);

    function registerKeys(
        uint256 schemeId,
        bytes memory stealthMetaAddress
    ) external;
}
