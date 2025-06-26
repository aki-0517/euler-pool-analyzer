import { useEffect, useState, useRef, useMemo } from 'react';
import './App.css';
import { createPublicClient, http } from 'viem';
import { TOKEN_LIST } from './assets/tokenlist';
import type { TokenInfo } from './assets/tokenlist';
import { NETWORKS } from './assets/networks';
import type { NetworkConfig } from './assets/networks';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Swap from './pages/Swap';
import CreatePool from './pages/CreatePool';
import DepositPool from './pages/DepositPool';
import PoolAnalyzerMain from './pages/PoolAnalyzerMain';

// Mainnet EulerSwap contract address
const EULER_FACTORY = '0xb013be1D0D380C13B58e889f412895970A2Cf228' as `0x${string}`;
// Factory ABI (only necessary functions)
const FACTORY_ABI = [
  {
    "inputs": [],
    "name": "poolsLength",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pools",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Pool ABI (only necessary functions)
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
  }
];

// IERC4626 ABI（VaultのAvailable取得用）
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
  }
];

// Add Factory ABI for poolsByPair, poolsByPairLength, poolByEulerAccount
const EXTENDED_FACTORY_ABI = [
  ...FACTORY_ABI,
  {
    "inputs": [
      { "internalType": "address", "name": "asset0", "type": "address" },
      { "internalType": "address", "name": "asset1", "type": "address" }
    ],
    "name": "poolsByPair",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "who", "type": "address" }
    ],
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
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "start", "type": "uint256" },
      { "internalType": "uint256", "name": "end", "type": "uint256" }
    ],
    "name": "poolsSlice",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Pool ABI for computeQuote, getLimits
