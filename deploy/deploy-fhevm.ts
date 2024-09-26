import { exec as oldExec } from "child_process";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { promisify } from "util";

const exec = promisify(oldExec);

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const ComputeProxy = await hre.ethers.getContractFactory("ComputeProxyUpgradeable");
  const deployComputeProxy = await hre.upgrades.deployProxy(ComputeProxy);
  await deployComputeProxy.waitForDeployment();
  console.log("ComputeProxyUpgradeable deployed to:", await deployComputeProxy.getAddress());
  const cmd = `sed -i 's#COMPUTE_PROXY_CONTRACT_ADDRESS=\\(.*\\)#COMPUTE_PROXY_CONTRACT_ADDRESS=${await deployComputeProxy.getAddress()}#g' .env`;
  const response = await exec(cmd);
  // console.log(cmd, response);
};
export default func;
func.id = "deploy-upgradeable-fhevm"; // id required to prevent reexecution
func.tags = ["upgradeable-fhevm"];
