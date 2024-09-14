import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ORACLE_ADDR_OP_SEPOLIA } from "@sight-oracle/contracts";

const MultiStepExampleModule = buildModule("MultiStepExampleModule", (m) => {
  // const oracleAddress = m.getParameter("oracleAddress");
  const MultiStepExample = m.contract("MultiStepExample", [ORACLE_ADDR_OP_SEPOLIA]);
  return { MultiStepExample };
});

export default MultiStepExampleModule;
