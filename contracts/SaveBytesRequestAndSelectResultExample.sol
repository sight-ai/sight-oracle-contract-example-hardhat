// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/CapsulatedValueResolver.sol";
import "@sight-oracle/contracts/Oracle/ReencryptRequestBuilder.sol";
import "@sight-oracle/contracts/Oracle/SaveCiphertextRequestBuilder.sol";

contract SaveBytesAndSelectResultExample {
    using RequestBuilder for Request;
    using ResponseResolver for CapsulatedValue;

    event OracleCallback(bytes32 indexed reqId);

    Oracle public oracle;
    CapsulatedValue[] public results;
    CapsulatedValue public result;
    bytes32 public latestReqId;

    constructor(address oracle_) {
        oracle = Oracle(oracle_);
    }

    function makeRequest(bytes memory euint64Bytes) public returns (bytes32) {
        // Initialize new FHE computation request of 2 steps.
        Request memory r = RequestBuilder.newRequest(
            msg.sender,
            7,
            address(this),
            this.callback.selector, // specify the callback for Oracle
            ""
        );

        op e_uint64 = r.rand();
        op e_uint64_1 = r.saveEuint64Bytes(euint64Bytes);
        op e_bool = r.ge(e_uint64, e_uint64_1);
        op e_uint64_max = r.select(e_bool, e_uint64, e_uint64_1);
        r.decryptEbool(e_bool);
        r.decryptEuint64(e_uint64);
        r.decryptEuint64(e_uint64_max);

        // Send the request via Sight FHE Oracle
        latestReqId = oracle.send(r);
        return latestReqId;
    }

    // only Oracle can call this
    function callback(bytes32 reqId, CapsulatedValue[] memory values) public onlyOracle {
        for (uint256 i = 0; i < values.length; i++) {
            results.push(values[i]);
        }
        // Decode value from Oracle callback
        result = results[values.length - 1];
        emit OracleCallback(reqId);
    }

    function getResults() public view returns (CapsulatedValue[] memory) {
        return results;
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracle), "Only Oracle Can Do This");
        _;
    }

    fallback() external payable {}
    receive() external payable {}
}
