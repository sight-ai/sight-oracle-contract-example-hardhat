import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import { config as dotenvConfig } from "dotenv";
import "hardhat-deploy";
import type { HardhatUserConfig } from "hardhat/config";
import path from "path";

import "./tasks";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: path.resolve(__dirname, dotenvConfigPath) });

const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none"
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800
      }
    }
  },
  defaultNetwork: "localEVM",
  networks: {
    localEVM: {
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0"
      },
      chainId: +process.env.ORACLE_CHAIN_ID!,
      url: "http://localhost:18545" // process.env.ORACLE_CHAIN_RPC_URL! // if execute environment is compose's service
    },
    localFHEVM: {
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0"
      },
      chainId: +process.env.COMPUTE_PROXY_CHAIN_ID!,
      url: "http://localhost:8545" // process.env.COMPUTE_PROXY_CHAIN_RPC_URL!
    }
  },
  namedAccounts: {
    deployer: 0
  },
  mocha: {
    timeout: 500000
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
  ignition: {
    requiredConfirmations: 1
  }
};

export default config;
