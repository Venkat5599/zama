// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC5564Announcer} from "../interfaces/IERC5564Announcer.sol";

/// @notice Test-only ERC-5564 announcer. Mirrors the standard singleton's event.
contract MockAnnouncer is IERC5564Announcer {
    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata metadata
    ) external {
        emit Announcement(schemeId, stealthAddress, msg.sender, ephemeralPubKey, metadata);
    }
}
