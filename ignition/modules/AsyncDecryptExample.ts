import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AsyncDecryptExampleModule = buildModule("AsyncDecryptExampleModule", (m) => {
  const oracleAddress = m.getParameter("oracleAddress");
  const AsyncDecryptExample = m.contract("AsyncDecryptExample", [oracleAddress]);
  return { AsyncDecryptExample };
});

export default AsyncDecryptExampleModule;
