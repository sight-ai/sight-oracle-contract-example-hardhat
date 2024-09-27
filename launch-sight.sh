#!/bin/bash

# default not to clean project.
# docker compose down -v; npm run clean

docker compose up -d evm-node mysql-server
npx hardhat task:fundMnemonicEVM --name MNEMONIC --index 0 --network localSightEVM;

PRIVATE_KEY_ORACLE_DEPLOYER=$(grep PRIVATE_KEY_ORACLE_DEPLOYER .env | cut -d '"' -f 2)
npx hardhat task:computePredeployAddress --private-key "$PRIVATE_KEY_ORACLE_DEPLOYER"

PRIVATE_KEY_ORACLE_RELAYER=$(grep PRIVATE_KEY_ORACLE_RELAYER .env | cut -d '"' -f 2)
ORACLE_CONTRACT_PREDEPLOY_ADDRESS=$(grep ORACLE_CONTRACT_PREDEPLOY_ADDRESS .env | cut -d '=' -f2)
docker compose up -d sight-node

npx hardhat compile
sleep 15
npx hardhat task:launchFhevm --network localSightFHEVM

# docker compose logs -f sight-node

npx hardhat task:accounts | tail -n 10| head -n 2 | xargs -I {} docker compose exec -T sight-node faucet {}; \
sleep 5; npx hardhat task:deploySightFHEVM --network localSightFHEVM;

npx hardhat task:deploySightEVM --network localSightEVM;

docker compose up -d backend

# npx hardhat ignition deploy ignition/modules/Example.ts --network localSightEVM
# npx hardhat ignition deploy ignition/modules/MultiStepExample.ts --network localSightEVM
# npx hardhat ignition deploy ignition/modules/DecryptExample.ts --network localSightEVM
