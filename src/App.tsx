import { useEffect, useState, useMemo } from 'react';
import './App.css';
import { createPublicClient, http } from 'viem';
import { TOKEN_LIST } from './assets/tokenlist';
import type { TokenInfo } from './assets/tokenlist';
import { NETWORKS } from './assets/networks';
import type { NetworkConfig } from './assets/networks';
import PoolAnalyzerMain from './pages/PoolAnalyzerMain';
import { GlobalStyles, NetworkSelector, ProtocolOverview, PoolSelectionGrid, PoolInfoHeader } from './components/ModernUI';

// Enhanced Factory ABI with all available functions
const FACTORY_ABI = [
  {
    "inputs": [],
    "name": "poolsLength",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "start", "type": "uint256" }, { "internalType": "uint256", "name": "end", "type": "uint256" }],
    "name": "poolsSlice",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "asset0", "type": "address" }, { "internalType": "address", "name": "asset1", "type": "address" }],
    "name": "poolsByPair",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "who", "type": "address" }],
    "name": "poolByEulerAccount",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolFeeRecipient",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Enhanced Pool ABI with all available functions
const POOL_ABI = [
  {
    "inputs": [],
    "name": "getAssets",
    "outputs": [
      { "internalType": "address", "name": "asset0", "type": "address" },
      { "internalType": "address", "name": "asset1", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getParams",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "vault0", "type": "address" },
          { "internalType": "address", "name": "vault1", "type": "address" },
          { "internalType": "address", "name": "eulerAccount", "type": "address" },
          { "internalType": "uint112", "name": "equilibriumReserve0", "type": "uint112" },
          { "internalType": "uint112", "name": "equilibriumReserve1", "type": "uint112" },
          { "internalType": "uint256", "name": "priceX", "type": "uint256" },
          { "internalType": "uint256", "name": "priceY", "type": "uint256" },
          { "internalType": "uint256", "name": "concentrationX", "type": "uint256" },
          { "internalType": "uint256", "name": "concentrationY", "type": "uint256" },
          { "internalType": "uint256", "name": "fee", "type": "uint256" },
          { "internalType": "uint256", "name": "protocolFee", "type": "uint256" },
          { "internalType": "address", "name": "protocolFeeRecipient", "type": "address" }
        ],
        "internalType": "struct IEulerSwap.Params",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      { "internalType": "uint112", "name": "reserve0", "type": "uint112" },
      { "internalType": "uint112", "name": "reserve1", "type": "uint112" },
      { "internalType": "uint32", "name": "status", "type": "uint32" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLimits",
    "outputs": [
      { "internalType": "uint256", "name": "maxIn0", "type": "uint256" },
      { "internalType": "uint256", "name": "maxOut0", "type": "uint256" },
      { "internalType": "uint256", "name": "maxIn1", "type": "uint256" },
      { "internalType": "uint256", "name": "maxOut1", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "curve",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "pure",
    "type": "function"
  }
];

// Enhanced Vault ABI with additional ERC4626 functions
const VAULT_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }],
    "name": "convertToAssets",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }],
    "name": "convertToShares",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalAssets",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "asset",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];





// Type definitions
type PoolParams = {
  vault0: string;
  vault1: string;
  eulerAccount: string;
  equilibriumReserve0: bigint;
  equilibriumReserve1: bigint;
  priceX: bigint;
  priceY: bigint;
  concentrationX: bigint;
  concentrationY: bigint;
  fee: bigint;
  protocolFee: bigint;
  protocolFeeRecipient: string;
};

type VaultData = {
  shares0: bigint;
  shares1: bigint;
  assets0: bigint;
  assets1: bigint;
  totalAssets0: bigint;
  totalAssets1: bigint;
  totalSupply0: bigint;
  totalSupply1: bigint;
};

