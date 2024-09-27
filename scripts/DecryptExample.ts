import hre from "hardhat";

import DecryptExampleModule from "../ignition/modules/DecryptExample";
import { explainCapsulatedValue, sleep } from "./utils";

async function main() {
  const { DecryptExample: example } = await hre.ignition.deploy(DecryptExampleModule, {
    parameters: {
      DecryptExample: {
        oracleAddress: process.env.ORACLE_CONTRACT_ADDRESS!
      }
    }
  });
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  target = await example.getTarget();
  console.log(`target before decryptRandomEuint64: `, explainCapsulatedValue(target));
  const txResp = await example.decryptRandomEuint64();
  await txResp.wait(1);
  await sleep(25e3);
  target = await example.getTarget();
  console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
}

main();
