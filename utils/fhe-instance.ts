import { toBufferBE } from "bigint-buffer";
import { ethers as hethers } from "hardhat";
import { WalletClient } from "viem";

export class FHE {
  private_key: string | undefined;
  constructor(params: {
    chainId: number;
    publicKey: string;
    contractAddress: string;
    account: WalletClient;
    ethers: typeof hethers;
  }) {
    this.generatePublicKey(params.contractAddress, params.account);
  }
  decrypt(publiKey: string, ciphertext: string) {
    return BigInt(ciphertext);
  }
  encrypt64(uint: number | bigint) {
    return createUintToUint8ArrayFunction(64)(uint);
  }
  generatePublicKey(contractAddress: string, signer: WalletClient) {
    this.private_key = "";
  }
  getPublicKey(contractAddress: string): { publicKey: string; signature: string } {
    return { publicKey: "0x" + "0".repeat(64), signature: "0x0000000000" };
  }
}

function createUintToUint8ArrayFunction(numBits: number) {
  const numBytes = Math.ceil(numBits / 8);
  return function (uint: number | bigint) {
    const buffer = toBufferBE(BigInt(uint), numBytes);
    return buffer;
  };
}
