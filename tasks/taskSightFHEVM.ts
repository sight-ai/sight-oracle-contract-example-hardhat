import { exec as oldExec } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import os from "os";
import { promisify } from "util";

import { updateEnvFile } from "./taskSightEVM";

const exec = promisify(oldExec);

task("task:accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task(
  "task:deploySightFHEVM",
  "Deploy Compute Proxy Contract to SightFHEVM Chain.",
  async (_taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const ComputeProxy = await hre.ethers.getContractFactory("ComputeProxyUpgradeable");
    const deployComputeProxy = await hre.upgrades.deployProxy(ComputeProxy, ["test"]);
    await deployComputeProxy.waitForDeployment();
    console.log("ComputeProxyUpgradeable deployed to:", await deployComputeProxy.getAddress());
    updateEnvFile("COMPUTE_PROXY_CONTRACT_ADDRESS", await deployComputeProxy.getAddress());
  }
);

task(
  "task:upgradeComputeProxyToV2",
  "upgrade Compute Proxy Contract in SightFHEVM Chain.",
  async (_taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const ComputeProxy = await hre.ethers.getContractFactory("ComputeProxyUpgradeableV2");
    const deployComputeProxy = await hre.upgrades.upgradeProxy(
      process.env.COMPUTE_PROXY_CONTRACT_ADDRESS!,
      ComputeProxy
    );
    await deployComputeProxy.waitForDeployment();
    console.log("ComputeProxyUpgradeableV2 deployed to:", await deployComputeProxy.getAddress());
  }
);

task("task:deployOracle")
  .addParam("privateKey", "The deployer private key")
  .addParam("ownerAddress", "The owner address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const deployer = new ethers.Wallet(taskArguments.privateKey).connect(ethers.provider);
    const oracleFactory = await ethers.getContractFactory("OraclePredeploy");
    const oracle = await oracleFactory.connect(deployer).deploy(taskArguments.ownerAddress);
    await oracle.waitForDeployment();
    const oraclePredeployAddress = await oracle.getAddress();
    const envConfig = dotenv.parse(fs.readFileSync(".env"));
    if (oraclePredeployAddress !== envConfig.ORACLE_CONTRACT_PREDEPLOY_ADDRESS) {
      throw new Error(
        `The nonce of the deployer account is not null. Please use another deployer private key or relaunch a clean instance of the Sight`
      );
    }
    console.log("OraclePredeploy was deployed at address: ", oraclePredeployAddress);
  });

const getCoin = async (address: string) => {
  const containerName = process.env["TEST_CONTAINER_NAME"] || "sight-node";
  const response = await exec(`docker compose exec -i ${containerName} faucet ${address} | grep height`);
  const res = JSON.parse(response.stdout);
  if (res.raw_log.match("account sequence mismatch")) await getCoin(address);
};

task("task:computePredeployAddress")
  .addParam("privateKey", "The deployer private key")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const deployerAddress = new ethers.Wallet(taskArguments.privateKey).address;
    const oraclePredeployAddressPrecomputed = ethers.getCreateAddress({
      from: deployerAddress,
      nonce: 0 // deployer is supposed to have nonce 0 when deploying OraclePredeploy
    });
    updateEnvFile("ORACLE_CONTRACT_PREDEPLOY_ADDRESS", oraclePredeployAddressPrecomputed);

    const solidityTemplate = `// SPDX-License-Identifier: MIT
  
  pragma solidity ^0.8.20;
  
  address constant ORACLE_CONTRACT_PREDEPLOY_ADDRESS = ${oraclePredeployAddressPrecomputed};
          `;

    try {
      fs.writeFileSync(
        "./node_modules/@sight-oracle/internal-contracts/ComputeProxy/oracle/lib/PredeployAddress.sol",
        solidityTemplate,
        {
          encoding: "utf8",
          flag: "w"
        }
      );
      console.log(
        "node_modules/@sight-oracle/internal-contracts/ComputeProxy/oracle/lib/PredeployAddress.sol file has been generated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to write node_modules/@sight-oracle/internal-contracts/ComputeProxy/oracle/lib/PredeployAddress.sol",
        error
      );
    }
  });

