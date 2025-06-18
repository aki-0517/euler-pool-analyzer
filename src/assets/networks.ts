import { mainnet, base, avalanche, bsc } from 'viem/chains';

export type NetworkConfig = {
  key: string;
  name: string;
  chainId: number;
  viemChain: any;
  factory: string;
};

export const NETWORKS: NetworkConfig[] = [
  {
    key: 'mainnet',
    name: 'Ethereum Mainnet',
    chainId: 1,
    viemChain: mainnet,
    factory: '0xb013be1D0D380C13B58e889f412895970A2Cf228',
  },
  {
    key: 'base',
    name: 'Base',
    chainId: 8453,
    viemChain: base,
    factory: '0xf0CFe22d23699ff1B2CFe6B8f706A6DB63911262',
  },
  {
    key: 'avalanche',
    name: 'Avalanche C-Chain',
    chainId: 43114,
    viemChain: avalanche,
    factory: '0x8A1D3a4850ed7deeC9003680Cf41b8E75D27e440',
  },
  {
    key: 'bsc',
    name: 'BNB Smart Chain',
    chainId: 56,
    viemChain: bsc,
    factory: '0x3e378e5E339DF5e0Da32964F9EEC2CDb90D28Cc7',
  },
  {
    key: 'unichain',
    name: 'Unichain',
    chainId: 130,
    viemChain: {
      id: 130,
      name: 'Unichain',
      network: 'unichain',
      nativeCurrency: { name: 'Unichain', symbol: 'UNI', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.unichain.org'] } },
      blockExplorers: { default: { name: 'Unichain Explorer', url: 'https://uniscan.xyz' } }
    },
    factory: '0x45b146BC07c9985589B52df651310e75C6BE066A',
  },
  // Add more networks as needed
]; 