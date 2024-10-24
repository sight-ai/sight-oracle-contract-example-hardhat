import hre from "hardhat";

import DecryptExampleModule from "../ignition/modules/DecryptExample";
import { explainCapsulatedValue } from "./utils";

async function main() {
  const oracleAddress = process.env.ORACLE_CONTRACT_ADDRESS!;
  const { DecryptExample: example } = await hre.ignition.deploy(DecryptExampleModule, {
    parameters: {
      DecryptExample: {
        oracleAddress
      }
    }
  });
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  let latestReqId: string;
  target = await example.getTarget();
  console.log(`target before decryptRandomEuint64: `, explainCapsulatedValue(target));

  example.on(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
    } else {
      console.error("NOT MATCHED reqId");
    }
    example.off(example.filters.OracleCallback);
  });
  const txResp = await example.decryptRandomEuint64();
  await txResp.wait(1);
  latestReqId = await example.getLatestReqId();
}

main();
