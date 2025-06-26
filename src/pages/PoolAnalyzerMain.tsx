import React from 'react';

// 必要なprops型（App.tsxから渡すものを列挙）
interface PoolAnalyzerMainProps {
  network: any;
  poolCount: number;
  protocolFee: any;
  protocolFeeRecipient: string;
  factoryAddress: string;
  loading: boolean;
  poolAddresses: string[];
  selectedPool: string | null;
  setSelectedPool: React.Dispatch<React.SetStateAction<`0x${string}` | null>>;
  poolDetail: any;
  asset0Info: any;
  asset1Info: any;
  cumulativeMetrics: any;
  dailyMetrics: any[];
  swapVolume: number;
  PriceHistoryChart: React.FC;
  swapHistory: any[];
  renderSwapRow: (row: any) => React.ReactNode;
  PoolStatsCards: React.FC;
}

const PoolAnalyzerMain: React.FC<PoolAnalyzerMainProps> = ({
  network, poolCount, protocolFee, protocolFeeRecipient, factoryAddress,
  loading, poolAddresses, selectedPool, setSelectedPool, poolDetail,
  asset0Info, asset1Info, cumulativeMetrics, dailyMetrics, swapVolume,
  PriceHistoryChart, swapHistory, renderSwapRow, PoolStatsCards
}) => {
  return (
    <>
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
            <PriceHistoryChart />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              <span style={{ color: '#ff9800' }}>■</span> Total Fees &nbsp; <span style={{ color: '#2196f3' }}>■</span> Trading Volume
            </div>
          </div>
          {/* Existing swap volume, price history, and swap history table remain below */}
          <div style={{ margin: '1.5em 0 0.5em 0' }}>
            <b>Swap Volume (last 20):</b> {swapVolume.toLocaleString()}
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
    </>
  );
};

export default PoolAnalyzerMain; 