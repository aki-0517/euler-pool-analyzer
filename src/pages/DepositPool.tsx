import React, { useState } from 'react';
import { TOKEN_LIST } from '../assets/tokenlist';
import { NETWORKS } from '../assets/networks';
import * as LibEulerSwap from '../lib/LibEulerSwap';

export default function DepositPool({ networkKey }: { networkKey: string }) {
  const [tab, setTab] = useState<'deposit'|'curve'|'address'|'price'|'math'>('deposit');
  // Common parameters
  const [poolAddr, setPoolAddr] = useState('');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [status, setStatus] = useState('');
  const [curveResult, setCurveResult] = useState<string>('');
  const [tightened, setTightened] = useState<[bigint, bigint] | null>(null);
  const [price, setPrice] = useState<string>('');
  const [genAddr, setGenAddr] = useState<{addr:string,salt:string}|null>(null);
  const [creationCode, setCreationCode] = useState<string>('');
  const [priceFrac, setPriceFrac] = useState<[any,any]>();
  const [fVal, setFVal] = useState<string>('');
  const [fInvVal, setFInvVal] = useState<string>('');
  const tokenList = TOKEN_LIST[networkKey] || [];

  // Temporary: Get pool parameters (originally from on-chain getParams)
  const params = {
    priceX: 1_000_000n,
    priceY: 1_000_000n,
    equilibriumReserve0: 1_000_000n,
    equilibriumReserve1: 1_000_000n,
    concentrationX: 100_000n,
    concentrationY: 100_000n,
  };

  // --- Curve validation ---
  const handleCurveCheck = () => {
    try {
      const x = BigInt(amount0 || '0');
      const y = BigInt(amount1 || '0');
      const isOnCurve = LibEulerSwap.verifyOnCurveExact(params, x, y);
      setCurveResult(isOnCurve ? 'On the curve' : 'Not on the curve');
      if (!isOnCurve) {
        const [tx, ty] = LibEulerSwap.tightenToCurve(params, x, y);
        setTightened([tx, ty]);
      } else {
        setTightened(null);
      }
      const priceVal = LibEulerSwap.getCurrentPrice(params, x, y);
      setPrice(priceVal ? priceVal.toString() : '-');
    } catch (e: any) {
      setCurveResult('Error: ' + (e?.message || e));
      setTightened(null);
      setPrice('-');
    }
  };

  // --- genAddress/creationCode ---
  const handleGenAddress = async () => {
    setStatus('Calculating...');
    try {
      // Prepare necessary parameters (dummy)
      const readClient = {} as any; // Actually viem's publicClient
      const eulerSwapFactory = poolAddr;
      const paramsForGen = params;
      // genAddress
      // const [addr, salt] = await LibEulerSwap.genAddress(readClient, eulerSwapFactory, paramsForGen);
      // setGenAddr({addr, salt});
      setGenAddr({addr: '0x...', salt: '0x...'}); // Dummy
      // creationCode
      // const code = await LibEulerSwap.creationCode(readClient, eulerSwapFactory, paramsForGen);
      // setCreationCode(code);
      setCreationCode('0x...'); // Dummy
      setStatus('Done');
    } catch (e: any) {
      setStatus('Error: ' + (e?.message || e));
    }
  };

  // --- computePriceFraction ---
  const handlePriceFrac = () => {
    try {
      const [px, py] = LibEulerSwap.computePriceFraction(priceInput, 6, 6);
      setPriceFrac([px?.toString(), py?.toString()]);
    } catch (e) {
      setPriceFrac(['-', '-']);
    }
  };

  // --- f, fInverse ---
  const handleF = () => {
    try {
      const x = BigInt(amount0 || '0');
      const v = LibEulerSwap.f(x, params.priceX, params.priceY, params.equilibriumReserve0, params.equilibriumReserve1, params.concentrationX);
      setFVal(v.toString());
    } catch (e) { setFVal('-'); }
  };
  const handleFInv = () => {
    try {
      const y = BigInt(amount1 || '0');
      const v = LibEulerSwap.fInverse(y, params.priceX, params.priceY, params.equilibriumReserve0, params.equilibriumReserve1, params.concentrationX);
      setFInvVal(v.toString());
    } catch (e) { setFInvVal('-'); }
  };

  const handleDeposit = async () => {
    setStatus('Deposit logic will be implemented later');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem' }}>
      <h2>Pool Deposit & LibEulerSwap Demo</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={()=>setTab('deposit')} style={{fontWeight:tab==='deposit'?'bold':'normal'}}>Deposit</button>
        <button onClick={()=>setTab('curve')} style={{fontWeight:tab==='curve'?'bold':'normal'}}>Curve Check / Adjust</button>
        <button onClick={()=>setTab('address')} style={{fontWeight:tab==='address'?'bold':'normal'}}>genAddress/creationCode</button>
        <button onClick={()=>setTab('price')} style={{fontWeight:tab==='price'?'bold':'normal'}}>computePriceFraction</button>
        <button onClick={()=>setTab('math')} style={{fontWeight:tab==='math'?'bold':'normal'}}>f/fInverse</button>
      </div>
      {tab==='deposit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Pool Address
            <input type="text" value={poolAddr} onChange={e => setPoolAddr(e.target.value)} placeholder="0x..." />
          </label>
          <label>
            Amount 0
            <input type="number" value={amount0} onChange={e => setAmount0(e.target.value)} placeholder="e.g. 100" />
          </label>
          <label>
            Amount 1
            <input type="number" value={amount1} onChange={e => setAmount1(e.target.value)} placeholder="e.g. 100" />
          </label>
          <button onClick={handleDeposit} style={{ marginTop: 16 }}>Deposit</button>
          {status && <div style={{ color: '#888', marginTop: 8 }}>{status}</div>}
        </div>
      )}
      {tab==='curve' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Amount 0
            <input type="number" value={amount0} onChange={e => setAmount0(e.target.value)} placeholder="e.g. 100" />
          </label>
          <label>
            Amount 1
            <input type="number" value={amount1} onChange={e => setAmount1(e.target.value)} placeholder="e.g. 100" />
          </label>
          <button onClick={handleCurveCheck} style={{ marginTop: 8 }}>Curve Check / Adjust</button>
          {curveResult && <div style={{ color: '#333', marginTop: 8 }}>{curveResult}</div>}
          {tightened && <div style={{ color: '#333', marginTop: 8 }}>Nearest on curve: {tightened[0].toString()} / {tightened[1].toString()}</div>}
          {price && <div style={{ color: '#333', marginTop: 8 }}>Current price: {price}</div>}
        </div>
      )}
      {tab==='address' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Factory Address
            <input type="text" value={poolAddr} onChange={e => setPoolAddr(e.target.value)} placeholder="0x..." />
          </label>
          <button onClick={handleGenAddress}>Calculate genAddress/creationCode</button>
          {genAddr && <div style={{ color: '#333', marginTop: 8 }}>Predicted address: {genAddr.addr}<br/>Salt: {genAddr.salt}</div>}
          {creationCode && <div style={{ color: '#333', marginTop: 8 }}>creationCode: {creationCode}</div>}
          {status && <div style={{ color: '#888', marginTop: 8 }}>{status}</div>}
        </div>
      )}
      {tab==='price' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Price
            <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder="e.g. 1.0" />
          </label>
          <button onClick={handlePriceFrac}>computePriceFraction</button>
          {priceFrac && <div style={{ color: '#333', marginTop: 8 }}>priceX: {priceFrac[0]}<br/>priceY: {priceFrac[1]}</div>}
        </div>
      )}
      {tab==='math' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label>
            Amount 0 (x)
            <input type="number" value={amount0} onChange={e => setAmount0(e.target.value)} placeholder="e.g. 100" />
          </label>
          <label>
            Amount 1 (y)
            <input type="number" value={amount1} onChange={e => setAmount1(e.target.value)} placeholder="e.g. 100" />
          </label>
          <button onClick={handleF}>f(x,...)</button>
          {fVal && <div style={{ color: '#333', marginTop: 8 }}>f(x): {fVal}</div>}
          <button onClick={handleFInv}>fInverse(y,...)</button>
          {fInvVal && <div style={{ color: '#333', marginTop: 8 }}>fInverse(y): {fInvVal}</div>}
        </div>
      )}
    </div>
  );
} 