const EXTENDED_POOL_ABI = [
  ...POOL_ABI,
  {
    "inputs": [
      { "internalType": "address", "name": "tokenIn", "type": "address" },
      { "internalType": "address", "name": "tokenOut", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "bool", "name": "exactIn", "type": "bool" }
    ],
    "name": "computeQuote",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "tokenIn", "type": "address" },
      { "internalType": "address", "name": "tokenOut", "type": "address" }
    ],
    "name": "getLimits",
    "outputs": [
      { "internalType": "uint256", "name": "maxIn", "type": "uint256" },
      { "internalType": "uint256", "name": "maxOut", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];



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

  // Add Vault Available to pool detail state
  const [vaultAvailable, setVaultAvailable] = useState<{ available0: string | null, available1: string | null }>({ available0: null, available1: null });

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
            abi: EXTENDED_FACTORY_ABI,
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
      setVaultAvailable({ available0: null, available1: null });
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
        setVaultAvailable({
          available0: avail0.toString(),
          available1: avail1.toString(),
        });
      } catch (e) {
        setVaultAvailable({ available0: null, available1: null });
      }
    };
    fetchDetail();
  }, [selectedPool]);

  // Fetch protocol fee info
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const [fee, recipient] = await Promise.all([
          client.readContract({ address: factoryAddress as `0x${string}`, abi: EXTENDED_FACTORY_ABI, functionName: 'protocolFee' }) as Promise<bigint>,
          client.readContract({ address: factoryAddress as `0x${string}`, abi: EXTENDED_FACTORY_ABI, functionName: 'protocolFeeRecipient' }) as Promise<string>,
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

  // SVG chart for swap history (amount0In or amount1In)
  function SwapHistoryChart({ data }: { data: any[] }) {
    if (!data.length) return null;
    const points = data.slice(-20).map((log, i) => {
      const y = Number(log.args?.amount0In || log.args?.amount1In || 0);
      return { x: i, y };
    });
    const maxY = Math.max(...points.map(p => p.y), 1);
    const width = 300, height = 80, pad = 20;
    return (
      <svg width={width} height={height} style={{ background: '#f8f9fa', borderRadius: 8, marginTop: 8 }}>
        <polyline
          fill="none"
          stroke="#61dafb"
          strokeWidth="2"
          points={points.map(p => `${pad + (width - 2 * pad) * (p.x / Math.max(points.length - 1, 1))},${height - pad - (height - 2 * pad) * (p.y / maxY)}`).join(' ')}
        />
        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#bbb" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#bbb" />
        {/* Labels */}
        <text x={pad} y={pad} fontSize="10" fill="#888">{maxY}</text>
        <text x={pad} y={height - 4} fontSize="10" fill="#888">0</text>
      </svg>
    );
  }

  // --- New: Main metrics calculation for Pool Analyzer ---
  // Get token info
  const asset0Info = useMemo(() => tokenList.find(t => t.address.toLowerCase() === poolDetail?.asset0?.toLowerCase()), [poolDetail, tokenList]);
  const asset1Info = useMemo(() => tokenList.find(t => t.address.toLowerCase() === poolDetail?.asset1?.toLowerCase()), [poolDetail, tokenList]);
  // Fee (%)
  const feePct = useMemo(() => poolDetail ? (Number(poolDetail.params.fee) / 1e6).toFixed(2) : '-', [poolDetail]);
  // Balance ratio
  const balanceRatio = useMemo(() => poolDetail ? (Number(poolDetail.reserve0) / Number(poolDetail.reserve1)).toFixed(3) : '-', [poolDetail]);
  // TVL (show total reserve here, USD conversion needs API)
  const tvl = useMemo(() => poolDetail ? (Number(poolDetail.reserve0) + Number(poolDetail.reserve1)).toLocaleString() : '-', [poolDetail]);
  // Swap volume (sum of last 20)
  const swapVolume = useMemo(() => swapHistory.reduce((sum, log) => sum + Number(log.args?.amount0In || 0) + Number(log.args?.amount1In || 0), 0), [swapHistory]);
  // Price history data
  const priceHistory = useMemo(() => swapHistory.map(log => {
    const a0 = Number(log.args?.amount0In || 0);
    const a1 = Number(log.args?.amount1Out || 0);
    return a0 > 0 && a1 > 0 ? a1 / a0 : null;
  }).filter(v => v !== null), [swapHistory]);
  // Fee APR (theoretical: annual volume × fee / TVL)
  const feeApr = useMemo(() => {
    if (!poolDetail || !swapVolume) return '-';
    const fee = Number(poolDetail.params.fee) / 1e6;
    // Assume last 20 swaps as 1 day, annualize
    const annualVolume = swapVolume * 365;
    const apr = tvl !== '-' && Number(tvl) > 0 ? (annualVolume * fee / Number(tvl) * 100).toFixed(2) : '-';
    return apr;
  }, [poolDetail, swapVolume, tvl]);

  // --- New: Main metrics calculation for Pool Analyzer ---
  function PoolStatsCards() {
    return (
      <div style={{ display: 'flex', gap: 24, margin: '1.5em 0' }}>
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888' }}>Fee</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{feePct}%</div>
        </div>
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888' }}>TVL (sum)</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{tvl}</div>
        </div>
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888' }}>Vault 0 Available</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{vaultAvailable.available0 ?? '-'}</div>
        </div>
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888' }}>Vault 1 Available</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{vaultAvailable.available1 ?? '-'}</div>
        </div>
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888' }}>Balance Ratio</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{balanceRatio}</div>
        </div>
        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888' }}>Fee APR (est)</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{feeApr === '-' ? '-' : feeApr + '%'}</div>
        </div>
      </div>
    );
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
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar: Network switcher and pool list */}
        <aside style={{ width: 260, background: '#222', color: '#fff', padding: '2rem 1rem', minHeight: '100vh', textAlign: 'left' }}>
          {/* Network Switcher */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}>Network</label>
            <select value={networkKey} onChange={e => setNetworkKey(e.target.value)} style={{ width: '100%' }}>
              {NETWORKS.map(n => (
                <option key={n.key} value={n.key}>{n.name}</option>
              ))}
            </select>
          </div>
          <h2>Pool Analyzer</h2>
          <div style={{ marginTop: '2rem' }}>
            <b>Pool List</b>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {loading ? <li>Loading...</li> :
                poolAddresses.length === 0 ? <li>No pools</li> :
                  poolAddresses.map(addr => (
                    <li
                      key={addr}
                      style={{ fontSize: '0.9em', margin: '0.5em 0', wordBreak: 'break-all', cursor: 'pointer', color: selectedPool === addr ? '#61dafb' : undefined }}
                      onClick={() => setSelectedPool(addr as `0x${string}`)}
                    >
                      {addr}
                    </li>
                  ))}
            </ul>
          </div>
          <nav style={{ marginTop: 32 }}>
            <Link to="/" style={{ display: 'block', color: '#fff', marginBottom: 12 }}>Pool Analyzer</Link>
            <Link to="/swap" style={{ display: 'block', color: '#fff', marginBottom: 12 }}>Swap</Link>
            <Link to="/create-pool" style={{ display: 'block', color: '#fff', marginBottom: 12 }}>Create Pool</Link>
            <Link to="/deposit-pool" style={{ display: 'block', color: '#fff', marginBottom: 12 }}>Deposit</Link>
          </nav>
        </aside>
        {/* Main: ルーティングで切り替え */}
        <main style={{ flex: 1, background: '#f5f6fa', padding: '2rem' }}>
          <Routes>
            <Route path="/" element={
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
              />
            } />
            <Route path="/swap" element={<Swap networkKey={networkKey} />} />
            <Route path="/create-pool" element={<CreatePool networkKey={networkKey} />} />
            <Route path="/deposit-pool" element={<DepositPool />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
