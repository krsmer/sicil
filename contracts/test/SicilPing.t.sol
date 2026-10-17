// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SicilPing} from "../src/SicilPing.sol";

contract SicilPingTest is Test {
    event Ping(address indexed from, string note, uint256 ts);

    function test_PingEmits() public {
        SicilPing p = new SicilPing();
        assertEq(p.owner(), address(this));
        vm.expectEmit(true, false, false, true);
        emit Ping(address(this), "merhaba", block.timestamp);
        p.ping("merhaba");
    }
}
