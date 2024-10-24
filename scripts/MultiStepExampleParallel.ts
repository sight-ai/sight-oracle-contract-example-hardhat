import hre from "hardhat";

import { MultiStepExample } from "../typechain-types/contracts/MultiStepExample";
import { sleep } from "./utils";

async function main() {
  const accounts = await hre.ethers.getSigners();
  const account = accounts[+process.env.idx!];
  const MultiStepExampleFactory = await hre.ethers.getContractFactory("MultiStepExample", account);
  const exampleDeploy = await MultiStepExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await exampleDeploy.waitForDeployment();
  console.log(`Contract Deployed At: ${await exampleDeploy.getAddress()}`);

  let target: any;
  let latestReqId: string;
  const example = exampleDeploy.connect(account) as MultiStepExample;
  target = await example.getTarget();
  const nonce = await account.getNonce();
  console.log(`${account.address}'s nonce: ${await account.getNonce()}`);
  console.log(`target(euint64) before createRandomTarget: `, target, "(uninitialized)");
  const txResp = await example.createRandomTarget({ nonce });
  await txResp.wait(1);
  console.log(`${account.address}'s nonce: ${await account.getNonce()}`);
  latestReqId = await example.getLatestReqId();
  example.once(example.filters.OracleCallback(latestReqId), async (event: any) => {
    if (latestReqId === event.args[0]) {
      target = await example.getTarget();
      console.log(`target(euint64) after createRandomTarget Oracle make callback: `, target);
    } else {
      console.error(`NOT MATCHED reqId ${latestReqId} ${event.args[0]}`);
    }
  });
  // await sleep(25e3);
  while ((target = await example.getTarget()) == 0n) {
    await sleep(5e3);
  }

  console.log(`target(euint64) before makeComputation: `, target);
  const txResp1 = await example.makeComputation(100);
  await txResp1.wait(1);
  console.log(`${account.address}'s nonce: ${await account.getNonce()}`);
  latestReqId = await example.getLatestReqId();
  example.once(example.filters.OracleCallback(latestReqId), async (event: any) => {
    const reqId = example.interface.parseLog(event.log)!.args.reqId;
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target(euint64) after makeComputation Oracle make callback: `, target);
    } else {
      console.error(`NOT MATCHED reqId ${latestReqId} ${reqId}`);
    }
  });
}

main();
