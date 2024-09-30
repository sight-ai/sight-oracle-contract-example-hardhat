import hre from "hardhat";

import { explainCapsulatedValue } from "./utils";

async function main() {
  const ExampleFactory = await hre.ethers.getContractFactory("Example");
  const example = await ExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  let latestReqId: string;
  target = await example.getTarget();
  console.log(`target before makeRequest: `, explainCapsulatedValue(target));

  example.once(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
    } else {
      console.error("NOT MATCHED reqId");
    }
  });
  const txResp = await example.makeRequest();
  await txResp.wait(1);
  latestReqId = await example.getLatestReqId();
}

main();
