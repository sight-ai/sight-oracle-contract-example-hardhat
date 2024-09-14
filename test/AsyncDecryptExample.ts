import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("AsyncDecryptExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployAsyncDecryptExample() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const oracle = await hre.viem.deployContract("Oracle");
    const asyncDecrypt = await hre.viem.deployContract("AsyncDecryptExample", [oracle.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      oracle,
      asyncDecrypt,
      owner,
      otherAccount,
      publicClient
    };
  }

  describe("Make AsyncDecryptExample Request", function () {
    it("Should be able to asyncDecrypt a random euint64", async function () {
      const { owner, asyncDecrypt, oracle, publicClient } = await loadFixture(deployAsyncDecryptExample);

      const hash = await asyncDecrypt.write.asyncDecryptRandomEuint64();
      await publicClient.waitForTransactionReceipt({ hash });

      // get the request sent events in the latest block
      const requestSentEvents: any = await oracle.getEvents.RequestSent();
      expect(requestSentEvents).to.have.lengthOf(1);
      expect(requestSentEvents[0].args[0]?.requester.toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect(requestSentEvents[0].args[0]?.ops.length).to.equal(2);
      const hash1 = await oracle.write.callback([
        requestSentEvents[0].args[0]?.id!,
        [
          { data: 0n, valueType: 129 },
          { data: BigInt(1e10), valueType: 2 }
        ]
      ]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
      const result: any = await asyncDecrypt.read.result();
      expect(result.valueType === 2n, "result valueType not matched.");
      expect(result.data === BigInt(1e10), "result data not matched.");
    });
  });
});
