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
  const [poolSearchFilter, setPoolSearchFilter] = useState<string>('');
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(true);
  const [poolDataLoading, setPoolDataLoading] = useState<boolean>(false);
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
        // Fetch all pool addresses in parallel batches using poolsSlice for maximum speed
        const batchSize = 200; // Increased batch size for efficiency
        const batchPromises: Promise<string[]>[] = [];
        
        // Create all batch promises
        for (let i = 0; i < Number(count); i += batchSize) {
          const end = Math.min(i + batchSize, Number(count));
          batchPromises.push(
            client.readContract({
              address: factoryAddress as `0x${string}`,
              abi: FACTORY_ABI,
              functionName: 'poolsSlice',
              args: [BigInt(i), BigInt(end)],
            }) as Promise<string[]>
          );
        }
        
        // Execute all batches in parallel and flatten results
        const batchResults = await Promise.all(batchPromises);
        const allPools = batchResults.flat();
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
      setPoolDataLoading(false);
      return;
    }
    
    // プール選択時に即座にローディング開始
    setPoolDataLoading(true);
    setPoolDetail(null);
    setVaultData(null);
    
    const fetchDetail = async () => {
      try {
        // 段階的にデータを読み込んで体感速度を向上
        console.log('🔄 Fetching basic pool data...');
        
        // Step 1: 基本プール情報を並列取得
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
        
        // 基本情報をすぐに表示
        setPoolDetail({
          asset0: assets[0],
          asset1: assets[1],
          params,
          reserve0: reserves[0],
          reserve1: reserves[1],
          status: reserves[2],
        });
        
        console.log('✅ Basic pool data fetched successfully');
        console.log('🔄 Fetching vault data...');
        
        // Step 2: ボルト情報を並列取得
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
        
        // shares取得後にconvertToAssetsを実行
        const [convertedAssets0, convertedAssets1] = await Promise.all([
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
          assets0: convertedAssets0,
          assets1: convertedAssets1,
          totalAssets0: 0n,
          totalAssets1: 0n,
          totalSupply0: 0n,
          totalSupply1: 0n,
        });
        
        console.log('✅ Vault data fetched successfully');
        
      } catch (e) {
        console.error('❌ Pool data fetch error:', e);
        setVaultData(null);
      } finally {
        setPoolDataLoading(false);
      }
    };
    
    fetchDetail();
  }, [selectedPool, client]);

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







  // Swap history for selected pool (最適化版)
  useEffect(() => {
    if (!selectedPool) {
      setSwapHistory([]);
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      try {
        console.log('🔄 Fetching swap history...');
        
        const latestBlock = await client.getBlockNumber();
        // ブロック範囲を1000に減らして高速化
        const fromBlock = (latestBlock - 1000n > 0n ? latestBlock - 1000n : 0n);
        
        const logs = await client.getLogs({
          address: selectedPool!,
          fromBlock,
        });
        
        if (!cancelled) {
          setSwapHistory(logs);
          console.log(`✅ Swap history fetched successfully (${logs.length} entries)`);
        }
      } catch (error) {
        console.error('❌ Swap history fetch error:', error);
        if (!cancelled) setSwapHistory([]);
      }
    })();
    
    return () => { cancelled = true; };
  }, [client, selectedPool]);

  // swapHistory取得後、blockNumberからtimestampを取得して付与（最適化版）
  useEffect(() => {
    if (!swapHistory.length || !client) {
      setSwapHistoryWithTimestamp([]);
      return;
    }
    
    let cancelled = false;
    
    (async () => {
      try {
        console.log('🔄 Fetching block timestamps...');
        
        // blockNumberの重複を避けて一括取得（最大10ブロックまで制限）
        const uniqueBlockNumbers = Array.from(new Set(swapHistory.map(log => log.blockNumber))).slice(0, 10);
        const blockMap: Record<string, number> = {};
        
        // 並列でブロック情報を取得（最大5並列）
        const batchSize = 5;
        for (let i = 0; i < uniqueBlockNumbers.length; i += batchSize) {
          const batch = uniqueBlockNumbers.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (bn) => {
            try {
              const block = await client.getBlock({ blockNumber: BigInt(bn) });
              blockMap[bn] = Number(block.timestamp);
            } catch (error) {
              console.warn(`⚠️ Failed to fetch timestamp for block ${bn}:`, error);
              blockMap[bn] = 0;
            }
          }));
          
          if (cancelled) return;
        }
        
        if (cancelled) return;
        
        // 各logにtimestampを付与
        const enrichedHistory = swapHistory.map(log => ({ 
          ...log, 
          timestamp: blockMap[log.blockNumber] || 0 
        }));
        
        setSwapHistoryWithTimestamp(enrichedHistory);
        console.log(`✅ Block timestamps fetched successfully (${uniqueBlockNumbers.length} blocks)`);
        
      } catch (error) {
        console.error('❌ Block timestamp fetch error:', error);
        if (!cancelled) setSwapHistoryWithTimestamp(swapHistory.map(log => ({ ...log, timestamp: 0 })));
      }
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

  // Filtered pools based on search
  const filteredPools = poolAddresses.filter(pool => {
    if (!poolSearchFilter) return true;
    return pool.toLowerCase().includes(poolSearchFilter.toLowerCase());
  });

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex' }}>
        {/* Side Menu */}
        <div style={{ 
          width: sideMenuOpen ? 400 : 60, 
          background: '#fff', 
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease',
          position: 'relative',
          zIndex: 100
        }}>
          {/* Toggle Button */}
          <button 
            onClick={() => setSideMenuOpen(!sideMenuOpen)}
            style={{
              position: 'absolute',
              top: 20,
              right: -15,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}
          >
            {sideMenuOpen ? '‹' : '›'}
          </button>

          {sideMenuOpen && (
            <div style={{ padding: 20, height: '100vh', overflowY: 'auto' }}>
              {/* Network Selection */}
              <div style={{ marginBottom: 24 }}>
                <NetworkSelector 
                  networks={NETWORKS}
                  selectedNetwork={networkKey}
                  onNetworkChange={setNetworkKey}
                />
              </div>

              {/* Pool Search Filter */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 1
                }}>
                  Filter Pools
                </label>
                <input
                  type="text"
                  placeholder="Search by address..."
                  value={poolSearchFilter}
                  onChange={(e) => setPoolSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Pool Selection */}
              <PoolSelectionGrid 
                pools={filteredPools}
                selectedPool={selectedPool}
                onPoolSelect={(pool) => setSelectedPool(pool as `0x${string}`)}
                loading={loading}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 24, maxWidth: 'calc(100vw - 400px)' }}>
          {/* Protocol Overview */}
          <ProtocolOverview 
            network={network}
            poolCount={poolCount ?? 0}
            protocolFee={protocolFee}
            protocolFeeRecipient={protocolFeeRecipient ?? ''}
            factoryAddress={factoryAddress}
          />
          
          {/* Pool Analysis - Now takes full width and is more prominent */}
          {poolDataLoading ? (
            <div style={{ 
              background: '#fff', 
              borderRadius: 16, 
              padding: 64, 
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: 60,
                height: 60,
                border: '6px solid #e0e7ff',
                borderTop: '6px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1.5s linear infinite',
                marginBottom: 24
              }} />
              <h2 style={{ color: '#3b82f6', margin: 0, fontSize: 24, fontWeight: 600 }}>Loading Pool Analytics...</h2>
              <p style={{ color: '#6b7280', marginTop: 8, fontSize: 16 }}>Please wait a moment</p>
              <div style={{ 
                marginTop: 16,
                padding: '8px 16px',
                background: '#f1f5f9',
                borderRadius: 8,
                fontSize: 14,
                color: '#6b7280'
              }}>
                💡 Initial loading may take some time
              </div>
            </div>
          ) : selectedPool && poolDetail ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
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
          ) : (
            <div style={{ 
              background: '#fff', 
              borderRadius: 16, 
              padding: 64, 
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h2 style={{ color: '#6b7280', margin: 0, fontSize: 24 }}>Select a Pool to View Analytics</h2>
              <p style={{ color: '#9ca3af', marginTop: 8 }}>Choose a pool from the side menu to see detailed analytics and metrics</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
