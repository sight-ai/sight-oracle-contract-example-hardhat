!/bin/bash

# Function to retrieve the health status of a evm node
check_evm_node() {
  local port=$1
  local response
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:$port)
  
  if echo "$response" | grep -q '"result":"0x[0-9a-fA-F]\+"'; then
    return 0
  else
    return 1
  fi
}

# Function to wait for a evm node to become healthy
wait_for_evm_node() {
  local port=$1
  local max_retries=30
  local retry_count=0

  echo "Waiting for EVM node on port $port to become healthy..."

  until check_evm_node $port; do
    if [ $retry_count -ge $max_retries ]; then
      echo "Error: EVM node on port $port did not become healthy within expected time."
      exit 1
    fi

    echo "EVM node on port $port not healthy yet. Retrying in 5 seconds..."
    sleep 5
    retry_count=$((retry_count + 1))
  done

  echo "EVM node on port $port is healthy."
}

# default not to clean project.
# docker compose down -v; npm run clean
source .env
docker compose up -d evm-node mysql-server
wait_for_evm_node 18545
npx hardhat task:fundMnemonicEVM --name MNEMONIC --index 0 --network localSightEVM;

npx hardhat task:computePredeployAddress --private-key "$PRIVATE_KEY_ORACLE_DEPLOYER"

docker compose up -d sight-node
wait_for_evm_node 8545

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
