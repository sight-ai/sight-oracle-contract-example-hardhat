import { createInstance as SightCreateInstance, SightInstance } from "@sight-oracle/sightjs";
import { Signer, keccak256 } from "ethers";
import hre, { ethers } from "hardhat";
import { HttpNetworkUserConfig } from "hardhat/types";
import { question } from "readline-sync";

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

  const SaveCiphertextAndReencryptExampleFactory = await hre.ethers.getContractFactory(
    "SaveCiphertextAndReencryptExample"
  );
  const example = await SaveCiphertextAndReencryptExampleFactory.deploy(ORACLE_CONTRACT_ADDRESS);
  await example.waitForDeployment();
  console.log(`Contract Deployed At: ${await example.getAddress()}`);

  let latestReqId: string;
  let nextTest = false;

  // test bool.
  {
    let BoolValue = question("save ciphertext(ebool) for false ? Or ", {
      defaultInput: "false",
      trueValue(input: string) {
        if ("true" === input.trim().toLowerCase()) {
          return true;
        }
        return false;
      },
      falseValue(input: string) {
        if ("false" === input.trim().toLowerCase()) {
          return true;
        }
        return false;
      }
    });
    console.log(`Encrypt Value: ${BoolValue}/${typeof BoolValue} ${typeof BoolValue === "string" ? true : BoolValue}`);
    const ciphertextBool = sightInstance.encryptBool(typeof BoolValue === "string" ? true : BoolValue);
    console.log(`ciphertextBool/fhe-publicKey size:`, ciphertextBool.length, publicKey!.length);
    let txRespBool = await example.saveCiphertext(ciphertextBool, 128 /* , { gasLimit: 1e7 } */);
    let txRcptBool = await txRespBool.wait(1);
    console.log(`call saveCiphertext:`, txRcptBool?.hash, txRcptBool?.status === 1 ? "success" : "failed");
    latestReqId = await example.latestReqId();

    await example.once(example.filters.SaveCiphertext, async (reqId, capsulatedValue, event) => {
      console.log(
        `Oracle SaveCiphertext callbacked with: ${reqId}, ${capsulatedValue[0]}/${typeof capsulatedValue[0]}, ${capsulatedValue[1]}/${typeof capsulatedValue[1]}`
      );
      if (latestReqId === reqId) {
        const txRespReencryptBool = await example.reencryptCapsulatedValue(
          {
            data: capsulatedValue[0],
            valueType: capsulatedValue[1]
          },
          token.publicKey,
          token.signature
        );
        await txRespReencryptBool.wait();
        latestReqId = await example.latestReqId();
        await example.once(example.filters.ReencryptedCiphertext, (reqId, reencryptedCiphertext, event) => {
          console.log(
            `Oracle ReencryptedCiphertext callbacked with: ${reqId}, ${reencryptedCiphertext}/${typeof reencryptedCiphertext}`
          );
          if (latestReqId === reqId) {
            let boolResult = sightInstance.decrypt(ORACLE_CONTRACT_ADDRESS, reencryptedCiphertext);
            console.log(`Decrypted reencrytedCiphertext to: ${typeof boolResult} ${boolResult === 0n ? false : true}`);
            nextTest = true;
          } else {
            console.error("NOT MATCHED reqId");
          }
        });
      } else {
        console.error("NOT MATCHED reqId");
      }
    });
    while (!nextTest) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    nextTest = false;
  }

  // test uint64.
  {
    let Uint64ValueStr = question("save ciphertext(euint64) for 1234567890 ? Or ", {
      defaultInput: "1234567890"
    });
    let Uint64ValueOriginal = BigInt(Uint64ValueStr);
    let Uint64Value = Uint64ValueOriginal % 2n ** 64n;
    let Uint64ValueDiv = Uint64ValueOriginal / 2n ** 64n;
    console.log(
      `Encrypt ${Uint64ValueDiv === 0n ? "Value" : `Mod(2**64) Value`}: ${Uint64Value}/${typeof Uint64Value}`
    );
    const ciphertextUint64 = sightInstance.encrypt64(Uint64Value);
    console.log(`ciphertextUint64/fhe-publicKey size:`, ciphertextUint64.length, publicKey!.length);
    let txRespUint64 = await example.saveCiphertext(ciphertextUint64, 129 /* , { gasLimit: 1e7 } */);
    let txRcptUint64 = await txRespUint64.wait(1);
    console.log(`call saveCiphertext:`, txRcptUint64?.hash, txRcptUint64?.status === 1 ? "success" : "failed");
    latestReqId = await example.latestReqId();

    await example.once(example.filters.SaveCiphertext, async (reqId, capsulatedValue, event) => {
      console.log(
        `Oracle SaveCiphertext callbacked with: ${reqId}, ${capsulatedValue[0]}/${typeof capsulatedValue[0]}, ${capsulatedValue[1]}/${typeof capsulatedValue[1]}`
      );
      if (latestReqId === reqId) {
        const txRespReencryptUint64 = await example.reencryptCapsulatedValue(
          {
            data: capsulatedValue[0],
            valueType: capsulatedValue[1]
          },
          token.publicKey,
          token.signature
        );
        await txRespReencryptUint64.wait();
        latestReqId = await example.latestReqId();
        await example.once(example.filters.ReencryptedCiphertext, (reqId, reencryptedCiphertext, event) => {
          console.log(
            `Oracle ReencryptedCiphertext callbacked with: ${reqId}, ${reencryptedCiphertext}/${typeof reencryptedCiphertext}`
          );
          if (latestReqId === reqId) {
            let Uint64Result = sightInstance.decrypt(ORACLE_CONTRACT_ADDRESS, reencryptedCiphertext);
            console.log(`Decrypted reencrytedCiphertext to: ${typeof Uint64Result} ${Uint64Result}`);
            nextTest = true;
          } else {
            console.error("NOT MATCHED reqId");
          }
        });
      } else {
        console.error("NOT MATCHED reqId");
      }
    });
    while (!nextTest) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    nextTest = false;
  }

  // test address.
  {
    let AddressValue = question("save ciphertext(eaddress) for 0x5c84d4dBD316252DC79dac7534aEE7F91E29eFAE ? Or ", {
      defaultInput: "0x5c84d4dBD316252DC79dac7534aEE7F91E29eFAE"
    });
    console.log(`Encrypt Value: ${AddressValue}/${typeof AddressValue}`);
    const ciphertextAddress = sightInstance.encryptAddress(AddressValue);
    console.log(`ciphertextAddress/fhe-publicKey size:`, ciphertextAddress.length, publicKey!.length);
    let txRespAddress = await example.saveCiphertext(ciphertextAddress, 130 /* , { gasLimit: 1e7 } */);
    let txRcptAddress = await txRespAddress.wait(1);
    console.log(`call saveCiphertext:`, txRcptAddress?.hash, txRcptAddress?.status === 1 ? "success" : "failed");
    latestReqId = await example.latestReqId();

    await example.once(example.filters.SaveCiphertext, async (reqId, capsulatedValue, event) => {
      console.log(
        `Oracle SaveCiphertext callbacked with: ${reqId}, ${capsulatedValue[0]}/${typeof capsulatedValue[0]}, ${capsulatedValue[1]}/${typeof capsulatedValue[1]}`
      );
      if (latestReqId === reqId) {
        const txRespReencryptAddress = await example.reencryptCapsulatedValue(
          {
            data: capsulatedValue[0],
            valueType: capsulatedValue[1]
          },
          token.publicKey,
          token.signature
        );
        await txRespReencryptAddress.wait();
        latestReqId = await example.latestReqId();
        await example.once(example.filters.ReencryptedCiphertext, (reqId, reencryptedCiphertext, event) => {
          console.log(
            `Oracle ReencryptedCiphertext callbacked with: ${reqId}, ${reencryptedCiphertext}/${typeof reencryptedCiphertext}`
          );
          if (latestReqId === reqId) {
            let addressResult = sightInstance.decryptAddress(ORACLE_CONTRACT_ADDRESS, reencryptedCiphertext);
            console.log(`Decrypted reencrytedCiphertext to: ${typeof addressResult} ${addressResult}`);
            nextTest = true;
          } else {
            console.error("NOT MATCHED reqId");
          }
        });
      } else {
        console.error("NOT MATCHED reqId");
      }
    });
    while (!nextTest) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    nextTest = false;
  }
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
