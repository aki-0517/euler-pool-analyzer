import React, { useState, useMemo, useEffect } from 'react';
import { TOKEN_LIST } from '../assets/tokenlist';
import { NETWORKS } from '../assets/networks';
import { createPublicClient, http } from 'viem';

// Factory/Pool ABI（App.tsxと同じものを利用）
const FACTORY_ABI = [
  { "inputs": [], "name": "poolsLength", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "pools", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "asset0", "type": "address" }, { "internalType": "address", "name": "asset1", "type": "address" } ], "name": "poolsByPair", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" }
];
const POOL_ABI = [
  { "inputs": [], "name": "getAssets", "outputs": [ { "internalType": "address", "name": "asset0", "type": "address" }, { "internalType": "address", "name": "asset1", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getParams", "outputs": [ { "components": [ { "internalType": "address", "name": "vault0", "type": "address" }, { "internalType": "address", "name": "vault1", "type": "address" }, { "internalType": "address", "name": "eulerAccount", "type": "address" }, { "internalType": "uint112", "name": "equilibriumReserve0", "type": "uint112" }, { "internalType": "uint112", "name": "equilibriumReserve1", "type": "uint112" }, { "internalType": "uint256", "name": "priceX", "type": "uint256" }, { "internalType": "uint256", "name": "priceY", "type": "uint256" }, { "internalType": "uint256", "name": "concentrationX", "type": "uint256" }, { "internalType": "uint256", "name": "concentrationY", "type": "uint256" }, { "internalType": "uint256", "name": "fee", "type": "uint256" }, { "internalType": "uint256", "name": "protocolFee", "type": "uint256" }, { "internalType": "address", "name": "protocolFeeRecipient", "type": "address" } ], "internalType": "struct IEulerSwap.Params", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getReserves", "outputs": [ { "internalType": "uint112", "name": "reserve0", "type": "uint112" }, { "internalType": "uint112", "name": "reserve1", "type": "uint112" }, { "internalType": "uint32", "name": "status", "type": "uint32" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "tokenIn", "type": "address" }, { "internalType": "address", "name": "tokenOut", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "bool", "name": "exactIn", "type": "bool" } ], "name": "computeQuote", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
];
const VAULT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "convertToAssets", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

// MaglevLens ABI（必要部分のみ）
const MAGLEV_LENS_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "eulerSwapFactory", "type": "address" }
    ],
    "name": "getEulerSwaps",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "addr", "type": "address" },
          { "internalType": "tuple", "name": "params", "type": "tuple" }, // 省略可
          { "internalType": "address", "name": "asset0", "type": "address" },
          { "internalType": "address", "name": "asset1", "type": "address" },
          { "internalType": "uint256", "name": "reserve0", "type": "uint256" },
          { "internalType": "uint256", "name": "reserve1", "type": "uint256" },
          { "internalType": "uint256", "name": "inLimit01", "type": "uint256" },
          { "internalType": "uint256", "name": "outLimit01", "type": "uint256" },
          { "internalType": "uint256", "name": "inLimit10", "type": "uint256" },
          { "internalType": "uint256", "name": "outLimit10", "type": "uint256" }
        ],
        "internalType": "struct MaglevLens.EulerSwapData[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address[]", "name": "eulerSwaps", "type": "address[]" },
      { "internalType": "address", "name": "tokenIn", "type": "address" },
      { "internalType": "address", "name": "tokenOut", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "bool", "name": "exactIn", "type": "bool" }
    ],
    "name": "eulerSwapQuoteMulti",
    "outputs": [
      { "internalType": "uint256[]", "name": "quotes", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// MaglevLensコントラクトアドレス（devland用）
const MAGLEV_LENS_ADDRESS = "0x11dE489De683DbBe8e1483700656F54280224531";
// EulerSwapFactoryアドレス（devland用、必要に応じて設定）
const EULER_SWAP_FACTORY_ADDRESS = "0x..."; // TODO: dev-ctx/addresses/31337/EulerSwapFactory.json などから取得

export default function Swap({ networkKey }: { networkKey: string }) {
  const [fromSymbol, setFromSymbol] = useState('');
  const [toSymbol, setToSymbol] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [account, setAccount] = useState('');
  const [poolAddresses, setPoolAddresses] = useState<string[]>([]);
  const [poolDetails, setPoolDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceMap, setPriceMap] = useState<any>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [lensPools, setLensPools] = useState<any[]>([]);
  const [lensQuotes, setLensQuotes] = useState<any[]>([]);
  const [lensLoading, setLensLoading] = useState(false);
  const tokenList = useMemo(() => TOKEN_LIST[networkKey] || [], [networkKey]);
  const network = useMemo(() => NETWORKS.find(n => n.key === networkKey)!, [networkKey]);
  const client = useMemo(() => createPublicClient({ chain: network.viemChain, transport: http() }), [network]);

  // アセットアドレス取得
  const fromAddr = useMemo(() => tokenList.find(t => t.symbol === fromSymbol)?.address || '', [fromSymbol, tokenList]);
  const toAddr = useMemo(() => tokenList.find(t => t.symbol === toSymbol)?.address || '', [toSymbol, tokenList]);

  // プール一覧取得
  useEffect(() => {
    if (!fromAddr || !toAddr) {
      setPoolAddresses([]);
      setPoolDetails([]);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const pools = await client.readContract({
          address: network.factory as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'poolsByPair',
          args: [fromAddr, toAddr],
        }) as string[];
        setPoolAddresses(pools);
      } catch {
        setPoolAddresses([]);
      }
      setLoading(false);
    })();
  }, [fromAddr, toAddr, client, network.factory]);

  // --- 価格API取得 ---
  useEffect(() => {
    setPriceLoading(true);
    fetch('https://app.euler.finance/api/v1/price?chainId=1')
      .then(res => res.json())
      .then(data => setPriceMap(data))
      .catch(() => setPriceMap({}))
      .finally(() => setPriceLoading(false));
  }, []);

  // 各プール詳細取得
  useEffect(() => {
    if (!poolAddresses.length) {
      setPoolDetails([]);
      return;
    }
    setLoading(true);
    (async () => {
      const details = await Promise.all(poolAddresses.map(async (addr) => {
        try {
          const [params, reserves] = await Promise.all([
            client.readContract({ address: addr as `0x${string}`, abi: POOL_ABI, functionName: 'getParams' }) as Promise<any>,
            client.readContract({ address: addr as `0x${string}`, abi: POOL_ABI, functionName: 'getReserves' }) as Promise<[bigint, bigint, number]>,
          ]);
          // Vault Available
          let available0 = null, available1 = null;
          if (account) {
            try {
              const [shares0, shares1] = await Promise.all([
                client.readContract({ address: params.vault0 as `0x${string}`, abi: VAULT_ABI, functionName: 'balanceOf', args: [account] }) as Promise<bigint>,
                client.readContract({ address: params.vault1 as `0x${string}`, abi: VAULT_ABI, functionName: 'balanceOf', args: [account] }) as Promise<bigint>,
              ]);
              const [avail0, avail1] = await Promise.all([
                client.readContract({ address: params.vault0 as `0x${string}`, abi: VAULT_ABI, functionName: 'convertToAssets', args: [shares0] }) as Promise<bigint>,
                client.readContract({ address: params.vault1 as `0x${string}`, abi: VAULT_ABI, functionName: 'convertToAssets', args: [shares1] }) as Promise<bigint>,
              ]);
              available0 = avail0.toString();
              available1 = avail1.toString();
            } catch {}
          }
          // Price（priceX/priceY）
          const price = params.priceX && params.priceY ? (Number(params.priceX) / Number(params.priceY)).toPrecision(8) : '-';
          // Quote
          let quote = null;
          if (amountIn) {
            try {
              quote = await client.readContract({
                address: addr as `0x${string}`,
                abi: POOL_ABI,
                functionName: 'computeQuote',
                args: [fromAddr, toAddr, BigInt(amountIn), true],
              }) as bigint;
              quote = quote.toString();
            } catch {}
          }
          // シンボル・USD価格
          const token0 = tokenList.find(t => t.address.toLowerCase() === params.asset0?.toLowerCase() || t.address.toLowerCase() === params.vault0?.toLowerCase());
          const token1 = tokenList.find(t => t.address.toLowerCase() === params.asset1?.toLowerCase() || t.address.toLowerCase() === params.vault1?.toLowerCase());
          const symbol0 = token0?.symbol || '-';
          const symbol1 = token1?.symbol || '-';
          const price0 = priceMap[params.asset0?.toLowerCase()]?.price || 0;
          const price1 = priceMap[params.asset1?.toLowerCase()]?.price || 0;
          // TVL（USD換算）
          const tvl = Number(reserves[0]) * price0 + Number(reserves[1]) * price1;
          // QuoteのUSD換算
          let quoteUsd = null;
          if (quote && price1) {
            quoteUsd = (Number(quote) * price1).toLocaleString(undefined, { maximumFractionDigits: 4 });
          }
          return {
            addr,
            available0,
            available1,
            price,
            quote,
            quoteUsd,
            reserves,
            params,
            symbol0,
            symbol1,
            price0,
            price1,
            tvl,
          };
        } catch {
          return null;
        }
      }));
      setPoolDetails(details.filter(Boolean));
      setLoading(false);
    })();
  }, [poolAddresses, client, account, amountIn, fromAddr, toAddr, tokenList]);

  // --- MaglevLensから全プール情報取得 ---
  useEffect(() => {
    if (!MAGLEV_LENS_ADDRESS || !EULER_SWAP_FACTORY_ADDRESS) return;
    setLensLoading(true);
    (async () => {
      try {
        const client = createPublicClient({
          chain: { id: 31337, name: 'devland', network: 'devland', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['http://localhost:8545'] } } },
          transport: http('http://localhost:8545'),
        });
        // getEulerSwapsで全プール情報取得
        const pools = await client.readContract({
          address: MAGLEV_LENS_ADDRESS,
          abi: MAGLEV_LENS_ABI,
          functionName: 'getEulerSwaps',
          args: [EULER_SWAP_FACTORY_ADDRESS],
        }) as any[];
        setLensPools(pools);
      } catch (e) {
        setLensPools([]);
      } finally {
        setLensLoading(false);
      }
    })();
  }, [MAGLEV_LENS_ADDRESS, EULER_SWAP_FACTORY_ADDRESS]);

  // --- アセット・Amount In入力時にeulerSwapQuoteMultiでQuote一括取得 ---
  useEffect(() => {
    if (!MAGLEV_LENS_ADDRESS || !lensPools.length || !fromSymbol || !toSymbol || !amountIn) return;
    (async () => {
      try {
        const client = createPublicClient({
          chain: { id: 31337, name: 'devland', network: 'devland', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['http://localhost:8545'] } } },
          transport: http('http://localhost:8545'),
        });
        // tokenIn, tokenOutアドレス取得
        const tokenList = TOKEN_LIST[networkKey] || [];
        const fromToken = tokenList.find(t => t.symbol === fromSymbol)?.address;
        const toToken = tokenList.find(t => t.symbol === toSymbol)?.address;
        if (!fromToken || !toToken) return;
        // プールアドレス一覧
        const poolAddrs = lensPools.map(p => p.addr);
        // eulerSwapQuoteMultiで一括見積もり
        const quotes = await client.readContract({
          address: MAGLEV_LENS_ADDRESS,
          abi: MAGLEV_LENS_ABI,
          functionName: 'eulerSwapQuoteMulti',
          args: [poolAddrs, fromToken, toToken, BigInt(Number(amountIn) * 10 ** 6), true], // 例: USDC/USDTは6桁
        }) as any[];
        setLensQuotes(quotes);
      } catch (e) {
        setLensQuotes([]);
      }
    })();
  }, [MAGLEV_LENS_ADDRESS, lensPools, fromSymbol, toSymbol, amountIn, networkKey]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem' }}>
      <h2>Swap</h2>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <label>From</label>
          <select value={fromSymbol} onChange={e => setFromSymbol(e.target.value)} style={{ width: '100%' }}>
            <option value="">Choose asset</option>
            {tokenList.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>To</label>
          <select value={toSymbol} onChange={e => setToSymbol(e.target.value)} style={{ width: '100%' }}>
            <option value="">Choose asset</option>
            {tokenList.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <label>Amount In</label>
          <input type="number" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Slippage (%)</label>
          <input type="number" value={slippage} onChange={e => setSlippage(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label>Account</label>
          <input type="text" value={account} onChange={e => setAccount(e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>
      {/* プール情報一覧テーブル */}
      <div style={{ marginTop: 32 }}>
        {lensLoading ? (
          <div>Loading...</div>
        ) : lensPools.length === 0 ? (
          <div style={{ color: '#888' }}>該当プールがありません</div>
        ) : (
          <table style={{ width: '100%', marginTop: 32, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                <th>Pool</th>
                <th>From</th>
                <th>To</th>
                <th>TVL (USD)</th>
                <th>Vault 0 Avail</th>
                <th>Vault 1 Avail</th>
                <th>Price</th>
                <th>Quote</th>
                <th>Quote (USD)</th>
                <th>Min Received</th>
                <th>Swap</th>
              </tr>
            </thead>
            <tbody>
              {lensPools.map((p, i) => {
                // priceMapからシンボル・価格取得（小文字アドレスで参照）
                const fromInfo = priceMap[p.asset0?.toLowerCase?.() || ''];
                const toInfo = priceMap[p.asset1?.toLowerCase?.() || ''];
                const fromSymbol = fromInfo?.symbol || '-';
                const toSymbol = toInfo?.symbol || '-';
                const price0 = fromInfo?.price || 0;
                const price1 = toInfo?.price || 0;
                // reserve/available/quoteが未定義なら0扱い
                const reserve0 = Number(p.reserve0 ?? 0);
                const reserve1 = Number(p.reserve1 ?? 0);
                // TVL(USD)
                const tvlUsd = price0 && price1 ? ((reserve0 * price0) / 10 ** 6 + (reserve1 * price1) / 10 ** 6) : '-';
                // Vault Available（ここではreserveをそのまま表示）
                const vault0Avail = price0 ? `${(reserve0 / 10 ** 6).toFixed(4)} (${(reserve0 * price0 / 10 ** 6).toFixed(2)}$)` : '-';
                const vault1Avail = price1 ? `${(reserve1 / 10 ** 6).toFixed(4)} (${(reserve1 * price1 / 10 ** 6).toFixed(2)}$)` : '-';
                // Price（単純な比率）
                const price = reserve1 > 0 ? (reserve0 / reserve1).toFixed(8) : '-';
                // Quote
                const quote = lensQuotes[i] !== undefined ? Number(lensQuotes[i]) / 10 ** 6 : '-';
                // Quote(USD)
                const quoteUsd = quote !== '-' && price1 ? (Number(quote) * price1).toFixed(2) : '-';
                // Min Received（スリッページ考慮）
                const minReceived = quote !== '-' ? (Number(quote) * (1 - Number(slippage) / 100)).toFixed(6) : '-';
                return (
                  <tr key={p.addr}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.addr}</td>
                    <td>{fromSymbol}</td>
                    <td>{toSymbol}</td>
                    <td>{tvlUsd !== '-' ? `$${Number(tvlUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}</td>
                    <td>{vault0Avail}</td>
                    <td>{vault1Avail}</td>
                    <td>{price}</td>
                    <td>{quote !== '-' ? Number(quote).toFixed(6) : '-'}</td>
                    <td>{quoteUsd !== '-' ? `$${quoteUsd}` : '-'}</td>
                    <td>{minReceived !== '-' ? minReceived : '-'}</td>
                    <td><button disabled={quote === '-' || Number(quote) === 0}>Swap</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 