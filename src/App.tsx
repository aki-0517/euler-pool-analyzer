import { useEffect, useState, useRef, useMemo } from 'react';
import './App.css';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { TOKEN_LIST } from './assets/tokenlist';
import type { TokenInfo } from './assets/tokenlist';
import { NETWORKS } from './assets/networks';
import type { NetworkConfig } from './assets/networks';

// Mainnet EulerSwap contract address
const EULER_FACTORY = '0xb013be1D0D380C13B58e889f412895970A2Cf228';
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
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
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
  const [factoryAddress, setFactoryAddress] = useState(network.factory);
  const [client, setClient] = useState(() => createPublicClient({ chain: network.viemChain, transport: http() }));
  const [tokenList, setTokenList] = useState<TokenInfo[]>(TOKEN_LIST[networkKey] || []);

  // Update client, factory, tokenList on network change
  useEffect(() => {
    setFactoryAddress(network.factory);
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
          address: factoryAddress,
          abi: FACTORY_ABI,
          functionName: 'poolsLength',
        }) as bigint;
        setPoolCount(Number(count));
        // Get pool address list
        const pools = await client.readContract({
          address: factoryAddress,
          abi: FACTORY_ABI,
          functionName: 'pools',
        }) as string[];
        setPoolAddresses(pools);
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
            address: selectedPool,
            abi: POOL_ABI,
            functionName: 'getAssets',
          }) as Promise<[string, string]>,
          client.readContract({
            address: selectedPool,
            abi: POOL_ABI,
            functionName: 'getParams',
          }) as Promise<PoolParams>,
          client.readContract({
            address: selectedPool,
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
          client.readContract({ address: factoryAddress, abi: EXTENDED_FACTORY_ABI, functionName: 'protocolFee' }) as Promise<bigint>,
          client.readContract({ address: factoryAddress, abi: EXTENDED_FACTORY_ABI, functionName: 'protocolFeeRecipient' }) as Promise<string>,
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
        address: factoryAddress,
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
        address: factoryAddress,
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
        address: selectedPool,
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
          address: selectedPool,
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
        const fromBlock = `0x${Math.max(0, latestBlock - 5000).toString(16)}`;
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
        const fromBlock = `0x${Math.max(0, latestBlock - 5000).toString(16)}`;
        const logs = await client.getLogs({
          address: selectedPool,
          fromBlock,
        });
        if (!cancelled) setSwapHistory(logs.filter(l => l.eventName === 'Swap'));
      } catch {
        if (!cancelled) setSwapHistory([]);
      }
      if (!cancelled) setSwapHistoryLoading(false);
    })();
    return () => { cancelled = true; };
  }, [client, selectedPool]);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#222', color: '#fff', padding: '2rem 1rem', minHeight: '100vh', textAlign: 'left' }}>
        {/* Network switcher */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 'bold', marginBottom: 4, display: 'block' }}>Network</label>
          <select value={networkKey} onChange={e => setNetworkKey(e.target.value)} style={{ width: '100%' }}>
            {NETWORKS.map(n => (
              <option key={n.key} value={n.key}>{n.name}</option>
            ))}
          </select>
        </div>
        <h2>EulerSwap Dashboard</h2>
        <div style={{ margin: '2rem 0' }}>
          <div>Network: <b>{network.name}</b></div>
          <div style={{ fontSize: '0.9em', marginTop: 8 }}>
            Factory:<br />
            <span style={{ wordBreak: 'break-all' }}>{factoryAddress}</span>
          </div>
        </div>
        <hr style={{ border: '1px solid #444' }} />
        <div style={{ marginTop: '2rem' }}>
          <b>Filter by Asset Pair</b>
          <div style={{ margin: '0.5em 0' }}>
            <select value={asset0Symbol} onChange={e => setAsset0Symbol(e.target.value)} style={{ width: '100%' }}>
              <option value="">Select Asset0</option>
              {tokenList.map(t => (
                <option key={t.address} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
            <select value={asset1Symbol} onChange={e => setAsset1Symbol(e.target.value)} style={{ width: '100%', marginTop: 4 }}>
              <option value="">Select Asset1</option>
              {tokenList.map(t => (
                <option key={t.address} value={t.symbol}>{t.symbol}</option>
              ))}
            </select>
            <button style={{ width: '100%', marginTop: 4 }} onClick={handlePairFilter}>Filter</button>
          </div>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <b>Search by Account</b>
          <div style={{ margin: '0.5em 0' }}>
            <input placeholder="Account address" value={accountSearch} onChange={e => setAccountSearch(e.target.value)} style={{ width: '100%' }} />
            <button style={{ width: '100%', marginTop: 4 }} onClick={handleAccountSearch}>Search</button>
            {accountPool && <div style={{ fontSize: '0.9em', marginTop: 4, wordBreak: 'break-all' }}>Pool: {accountPool}</div>}
            {accountPoolError && <div style={{ color: 'red', fontSize: '0.9em', marginTop: 4 }}>{accountPoolError}</div>}
          </div>
        </div>
        <hr style={{ border: '1px solid #444', margin: '2rem 0' }} />
        <div style={{ marginTop: '2rem' }}>
          <b>Pool List</b>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {loading ? <li>Loading...</li> :
              poolAddresses.length === 0 ? <li>No pools</li> :
                poolAddresses.map(addr => (
                  <li
                    key={addr}
                    style={{ fontSize: '0.9em', margin: '0.5em 0', wordBreak: 'break-all', cursor: 'pointer', color: selectedPool === addr ? '#61dafb' : undefined }}
                    onClick={() => setSelectedPool(addr)}
                  >
                    {addr}
                  </li>
                ))}
          </ul>
        </div>
      </aside>
      {/* Main */}
      <main style={{ flex: 1, background: '#f5f6fa', padding: '2rem' }}>
        <h1>EulerSwap Pool Summary</h1>
        {loading ? <p>Loading...</p> :
          <>
            <p>Total pools: <b>{poolCount ?? 'Failed to fetch'}</b></p>
            <div style={{ margin: '1em 0' }}>
              <b>Protocol Fee:</b> {protocolFee ?? '...'}<br />
              <b>Protocol Fee Recipient:</b> {protocolFeeRecipient ?? '...'}
            </div>
            {selectedPool && (
              <section style={{ marginTop: '2rem', textAlign: 'left', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem', maxWidth: 800 }}>
                <h2>Pool Details</h2>
                <div style={{ fontSize: '0.95em', marginBottom: 12 }}>
                  <b>Address:</b> <span style={{ wordBreak: 'break-all' }}>{selectedPool}</span>
                </div>
                {poolDetailLoading && <p>Loading pool details...</p>}
                {poolDetailError && <p style={{ color: 'red' }}>{poolDetailError}</p>}
                {poolDetail && (
                  <>
                    <div><b>Asset0:</b> {poolDetail.asset0}</div>
                    <div><b>Asset1:</b> {poolDetail.asset1}</div>
                    <div style={{ marginTop: 10 }}><b>Reserves:</b></div>
                    <div style={{ marginLeft: 16 }}>Asset0: {poolDetail.reserve0.toString()}</div>
                    <div style={{ marginLeft: 16 }}>Asset1: {poolDetail.reserve1.toString()}</div>
                    <div style={{ marginLeft: 16 }}>Status: {poolDetail.status}</div>
                    <div style={{ marginTop: 10 }}><b>Params:</b></div>
                    <div style={{ marginLeft: 16 }}>Vault0: {poolDetail.params.vault0}</div>
                    <div style={{ marginLeft: 16 }}>Vault1: {poolDetail.params.vault1}</div>
                    <div style={{ marginLeft: 16 }}>EulerAccount: {poolDetail.params.eulerAccount}</div>
                    <div style={{ marginLeft: 16 }}>EquilibriumReserve0: {poolDetail.params.equilibriumReserve0.toString()}</div>
                    <div style={{ marginLeft: 16 }}>EquilibriumReserve1: {poolDetail.params.equilibriumReserve1.toString()}</div>
                    <div style={{ marginLeft: 16 }}>PriceX: {poolDetail.params.priceX.toString()}</div>
                    <div style={{ marginLeft: 16 }}>PriceY: {poolDetail.params.priceY.toString()}</div>
                    <div style={{ marginLeft: 16 }}>ConcentrationX: {poolDetail.params.concentrationX.toString()}</div>
                    <div style={{ marginLeft: 16 }}>ConcentrationY: {poolDetail.params.concentrationY.toString()}</div>
                    <div style={{ marginLeft: 16 }}>Fee: {poolDetail.params.fee.toString()}</div>
                    <div style={{ marginLeft: 16 }}>ProtocolFee: {poolDetail.params.protocolFee.toString()}</div>
                    <div style={{ marginLeft: 16 }}>ProtocolFeeRecipient: {poolDetail.params.protocolFeeRecipient}</div>
                  </>
                )}
                {/* Swap Simulator */}
                {poolDetail && (
                  <div style={{ marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
                    <h3>Swap Simulator</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={swapSim.direction} onChange={e => setSwapSim(s => ({ ...s, direction: e.target.value as 'in' | 'out', result: null, error: null }))}>
                        <option value="in">Input → Output</option>
                        <option value="out">Output → Input</option>
                      </select>
                      <input ref={swapSimAmountRef} type="number" min="0" placeholder="Amount" value={swapSim.amount} onChange={e => setSwapSim(s => ({ ...s, amount: e.target.value, result: null, error: null }))} style={{ width: 120 }} />
                      <button onClick={handleSwapSim}>Quote</button>
                    </div>
                    {swapSim.limits && (
                      <div style={{ fontSize: '0.9em', marginTop: 4 }}>
                        Max Input: {swapSim.limits.maxIn}<br />
                        Max Output: {swapSim.limits.maxOut}
                      </div>
                    )}
                    {swapSim.result && <div style={{ marginTop: 8 }}>Quote Result: <b>{swapSim.result}</b></div>}
                    {swapSim.error && <div style={{ color: 'red', marginTop: 8 }}>{swapSim.error}</div>}
                  </div>
                )}
                {/* Swap History */}
                <div style={{ marginTop: 24 }}>
                  <h3>Swap History</h3>
                  {swapHistoryLoading ? <div>Loading swap history...</div> :
                    swapHistory.length === 0 ? <div>No swaps found.</div> :
                      <>
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
                        <SwapHistoryChart data={swapHistory} />
                      </>
                  }
                </div>
              </section>
            )}
            {/* Recent Events */}
            <section style={{ marginTop: '2rem', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem', maxWidth: 800 }}>
              <h2>Recent Events</h2>
              {eventLoading ? <div>Loading events...</div> :
                eventError ? <div style={{ color: 'red' }}>{eventError}</div> :
                  recentEvents.length === 0 ? <div>No events found.</div> :
                    <table style={{ width: '100%', fontSize: '0.95em' }}>
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Block</th>
                          <th>Args/Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEvents.slice(-20).reverse().map(renderEventRow)}
                      </tbody>
                    </table>
              }
            </section>
          </>
        }
      </main>
    </div>
  );
}

export default App;
