import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("MultiStepExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployMultiStepExample() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const oracle = await hre.viem.deployContract("Oracle");
    const multiStepExample = await hre.viem.deployContract("MultiStepExample", [oracle.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      oracle,
      multiStepExample,
      owner,
      otherAccount,
      publicClient
    };
  }

  describe("Make Request", function () {
    it("Should create a request successfully", async function () {
      const { multiStepExample, owner, oracle, publicClient } = await loadFixture(deployMultiStepExample);

      const hash = await multiStepExample.write.makeComputation([BigInt(100_000)]);
      await publicClient.waitForTransactionReceipt({ hash });
      const requestSentEvents: any = await oracle.getEvents.RequestSent();
      expect(requestSentEvents).to.have.lengthOf(1);
      expect(requestSentEvents[0].args[0]?.requester.toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect(requestSentEvents[0].args[0]?.ops.length).to.equal(2);
      const hash1 = await oracle.write.callback([
        requestSentEvents[0].args[0]?.id!,
        [
          { data: 0n, valueType: 129 },
          { data: 1n, valueType: 129 }
        ]
      ]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
    });
    it("Should create a request for a random target successfully", async function () {
      const { multiStepExample, owner, oracle, publicClient } = await loadFixture(deployMultiStepExample);

      const hash = await multiStepExample.write.createRandomTarget();
      await publicClient.waitForTransactionReceipt({ hash });
      const requestSentEvents: any = await oracle.getEvents.RequestSent();
      expect(requestSentEvents).to.have.lengthOf(1);
      expect(requestSentEvents[0].args[0]?.requester.toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect(requestSentEvents[0].args[0]?.ops.length).to.equal(1);
      const hash1 = await oracle.write.callback([requestSentEvents[0].args[0]?.id!, [{ data: 0n, valueType: 129 }]]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
      expect(await multiStepExample.read.getTarget()).to.equal(0n);
    });
  });
});
