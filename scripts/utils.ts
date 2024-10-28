export const sleep = async (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

export const explainCapsulatedValue = (cv: [bigint, bigint]) => {
  switch (cv[1]) {
    case 0n:
      return { msg: "CapsulatedValue Not Initialized.", value: cv[0] };

    case 1n:
      return { msg: "CapsulatedValue represents bool.", value: cv[0] == 0n ? false : true };
    case 2n:
      return { msg: "CapsulatedValue represents uint64.", value: cv[0] };
    case 3n:
      return { msg: "CapsulatedValue represents address.", value: cv[0] };

    case 128n:
      return { msg: "CapsulatedValue represents ebool.", value: cv[0] };
    case 129n:
      return { msg: "CapsulatedValue represents euint64.", value: cv[0] };
    case 130n:
      return { msg: "CapsulatedValue represents eaddress.", value: cv[0] };

    default:
      return { msg: "CapsulatedValue Represents Unsupported Type.", value: cv[0] };
  }
};
