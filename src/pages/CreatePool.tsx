import React, { useState } from 'react';
import { TOKEN_LIST } from '../assets/tokenlist';
import { NETWORKS } from '../assets/networks';
import { parseUnits, getAddress, parseAbi, encodeAbiParameters, encodePacked, keccak256, fromHex, toHex } from 'viem';
import { generatePrivateKey } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ABI required for pool creation (e.g. Factory's createPool function)
const FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "tuple", "name": "params", "type": "tuple" }
    ],
    "name": "createPool",
    "outputs": [
      { "internalType": "address", "name": "pool", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... 必要に応じて他の関数 ...
];

// Pool parameter ABI (equivalent to paramsAbi in LibEulerSwap.js)
const PARAMS_ABI = [
  { name: 'asset0', type: 'address' },
  { name: 'asset1', type: 'address' },
  { name: 'priceX', type: 'uint256' },
  { name: 'priceY', type: 'uint256' },
  { name: 'equilibriumReserve0', type: 'uint256' },
  { name: 'equilibriumReserve1', type: 'uint256' },
  { name: 'concentrationX', type: 'uint256' },
  { name: 'concentrationY', type: 'uint256' },
  { name: 'hook', type: 'address' },
  { name: 'eulerAccount', type: 'address' },
];

export default function CreatePool({ networkKey }: { networkKey: string }) {
  const [asset0, setAsset0] = useState('');
  const [asset1, setAsset1] = useState('');
  const [price, setPrice] = useState('');
  const [concentration, setConcentration] = useState('');
  const [status, setStatus] = useState('');
  const [poolAddr, setPoolAddr] = useState('');
  const [txHash, setTxHash] = useState('');
  const tokenList = TOKEN_LIST[networkKey] || [];
  const network = NETWORKS.find(n => n.key === networkKey);

  // Pool作成ロジック
  const handleCreate = async () => {
    setStatus('Creating...');
    setPoolAddr('');
    setTxHash('');
    try {
      // networkが未定義の場合はエラー表示
      if (!network) {
        setStatus('ネットワーク情報が見つかりません');
        return;
      }
      // Format necessary parameters
      const decimals0 = tokenList.find(t => t.address === asset0)?.decimals || 6;
      const decimals1 = tokenList.find(t => t.address === asset1)?.decimals || 6;
      const priceX = parseUnits(price, decimals0);
      const priceY = parseUnits('1', decimals1);
      const eq0 = parseUnits('1000', decimals0); // Temp: initial reserve
      const eq1 = parseUnits('1000', decimals1); // Temp: initial reserve
      const conc = BigInt(concentration || '100000');
      const params = {
        asset0,
        asset1,
        priceX,
        priceY,
        equilibriumReserve0: eq0,
        equilibriumReserve1: eq1,
        concentrationX: conc,
        concentrationY: conc,
        hook: '0x0000000000000000000000000000000000000000',
        eulerAccount: '0x0000000000000000000000000000000000000000',
      };
      // Create wallet client (privateKey for test)
      const account = privateKeyToAccount('0x0123456789012345678901234567890123456789012345678901234567890123');
      const client = createWalletClient({
        account,
        chain: network.viemChain,
        transport: http(network.rpc),
      });
      // Send transaction (simulateContractは使わずwriteContractを直接使う)
      const hash = await client.writeContract({
        address: network.factory as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'createPool',
        args: [params],
        chain: network.viemChain,
      });
      setTxHash(hash as string);
      setStatus('Pool creation transaction sent');
      // It is accurate to get the pool address from the event or TxReceipt
    } catch (e: any) {
      setStatus('Error: ' + (e?.message || e));
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem' }}>
      <h2>Create Pool</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          Asset 0
          <select value={asset0} onChange={e => setAsset0(e.target.value)}>
            <option value="">Select</option>
            {tokenList.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
          </select>
        </label>
        <label>
          Asset 1
          <select value={asset1} onChange={e => setAsset1(e.target.value)}>
            <option value="">Select</option>
            {tokenList.map(t => <option key={t.address} value={t.address}>{t.symbol}</option>)}
          </select>
        </label>
        <label>
          Initial Price
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 1" />
        </label>
        <label>
          Concentration
          <input type="number" value={concentration} onChange={e => setConcentration(e.target.value)} placeholder="e.g. 100000" />
        </label>
        <button onClick={handleCreate} style={{ marginTop: 16 }}>Create Pool</button>
        {status && <div style={{ color: '#888', marginTop: 8 }}>{status}</div>}
        {txHash && <div style={{ color: '#333', marginTop: 8 }}>Tx: {txHash}</div>}
        {poolAddr && <div style={{ color: '#333', marginTop: 8 }}>Pool: {poolAddr}</div>}
      </div>
    </div>
  );
} 