#!/bin/bash

# default not to clean project.
# docker compose down -v; npm run clean

docker compose up -d evm-node mysql-server

PRIVATE_KEY_ORACLE_DEPLOYER=$(grep PRIVATE_KEY_ORACLE_DEPLOYER .env | cut -d '"' -f 2)
npx hardhat task:computePredeployAddress --private-key "$PRIVATE_KEY_ORACLE_DEPLOYER"

PRIVATE_KEY_ORACLE_RELAYER=$(grep PRIVATE_KEY_ORACLE_RELAYER .env | cut -d '"' -f 2)
ORACLE_CONTRACT_PREDEPLOY_ADDRESS=$(grep ORACLE_CONTRACT_PREDEPLOY_ADDRESS .env | cut -d '=' -f2)
docker compose up -d fhevm-node

npx hardhat compile
sleep 15
npx hardhat task:launchFhevm --network localFHEVM

# docker compose logs -f fhevm-node

npx hardhat task:accounts | tail -n 10| head -n 2 | xargs -I {} docker compose exec -T fhevm-node faucet {}; \
sleep 5; npx hardhat deploy --no-compile --tags upgradeable-fhevm --network localFHEVM --reset;

npx hardhat deploy --no-compile --tags upgradeable-evm --network localEVM --reset;

docker compose up -d backend

# npx hardhat ignition deploy ignition/modules/Example.ts --network localEVM
# npx hardhat ignition deploy ignition/modules/MultiStepExample.ts --network localEVM
# npx hardhat ignition deploy ignition/modules/DecryptExample.ts --network localEVM
