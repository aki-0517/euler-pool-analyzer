import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './App.css';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { TOKEN_LIST } from './assets/tokenlist';
import type { TokenInfo } from './assets/tokenlist';
import { NETWORKS } from './assets/networks';
import type { NetworkConfig } from './assets/networks';

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

// Event topics for logs
const EVENT_TOPICS = {
  PoolDeployed: '0x7e2e7e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e2e', // placeholder, replace with actual
  PoolUninstalled: '0x...', // placeholder
  ProtocolFeeSet: '0x...', // placeholder
  ProtocolFeeRecipientSet: '0x...', // placeholder
  Swap: '0x...', // placeholder
};

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

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
  const [poolDetailLoading, setPoolDetailLoading] = useState(false);
  const [poolDetailError, setPoolDetailError] = useState<string | null>(null);
  const [asset0Filter, setAsset0Filter] = useState('');
  const [asset1Filter, setAsset1Filter] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountPool, setAccountPool] = useState<string | null>(null);
  const [accountPoolError, setAccountPoolError] = useState<string | null>(null);
  const [protocolFee, setProtocolFee] = useState<string | null>(null);
  const [protocolFeeRecipient, setProtocolFeeRecipient] = useState<string | null>(null);
  const [swapSim, setSwapSim] = useState<{ direction: 'in' | 'out'; amount: string; result: string | null; error: string | null; limits: { maxIn: string; maxOut: string } | null }>({ direction: 'in', amount: '', result: null, error: null, limits: null });
  const [swapHistory, setSwapHistory] = useState<any[]>([]);
  const [swapHistoryLoading, setSwapHistoryLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const swapSimAmountRef = useRef<HTMLInputElement>(null);
  const [networkKey, setNetworkKey] = useState('mainnet');
  const network: NetworkConfig = useMemo(() => NETWORKS.find(n => n.key === networkKey)!, [networkKey]);
  const [factoryAddress, setFactoryAddress] = useState<`0x${string}`>(network.factory as `0x${string}`);
  const [client, setClient] = useState(() => createPublicClient({ chain: network.viemChain, transport: http() }));
  const [tokenList, setTokenList] = useState<TokenInfo[]>(TOKEN_LIST[networkKey] || []);
  const [swapHistoryWithTimestamp, setSwapHistoryWithTimestamp] = useState<any[]>([]);

  // --- Fee & Volume Metrics Calculation (contract-accurate, English) ---
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [cumulativeMetrics, setCumulativeMetrics] = useState<any>({});

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
      setPoolDetailError(null);
      return;
    }
    setPoolDetailLoading(true);
    setPoolDetailError(null);
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
      } catch (e) {
        setPoolDetailError('Failed to fetch pool details.');
      }
      setPoolDetailLoading(false);
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

  // Pool filter by asset pair
  const handlePairFilter = async () => {
    if (!asset0Filter || !asset1Filter) return;
    setLoading(true);
    try {
      const filtered = await client.readContract({
        address: factoryAddress as `0x${string}`,
        abi: EXTENDED_FACTORY_ABI,
        functionName: 'poolsByPair',
        args: [asset0Filter, asset1Filter],
      }) as string[];
      setPoolAddresses(filtered);
    } catch {
      setPoolAddresses([]);
    }
    setLoading(false);
  };

  // Account search
  const handleAccountSearch = async () => {
    if (!accountSearch) return;
    setAccountPoolError(null);
    setAccountPool(null);
    try {
      const pool = await client.readContract({
        address: factoryAddress as `0x${string}`,
        abi: EXTENDED_FACTORY_ABI,
        functionName: 'poolByEulerAccount',
        args: [accountSearch],
      }) as string;
      setAccountPool(pool && pool !== '0x0000000000000000000000000000000000000000' ? pool : null);
      if (!pool || pool === '0x0000000000000000000000000000000000000000') setAccountPoolError('No pool found for this account.');
    } catch {
      setAccountPoolError('Failed to fetch pool for this account.');
    }
  };

  // Swap simulator
  const handleSwapSim = async () => {
    if (!selectedPool || !poolDetail) return;
    setSwapSim(s => ({ ...s, result: null, error: null }));
    try {
      const tokenIn = swapSim.direction === 'in' ? poolDetail.asset0 : poolDetail.asset1;
      const tokenOut = swapSim.direction === 'in' ? poolDetail.asset1 : poolDetail.asset0;
      const amount = BigInt(swapSim.amount);
      const quote = await client.readContract({
        address: selectedPool as `0x${string}`,
        abi: EXTENDED_POOL_ABI,
        functionName: 'computeQuote',
        args: [tokenIn, tokenOut, amount, swapSim.direction === 'in'],
      }) as bigint;
      setSwapSim(s => ({ ...s, result: quote.toString() }));
    } catch (e: any) {
      setSwapSim(s => ({ ...s, result: null, error: 'Failed to get quote.' }));
    }
  };

  // Fetch swap limits for simulator
  useEffect(() => {
    if (!selectedPool || !poolDetail) return;
    const fetchLimits = async () => {
      try {
        const [maxIn, maxOut] = await client.readContract({
          address: selectedPool as `0x${string}`,
          abi: EXTENDED_POOL_ABI,
          functionName: 'getLimits',
          args: [poolDetail.asset0, poolDetail.asset1],
        }) as [bigint, bigint];
        setSwapSim(s => ({ ...s, limits: { maxIn: maxIn.toString(), maxOut: maxOut.toString() } }));
      } catch {
        setSwapSim(s => ({ ...s, limits: null }));
      }
    };
    fetchLimits();
  }, [selectedPool, poolDetail]);

  // Asset pair filter using token symbols
  const [asset0Symbol, setAsset0Symbol] = useState('');
  const [asset1Symbol, setAsset1Symbol] = useState('');
  const asset0Addr = useMemo(() => tokenList.find(t => t.symbol === asset0Symbol)?.address || '', [asset0Symbol, tokenList]);
  const asset1Addr = useMemo(() => tokenList.find(t => t.symbol === asset1Symbol)?.address || '', [asset1Symbol, tokenList]);

  // Event log fetching
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    setEventLoading(true);
    setEventError(null);
    (async () => {
      try {
        const latestBlock = await client.getBlockNumber();
        const fromBlock = (latestBlock - 5000n > 0n ? latestBlock - 5000n : 0n);
        const logs = await client.getLogs({
          address: factoryAddress,
          fromBlock,
        });
        if (!cancelled) setRecentEvents(logs);
      } catch (e) {
        if (!cancelled) {
          setEventError('Failed to fetch events');
          setRecentEvents([]);
        }
      }
      if (!cancelled) setEventLoading(false);
    })();
    return () => { cancelled = true; };
  }, [client, factoryAddress]);

  // Swap history for selected pool
  useEffect(() => {
    if (!selectedPool) return;
    let cancelled = false;
    setSwapHistoryLoading(true);
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
      if (!cancelled) setSwapHistoryLoading(false);
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

  // Helper: decode event args (viem log format)
  function renderEventRow(log: any, i: number) {
    return (
      <tr key={i}>
        <td>{log.eventName || log.topics?.[0]?.slice(0, 10) || 'Unknown'}</td>
        <td>{log.blockNumber}</td>
        <td style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>{JSON.stringify(log.args || log.data)}</td>
      </tr>
    );
  }

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

  // --- 新: プールアナライザー用の主要指標計算 ---
  // トークン情報取得
  const asset0Info = useMemo(() => tokenList.find(t => t.address.toLowerCase() === poolDetail?.asset0?.toLowerCase()), [poolDetail, tokenList]);
  const asset1Info = useMemo(() => tokenList.find(t => t.address.toLowerCase() === poolDetail?.asset1?.toLowerCase()), [poolDetail, tokenList]);
  // Fee（%）
  const feePct = useMemo(() => poolDetail ? (Number(poolDetail.params.fee) / 1e6).toFixed(2) : '-', [poolDetail]);
  // バランス比率
  const balanceRatio = useMemo(() => poolDetail ? (Number(poolDetail.reserve0) / Number(poolDetail.reserve1)).toFixed(3) : '-', [poolDetail]);
  // TVL（USD換算はAPI必要なので、ここではReserve合計を表示）
  const tvl = useMemo(() => poolDetail ? (Number(poolDetail.reserve0) + Number(poolDetail.reserve1)).toLocaleString() : '-', [poolDetail]);
  // スワップボリューム（直近20件合計）
  const swapVolume = useMemo(() => swapHistory.reduce((sum, log) => sum + Number(log.args?.amount0In || 0) + Number(log.args?.amount1In || 0), 0), [swapHistory]);
  // 価格推移データ
  const priceHistory = useMemo(() => swapHistory.map(log => {
    const a0 = Number(log.args?.amount0In || 0);
    const a1 = Number(log.args?.amount1Out || 0);
    return a0 > 0 && a1 > 0 ? a1 / a0 : null;
  }).filter(v => v !== null), [swapHistory]);
  // Fee APR（理論値: 年間ボリューム×fee/TVL）
  const feeApr = useMemo(() => {
    if (!poolDetail || !swapVolume) return '-';
    const fee = Number(poolDetail.params.fee) / 1e6;
    // 直近20件を1日分と仮定し年率換算
    const annualVolume = swapVolume * 365;
    const apr = tvl !== '-' && Number(tvl) > 0 ? (annualVolume * fee / Number(tvl) * 100).toFixed(2) : '-';
    return apr;
  }, [poolDetail, swapVolume, tvl]);

  // --- 新: 主要指標カードUI ---
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

  // --- 新: 価格推移グラフ ---
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
      </aside>
      {/* Main: Global summary + pool analyzer */}
      <main style={{ flex: 1, background: '#f5f6fa', padding: '2rem' }}>
        {/* Global summary */}
        <section style={{ marginBottom: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '1.5rem', maxWidth: 800 }}>
          <h2 style={{ marginBottom: 8 }}>EulerSwap Summary</h2>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><b>Network:</b> {network.name}</div>
            <div><b>Total Pools:</b> {poolCount ?? '...'}</div>
            <div><b>Protocol Fee:</b> {protocolFee ?? '...'}</div>
            <div><b>Protocol Fee Recipient:</b> <span style={{ fontSize: '0.95em', wordBreak: 'break-all' }}>{protocolFeeRecipient ?? '...'}</span></div>
            <div><b>Factory:</b> <span style={{ fontSize: '0.95em', wordBreak: 'break-all' }}>{factoryAddress}</span></div>
          </div>
        </section>
        {/* Pool analyzer */}
        {selectedPool && poolDetail && (
          <section style={{ marginTop: '2rem', textAlign: 'left', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem', maxWidth: 800 }}>
            <h2 style={{ marginBottom: 8 }}>Pool Analyzer</h2>
            <div style={{ fontSize: '1.1em', marginBottom: 8 }}>
              <b>{asset0Info?.symbol || poolDetail.asset0}</b> / <b>{asset1Info?.symbol || poolDetail.asset1}</b>
              <span style={{ color: '#888', fontSize: '0.9em', marginLeft: 8 }}>{selectedPool}</span>
            </div>
            <PoolStatsCards />

            {/* --- New: Fee & Volume Metrics Cards --- */}
            <div style={{ display: 'flex', gap: 24, margin: '1.5em 0', flexWrap: 'wrap' }}>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 160, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Cumulative Protocol Fees</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{cumulativeMetrics.protocolFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 160, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Cumulative LP Fees</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{cumulativeMetrics.lpFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 160, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Cumulative Total Fees</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{cumulativeMetrics.totalFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16, minWidth: 160, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#888' }}>Cumulative Trading Volume</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{cumulativeMetrics.tradingVolume?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              </div>
            </div>

            {/* --- New: Daily Metrics Table --- */}
            <div style={{ margin: '2em 0 1em 0' }}>
              <b>Daily Fee & Volume Metrics</b>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.95em', marginTop: 8, background: '#f8f9fa', borderRadius: 8 }}>
                  <thead>
                    <tr>
                      <th>Date (UTC)</th>
                      <th>Protocol Fees</th>
                      <th>LP Fees</th>
                      <th>Total Fees</th>
                      <th>Trading Volume</th>
                      <th>Swap Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyMetrics.map((row: any) => (
                      <tr key={row.day}>
                        <td>{row.day}</td>
                        <td>{row.protocolFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td>{row.lpFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td>{row.totalFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td>{row.tradingVolume.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td>{row.swapCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- New: Daily Trends Line Chart (Total Fees & Volume) --- */}
            <div style={{ margin: '2em 0 1em 0' }}>
              <b>Daily Trends</b>
              <svg width={600} height={180} style={{ background: '#f8f9fa', borderRadius: 8, marginTop: 8 }}>
                {/* X axis labels */}
                {dailyMetrics.map((row: any, i: number) => (
                  <text key={row.day} x={60 + i * 40} y={170} fontSize="10" fill="#888" textAnchor="middle">{row.day.slice(5)}</text>
                ))}
                {/* Y axis (left) */}
                <text x={10} y={30} fontSize="10" fill="#888">Fees</text>
                {/* Y axis (right) */}
                <text x={580} y={30} fontSize="10" fill="#888">Volume</text>
                {/* Total Fees line */}
                <polyline
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="2"
                  points={dailyMetrics.map((row: any, i: number) => `${60 + i * 40},${160 - (row.totalFee / Math.max(...dailyMetrics.map((r: any) => r.totalFee), 1)) * 120}`).join(' ')}
                />
                {/* Trading Volume line */}
                <polyline
                  fill="none"
                  stroke="#2196f3"
                  strokeWidth="2"
                  points={dailyMetrics.map((row: any, i: number) => `${60 + i * 40},${160 - (row.tradingVolume / Math.max(...dailyMetrics.map((r: any) => r.tradingVolume), 1)) * 120}`).join(' ')}
                />
              </svg>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                <span style={{ color: '#ff9800' }}>■</span> Total Fees &nbsp; <span style={{ color: '#2196f3' }}>■</span> Trading Volume
              </div>
            </div>

            {/* Existing swap volume, price history, and swap history table remain below */}
            <div style={{ margin: '1.5em 0 0.5em 0' }}>
              <b>Swap Volume (last 20):</b> {swapVolume.toLocaleString()}
            </div>
            <div style={{ margin: '1em 0' }}>
              <b>Price History</b>
              <PriceHistoryChart />
            </div>
            <div style={{ margin: '1em 0' }}>
              <b>Swap History (last 20)</b>
              <table style={{ width: '100%', fontSize: '0.95em', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Amount0In</th>
                    <th>Amount1In</th>
                    <th>Amount0Out</th>
                    <th>Amount1Out</th>
                    <th>Reserve0</th>
                    <th>Reserve1</th>
                    <th>To</th>
                    <th>Block</th>
                  </tr>
                </thead>
                <tbody>
                  {swapHistory.slice(-20).reverse().map(renderSwapRow)}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {!selectedPool && <div style={{ marginTop: 80, color: '#888', fontSize: '1.2em' }}>Please select a pool</div>}
      </main>
    </div>
  );
}

export default App;
