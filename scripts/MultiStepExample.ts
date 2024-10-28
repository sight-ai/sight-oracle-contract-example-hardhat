import hre from "hardhat";

import { sleep } from "./utils";

async function main() {
  const MultiStepExampleFactory = await hre.ethers.getContractFactory("MultiStepExample");
  const example = await MultiStepExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  let latestReqId: string;
  target = await example.getTarget();
  console.log(`target(euint64) before createRandomTarget: `, target, "(uninitialized)");

  example.once(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target(euint64) after Oracle make callback: `, target);
    } else {
      console.error("NOT MATCHED reqId");
    }
  });
  const txResp = await example.createRandomTarget();
  await txResp.wait(1);
  latestReqId = await example.getLatestReqId();
  await sleep(25e3);

  console.log(`target(euint64) before makeComputation: `, target);
  example.once(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target(euint64) after Oracle make callback: `, target);
    } else {
      console.error("NOT MATCHED reqId");
    }
  });
  const txResp1 = await example.makeComputation(100);
  await txResp1.wait(1);
  latestReqId = await example.getLatestReqId();
}

main();
