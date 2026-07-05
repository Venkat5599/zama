// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/// @notice Test-only ERC-7984 confidential token. Stands in for the official
///         Wrappers-Registry cToken during local FHEVM-mock tests. Not for deploy.
contract MockConfidentialToken is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("Mock cUSDT", "mcUSDT", "") {}

    /// @notice Mint an encrypted balance to `to` from an external ciphertext.
    function mint(
        address to,
        externalEuint64 encAmount,
        bytes calldata inputProof
    ) external returns (euint64) {
        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        return _mint(to, amount);
    }
}
