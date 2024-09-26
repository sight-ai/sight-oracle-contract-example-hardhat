import hre from "hardhat";

import { explainCapsulatedValue, sleep } from "./utils";

async function main() {
  const ExampleFactory = await hre.ethers.getContractFactory("Example");
  const example = await ExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  target = await example.getTarget();
  console.log(`target before makeRequest: `, explainCapsulatedValue(target));
  const txResp = await example.makeRequest();
  await txResp.wait(1);
  await sleep(25e3);
  target = await example.getTarget();
  console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
}

main();
