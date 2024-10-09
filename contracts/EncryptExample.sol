// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/ResponseResolver.sol";
import "@sight-oracle/contracts/Oracle/SaveCiphertextRequestBuilder.sol";

contract EncryptExample {
    // Use Sight Oracle's SaveCiphertextRequestBuilder and ResponseResolver to interact with Sight Oracle
    using SaveCiphertextRequestBuilder for SaveCiphertextRequest;
    using ResponseResolver for CapsulatedValue;

    Oracle public oracle;
    CapsulatedValue public result;

    constructor(address oracle_) payable {
        oracle = Oracle(payable(oracle_));
    }

    function encryptEuint64(
        bytes calldata cyphertext,
        uint8 cyphertextType
    ) public payable returns (bytes32 _requestId) {
        // Initialize new FHE computation request of a single step.
        SaveCiphertextRequest memory r = SaveCiphertextRequestBuilder.newSaveCiphertextRequest(
            msg.sender,
            cyphertext,
            cyphertextType,
            address(this),
            this.callback.selector // specify the callback for Oracle
        );

        // Send the request via Sight FHE Oracle
        _requestId = oracle.send(r);
    }

    // only Oracle can call this
    function callback(bytes32 /** requestId **/, CapsulatedValue memory value) public onlyOracle {
        // Decode value from Oracle callback
        result = value;
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracle), "Only Oracle Can Do This");
        _;
    }
}
