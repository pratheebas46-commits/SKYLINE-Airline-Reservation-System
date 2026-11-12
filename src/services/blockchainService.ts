import { BrowserProvider, Contract, formatEther, type TransactionReceipt } from 'ethers';
import artifact from '../../build/contracts/SkylineBookingLedger.json';

const ENV_CONTRACT_ADDRESS = import.meta.env.VITE_SKYLINE_CONTRACT_ADDRESS as string | undefined;
export const DEFAULT_CHAIN_ID = Number(import.meta.env.VITE_GANACHE_CHAIN_ID || 1337);
export const DEFAULT_RPC_URL = import.meta.env.VITE_GANACHE_RPC_URL || 'http://127.0.0.1:7546';

// Support 1337, 5777, and whatever chain ID is configured in .env.local
const SUPPORTED_CHAIN_IDS = new Set<number>([
  DEFAULT_CHAIN_ID,
  1337,
  5777,
]);

export function isSupportedChain(chainId: number | bigint): boolean {
  return SUPPORTED_CHAIN_IDS.has(Number(chainId));
}

export function resolveContractAddress(chainId?: number): string | null {
  // 1. Explicit environment variable (.env.local) takes highest precedence
  if (ENV_CONTRACT_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(ENV_CONTRACT_ADDRESS)) {
    return ENV_CONTRACT_ADDRESS;
  }

  // 2. Look up deployed address in the compiled artifact for the given chain ID
  const networks = (artifact as any)?.networks || {};
  if (chainId && networks[String(chainId)]?.address) {
    return networks[String(chainId)].address;
  }

  // 3. Fallback to 1337 or 5777 in artifact
  if (networks['1337']?.address) return networks['1337'].address;
  if (networks['5777']?.address) return networks['5777'].address;

  // 4. Fallback to any network address present in artifact
  const firstNetwork = Object.values(networks)[0] as { address?: string } | undefined;
  if (firstNetwork?.address && /^0x[a-fA-F0-9]{40}$/.test(firstNetwork.address)) {
    return firstNetwork.address;
  }

  return null;
}

// Automatically fund any account on local Ganache if balance is low (< 0.1 ETH)
export async function autoFundAccount(address: string, amountEthHex = '0x2b5e3af16b1880000'): Promise<boolean> {
  const candidateUrls = [
    DEFAULT_RPC_URL,
    'http://127.0.0.1:7546',
    'http://127.0.0.1:7545',
    'http://127.0.0.1:8545',
    'http://127.0.0.1:1337',
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'evm_setAccountBalance',
          params: [address, amountEthHex], // 50 ETH
          id: Date.now(),
        }),
      });
      if (response.ok) {
        console.log(`[AutoFund] Credited 50 ETH to ${address} on ${url}`);
        return true;
      }
    } catch {
      // try next candidate port
    }
  }
  return false;
}

const ABI = [
  'function recordBooking(string bookingRef, string flightId, string seatNumber) external',
  'function verifyBooking(string bookingRef) view returns (bool)',
  'function getBooking(string bookingRef) view returns (string,string,string,address,uint64,bool,bool)',
  'function recordCancellation(string bookingRef) external',
  'event BookingRecorded(bytes32 indexed bookingRefHash,string bookingRef,string flightId,string seatNumber,address indexed wallet,uint64 recordedAt)',
  'event BookingCancelled(bytes32 indexed bookingRefHash,string bookingRef,address indexed wallet,uint64 recordedAt)',
];

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export interface BlockchainBookingResult {
  walletAddress: string;
  transactionHash: string;
  blockNumber: number;
  explorerUrl?: string;
  contractAddress?: string;
}

export interface ConnectedWallet {
  address: string;
  balanceEth: string;
  chainId: number;
  contractAddress?: string;
}

function requireProvider(): EthereumProvider {
  if (!window.ethereum) {
    throw new Error('MetaMask was not detected. Please install or unlock MetaMask in your browser, then refresh.');
  }
  return window.ethereum;
}

