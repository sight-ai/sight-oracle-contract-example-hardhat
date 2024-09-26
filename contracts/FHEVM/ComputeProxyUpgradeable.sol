// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "fhevm/lib/TFHE.sol";
import "fhevm/oracle/OracleCaller.sol";
import { ComputeProxyBaseUpgradeable } from "./ComputeProxyBaseUpgradeable.sol";
import {
    Opcode,
    Operation,
    Types,
    CapsulatedValue,
    Request,
    ReencryptRequest,
    SaveCiphertextRequest
} from "@sight-oracle/contracts/Oracle/Types.sol";

contract ComputeProxyUpgradeable is ComputeProxyBaseUpgradeable, OracleCaller {
    event RequestResolved(bytes32 id, CapsulatedValue[] results);
    event ReencryptRequestResolved(bytes32 id, bytes results);
    event DecryptAsyncResolved(uint256 reqId, CapsulatedValue[] results);
    event SaveCiphertextResolved(bytes32 reqId, CapsulatedValue result);
    uint[128] __gap_placeholder;

    function initialize() public initializer {
        __EIP712_init("Authorization token", "1");
        __Ownable_init(msg.sender);
    }

    function executeRequest(Request memory r) public returns (CapsulatedValue[] memory results) {
        results = new CapsulatedValue[](r.ops.length);
        for (uint256 i = 0; i < r.ops.length; i++) {
            Operation memory operation = r.ops[i];

            if (operation.opcode == Opcode.get_euint64) {
                results[i] = getEuint64(operation.operands[0]);
            } else if (operation.opcode == Opcode.get_ebool) {
                results[i] = getEbool(operation.operands[0]);
            } else if (operation.opcode == Opcode.get_eaddress) {
                results[i] = getEaddress(operation.operands[0]);
            } else if (operation.opcode == Opcode.rand_ebool) {
                results[i] = randEbool();
            } else if (operation.opcode == Opcode.rand_euint64) {
                results[i] = randEuint64();
            } else if (operation.opcode == Opcode.add_euint64_euint64) {
                results[i] = addEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.add_euint64_uint64) {
                results[i] = addEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.min) {
                results[i] = minEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.min_euint64_uint64) {
                results[i] = minEuint64Uint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.max) {
                results[i] = maxEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.max_euint64_uint64) {
                results[i] = maxEuint64Uint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.sub_euint64_euint64) {
                results[i] = subEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.sub_euint64_uint64) {
                results[i] = subEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.sub_uint64_euint64) {
                results[i] = subUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.eq) {
                results[i] = subUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.eq_euint64_euint64) {
                results[i] = eqEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.eq_euint64_uint64) {
                results[i] = eqEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.eq_uint64_euint64) {
                results[i] = eqUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.ne_euint64_euint64) {
                results[i] = neEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.ne_euint64_uint64) {
                results[i] = neEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.ne_uint64_euint64) {
                results[i] = neUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.ge_euint64_euint64) {
                results[i] = geEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.ge_euint64_uint64) {
                results[i] = geEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.ge_uint64_euint64) {
                results[i] = geUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.gt_euint64_euint64) {
                results[i] = gtEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.gt_euint64_uint64) {
                results[i] = gtEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.gt_uint64_euint64) {
                results[i] = gtUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.le_euint64_euint64) {
                results[i] = leEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.le_euint64_uint64) {
                results[i] = leEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.le_uint64_euint64) {
                results[i] = leUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.lt_euint64_euint64) {
                results[i] = ltEuint64(
                    getOperandEuint64(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1])
                );
            } else if (operation.opcode == Opcode.lt_euint64_uint64) {
                results[i] = ltEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.lt_uint64_euint64) {
                results[i] = ltUint64Euint64(operation.value, getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.select) {
                results[i] = selectEuint64(
                    getOperandEbool(results, operation.operands[0]),
                    getOperandEuint64(results, operation.operands[1]),
                    getOperandEuint64(results, operation.operands[2])
                );
            } else if (operation.opcode == Opcode.div_euint64_uint64) {
                results[i] = divEuint64(getOperandEuint64(results, operation.operands[0]), operation.value);
            } else if (operation.opcode == Opcode.decrypt_ebool) {
                results[i] = decryptEbool(getOperandEbool(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.decrypt_euint64) {
                results[i] = decryptEuint64(getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.decrypt_eaddress) {
                results[i] = decryptEaddress(getOperandEaddress(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.decrypt_ebool_async) {
                decryptEboolAsync(getOperandEbool(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.decrypt_euint64_async) {
                decryptEuint64Async(getOperandEuint64(results, operation.operands[0]));
            } else if (operation.opcode == Opcode.decrypt_eaddress_async) {
                decryptEaddressAsync(getOperandEaddress(results, operation.operands[0]));
            }
            // Add more cases as needed for other operations.
        }

        emit RequestResolved(r.id, results);
    }

    function executeReencryptRequest(
        ReencryptRequest memory reen_req
    ) public view onlySignedPublicKey(reen_req.publicKey, reen_req.signature) returns (bytes memory) {
        if (reen_req.target.valueType == Types.T_EBOOL) {
            return TFHE.reencrypt(asEbool(reen_req.target), reen_req.publicKey);
        } else if (reen_req.target.valueType == Types.T_EUINT64) {
            return TFHE.reencrypt(asEuint64(reen_req.target), reen_req.publicKey);
        }
        return "";
    }

    function executeSaveCiphertextRequest(SaveCiphertextRequest memory req) public {
        if (req.ciphertextType == Types.T_EBOOL) {
            ebool_store[ebool_cursor++] = TFHE.asEbool(req.ciphertext);
            emit SaveCiphertextResolved(req.id, CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL));
        } else if (req.ciphertextType == Types.T_EUINT64) {
            euint64_store[euint64_cursor++] = TFHE.asEuint64(req.ciphertext);
            emit SaveCiphertextResolved(req.id, CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64));
        } else if (req.ciphertextType == Types.T_EADDRESS) {
            eaddress_store[eaddress_cursor++] = TFHE.asEaddress(req.ciphertext);
            emit SaveCiphertextResolved(req.id, CapsulatedValue(eaddress_cursor - 1, Types.T_EADDRESS));
        }
    }

    function decryptEboolAsync(ebool cond) internal {
        ebool[] memory cts = new ebool[](1);
        cts[0] = cond;
        Oracle.requestDecryption(cts, this.decryptEboolAsyncCallback.selector, 0, block.timestamp + 100);
    }

    function decryptEboolAsyncCallback(uint256 reqId, bool decryptedInput) public onlyOracle {
        CapsulatedValue[] memory results = new CapsulatedValue[](1);
        results[0] = CapsulatedValue(decryptedInput ? 1 : 0, Types.T_BOOL);
        emit DecryptAsyncResolved(reqId, results);
    }

    function decryptEaddressAsync(eaddress cond) internal {
        eaddress[] memory cts = new eaddress[](1);
        cts[0] = cond;
        Oracle.requestDecryption(cts, this.decryptEaddressAsyncCallback.selector, 0, block.timestamp + 100);
    }

    function decryptEaddressAsyncCallback(uint256 reqId, address decryptedInput) public onlyOracle {
        CapsulatedValue[] memory results = new CapsulatedValue[](1);
        results[0] = CapsulatedValue(uint256(uint160(decryptedInput)), Types.T_ADDRESS);
        emit DecryptAsyncResolved(reqId, results);
    }

    function decryptEuint64Async(euint64 cond) internal {
        euint64[] memory cts = new euint64[](1);
        cts[0] = cond;
        Oracle.requestDecryption(cts, this.decryptEuint64AsyncCallback.selector, 0, block.timestamp + 100);
    }

    function decryptEuint64AsyncCallback(uint256 reqId, uint64 decryptedInput) public onlyOracle {
        CapsulatedValue[] memory results = new CapsulatedValue[](1);
        results[0] = CapsulatedValue(decryptedInput, Types.T_UINT64);
        emit DecryptAsyncResolved(reqId, results);
    }
}
