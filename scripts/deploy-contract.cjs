const fs = require('fs');
const path = require('path');
const http = require('http');
const { ethers } = require('ethers');

const CANDIDATE_PORTS = [7546, 7545, 8545, 1337];
const ARTIFACT_PATH = path.join(__dirname, '..', 'build', 'contracts', 'SkylineBookingLedger.json');
const ENV_LOCAL_PATH = path.join(__dirname, '..', '.env.local');

async function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: port,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 1000,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(Boolean(json && (json.result || json.jsonrpc)));
          } catch {
            resolve(false);
          }
        });
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', id: 1 }));
    req.end();
  });
}

async function findActivePort() {
  for (const port of CANDIDATE_PORTS) {
    if (await isPortOpen(port)) {
      return port;
    }
  }
  return null;
}

async function main() {
  console.log('='.repeat(65));
  console.log('  SKYLINE SMART CONTRACT DEPLOYER (Chain ID 1337)');
  console.log('='.repeat(65));

  // 1. Check for active Ganache RPC
  console.log('[*] Searching for active Ethereum RPC endpoint (ports 7545, 8545, 1337)...');
  const port = await findActivePort();

  if (!port) {
    console.error('[!] ERROR: No active Ganache RPC server detected on ports 7545, 8545, or 1337.');
    console.error('    Please start Ganache first:');
    console.error('      npm run ganache');
    console.error('    or launch your Ganache GUI desktop app and click "Quickstart".');
    process.exit(1);
  }

  const rpcUrl = `http://127.0.0.1:${port}`;
  console.log(`[+] Connected to active RPC endpoint at: ${rpcUrl}`);

  // 2. Connect provider
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`[+] Network Chain ID detected: ${chainId} (0x${chainId.toString(16)})`);

  // 3. Load contract artifact
  if (!fs.existsSync(ARTIFACT_PATH)) {
    console.error(`[!] Artifact not found at ${ARTIFACT_PATH}. Compiling contracts first...`);
    require('child_process').execSync('npx truffle compile --config truffle-config.cjs', { stdio: 'inherit' });
  }

  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  if (!bytecode || bytecode === '0x') {
    console.error('[!] Contract bytecode is empty! Please recompile contracts.');
    process.exit(1);
  }

  // 4. Get deployer signer
  const signer = await provider.getSigner(0);
  const deployerAddress = await signer.getAddress();
  const balance = await provider.getBalance(deployerAddress);
  console.log(`[+] Deployer Account: ${deployerAddress}`);
  console.log(`[+] Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  // 5. Deploy SkylineBookingLedger contract
  console.log('[*] Deploying SkylineBookingLedger contract to Ganache...');
  const factory = new ethers.ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  console.log(`[✓] SkylineBookingLedger DEPLOYED SUCCESS!`);
  console.log(`[✓] Contract Address: ${contractAddress}`);
  if (tx) {
    console.log(`[✓] Deployment Tx:   ${tx.hash}`);
  }

  // 6. Test on-chain read
  try {
    const isVerified = await contract.verifyBooking('DEPLOYMENT_TEST_PROBE');
    console.log(`[✓] Contract on-chain verification self-test passed (verifyBooking returned: ${isVerified})`);
  } catch (probeErr) {
    console.warn('[!] Note on self-test:', probeErr.message);
  }

  // 7. Update .env.local
  const envContent = [
    `# SKYLINE Ethereum Ganache Local Configuration`,
    `VITE_GANACHE_CHAIN_ID=${chainId}`,
    `VITE_SKYLINE_CONTRACT_ADDRESS=${contractAddress}`,
    `VITE_GANACHE_RPC_URL=${rpcUrl}`,
    ``,
  ].join('\n');

  fs.writeFileSync(ENV_LOCAL_PATH, envContent, 'utf8');
  console.log(`[+] Updated ${ENV_LOCAL_PATH}`);

  // 8. Update build/contracts/SkylineBookingLedger.json networks map
  artifact.networks = artifact.networks || {};
  artifact.networks[String(chainId)] = {
    events: {},
    links: {},
    address: contractAddress,
    transactionHash: tx ? tx.hash : '',
  };
  // Also keep 1337 and 5777 for maximum compatibility
  if (String(chainId) !== '1337') {
    artifact.networks['1337'] = { address: contractAddress };
  }
  if (String(chainId) !== '5777') {
    artifact.networks['5777'] = { address: contractAddress };
  }
  fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(artifact, null, 2), 'utf8');
  console.log(`[+] Updated artifact networks mapping in ${ARTIFACT_PATH}`);

  console.log('='.repeat(65));
  console.log('  SETUP COMPLETE! Ready for MetaMask integration:');
  console.log(`  - Chain ID:          ${chainId}`);
  console.log(`  - Contract Address:  ${contractAddress}`);
  console.log(`  - RPC Endpoint:      ${rpcUrl}`);
  console.log('='.repeat(65));
}

main().catch((err) => {
  console.error('[!] Deployment failed:', err);
  process.exit(1);
});
