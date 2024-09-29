import hre from "hardhat";

import { Oracle } from "../typechain-types/@sight-oracle/contracts/Oracle/Oracle";
import { explainCapsulatedValue, sleep } from "./utils";

async function main() {
  const ExampleFactory = await hre.ethers.getContractFactory("Example");
  const example = await ExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  target = await example.getTarget();
  console.log(`target before makeRequest: `, explainCapsulatedValue(target));
  const oracle = (await hre.ethers.getContractAt(
    "@sight-oracle/contracts/Oracle/Oracle.sol:Oracle",
    process.env.ORACLE_CONTRACT_ADDRESS!
  )) as unknown as Oracle;
  oracle.connect(hre.ethers.provider);

  oracle.once(oracle.filters.RequestCallback, async (reqId, success, event) => {
    target = await example.getTarget();
    console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
  });
  const txResp = await example.makeRequest();
  await txResp.wait(1);
}

main();
