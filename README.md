# Sight Oracle Development Environment Hardhat Project

This project demonstrates a basic Sight Oracle Development use case. It comes with an example contract, a test for that
contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
cp -f .env{.example,}
npm install

npm run sight:stop ;npm run sight:start

npx hardhat run scripts/Example.ts
npx hardhat run scripts/MultiStepExample.ts
npx hardhat run scripts/DecryptExample.ts
```

Change example contracts & example scripts to make yourself.
