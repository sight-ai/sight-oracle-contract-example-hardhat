import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { IgnitionModule, NamedArtifactContractDeploymentFuture } from "@nomicfoundation/ignition-core";

const DecryptExampleModule: IgnitionModule<
  "DecryptExampleModule",
  string,
  {
    DecryptExample: NamedArtifactContractDeploymentFuture<"DecryptExample">;
  }
> = buildModule("DecryptExampleModule", (m) => {
  const oracleAddress = m.getParameter("oracleAddress", process.env.ORACLE_CONTRACT_ADDRESS!);
  const DecryptExample = m.contract("DecryptExample", [oracleAddress]);
  return { DecryptExample };
});

export default DecryptExampleModule;
