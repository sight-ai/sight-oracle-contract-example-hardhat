import hre from "hardhat";

import DecryptCapsulatedValueExampleModule from "../ignition/modules/DecryptCapsulatedValueExample";
import DecryptExampleModule from "../ignition/modules/DecryptExample";
import { explainCapsulatedValue } from "./utils";

async function main() {
  const accounts = await hre.ethers.getSigners();
  const oracleAddress = process.env.ORACLE_CONTRACT_ADDRESS!;
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
  console.log(`Contract Deployed At: ${example.target}`);
  const { DecryptExample: decryptExample } = await hre.ignition.deploy(DecryptExampleModule, {
    parameters: {
      DecryptExample: {
        oracleAddress
      }
    },
    config: {
      requiredConfirmations: 1
    }
  });
  console.log(`Contract DecryptExample Deployed At: ${decryptExample.target}`);
  let target: any;
  let latestReqId: string;
  target = await example.getTarget();
  console.log(`target before decryptCapsulatedValue: `, explainCapsulatedValue(target));
  target = await decryptExample.capsulatedValue();
  console.log(`DecryptExample's capsulatedValue before decryptCapsulatedValue: `, explainCapsulatedValue(target));
  const txRcpt = await (await decryptExample.shareACL(example.target, true)).wait();
  console.log(`Share DecryptExample ACL to ${example.target} ${txRcpt.status == 1 ? "success" : "failed"}`);
  console.log(`DecryptExample's callback addrs: ${JSON.stringify(await decryptExample.getACL())}`);
  const txRcpt1 = await (await decryptExample.shareEncryptedValue(example.target, true)).wait();
  console.log(
    `Share DecryptExample capsulatedValue to ${example.target} as true: ${txRcpt1.status == 1 ? "success" : "failed"}`
  );
  console.log(
    `DecryptExample's capsulatedValue owners: ${JSON.stringify(await decryptExample.getEncryptedValueOwners())}`
  );

  example.on(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      target = await example.getTarget();
      console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));

      // const txRcpt1 = await (await decryptExample.shareEncryptedValue(example.target, false)).wait();
      // console.log(
      //   `Share DecryptExample capsulatedValue to ${example.target} as false: ${txRcpt1.status == 1 ? "success" : "failed"}`
      // );
      // console.log(
      //   `DecryptExample's capsulatedValue owners: ${JSON.stringify(await decryptExample.getEncryptedValueOwners())}`
      // );
    } else {
      console.error("NOT MATCHED reqId");
    }
    example.off(example.filters.OracleCallback);
  });
  const unsignedTx = await example["decryptCapsulatedValue"].populateTransaction({
    data: target[0],
    valueType: target[1]
  });
  const txResp = await accounts[0].sendTransaction({ ...unsignedTx });
  await txResp.wait(1);
  latestReqId = await example.getLatestReqId();
}

main();
