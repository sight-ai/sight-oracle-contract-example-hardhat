import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DecryptExampleModule = buildModule("DecryptExampleModule", (m) => {
  // const oracleAddress = m.getParameter("oracleAddress");
  const DecryptExample = m.contract("DecryptExample", [process.env.ORACLE_CONTRACT_ADDRESS!]);
  return { DecryptExample };
});

export default DecryptExampleModule;
