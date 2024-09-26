import { exec as oldExec } from "child_process";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { promisify } from "util";

const exec = promisify(oldExec);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const Oracle = await hre.ethers.getContractFactory("@sight-oracle/contracts/Oracle/Oracle.sol:Oracle");
  const deployOracle = await Oracle.deploy();
  await deployOracle.waitForDeployment();
  console.log("Oracle deployed to:", await deployOracle.getAddress());
  const cmd = `sed -i 's#ORACLE_CONTRACT_ADDRESS=\\(.*\\)#ORACLE_CONTRACT_ADDRESS=${await deployOracle.getAddress()}#g' .env`;
  const response = await exec(cmd);
  // console.log(cmd, response);
};
export default func;
func.id = "deploy-upgradeable-evm"; // id required to prevent reexecution
func.tags = ["upgradeable-evm"];
