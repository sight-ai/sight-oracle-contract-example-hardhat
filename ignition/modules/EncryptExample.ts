import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EncryptExampleModule = buildModule("EncryptExampleModule", (m) => {
  const oracleAddress = m.getParameter("oracleAddress");
  const EncryptExample = m.contract("EncryptExample", [oracleAddress]);
  return { EncryptExample };
});

export default EncryptExampleModule;
