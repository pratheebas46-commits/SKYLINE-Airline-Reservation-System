const ganache = require('ganache');
const http = require('http');

const PRIMARY_PORT = parseInt(process.env.GANACHE_PORT || '7545', 10);
const SECONDARY_PORT = 8545;
const TERTIARY_PORT = 1337;
const CHAIN_ID = parseInt(process.env.GANACHE_CHAIN_ID || '1337', 10);
const MNEMONIC = process.env.GANACHE_MNEMONIC || 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

console.log('='.repeat(65));
console.log('  SKYLINE RESERVATION SYSTEM - GANACHE ETHEREUM ENGINE');
console.log('='.repeat(65));
console.log(`[*] Initializing Ganache with Chain ID: ${CHAIN_ID} (0x${CHAIN_ID.toString(16)})`);

const server = ganache.server({
  chain: {
    chainId: CHAIN_ID,
    networkId: CHAIN_ID,
  },
  wallet: {
    mnemonic: MNEMONIC,
    totalAccounts: 10,
    defaultBalance: 100, // 100 ETH per account
  },
  logging: {
    quiet: false,
    verbose: false,
  },
});

function createProxy(proxyPort, targetPort) {
  const proxy = http.createServer((req, res) => {
    // Add CORS headers so MetaMask and browser RPC requests work seamlessly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const pReq = http.request(
      {
        host: '127.0.0.1',
        port: targetPort,
        method: req.method,
        path: req.url,
        headers: req.headers,
      },
      pRes => {
        res.writeHead(pRes.statusCode, pRes.headers);
        pRes.pipe(res);
      }
    );
    pReq.on('error', err => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Proxy to port ${targetPort} failed: ${err.message}` }));
    });
    req.pipe(pReq);
  });

  proxy.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[!] Note: Port ${proxyPort} is already in use by another service. Skipping proxy on this port.`);
    } else {
      console.warn(`[!] Proxy on port ${proxyPort} error:`, err.message);
    }
  });

  proxy.listen(proxyPort, '0.0.0.0', () => {
    console.log(`[+] Dual-port Proxy active on http://127.0.0.1:${proxyPort} -> http://127.0.0.1:${targetPort}`);
  });
  return proxy;
}

server.listen(PRIMARY_PORT, '0.0.0.0', async err => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.log(`[!] Port ${PRIMARY_PORT} is already in use by another Ganache instance or app.`);
      console.log(`    If Ganache GUI is already running on ${PRIMARY_PORT}, you can deploy directly!`);
      process.exit(0);
    }
    console.error('Fatal error starting Ganache:', err);
    process.exit(1);
  }

  console.log(`[+] Ganache RPC Server LIVE on: http://127.0.0.1:${PRIMARY_PORT}`);
  console.log(`[+] Network ID / Chain ID:     ${CHAIN_ID} (0x${CHAIN_ID.toString(16)})`);

  // Start proxies on 8545 and 1337 so whatever port MetaMask is configured with will work
  createProxy(SECONDARY_PORT, PRIMARY_PORT);
  if (PRIMARY_PORT !== TERTIARY_PORT) {
    createProxy(TERTIARY_PORT, PRIMARY_PORT);
  }

  const provider = server.provider;
  const accounts = await provider.request({ method: 'eth_accounts', params: [] });

  console.log('\n--- AVAILABLE TEST ACCOUNTS (Pre-funded with 100 ETH) ---');
  console.log(`Account (0): ${accounts[0]}`);
  console.log(`Account (1): ${accounts[1]}`);
  console.log(`Account (2): ${accounts[2]}`);
  console.log('Mnemonic:   ', MNEMONIC);
  console.log('Private Key (Account 0): 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d');
  console.log('Private Key (Account 1): 0x6cbed15c793ce57650b9877cf2ebe48b0f79614e52aa62248505579f6321a800');
  console.log('='.repeat(65));
  console.log('MetaMask Network Settings:');
  console.log('  Network Name: Ganache Local');
  console.log(`  RPC URL:      http://127.0.0.1:${PRIMARY_PORT} (or http://127.0.0.1:${SECONDARY_PORT})`);
  console.log(`  Chain ID:     ${CHAIN_ID}`);
  console.log('  Currency:     ETH');
  console.log('='.repeat(65));
});

// Handle graceful termination
process.on('SIGINT', () => {
  console.log('\nStopping Ganache...');
  server.close(() => {
    process.exit(0);
  });
});
