// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@sight-oracle/contracts/Oracle/RequestBuilder.sol";
import "@sight-oracle/contracts/Oracle/ResponseResolver.sol";
import { oracleOpSepolia } from "@sight-oracle/contracts/Oracle/Oracle.sol";
import { ORACLE_ADDR_OP_SEPOLIA } from "@sight-oracle/contracts/Oracle/constants/OracleAddresses.sol";

contract UseInlineOracleExample {
    using RequestBuilder for Request;
    using ResponseResolver for CapsulatedValue;

    CapsulatedValue public _target;

    function checkOracleAddress() public pure returns (bool) {
        return ORACLE_ADDR_OP_SEPOLIA == address(oracleOpSepolia);
    }

    function checkOracleVersion() public view returns (bool) {
        // this call will revert in others network, because oracleOpSepolia is not deployed yet.
        return keccak256(bytes("0.0.2-SNAPSHOT")) == keccak256(bytes(oracleOpSepolia.VERSION()));
    }

    function makeRequest() public payable {
        // this call will revert in others network, because oracleOpSepolia is not deployed yet.
        // Initialize new FHE computation request of a single step.
        Request memory r = RequestBuilder.newRequest(
            msg.sender,
            1,
            address(this),
            this.callback.selector, // specify the callback for Oracle
            ""
        );

        // Generate a random encrypted value and store in Sight Network
        r.rand();

        // Send the request via Sight FHE Oracle
        oracleOpSepolia.send(r);
    }

    // only Oracle can call this
    function callback(bytes32 /** requestId **/, CapsulatedValue[] memory values) public onlyOracle {
        // Decode value from Oracle callback
        CapsulatedValue memory result = values[0];

        // Keep this encrypted target value
        _target = result;
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracleOpSepolia), "Only Oracle Can Do This");
        _;
    }
}
