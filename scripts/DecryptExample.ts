import hre from "hardhat";

import DecryptExampleModule from "../ignition/modules/DecryptExample";
import { Oracle } from "../typechain-types/@sight-oracle/contracts/Oracle/Oracle";
import { explainCapsulatedValue, sleep } from "./utils";

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
  target = await example.getTarget();
  console.log(`target before decryptRandomEuint64: `, explainCapsulatedValue(target));
  const oracle = (await hre.ethers.getContractAt(
    "@sight-oracle/contracts/Oracle/Oracle.sol:Oracle",
    oracleAddress
  )) as unknown as Oracle;
  oracle.connect(hre.ethers.provider);

  oracle.on(oracle.filters.RequestCallback, async (reqId, success, event) => {
    target = await example.getTarget();
    console.log(`target after Oracle make callback: `, explainCapsulatedValue(target));
    oracle.off(oracle.filters.RequestCallback);
  });
  const txResp = await example.decryptRandomEuint64();
  await txResp.wait(1);
}

main();
