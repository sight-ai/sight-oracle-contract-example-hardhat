// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@sight-oracle/contracts/Oracle/Types.sol";
import "@sight-oracle/contracts/Oracle/Oracle.sol";
import "@sight-oracle/contracts/Oracle/RequestBuilder.sol";
import "@sight-oracle/contracts/Oracle/CapsulatedValueResolver.sol";

contract MultiStepExample {
    // Use Sight Oracle's RequestBuilder and ResponseResolver to interact with Sight Oracle
    using RequestBuilder for Request;
    using ResponseResolver for CapsulatedValue;

    event OracleCallback(bytes32 indexed reqId);

    bytes32 latestReqId;
    Oracle public oracle;
    euint64 private _target;

    constructor(address oracle_) payable {
        oracle = Oracle(payable(oracle_));
    }

    function createRandomTarget() public payable {
        // Initialize new FHE computation request of a single step.
        Request memory r = RequestBuilder.newRequest(
            msg.sender,
            1,
            address(this),
            this.randomTargetCallback.selector, // specify the callback for Oracle
            ""
        );

        r.rand();

        // Send the request via Sight FHE Oracle
        latestReqId = oracle.send(r);
    }

    // only Oracle can call this
    function randomTargetCallback(bytes32 reqId, CapsulatedValue[] memory values) public onlyOracle {
        // Decode value from Oracle callback
        CapsulatedValue memory result = values[0];

        // Keep this encrypted target value
        _target = result.asEuint64();
        emit OracleCallback(reqId);
    }

    function makeComputation(uint64 amount) public payable {
        // Initialize new FHE computation request of 2 steps.
        Request memory r = RequestBuilder.newRequest(
            msg.sender,
            2,
            address(this),
            this.computationCallback.selector, // specify the callback for Oracle
            ""
        );

        // Step 1 - Load euint64 into Request Execution Context
        op e_target = r.getEuint64(_target);

        // Step 2 - Add _target with plaintext input and store in Sight Network
        // op e_target_sum = r.add(e_target, amount);
        r.add(e_target, amount);

        // Send the request via Sight FHE Oracle
        latestReqId = oracle.send(r);
    }

    // only Oracle can call this
    function computationCallback(bytes32 reqId, CapsulatedValue[] memory values) public onlyOracle {
        // Decode value from Oracle callback
        CapsulatedValue memory result = values[values.length - 1];

        // Keep this encrypted target value
        _target = result.asEuint64();
        emit OracleCallback(reqId);
    }

    function getTarget() public view returns (euint64) {
        return _target;
    }

    function getLatestReqId() public view returns (bytes32) {
        return latestReqId;
    }

    modifier onlyOracle() {
        require(msg.sender == address(oracle), "Only Oracle Can Do This");
        _;
    }
}
