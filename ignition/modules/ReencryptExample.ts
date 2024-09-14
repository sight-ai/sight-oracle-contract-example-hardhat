import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ReencryptExampleModule = buildModule("ReencryptExampleModule", (m) => {
  const oracleAddress = m.getParameter("oracleAddress");
  const ReencryptExample = m.contract("ReencryptExample", [oracleAddress]);
  return { ReencryptExample };
});

export default ReencryptExampleModule;
