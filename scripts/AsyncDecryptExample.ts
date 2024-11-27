import hre from "hardhat";

import { explainCapsulatedValue } from "./utils";

async function main() {
  const AsyncDecryptExampleFactory = await hre.ethers.getContractFactory("AsyncDecryptExample");
  const example = await AsyncDecryptExampleFactory.deploy(process.env.ORACLE_CONTRACT_ADDRESS!);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let result: any;
  let results: any[];
  let latestReqId: string;
  result = await example.result();
  results = await example.getResults();
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
}

main();
