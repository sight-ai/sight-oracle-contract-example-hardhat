import hre from "hardhat";

import { sleep } from "./utils";

async function main() {
  const MultiStepExampleFactory = await hre.ethers.getContractFactory("MultiStepExample");
  const example = await MultiStepExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  target = await example.getTarget();
  console.log(`target(euint64) before createRandomTarget: `, target, "(uninitialized)");
  const txResp = await example.createRandomTarget();
  await txResp.wait(1);
  await sleep(25e3);
  target = await example.getTarget();
  console.log(`target(euint64) after Oracle make callback: `, target);
  console.log(`target(euint64) before makeComputation: `, target);
  const txResp1 = await example.makeComputation(100);
  await txResp1.wait(1);
  await sleep(25e3);
  target = await example.getTarget();
  console.log(`target(euint64) after Oracle make callback: `, target);
}

main();
