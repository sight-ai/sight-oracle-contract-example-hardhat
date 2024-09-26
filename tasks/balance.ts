import { formatUnits } from "ethers";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:getEthOfAddr", "get raw assets from a network")
  .addParam("address", "account")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, network } = hre;
    const balance = await ethers.provider.getBalance(taskArguments.address);
    const balance_eth = formatUnits(balance, 18);
    console.log(`${taskArguments.address} owns ${balance_eth} ETHs on ${network.name}`);
  });
