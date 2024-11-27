import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { IgnitionModule, NamedArtifactContractDeploymentFuture } from "@nomicfoundation/ignition-core";

const DecryptCapsulatedValueExampleModule: IgnitionModule<
  "DecryptCapsulatedValueExampleModule",
  string,
  {
    DecryptCapsulatedValueExample: NamedArtifactContractDeploymentFuture<"DecryptCapsulatedValueExample">;
  }
> = buildModule("DecryptCapsulatedValueExampleModule", (m) => {
  const oracleAddress = m.getParameter("oracleAddress", process.env.ORACLE_CONTRACT_ADDRESS!);
  const DecryptCapsulatedValueExample = m.contract("DecryptCapsulatedValueExample", [oracleAddress]);
  return { DecryptCapsulatedValueExample };
});

export default DecryptCapsulatedValueExampleModule;
