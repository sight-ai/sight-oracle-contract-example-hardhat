import { exec as oldExec } from "child_process";
import dotenv from "dotenv";
import fs from "fs";
import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import path from "path";
import { promisify } from "util";

const exec = promisify(oldExec);

/**
 * Updates a specific key in the .env file with the provided value.
 * If the key does not exist, it adds the key-value pair.
 *
 * @param key - The environment variable key to update.
 * @param value - The value to set for the key.
 */
export const updateEnvFile = (key: string, value: string): void => {
  const envPath = path.resolve(process.cwd(), ".env");
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error(`.env file not found at path: ${envPath}`);
    process.exit(1);
  }
  // Create a timestamped backup of the original .env file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.resolve(process.cwd(), `.env.backup.${timestamp}`);
  fs.copyFileSync(envPath, backupPath);
  console.log(`Backup of .env created at ${backupPath}`);
  // Parse the existing .env file
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  // Update the specified key with the new value
  envConfig[key] = value;
  // Convert the updated config back to string
  const updatedEnv = Object.entries(envConfig)
    .map(([envKey, envValue]) => {
      if (envValue.trim().includes(" ")) {
        return `${envKey}="${envValue.trim()}"`;
      } else {
        return `${envKey}=${envValue}`;
      }
    })
    .join("\n");
  // Write the updated config back to the .env file
  fs.writeFileSync(envPath, updatedEnv);
  console.log(`Successfully updated the ${key} field in .env.`);
};

task(
  "task:deploySightEVM",
  "Deploy Oracle Contract to EVM Chain.",
  async (_taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    const Oracle = await hre.ethers.getContractFactory("@sight-oracle/contracts/Oracle/Oracle.sol:Oracle");
    const deployOracle = await Oracle.deploy();
    await deployOracle.waitForDeployment();
    const oracleAddress = await deployOracle.getAddress();
    console.log("Oracle deployed to:", oracleAddress);
    updateEnvFile("ORACLE_CONTRACT_ADDRESS", oracleAddress);
    const envConfig = dotenv.parse(fs.readFileSync(".env"));
    const callers_count = +envConfig["ORACLE_CHAIN_MNEMONIC_COUNT"];
    const accounts = await hre.ethers.getSigners();
    const accounts_addrs = accounts.slice(0, callers_count).map((account) => account.address);
    const txResp = await deployOracle.addCallers(accounts_addrs);
    const txRcpt = await txResp.wait();
    if (txRcpt.status === 1) {
      console.log(JSON.stringify(accounts_addrs), "are the Oracle's caller.");
    } else {
      console.log(JSON.stringify(accounts_addrs), "failed to be the Oracle's caller.");
    }
  }
);

task(
  "task:randomMnemonic",
  "Generate a random Mnemonic as user's mnemonic.",
  async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment) => {
    try {
      const name = taskArgs.name;
      const mnemonic = hre.ethers.Mnemonic.entropyToPhrase(hre.ethers.randomBytes(32));
      console.log(`Generated a Random Mnemonic for the ${name} field.`);
      // Update the .env file with the new mnemonic
      updateEnvFile(name, `"${mnemonic}"`);
      console.log(`Successfully updated the ${name} field in .env.`);
    } catch (error) {
      console.error(`Error in task:randomMnemonic - ${(error as Error).message}`);
      process.exit(1);
    }
  }
).addParam("name", "Which Mnemonic Field.", undefined, types.string);

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
