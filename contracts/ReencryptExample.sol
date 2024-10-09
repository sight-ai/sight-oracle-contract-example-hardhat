// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/ResponseResolver.sol";
import "@sight-oracle/contracts/Oracle/ReencryptRequestBuilder.sol";

contract ReencryptExample {
    // Use Sight Oracle's ReencryptRequestBuilder and ResponseResolver to interact with Sight Oracle
    using ReencryptRequestBuilder for ReencryptRequest;
    using ResponseResolver for CapsulatedValue;

    Oracle public oracle;
    bytes public result;

    constructor(address oracle_) payable {
        oracle = Oracle(payable(oracle_));
    }

    function reencryptEuint64(
        CapsulatedValue memory capsulatedValue,
        bytes32 publicKey,
        bytes calldata signature
    ) public payable returns (bytes32 _requestId) {
        // Initialize new FHE computation request of a single step.
        ReencryptRequest memory r = ReencryptRequestBuilder.newReencryptRequest(
            msg.sender,
            capsulatedValue,
            publicKey,
            signature,
            address(this),
            this.callback.selector // specify the callback for Oracle
        );

        // Send the request via Sight FHE Oracle
        _requestId = oracle.send(r);
    }

    // only Oracle can call this
    function callback(bytes32 /** requestId **/, bytes memory value) public onlyOracle {
        // Decode value from Oracle callback
        result = value;
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracle), "Only Oracle Can Do This");
        _;
    }
}
