import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

import { FHE } from "../utils/fhe-instance";

let publicKey: string = process.env.FHE_PUBLIC_KEY!;
let chainId: number = +process.env.FHE_CHAINID!;
let fheAddress: string = process.env.FHE_ADDRESS!;

describe("EncryptExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployEncryptExample() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const oracle = await hre.viem.deployContract("Oracle");
    const encrypt = await hre.viem.deployContract("EncryptExample", [oracle.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      oracle,
      encrypt,
      owner,
      otherAccount,
      publicClient
    };
  }

  describe("Make EncryptExample Request", function () {
    it("Should be able to save ciphertext for specify type from client", async function () {
      const { owner, encrypt, oracle, publicClient } = await loadFixture(deployEncryptExample);
      this.fheInstance = new FHE({
        chainId,
        publicKey,
        ethers,
        account: owner,
        contractAddress: fheAddress
      });

      const ciphertext = this.fheInstance.encrypt64(1e10);

      const hash = await encrypt.write.encryptEuint64([ethers.hexlify(ciphertext), 129]);
      await publicClient.waitForTransactionReceipt({ hash });

      // get the request sent events in the latest block
      const saveCiphertextSentEvents: any = await oracle.getEvents.SaveCiphertextSent();
      expect(saveCiphertextSentEvents).to.have.lengthOf(1);
      expect(saveCiphertextSentEvents[0].args[0]?.requester.toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
      expect(saveCiphertextSentEvents[0].args[0]?.ciphertextType).to.equal(129);
      const hash1 = await oracle.write.saveCiphertextCallback([
        saveCiphertextSentEvents[0].args[0]?.id!,
        { data: 0n, valueType: 129 }
      ]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
      const result: any = await encrypt.read.result();
      expect(result.valueType === 129n, "result valueType not matched.");
      expect(result.data === BigInt(0), "result data not matched.");
    });
  });
});
