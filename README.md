# Sight Oracle Example Hardhat Project

This project demonstrates a basic Sight Oracle use case. It comes with an example contract, a test for that contract,
and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
pnpm install

npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Example.ts --parameters ./ignition/parameters.json

pnpm clean && pnpm coverage
```
