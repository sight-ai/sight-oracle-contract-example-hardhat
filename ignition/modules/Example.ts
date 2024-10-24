import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ExampleModule = buildModule("ExampleModule", (m) => {
  // const oracleAddress = m.getParameter("oracleAddress");
  const Example = m.contract("Example", [process.env.ORACLE_CONTRACT_ADDRESS!]);
  return { Example };
});

export default ExampleModule;
