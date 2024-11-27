# Sight Oracle Development Environment Hardhat Project

This project demonstrates a basic Sight Oracle Development use case. It comes with an example contract, a test for that
contract, and a Hardhat Ignition module that deploys that contract.

This project depends on docker compose, make sure that you have installed [these](https://github.com/docker/compose)
firstly.

Try running some of the following tasks:

```shell
cp -f .env{.example,}
npm install

#npx hardhat task:randomMnemonic --name MNEMONIC # or replace with your mnemonic in .env
# others mnemonic fields: ORACLE_CHAIN_MNEMONIC, COMPUTE_PROXY_CHAIN_MNEMONIC

npm run sight:stop ;npm run sight:start

npx hardhat run --no-compile scripts/Example.ts
npx hardhat run --no-compile scripts/MultiStepExample.ts
npx hardhat run --no-compile scripts/DecryptExample.ts
npx hardhat run --no-compile scripts/EncryptReencryptExample.ts
npx hardhat run --no-compile scripts/AsyncDecryptExample.ts

# for i in {1..10}; do idx=${i} npx hardhat run --no-compile scripts/MultiStepExampleParallel.ts & done
# for i in {1..10}; do idx=${i} npx hardhat run --no-compile scripts/AsyncDecryptExampleParallel.ts & done
```

Change example contracts & example scripts to make yourself.
