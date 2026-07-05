// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";

/// @title IERC7984 - minimal confidential fungible token surface used by Veil.
/// @notice Trimmed to the operations ConfidentialDisperse needs. The canonical
///         ERC-7984 interface is broader; confirm exact signatures against the
///         official Zama implementation during the week-1 spike before relying
///         on this.
interface IERC7984 {
    /// @notice Move an encrypted amount from `from` to `to`.
    /// @dev Caller must be authorized by `from` (operator/allowance model per
    ///      the live ERC-7984 spec - verify whether this is `confidentialTransferFrom`
    ///      with an operator approval or a permit-style flow).
    /// @return transferred the encrypted amount actually moved (may differ if
    ///         the sender balance is insufficient, per confidential-token semantics).
    function confidentialTransferFrom(
        address from,
        address to,
        euint64 amount
    ) external returns (euint64 transferred);

    /// @notice Encrypted balance handle for `account`.
    function confidentialBalanceOf(address account) external view returns (euint64);
}