export async function switchOrAddGanacheNetwork(targetChainId: number = DEFAULT_CHAIN_ID): Promise<void> {
  const injected = requireProvider();
  const hexChainId = '0x' + targetChainId.toString(16);

  try {
    await injected.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (switchError: any) {
    // 4902 means the chain has not yet been added to MetaMask
    if (switchError?.code === 4902 || switchError?.message?.includes('4902')) {
      await injected.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            chainName: `Ganache Local (${targetChainId})`,
            rpcUrls: ['http://127.0.0.1:7546', 'http://127.0.0.1:7545', 'http://127.0.0.1:8545'],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

async function getContract(write = false) {
  const injected = requireProvider();
  const provider = new BrowserProvider(injected as any);
  let network = await provider.getNetwork();
  let chainId = Number(network.chainId);

  if (!isSupportedChain(chainId)) {
    try {
      await switchOrAddGanacheNetwork(DEFAULT_CHAIN_ID);
      const refreshed = await provider.getNetwork();
      chainId = Number(refreshed.chainId);
    } catch {
      // Continue to verify if user remains on wrong network
    }

    if (!isSupportedChain(chainId)) {
      throw new Error(
        `Wrong MetaMask network. Connected to chain ID ${chainId}, but Ganache requires Chain ID ${DEFAULT_CHAIN_ID} (1337). Please switch network in MetaMask.`
      );
    }
  }

  const contractAddress = resolveContractAddress(chainId);
  if (!contractAddress) {
    throw new Error(
      `SkylineBookingLedger contract is not deployed or configured for Chain ID ${chainId}. Run 'npm run blockchain:deploy' to deploy to Ganache.`
    );
  }

  if (write) {
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Verify balance & auto-fund if needed
    try {
      const balance = await provider.getBalance(signerAddress);
      if (Number(formatEther(balance)) < 0.05) {
        await autoFundAccount(signerAddress);
      }
    } catch {
      // ignore
    }

    return {
      contract: new Contract(contractAddress, ABI, signer),
      signerAddress,
      contractAddress,
      chainId,
    };
  }

  return {
    contract: new Contract(contractAddress, ABI, provider),
    signerAddress: '',
    contractAddress,
    chainId,
  };
}

export async function connectWallet(): Promise<ConnectedWallet> {
  const injected = requireProvider();
  const provider = new BrowserProvider(injected as any);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  let network = await provider.getNetwork();
  let chainId = Number(network.chainId);

  if (!isSupportedChain(chainId)) {
    try {
      await switchOrAddGanacheNetwork(DEFAULT_CHAIN_ID);
      const refreshed = await provider.getNetwork();
      chainId = Number(refreshed.chainId);
    } catch (switchErr: any) {
      throw new Error(
        `Wrong MetaMask network. Connected to chain ID ${chainId}. Please switch to Ganache Local (Chain ID ${DEFAULT_CHAIN_ID}).`
      );
    }
  }

  const userAddress = await signer.getAddress();
  let balance = await provider.getBalance(userAddress);
  let balanceEth = Number(formatEther(balance));

  // Auto-fund account if balance is 0 on Ganache
  if (balanceEth < 0.1) {
    const funded = await autoFundAccount(userAddress);
    if (funded) {
      try {
        balance = await provider.getBalance(userAddress);
        balanceEth = Number(formatEther(balance));
      } catch {
        // continue
      }
    }
  }

  const contractAddress = resolveContractAddress(chainId) || undefined;

  return {
    address: userAddress,
    balanceEth: balanceEth.toFixed(4),
    chainId,
    contractAddress,
  };
}

export async function recordBookingOnBlockchain(
  bookingRef: string,
  flightId: string,
  seatNumber: string
): Promise<BlockchainBookingResult> {
  const { contract, signerAddress, contractAddress } = await getContract(true);

  try {
    const exists = await contract.verifyBooking(bookingRef);
    if (exists) {
      throw new Error(`Booking ${bookingRef} is already recorded on the blockchain ledger.`);
    }

    const tx = await contract.recordBooking(bookingRef, flightId, seatNumber);
    const receipt: TransactionReceipt | null = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error('The blockchain transaction was not confirmed successfully.');
    }

    const result: BlockchainBookingResult = {
      walletAddress: signerAddress,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress,
    };

    const storageKey = `skyline:blockchain:${bookingRef}`;
    const prior = JSON.parse(localStorage.getItem('skyline:blockchain-records') || '{}');
    prior[bookingRef] = result;
    localStorage.setItem('skyline:blockchain-records', JSON.stringify(prior));
    localStorage.setItem(storageKey, JSON.stringify(result));

    return result;
  } catch (err: any) {
    if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') {
      throw new Error('Transaction was rejected in MetaMask.');
    }
    if (err?.message?.includes('Booking reference already recorded')) {
      throw new Error(`Booking reference ${bookingRef} is already recorded on-chain.`);
    }
    if (err?.message?.includes('Seat already recorded as booked')) {
      throw new Error(`Seat ${seatNumber} for ${flightId} is already marked as booked on the blockchain.`);
    }
    throw err;
  }
}

export async function verifyBookingOnBlockchain(bookingRef: string) {
  const { contract } = await getContract(false);
  const exists = await contract.verifyBooking(bookingRef);
  if (!exists) return { exists: false as const };
  const item = await contract.getBooking(bookingRef);
  return {
    exists: true as const,
    bookingRef: item[0] as string,
    flightId: item[1] as string,
    seatNumber: item[2] as string,
    walletAddress: item[3] as string,
    recordedAt: Number(item[4]),
    cancelled: Boolean(item[6]),
  };
}
