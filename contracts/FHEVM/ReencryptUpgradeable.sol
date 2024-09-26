// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

abstract contract ReencryptUpgradeable is EIP712Upgradeable {
    modifier onlySignedPublicKey(bytes32 publicKey, bytes memory signature) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(keccak256("Reencrypt(bytes32 publicKey)"), publicKey)));
        address signer = ECDSA.recover(digest, signature);
        require(signer == msg.sender, "EIP712 signer and transaction signer do not match");
        _;
    }
}
