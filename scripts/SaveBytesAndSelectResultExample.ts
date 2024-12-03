import { createInstance as SightCreateInstance, SightInstance } from "@sight-oracle/sightjs";
import { BytesLike, Signer, keccak256 } from "ethers";
import hre, { ethers } from "hardhat";
import { HttpNetworkUserConfig } from "hardhat/types";
import { question } from "readline-sync";

import { abiCoder, explainCapsulatedValue } from "./utils";

const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS!;
const FHE_LIB_ADDRESS = "0x000000000000000000000000000000000000005d";

async function main() {
  const localSightFHEVM: HttpNetworkUserConfig = hre.userConfig.networks!.localSightFHEVM! as HttpNetworkUserConfig;
  const provider = new ethers.JsonRpcProvider(localSightFHEVM.url);
  const ethers_wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC!, provider);

  // 1. Get chain id
  let chainId: number;
  let publicKey: string | undefined;
  // const provider = hre.ethers.provider;

  const network1 = await provider.getNetwork();
  chainId = +network1.chainId.toString(); // Need to be a number
  try {
    // Get blockchain public key
    const ret = await provider.call({
      to: FHE_LIB_ADDRESS,
      // first four bytes of keccak256('fhePubKey(bytes1)') + 1 byte for library
      data: "0xd9d47bb001"
    });
    console.log(`fhe-publicKey size/keccak256:`, ret.length, keccak256(ret));
    const decoded = hre.ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], ret);
    publicKey = decoded[0];
  } catch (e) {
    console.error(e);
    publicKey = undefined;
  }

  // Get public key to perform encryption
  const sightInstance = await SightCreateInstance({
    chainId: hre.network.config.chainId!,
    publicKey
  });

  await generatePublicKey(ORACLE_CONTRACT_ADDRESS, ethers_wallet, sightInstance);
  // This will be used in Compute Proxy
  const token = sightInstance.getPublicKey(ORACLE_CONTRACT_ADDRESS);
  if (!token) {
    console.error("null token!");
    return;
  }

  const SaveBytesAndSelectResultExampleFactory = await hre.ethers.getContractFactory("SaveBytesAndSelectResultExample");
  const example = await SaveBytesAndSelectResultExampleFactory.deploy(ORACLE_CONTRACT_ADDRESS);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);

  let result: any;
  let results: any[];
  let latestReqId: string;
  let nextTest = false;

  let Uint64ValueStr = question("saveEuint64Bytes for 1234567890 ? Or ", {
    defaultInput: "1234567890"
  });
  let Uint64ValueOriginal = BigInt(Uint64ValueStr);
  let Uint64Value = Uint64ValueOriginal % 2n ** 64n;
  let Uint64ValueDiv = Uint64ValueOriginal / 2n ** 64n;
  console.log(`Encrypt ${Uint64ValueDiv === 0n ? "Value" : `Mod(2**64) Value`}: ${Uint64Value}/${typeof Uint64Value}`);
  const ciphertextUint64 = sightInstance.encrypt64(Uint64Value);
  console.log(`ciphertextUint64/fhe-publicKey size:`, ciphertextUint64.length, publicKey!.length);
  let txRespUint64 = await example.makeRequest(ciphertextUint64 /* , { gasLimit: 1e7 } */);
  let txRcptUint64 = await txRespUint64.wait(1);
  console.log(`call makeRequest:`, txRcptUint64?.hash, txRcptUint64?.status === 1 ? "success" : "failed");
  latestReqId = await example.latestReqId();

  await example.once(example.filters.OracleCallback, async (reqId, event) => {
    if (latestReqId === reqId) {
      result = await example.result();
      results = await example.getResults();
      console.log(`result after makeRequest: `, explainCapsulatedValue(result));
      console.log(
        `results after makeRequest: `,
        results.map((result: [BytesLike, bigint]) => explainCapsulatedValue(result))
      );
      let results_4 = abiCoder.decode(["bool"], results[4].data)[0];
      let results_5 = abiCoder.decode(["uint64"], results[5].data)[0];
      let results_6 = abiCoder.decode(["uint64"], results[6].data)[0];
      if (results_4 ? results_5 : Uint64Value >= results_4 ? Uint64Value : results_5 === results_4) {
        console.log(
          `Result: ${Number(results_4 ? results_5 : Uint64Value).toExponential()} >= ${Number(!results_4 ? results_5 : Uint64Value).toExponential()} === ${results_4}, max(${Uint64Value},${results_5}) == ${results_6}, Is Correct.`
        );
      } else {
        console.error(
          `Result: ${Number(results_4 ? results_5 : Uint64Value).toExponential()} >= ${Number(!results_4 ? results_5 : Uint64Value).toExponential()} === ${results_4}, max(${Uint64Value},${results_5}) != ${results_6}, Not Matched`
        );
      }
    } else {
      console.error("NOT MATCHED reqId");
    }
  });
}

const generatePublicKey = async (contractAddress: string, signer: Signer, instance: SightInstance) => {
  // Generate token to decrypt
  const generatedToken = instance.generatePublicKey({
    verifyingContract: contractAddress
  });
  // Sign the public key
  const signature = await signer.signTypedData(
    generatedToken.eip712.domain,
    { Reencrypt: generatedToken.eip712.types.Reencrypt }, // Need to remove EIP712Domain from types
    generatedToken.eip712.message
  );
  instance.setSignature(contractAddress, signature);
};

main();