function App() {
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [poolAddresses, setPoolAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<`0x${string}` | null>(null);
  const [poolDetail, setPoolDetail] = useState<{
    asset0: string;
    asset1: string;
    params: PoolParams;
    reserve0: bigint;
    reserve1: bigint;
    status: number;
  } | null>(null);
  const [protocolFee, setProtocolFee] = useState<string | null>(null);
  const [protocolFeeRecipient, setProtocolFeeRecipient] = useState<string | null>(null);
  const [swapHistory, setSwapHistory] = useState<any[]>([]);
  const [networkKey, setNetworkKey] = useState('mainnet');
  const network: NetworkConfig = useMemo(() => NETWORKS.find(n => n.key === networkKey)!, [networkKey]);
  const [factoryAddress, setFactoryAddress] = useState<`0x${string}`>(network.factory as `0x${string}`);
  const [client, setClient] = useState(() => createPublicClient({ chain: network.viemChain, transport: http() }));
  const [tokenList, setTokenList] = useState<TokenInfo[]>(TOKEN_LIST[networkKey] || []);
  const [swapHistoryWithTimestamp, setSwapHistoryWithTimestamp] = useState<any[]>([]);

  // --- Fee & Volume Metrics Calculation (contract-accurate, English) ---
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [cumulativeMetrics, setCumulativeMetrics] = useState<any>({});

  // Enhanced state for comprehensive pool data
  const [vaultData, setVaultData] = useState<VaultData | null>(null);

  useEffect(() => {
    if (!swapHistoryWithTimestamp.length || !poolDetail) {
      setDailyMetrics([]);
      setCumulativeMetrics({});
      return;
    }
    // Get fee and protocolFee from pool params
    const fee = Number(poolDetail.params.fee) / 1e18; // e.g. 0.001
    const protocolFeeRate = Number(poolDetail.params.protocolFee) / 1e18; // e.g. 0.1

    // Group by day (UTC)
    const dayMap: Record<string, any> = {};
    let cumulative = {
      protocolFee: 0,
      lpFee: 0,
      totalFee: 0,
      tradingVolume: 0,
      swapCount: 0,
    };

    for (const log of swapHistoryWithTimestamp) {
      const netIn = Number(log.args?.amount0In || 0) + Number(log.args?.amount1In || 0);
      if (netIn === 0) continue;
      const grossIn = netIn / (1 - fee);
      const totalFee = grossIn - netIn;
      const protocolFee = totalFee * protocolFeeRate;
      const lpFee = totalFee - protocolFee;
      const ts = log.timestamp ? new Date(log.timestamp * 1000) : null;
      const day = ts ? ts.toISOString().slice(0, 10) : 'unknown';
      if (!dayMap[day]) {
        dayMap[day] = {
          protocolFee: 0,
          lpFee: 0,
          totalFee: 0,
          tradingVolume: 0,
          swapCount: 0,
          day,
        };
      }
      dayMap[day].protocolFee += protocolFee;
      dayMap[day].lpFee += lpFee;
      dayMap[day].totalFee += totalFee;
      dayMap[day].tradingVolume += grossIn;
      dayMap[day].swapCount += 1;
      cumulative.protocolFee += protocolFee;
      cumulative.lpFee += lpFee;
      cumulative.totalFee += totalFee;
      cumulative.tradingVolume += grossIn;
      cumulative.swapCount += 1;
    }
    // Convert to sorted array
    const dailyArr = Object.values(dayMap).sort((a: any, b: any) => a.day.localeCompare(b.day));
    setDailyMetrics(dailyArr);
    setCumulativeMetrics(cumulative);
  }, [swapHistoryWithTimestamp, poolDetail]);

  // Update client, factory, tokenList on network change
  useEffect(() => {
    setFactoryAddress(network.factory as `0x${string}`);
    setClient(createPublicClient({ chain: network.viemChain, transport: http() }));
    setTokenList(TOKEN_LIST[networkKey] || []);
    setSelectedPool(null);
    setPoolAddresses([]);
    setPoolCount(null);
    setLoading(true);
  }, [networkKey, network]);

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      try {
        const count = await client.readContract({
          address: factoryAddress as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'poolsLength',
        }) as bigint;
        setPoolCount(Number(count));
        // Fetch all pool addresses in batches using poolsSlice
        const batchSize = 100;
        let allPools: string[] = [];
        for (let i = 0; i < Number(count); i += batchSize) {
          const end = Math.min(i + batchSize, Number(count));
          const batch = await client.readContract({
            address: factoryAddress as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: 'poolsSlice',
            args: [BigInt(i), BigInt(end)],
          }) as string[];
          allPools = allPools.concat(batch);
        }
        setPoolAddresses(allPools);
      } catch (e) {
        setPoolCount(null);
        setPoolAddresses([]);
      }
      setLoading(false);
    };
    fetchPools();
  }, [client, factoryAddress]);

  useEffect(() => {
    if (!selectedPool) {
      setPoolDetail(null);
      setVaultData(null);
      return;
    }
    setPoolDetail(null);
    const fetchDetail = async () => {
      try {
        const [assets, params, reserves] = await Promise.all([
          client.readContract({
            address: selectedPool as `0x${string}`,
            abi: POOL_ABI,
            functionName: 'getAssets',
          }) as Promise<[string, string]>,
          client.readContract({
            address: selectedPool as `0x${string}`,
            abi: POOL_ABI,
            functionName: 'getParams',
          }) as Promise<PoolParams>,
          client.readContract({
            address: selectedPool as `0x${string}`,
            abi: POOL_ABI,
            functionName: 'getReserves',
          }) as Promise<[bigint, bigint, number]>,
        ]);
        setPoolDetail({
          asset0: assets[0],
          asset1: assets[1],
          params,
          reserve0: reserves[0],
          reserve1: reserves[1],
          status: reserves[2],
        });
        // Vault Available取得
        const [shares0, shares1] = await Promise.all([
          client.readContract({
            address: params.vault0 as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'balanceOf',
            args: [params.eulerAccount],
          }) as Promise<bigint>,
          client.readContract({
            address: params.vault1 as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'balanceOf',
            args: [params.eulerAccount],
          }) as Promise<bigint>,
        ]);
        const [avail0, avail1] = await Promise.all([
          client.readContract({
            address: params.vault0 as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'convertToAssets',
            args: [shares0],
          }) as Promise<bigint>,
          client.readContract({
            address: params.vault1 as `0x${string}`,
            abi: VAULT_ABI,
            functionName: 'convertToAssets',
            args: [shares1],
          }) as Promise<bigint>,
        ]);
        setVaultData({
          shares0: shares0,
          shares1: shares1,
          assets0: avail0,
          assets1: avail1,
          totalAssets0: 0n,
          totalAssets1: 0n,
          totalSupply0: 0n,
          totalSupply1: 0n,
        });
      } catch (e) {
        setVaultData(null);
      }
    };
    fetchDetail();
  }, [selectedPool]);

  // Fetch protocol fee info
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const [fee, recipient] = await Promise.all([
          client.readContract({ address: factoryAddress as `0x${string}`, abi: FACTORY_ABI, functionName: 'protocolFee' }) as Promise<bigint>,
          client.readContract({ address: factoryAddress as `0x${string}`, abi: FACTORY_ABI, functionName: 'protocolFeeRecipient' }) as Promise<string>,
        ]);
        setProtocolFee((Number(fee) / 1e18).toString());
        setProtocolFeeRecipient(recipient);
      } catch {
        setProtocolFee(null);
        setProtocolFeeRecipient(null);
      }
    };
    fetchFee();
  }, [client, factoryAddress]);







  // Swap history for selected pool
  useEffect(() => {
    if (!selectedPool) return;
    let cancelled = false;
    (async () => {
      try {
        const latestBlock = await client.getBlockNumber();
        const fromBlock = (latestBlock - 5000n > 0n ? latestBlock - 5000n : 0n);
        const logs = await client.getLogs({
          address: selectedPool!,
          fromBlock,
        });
        if (!cancelled) setSwapHistory(logs);
      } catch {
        if (!cancelled) setSwapHistory([]);
      }
    })();
    return () => { cancelled = true; };
  }, [client, selectedPool]);

  // swapHistory取得後、blockNumberからtimestampを取得して付与
  useEffect(() => {
    if (!swapHistory.length || !client) {
      setSwapHistoryWithTimestamp([]);
      return;
    }
    let cancelled = false;
    (async () => {
      // blockNumberの重複を避けて一括取得
      const blockNumbers = Array.from(new Set(swapHistory.map(log => log.blockNumber)));
      const blockMap: Record<string, number> = {};
      await Promise.all(blockNumbers.map(async (bn) => {
        try {
          const block = await client.getBlock({ blockNumber: BigInt(bn) });
          blockMap[bn] = Number(block.timestamp);
        } catch {
          blockMap[bn] = 0;
        }
      }));
      if (cancelled) return;
      // 各logにtimestampを付与
      setSwapHistoryWithTimestamp(swapHistory.map(log => ({ ...log, timestamp: blockMap[log.blockNumber] })));
    })();
    return () => { cancelled = true; };
  }, [swapHistory, client]);


  // Helper: decode swap event args
  function renderSwapRow(log: any, i: number) {
    const args = log.args || {};
    return (
      <tr key={i}>
        <td>{args.sender}</td>
        <td>{args.amount0In}</td>
        <td>{args.amount1In}</td>
        <td>{args.amount0Out}</td>
        <td>{args.amount1Out}</td>
        <td>{args.reserve0}</td>
        <td>{args.reserve1}</td>
        <td>{args.to}</td>
        <td>{log.blockNumber}</td>
      </tr>
    );
  }


  // --- New: Main metrics calculation for Pool Analyzer ---
  // Get token info
  const asset0Info = useMemo(() => tokenList.find(t => t.address.toLowerCase() === poolDetail?.asset0?.toLowerCase()), [poolDetail, tokenList]);
  const asset1Info = useMemo(() => tokenList.find(t => t.address.toLowerCase() === poolDetail?.asset1?.toLowerCase()), [poolDetail, tokenList]);
  // Swap volume (sum of last 20)
  const swapVolume = useMemo(() => swapHistory.reduce((sum, log) => sum + Number(log.args?.amount0In || 0) + Number(log.args?.amount1In || 0), 0), [swapHistory]);
  // Price history data
  const priceHistory = useMemo(() => swapHistory.map(log => {
    const a0 = Number(log.args?.amount0In || 0);
    const a1 = Number(log.args?.amount1Out || 0);
    return a0 > 0 && a1 > 0 ? a1 / a0 : null;
  }).filter(v => v !== null), [swapHistory]);

  // --- New: Main metrics calculation for Pool Analyzer ---
  function PoolStatsCards() {
    // This component is now replaced by the MetricsGrid but kept for compatibility
    return null;
  }

  // --- New: Price history chart ---
  function PriceHistoryChart() {
    if (!priceHistory.length) return null;
    const width = 320, height = 80, pad = 20;
    const maxY = Math.max(...priceHistory, 1);
    return (
      <svg width={width} height={height} style={{ background: '#f8f9fa', borderRadius: 8, marginTop: 8 }}>
        <polyline
          fill="none"
          stroke="#4caf50"
          strokeWidth="2"
          points={priceHistory.map((y, i) => `${pad + (width - 2 * pad) * (i / Math.max(priceHistory.length - 1, 1))},${height - pad - (height - 2 * pad) * (y / maxY)}`).join(' ')}
        />
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#bbb" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#bbb" />
        <text x={pad} y={pad} fontSize="10" fill="#888">{maxY.toFixed(4)}</text>
        <text x={pad} y={height - 4} fontSize="10" fill="#888">0</text>
      </svg>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        {/* Main Content Container */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
          {/* Network Selection */}
          <NetworkSelector 
            networks={NETWORKS}
            selectedNetwork={networkKey}
            onNetworkChange={setNetworkKey}
          />
          
          {/* Protocol Overview */}
          <ProtocolOverview 
            network={network}
            poolCount={poolCount ?? 0}
            protocolFee={protocolFee}
            protocolFeeRecipient={protocolFeeRecipient ?? ''}
            factoryAddress={factoryAddress}
          />
          
          {/* Pool Selection */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <PoolSelectionGrid 
              pools={poolAddresses}
              selectedPool={selectedPool}
              onPoolSelect={(pool) => setSelectedPool(pool as `0x${string}`)}
              loading={loading}
            />
          </div>
          
          {/* Pool Analysis */}
          {selectedPool && poolDetail && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <PoolInfoHeader 
                poolAddress={selectedPool}
                asset0Info={asset0Info}
                asset1Info={asset1Info}
                poolDetail={poolDetail}
              />
              <PoolAnalyzerMain
                network={network}
                poolCount={poolCount ?? 0}
                protocolFee={protocolFee}
                protocolFeeRecipient={protocolFeeRecipient ?? ''}
                factoryAddress={factoryAddress}
                loading={loading}
                poolAddresses={poolAddresses}
                selectedPool={selectedPool ?? ''}
                setSelectedPool={setSelectedPool}
                poolDetail={poolDetail}
                asset0Info={asset0Info}
                asset1Info={asset1Info}
                cumulativeMetrics={cumulativeMetrics}
                dailyMetrics={dailyMetrics}
                swapVolume={swapVolume ?? 0}
                PriceHistoryChart={PriceHistoryChart}
                swapHistory={swapHistory}
                renderSwapRow={(row: any) => renderSwapRow(row, 0)}
                PoolStatsCards={PoolStatsCards}
                vaultData={vaultData}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
