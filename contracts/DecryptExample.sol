// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/RequestBuilder.sol";
import "@sight-oracle/contracts/Oracle/ResponseResolver.sol";

contract DecryptExample {
    // Use Sight Oracle's RequestBuilder and ResponseResolver to interact with Sight Oracle
    using RequestBuilder for Request;
    using ResponseResolver for CapsulatedValue;

    Oracle public oracle;
    CapsulatedValue public result;

    constructor(address oracle_) payable {
        oracle = Oracle(payable(oracle_));
    }

    function decryptRandomEuint64() public payable {
        // Initialize new FHE computation request of a single step.
        Request memory r = RequestBuilder.newRequest(
            msg.sender,
            2,
            address(this),
            this.callback.selector // specify the callback for Oracle
        );

        // Generate a random encrypted value and store in Sight Network
        op e_result = r.rand();

        // Decrypt e_result

        r.decryptEuint64(e_result);

        // Send the request via Sight FHE Oracle
        oracle.send(r);
    }

    // only Oracle can call this
    function callback(bytes32 /** requestId **/, CapsulatedValue[] memory values) public onlyOracle {
        // Decode value from Oracle callback
        result = values[values.length - 1];
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracle), "Only Oracle Can Do This");
        _;
    }
}
