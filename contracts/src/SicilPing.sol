// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title SicilPing
/// @notice Throwaway contract to prove the Fuji deploy + verify pipeline (cancun) before SicilKasasi.
contract SicilPing {
    address public immutable owner;

    event Ping(address indexed from, string note, uint256 ts);

    constructor() {
        owner = msg.sender;
    }

    function ping(string calldata note) external {
        emit Ping(msg.sender, note, block.timestamp);
    }
}
