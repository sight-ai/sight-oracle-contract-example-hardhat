import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { ORACLE_ADDR_OP_SEPOLIA } from "@sight-oracle/contracts";
import { expect } from "chai";
import hre from "hardhat";

describe("UseInlineOracleExample", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function deployUseInlineOracleExample() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const useInlineOracle = await hre.viem.deployContract("UseInlineOracleExample", []);
    const oracle = await hre.viem.getContractAt("Oracle", ORACLE_ADDR_OP_SEPOLIA);

    const publicClient = await hre.viem.getPublicClient();

    return {
      useInlineOracle,
      owner,
      oracle,
      otherAccount,
      publicClient
    };
  }

  describe("Check Oracle", function () {
    it("Should match oracle instance's addr", async function () {
      const { useInlineOracle, owner, otherAccount, publicClient } = await loadFixture(deployUseInlineOracleExample);

      expect(await useInlineOracle.read.checkOracleAddress()).to.equal(true);
    });
    it("Should match oracle instance's version", async function () {
      const { useInlineOracle, owner, otherAccount, publicClient } = await loadFixture(deployUseInlineOracleExample);

      // oracle instance not deployed at local network.
      await expect(useInlineOracle.read.checkOracleVersion()).rejectedWith("An unknown RPC error occurred.");
    });
    it("Should create a request successfully", async function () {
      const { owner, useInlineOracle, oracle, publicClient } = await loadFixture(deployUseInlineOracleExample);

      await expect(useInlineOracle.write.makeRequest()).rejectedWith("An unknown RPC error occurred.");

      /**
       * It would work at op sepolia network

      const hash = await useInlineOracle.write.makeRequest();
      await publicClient.waitForTransactionReceipt({ hash });

      // get the request sent events in the latest block
      const requestSentEvents: any = await oracle.getEvents.RequestSent();
      expect(requestSentEvents).to.have.lengthOf(1);
      expect(requestSentEvents[0].args[0]?.requester.toLowerCase()).to.equal(owner.account.address.toLowerCase());
      expect(requestSentEvents[0].args[0]?.ops.length).to.equal(1);
      const hash1 = await oracle.write.callback([requestSentEvents[0].args[0]?.id!, [{ data: 0n, valueType: 129 }]]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
      expect(((await multiStepExample.read._target()) as any).data).to.equal(0n);
       */
    });
  });
});
