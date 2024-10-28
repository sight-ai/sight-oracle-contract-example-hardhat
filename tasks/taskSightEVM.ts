import { exec as oldExec } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { promisify } from "util";

const exec = promisify(oldExec);

task(
  "task:deploySightEVM",
  "Deploy Oracle Contract to EVM Chain.",
  async (_taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const Oracle = await hre.ethers.getContractFactory("@sight-oracle/contracts/Oracle/Oracle.sol:Oracle");
    const deployOracle = await Oracle.deploy();
    await deployOracle.waitForDeployment();
    console.log("Oracle deployed to:", await deployOracle.getAddress());
    const cmd = `sed -i 's#ORACLE_CONTRACT_ADDRESS=\\(.*\\)#ORACLE_CONTRACT_ADDRESS=${await deployOracle.getAddress()}#g' .env`;
    const response = await exec(cmd);
    // console.log(cmd, response);
  }
);

task(
  "task:randomMnemonic",
  "Generate a random Mnemonic as user's mnemonic.",
  async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const name = taskArgs.name;
    const mnemonic = hre.ethers.Mnemonic.entropyToPhrase(hre.ethers.randomBytes(32));
    console.log(`Generated a Random Mnemonic to .env ${name} field.`);
    const cmd = `sed -i 's#\\b${name}=\\(.*\\)#${name}="${mnemonic}"#g' .env`;
    const response = await exec(cmd);
    // console.log(cmd, response);
  }
).addParam("name", "which Mnemonic Field.");

task(
  "task:fundMnemonicEVM",
  "Fund a Mnemonic's account'",
  async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const name = taskArgs.name;
    const account_idx = taskArgs.index;
    const envConfig = dotenv.parse(fs.readFileSync(".env"));
    const from_mnemonic = hre.ethers.Mnemonic.fromPhrase(envConfig["ORACLE_CHAIN_MNEMONIC"]);
    const from_wallet = hre.ethers.HDNodeWallet.fromMnemonic(from_mnemonic, `m/44'/60'/0'/0`).connect(
      hre.ethers.provider
    );
    const from = from_wallet.deriveChild(0);
    const to_mnemonic = hre.ethers.Mnemonic.fromPhrase(envConfig[name]);
    const to_wallet = hre.ethers.HDNodeWallet.fromMnemonic(to_mnemonic, `m/44'/60'/0'/0`).connect(hre.ethers.provider);
    const to = to_wallet.deriveChild(account_idx);
    if (to.address !== from.address) {
      console.log(
        `${from.address}: ${hre.ethers.formatUnits(await hre.ethers.provider.getBalance(from.address), "ether")} ETHs.`
      );
      console.log(
        `${to.address}: ${hre.ethers.formatUnits(await hre.ethers.provider.getBalance(to.address), "ether")} ETHs.`
      );
      const txResp = await from.sendTransaction({
        to: to.address,
        value: hre.ethers.parseEther("10")
      });
      await txResp.wait(1);
      console.log("after fund:");
    }
    console.log(
      `${from.address}: ${hre.ethers.formatUnits(await hre.ethers.provider.getBalance(from.address), "ether")} ETHs.`
    );
    console.log(
      `${to.address}: ${hre.ethers.formatUnits(await hre.ethers.provider.getBalance(to.address), "ether")} ETHs.`
    );
  }
)
  .addParam("name", "which Mnemonic Field.")
  .addParam("index", "which account from Mnemonic.");
