!/bin/bash

# default not to clean project.
# docker compose down -v; npm run clean
source .env
docker compose up -d evm-node mysql-server
npx hardhat task:fundMnemonicEVM --name MNEMONIC --index 0 --network localSightEVM;

npx hardhat task:computePredeployAddress --private-key "$PRIVATE_KEY_ORACLE_DEPLOYER"

docker compose up -d sight-node

npx hardhat compile
sleep 15
npx hardhat task:launchFhevm --network localSightFHEVM

# docker compose logs -f sight-node

MNEMONIC=$(grep ^COMPUTE_PROXY_CHAIN_MNEMONIC= .env | cut -d '=' -f 2) npx hardhat task:accounts | head -n $(grep COMPUTE_PROXY_CHAIN_MNEMONIC_COUNT= .env | cut -d '=' -f 2) | xargs -I {} sh -c "docker compose exec -T sight-node faucet {}; \
sleep 7"; MNEMONIC=$(grep ^COMPUTE_PROXY_CHAIN_MNEMONIC= .env | cut -d '=' -f 2) npx hardhat task:deploySightFHEVM --network localSightFHEVM;

MNEMONIC=$(grep ORACLE_CHAIN_MNEMONIC= .env | cut -d '=' -f 2) npx hardhat task:deploySightEVM --network localSightEVM;

docker compose up -d backend

MNEMONIC=$(grep COMPUTE_PROXY_CHAIN_MNEMONIC= .env | cut -d '=' -f 2) npx hardhat task:upgradeComputeProxyToV2 --network localSightFHEVM;

# npx hardhat ignition deploy ignition/modules/Example.ts --network localSightEVM
# npx hardhat ignition deploy ignition/modules/MultiStepExample.ts --network localSightEVM
# npx hardhat ignition deploy ignition/modules/DecryptExample.ts --network localSightEVM

docker compose logs -f backend
