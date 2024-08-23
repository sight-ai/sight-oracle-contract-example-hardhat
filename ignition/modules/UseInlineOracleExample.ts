import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const UseInlineOracleExampleModule = buildModule("UseInlineOracleExampleModule", (m) => {
  const UseInlineOracleExample = m.contract("UseInlineOracleExample", []);
  return { UseInlineOracleExample };
});

export default UseInlineOracleExampleModule;
