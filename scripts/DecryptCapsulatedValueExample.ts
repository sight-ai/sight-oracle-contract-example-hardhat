import hre from "hardhat";
import { question } from "readline-sync";

import DecryptCapsulatedValueExampleModule from "../ignition/modules/DecryptCapsulatedValueExample";
import { explainCapsulatedValue } from "./utils";

async function main() {
  const oracleAddress = process.env.ORACLE_CONTRACT_ADDRESS!;
  const accounts = await hre.ethers.getSigners();
  const { DecryptCapsulatedValueExample: example } = await hre.ignition.deploy(DecryptCapsulatedValueExampleModule, {
    parameters: {
      DecryptCapsulatedValueExample: {
        oracleAddress
      }
    },
    config: {
      requiredConfirmations: 1
    }
  });
  console.log(`Contract Deployed At: ${await example.getAddress()}`);
  let target: any;
  let latestReqId: string;
  target = await example.getTarget();
  console.log(`target before decryptCapsulatedValue: `, explainCapsulatedValue(target));

  example.on(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
    } else {
      console.error("NOT MATCHED reqId");
    }
    example.off(example.filters.OracleCallback);
  });
  console.log(`valueType: ebool(128), euint64(129), eaddress(130)`);
  let capsulatedValueStr = question("capsulatedValue(data,valueType): 0,0 ? or ", {
    defaultInput: "0,0"
  });
  console.log(`Capsulated Value String: ${capsulatedValueStr}/${typeof capsulatedValueStr}`);
  let capsulatedValue = {
    data: BigInt(capsulatedValueStr.split(",")[0]),
    valueType: BigInt(capsulatedValueStr.split(",")[1])
  };
  console.log(`CapsulatedValue: `, explainCapsulatedValue(Object.values(capsulatedValue) as [bigint, bigint]));
  const unsignedTx = await example["decryptCapsulatedValue"].populateTransaction(capsulatedValue);
  const txResp = await accounts[0].sendTransaction({ ...unsignedTx });
  await txResp.wait(1);
  latestReqId = await example.getLatestReqId();
}

main();
