import { AbiCoder, BytesLike } from "ethers";

export const sleep = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

export const abiCoder = AbiCoder.defaultAbiCoder();

export const explainCapsulatedValue = (cv: [BytesLike, bigint]) => {
  switch (cv[1]) {
    case 0n:
      return { explain: "CapsulatedValue Not Initialized.", value: cv[0].toString() };

    case 1n:
      return { explain: "CapsulatedValue represents bool.", value: abiCoder.decode(["bool"], cv[0])[0] };
    case 2n:
      return { explain: "CapsulatedValue represents uint64.", value: abiCoder.decode(["uint64"], cv[0])[0] };
    case 3n:
      return { explain: "CapsulatedValue represents address.", value: abiCoder.decode(["address"], cv[0])[0] };
    case 4n:
      return { explain: "CapsulatedValue represents uint256.", value: abiCoder.decode(["uint256"], cv[0])[0] };
    case 5n:
      return { explain: "CapsulatedValue represents bytes32.", value: abiCoder.decode(["bytes32"], cv[0])[0] };
    case 6n:
      return { explain: "CapsulatedValue represents bytes.", value: cv[0] };

    case 128n:
      return { explain: "CapsulatedValue represents ebool.", value: abiCoder.decode(["bytes32"], cv[0])[0] };
    case 129n:
      return { explain: "CapsulatedValue represents euint64.", value: abiCoder.decode(["bytes32"], cv[0])[0] };
    case 130n:
      return { explain: "CapsulatedValue represents eaddress.", value: abiCoder.decode(["bytes32"], cv[0])[0] };
    case 131n:
      return { explain: "CapsulatedValue represents ebool bytes.", value: cv[0] };
    case 132n:
      return { explain: "CapsulatedValue represents euint64 bytes.", value: cv[0] };
    case 133n:
      return { explain: "CapsulatedValue represents eaddress bytes.", value: cv[0] };

    default:
      return { explain: "CapsulatedValue Represents Unsupported Type.", value: cv[0].toString() };
  }
};
