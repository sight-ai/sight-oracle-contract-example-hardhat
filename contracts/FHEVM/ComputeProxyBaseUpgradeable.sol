// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "fhevm/lib/TFHE.sol";
import "./ReencryptUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Opcode, Types, CapsulatedValue } from "@sight-oracle/contracts/Oracle/Types.sol";

contract ComputeProxyBaseUpgradeable is ReencryptUpgradeable, Ownable2StepUpgradeable {
    mapping(uint256 => euint64) euint64_store;
    mapping(uint256 => ebool) ebool_store;
    mapping(uint256 => eaddress) eaddress_store;
    uint[100] __gap_etype_store;

    uint256 euint64_cursor;
    uint256 ebool_cursor;
    uint256 eaddress_cursor;
    uint[100] __gap_etype_cursor;

    function getOperandEuint64(CapsulatedValue[] memory results, uint256 index) internal view returns (euint64) {
        CapsulatedValue memory operand = results[index];
        require(operand.valueType == Types.T_EUINT64, "Operand is not an euint64");
        return euint64_store[operand.data];
    }

    function getOperandEbool(CapsulatedValue[] memory results, uint256 index) internal view returns (ebool) {
        CapsulatedValue memory operand = results[index];
        require(operand.valueType == Types.T_EBOOL, "Operand is not an ebool");
        return ebool_store[operand.data];
    }

    function getOperandEaddress(CapsulatedValue[] memory results, uint256 index) internal view returns (eaddress) {
        CapsulatedValue memory operand = results[index];
        require(operand.valueType == Types.T_EADDRESS, "Operand is not an eaddress");
        return eaddress_store[operand.data];
    }

    function getEuint64(uint256 index) internal view returns (CapsulatedValue memory) {
        require(euint64.unwrap(euint64_store[index]) != 0, "data not exist");
        return CapsulatedValue(index, Types.T_EUINT64);
    }

    function getEbool(uint256 index) internal view returns (CapsulatedValue memory) {
        require(ebool.unwrap(ebool_store[index]) != 0, "data not exist");
        return CapsulatedValue(index, Types.T_EBOOL);
    }

    function getEaddress(uint256 index) internal view returns (CapsulatedValue memory) {
        require(eaddress.unwrap(eaddress_store[index]) != 0, "data not exist");
        return CapsulatedValue(index, Types.T_EADDRESS);
    }

    function randEuint64() internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.randEuint64();
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function randEbool() internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ge(TFHE.randEuint8(), TFHE.randEuint8());
        return CapsulatedValue(euint64_cursor - 1, Types.T_EBOOL);
    }

    function addEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.add(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function addEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.add(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function divEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.div(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function subEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.sub(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function subEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.sub(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function subUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.sub(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function eqEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.eq(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function eqEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.eq(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function eqUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.eq(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function neEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ne(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function neEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ne(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function neUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ne(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function geEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ge(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function geEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ge(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function geUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.ge(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function gtEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.gt(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function gtEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.gt(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function gtUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.gt(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function leEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.le(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function leEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.le(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function leUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.le(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function ltEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.lt(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function ltEuint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.lt(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function ltUint64Euint64(uint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        ebool_store[ebool_cursor++] = TFHE.lt(a, b);
        return CapsulatedValue(ebool_cursor - 1, Types.T_EBOOL);
    }

    function minEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.min(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function minEuint64Uint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.min(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function maxEuint64(euint64 a, euint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.max(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function maxEuint64Uint64(euint64 a, uint64 b) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.max(a, b);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function selectEuint64(ebool cond, euint64 value1, euint64 value2) internal returns (CapsulatedValue memory) {
        euint64_store[euint64_cursor++] = TFHE.select(cond, value1, value2);
        return CapsulatedValue(euint64_cursor - 1, Types.T_EUINT64);
    }

    function decryptEbool(ebool cond) internal view returns (CapsulatedValue memory) {
        bool result = TFHE.decrypt(cond);
        return CapsulatedValue(result ? 1 : 0, Types.T_BOOL);
    }

    function decryptEaddress(eaddress cond) internal view returns (CapsulatedValue memory) {
        address result = TFHE.decrypt(cond);
        return CapsulatedValue(uint256(uint160(result)), Types.T_ADDRESS);
    }

    function decryptEuint64(euint64 cond) internal view returns (CapsulatedValue memory) {
        uint64 result = TFHE.decrypt(cond);
        return CapsulatedValue(result, Types.T_UINT64);
    }

    function asBool(CapsulatedValue memory capsulatedValue) internal pure returns (bool) {
        require(capsulatedValue.valueType == Types.T_BOOL, "Invalid valueType for Bool");
        return (capsulatedValue.data % 2) == 1;
    }

    function asUint64(CapsulatedValue memory capsulatedValue) internal pure returns (uint64) {
        require(capsulatedValue.valueType == Types.T_UINT64, "Invalid valueType for Uint64");
        return uint64(capsulatedValue.data);
    }

    function asAddress(CapsulatedValue memory capsulatedValue) internal pure returns (address) {
        require(capsulatedValue.valueType == Types.T_ADDRESS, "Invalid valueType for address");
        return address(uint160(capsulatedValue.data));
    }

    function asEbool(CapsulatedValue memory capsulatedValue) internal view returns (ebool) {
        require(capsulatedValue.valueType == Types.T_EBOOL, "Invalid valueType for Ebool");
        return ebool_store[capsulatedValue.data];
    }

    function asEuint64(CapsulatedValue memory capsulatedValue) internal view returns (euint64) {
        require(capsulatedValue.valueType == Types.T_EUINT64, "Invalid valueType for Euint64");
        return euint64_store[capsulatedValue.data];
    }

    function asEaddress(CapsulatedValue memory capsulatedValue) internal view returns (eaddress) {
        require(capsulatedValue.valueType == Types.T_EADDRESS, "Invalid valueType for Eaddress");
        return eaddress_store[capsulatedValue.data];
    }
}
