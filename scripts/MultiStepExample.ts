import hre from "hardhat";

import { Oracle } from "../typechain-types/@sight-oracle/contracts/Oracle/Oracle";
import { sleep } from "./utils";

async function main() {
  const MultiStepExampleFactory = await hre.ethers.getContractFactory("MultiStepExample");
  const example = await MultiStepExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  target = await example.getTarget();
  console.log(`target(euint64) before createRandomTarget: `, target, "(uninitialized)");
  const oracle = (await hre.ethers.getContractAt(
    "@sight-oracle/contracts/Oracle/Oracle.sol:Oracle",
    process.env.ORACLE_CONTRACT_ADDRESS!
  )) as unknown as Oracle;
  oracle.connect(hre.ethers.provider);

  oracle.once(oracle.filters.RequestCallback, async (reqId, success, event) => {
    target = await example.getTarget();
    console.log(`target(euint64) after Oracle make callback: `, target);
  });
  const txResp = await example.createRandomTarget();
  await txResp.wait(1);
  await sleep(25e3);

  console.log(`target(euint64) before makeComputation: `, target);
  oracle.once(oracle.filters.RequestCallback, async (reqId, success, event) => {
    target = await example.getTarget();
    console.log(`target(euint64) after Oracle make callback: `, target);
  });
  const txResp1 = await example.makeComputation(100);
  await txResp1.wait(1);
}

main();
