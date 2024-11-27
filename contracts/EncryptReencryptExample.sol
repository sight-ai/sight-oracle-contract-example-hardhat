// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/ResponseResolver.sol";
import "@sight-oracle/contracts/Oracle/CapsulatedValueResolver.sol";
import "@sight-oracle/contracts/Oracle/ReencryptRequestBuilder.sol";
import "@sight-oracle/contracts/Oracle/SaveCiphertextRequestBuilder.sol";

contract EncryptReencryptExample {
    event SaveCiphertext(bytes32 reqId, CapsulatedValue cv);
    event ReencryptedCiphertext(bytes32 reqId, bytes reencryptedCiphertext);

    Oracle public oracle;
    bytes32 public latestReqId;

    constructor(address oracle_) {
        oracle = Oracle(oracle_);
    }

    // ciphertextType: 128 for T_EBOOL, 129 for T_EUINT64, 130 for T_EADDRESS;
    function saveCiphertext(bytes calldata ciphertext, uint8 ciphertextType) public returns (bytes32) {
        SaveCiphertextRequest memory r = SaveCiphertextRequestBuilder.newSaveCiphertextRequest(
            msg.sender,
            ciphertext,
            ciphertextType,
            address(this),
            this.saveCiphertext_cb.selector
        );
        latestReqId = oracle.send(r);
        return latestReqId;
    }

    function saveCiphertext_cb(bytes32 reqId, CapsulatedValue memory capsulated_value) public onlyOracle {
        emit SaveCiphertext(reqId, capsulated_value);
    }

    // CapsulatedValue valueType need to be T_EBOOL | T_EUINT64 | T_EADDRESS
    function reencryptCapsulatedValue(
        CapsulatedValue memory capsulatedValue,
        bytes32 publicKey,
        bytes calldata signature
    ) public payable returns (bytes32) {
        // Initialize new FHE computation request of a single step.
        ReencryptRequest memory r = ReencryptRequestBuilder.newReencryptRequest(
            msg.sender,
            capsulatedValue,
            publicKey,
            signature,
            address(this),
            this.reencryptCapsulatedValue_cb.selector // specify the callback for Oracle
        );

        // Send the request via Sight FHE Oracle
        latestReqId = oracle.send(r);
        return latestReqId;
    }

    function reencryptCapsulatedValue_cb(bytes32 reqId, bytes memory reencryptedCipherText) public onlyOracle {
        emit ReencryptedCiphertext(reqId, reencryptedCipherText);
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracle), "Only Oracle Can Do This");
        _;
    }

    fallback() external payable {}
    receive() external payable {}
}
