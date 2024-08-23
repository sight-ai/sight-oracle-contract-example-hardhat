import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

import { FHE } from "../utils/fhe-instance";

let publicKey: string = process.env.FHE_PUBLIC_KEY!;
let chainId: number = +process.env.FHE_CHAINID!;
let fheAddress: string = process.env.FHE_ADDRESS!;

describe("ReencryptExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployReencryptExample() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const oracle = await hre.viem.deployContract("Oracle");
    const reencrypt = await hre.viem.deployContract("ReencryptExample", [oracle.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      oracle,
      reencrypt,
      owner,
      otherAccount,
      publicClient
    };
  }

  describe("Make ReencryptExample Request", function () {
    it("Should be able to reencrypt from the fhe end.", async function () {
      const { owner, reencrypt, oracle, publicClient } = await loadFixture(deployReencryptExample);
      this.fheInstance = new FHE({
        chainId,
        publicKey,
        ethers,
        account: owner,
        contractAddress: fheAddress
      });

      const token = this.fheInstance.getPublicKey(fheAddress)!;

      const hash = await reencrypt.write.reencryptEuint64([[0, 129], ethers.hexlify(token.publicKey), token.signature]);
      await publicClient.waitForTransactionReceipt({ hash });

      // get the request sent events in the latest block
      const ReencryptExampleSentEvents: any = await oracle.getEvents.ReencryptExampleSent();
      expect(ReencryptExampleSentEvents).to.have.lengthOf(1);
      expect(ReencryptExampleSentEvents[0].args[0]?.requester.toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
      expect(ReencryptExampleSentEvents[0].args[0]?.target.data).to.equal(0n);
      expect(ReencryptExampleSentEvents[0].args[0]?.target.valueType).to.equal(129);
      expect(ReencryptExampleSentEvents[0].args[0]?.publicKey).to.equal(ethers.hexlify(token.publicKey));
      expect(ReencryptExampleSentEvents[0].args[0]?.signature).to.equal(ethers.hexlify(token.signature));
      const hash1 = await oracle.write.reencryptCallback([ReencryptExampleSentEvents[0].args[0]?.id!, "0x01"]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
      const encryptedResultByPublickey: any = await reencrypt.read.result();
      expect(encryptedResultByPublickey === "0x01", "result not matched.");
      let decrypt_result = this.fheInstance.decrypt(fheAddress, encryptedResultByPublickey);
      expect(decrypt_result).to.equal(1n);
    });
  });
});
