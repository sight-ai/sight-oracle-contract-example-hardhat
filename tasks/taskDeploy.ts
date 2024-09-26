import dotenv from "dotenv";
import fs from "fs";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

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
        `The nonce of the deployer account is not null. Please use another deployer private key or relaunch a clean instance of the fhEVM`
      );
    }
    console.log("OraclePredeploy was deployed at address: ", oraclePredeployAddress);
  });