task("task:addRelayer")
  .addParam("privateKey", "The owner private key")
  .addParam("oracleAddress", "The OraclePredeploy address")
  .addParam("relayerAddress", "The relayer address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const codeAtAddress = await ethers.provider.getCode(taskArguments.oracleAddress);
    if (codeAtAddress === "0x") {
      throw Error(`${taskArguments.oracleAddress} is not a smart contract`);
    }
    const owner = new ethers.Wallet(taskArguments.privateKey).connect(ethers.provider);
    const oracle = await ethers.getContractAt("OraclePredeploy", taskArguments.oracleAddress, owner);
    const tx = await oracle.addRelayer(taskArguments.relayerAddress);
    const rcpt = await tx.wait();
    if (rcpt!.status === 1) {
      console.log(`Account ${taskArguments.relayerAddress} was succesfully added as an oracle relayer`);
    } else {
      console.log("Adding relayer failed");
    }
  });

task("task:removeRelayer")
  .addParam("privateKey", "The owner private key")
  .addParam("oracleAddress", "The OraclePredeploy address")
  .addParam("relayerAddress", "The relayer address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const codeAtAddress = await ethers.provider.getCode(taskArguments.oracleAddress);
    if (codeAtAddress === "0x") {
      throw Error(`${taskArguments.oracleAddress} is not a smart contract`);
    }
    const owner = new ethers.Wallet(taskArguments.privateKey).connect(ethers.provider);
    const oracle = await ethers.getContractAt("OraclePredeploy", taskArguments.oracleAddress, owner);
    const tx = await oracle.removeRelayer(taskArguments.relayerAddress);
    const rcpt = await tx.wait();
    if (rcpt!.status === 1) {
      console.log(`Account ${taskArguments.relayerAddress} was succesfully removed from authorized relayers`);
    } else {
      console.log("Removing relayer failed");
    }
  });

task("task:launchSightFHEVM").setAction(async function (taskArgs, hre) {
  const privKeyDeployer = process.env.PRIVATE_KEY_ORACLE_DEPLOYER;
  const privKeyOwner = process.env.PRIVATE_KEY_ORACLE_OWNER;
  const privKeyRelayer = process.env.PRIVATE_KEY_ORACLE_RELAYER;
  const deployerAddress = new hre.ethers.Wallet(privKeyDeployer!).address;
  const ownerAddress = new hre.ethers.Wallet(privKeyOwner!).address;
  const relayerAddress = new hre.ethers.Wallet(privKeyRelayer!).address;
  const p1 = getCoin(deployerAddress);
  const p2 = getCoin(ownerAddress);
  const p3 = getCoin(relayerAddress);
  await Promise.all([p1, p2, p3]);
  await new Promise((res) => setTimeout(res, 5000)); // wait 5 seconds
  await hre.run("task:deployOracle", { privateKey: privKeyDeployer, ownerAddress: ownerAddress });

  const parsedEnv = dotenv.parse(fs.readFileSync(".env"));
  const oraclePredeployAddress = parsedEnv.ORACLE_CONTRACT_PREDEPLOY_ADDRESS;

  await hre.run("task:addRelayer", {
    privateKey: privKeyOwner,
    oracleAddress: oraclePredeployAddress,
    relayerAddress: relayerAddress
  });
});

task("task:getBalances").setAction(async function (taskArgs, hre) {
  const privKeyDeployer = process.env.PRIVATE_KEY_ORACLE_DEPLOYER;
  const privKeyOwner = process.env.PRIVATE_KEY_ORACLE_OWNER;
  const privKeyRelayer = process.env.PRIVATE_KEY_ORACLE_RELAYER;
  const deployerAddress = new hre.ethers.Wallet(privKeyDeployer!).address;
  const ownerAddress = new hre.ethers.Wallet(privKeyOwner!).address;
  const relayerAddress = new hre.ethers.Wallet(privKeyRelayer!).address;
  console.log(
    deployerAddress.slice(0, 5) + "..." + deployerAddress.slice(-3, deployerAddress.length),
    await hre.ethers.provider.getBalance(deployerAddress),
    `deployerAddress`
  );
  console.log(
    ownerAddress.slice(0, 5) + "..." + ownerAddress.slice(-3, deployerAddress.length),
    await hre.ethers.provider.getBalance(ownerAddress),
    `ownerAddress`
  );
  console.log(
    relayerAddress.slice(0, 5) + "..." + relayerAddress.slice(-3, deployerAddress.length),
    await hre.ethers.provider.getBalance(relayerAddress),
    `relayerAddress`
  );
});

task("task:checkTxReceipt")
  .addParam("hash", "the tx hash.")
  .setAction(async function (taskArgs, hre) {
    const txRcpt = await hre.ethers.provider.getTransactionReceipt(taskArgs.hash);
    console.log(txRcpt, txRcpt?.logs);
  });
