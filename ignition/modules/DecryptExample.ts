import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DecryptExampleModule = buildModule("DecryptExampleModule", (m) => {
  const oracleAddress = m.getParameter("oracleAddress");
  const DecryptExample = m.contract("DecryptExample", [oracleAddress]);
  return { DecryptExample };
});

export default DecryptExampleModule;
