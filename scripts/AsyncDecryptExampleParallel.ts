import hre from "hardhat";

import { AsyncDecryptExample } from "../typechain-types/contracts/AsyncDecryptExample";
import { explainCapsulatedValue } from "./utils";

async function main() {
  const accounts = await hre.ethers.getSigners();
  const account = accounts[+process.env.idx!];
  const AsyncDecryptExampleFactory = await hre.ethers.getContractFactory("AsyncDecryptExample", account);
  const exampleDeploy = await AsyncDecryptExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await exampleDeploy.waitForDeployment();
  console.log(`Contract Deployed At: ${await exampleDeploy.getAddress()}`);
  let result: any;
  let results: any[];
  let latestReqId: string;

  const example = exampleDeploy.connect(account) as AsyncDecryptExample;
  result = await example.result();
  results = await example.getResults();
  console.log(`${account.address}'s nonce: ${await account.getNonce()}`);
  console.log(`result before asyncDecryptRandomEuint64: `, explainCapsulatedValue(result));
  console.log(
    `results before asyncDecryptRandomEuint64: `,
    results.map((result) => explainCapsulatedValue(result))
  );

  example.once(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      result = await example.result();
      results = await example.getResults();
      console.log(`result after asyncDecryptRandomEuint64: `, explainCapsulatedValue(result));
      console.log(
        `results after asyncDecryptRandomEuint64: `,
        results.map((result: [bigint, bigint]) => explainCapsulatedValue(result))
      );
      if ((results[1].data + results[5].data) % 2n ** 64n == results[7].data) {
        console.log(`Result: ${results[1].data} + ${results[5].data} == ${results[7].data} + n*2**64, Is Correct.`);
      } else {
        console.error(`Result: ${results[1].data} + ${results[5].data} == ${results[7].data} + n*2**64, Not Matched`);
      }
    } else {
      console.error("NOT MATCHED reqId");
    }
  });
  const txResp = await example.asyncDecryptRandomEuint64();
  await txResp.wait(1);
  latestReqId = await example.latestReqId();
  console.log(`${account.address}'s nonce: ${await account.getNonce()}`);
}

main();
