// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/RequestBuilder.sol";
import "@sight-oracle/contracts/Oracle/ResponseResolver.sol";

// Async ops might slower than sync ops, but a transaction can own multi async ops, and it is not easy to reach the block gas limit of the fhe compute chain.
contract AsyncDecryptExample {
    // Use Sight Oracle's RequestBuilder and ResponseResolver to interact with Sight Oracle
    using RequestBuilder for Request;
    using ResponseResolver for CapsulatedValue;

    event OracleCallback(bytes32 indexed reqId);

    Oracle public oracle;
    CapsulatedValue[] public results;
    CapsulatedValue public result;
    bytes32 public latestReqId;

    constructor(address oracle_) payable {
        oracle = Oracle(payable(oracle_));
    }

    function asyncDecryptRandomEuint64() public payable returns (bytes32) {
        // Initialize new FHE computation request of multi-steps.
        Request memory r = RequestBuilder.newRequest(
            msg.sender,
            8,
            address(this),
            this.callback.selector // specify the callback for Oracle
        );

        // Generate a random encrypted value and store in Sight Network
        op e_result0 = r.rand();
        // Decrypt e_result0 in async way.
        r.decryptEuint64Async(e_result0);

        op e_result1 = r.rand();
        r.decryptEuint64Async(e_result1);
        op e_result2 = r.rand();
        r.decryptEuint64Async(e_result2);
        op e_result3 = r.add(e_result0, e_result2);
        r.decryptEuint64Async(e_result3);

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
}
