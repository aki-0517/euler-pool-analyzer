import React from 'react';
import { 
  VolumeChart, 
  FeeBreakdownChart, 
  JITLiquidityGauge, 
  CurveVisualization, 
  RiskAssessment,
  EnhancedMetricsCards 
} from '../components/EnhancedCharts';

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
  cumulativeMetrics: any;
  dailyMetrics: any[];
  swapVolume: number;
  PriceHistoryChart: React.FC;
  swapHistory: any[];
  renderSwapRow: (row: any) => React.ReactNode;
  PoolStatsCards: React.FC;
  vaultData?: any;
}

const PoolAnalyzerMain: React.FC<PoolAnalyzerMainProps> = ({
  selectedPool, poolDetail,
  cumulativeMetrics, dailyMetrics, swapVolume,
  PriceHistoryChart, swapHistory, PoolStatsCards, vaultData
}) => {
  
  // Calculate enhanced metrics for the enhanced charts
  const calculateEnhancedMetrics = () => {
    if (!poolDetail || !vaultData) return null;
    
    const fee = Number(poolDetail.params?.fee || 0) / 1e18;
    const protocolFeeRate = Number(poolDetail.params?.protocolFee || 0) / 1e18;
    
    // Real TVL from vault assets
    const realTVL = Number(vaultData.assets0 || 0) + Number(vaultData.assets1 || 0);
    const virtualTVL = realTVL * 10; // Placeholder multiplier for JIT capability
    
    // Calculate APY components
    const volume24h = swapHistory.reduce((sum, log) => {
      const netIn = Number(log.args?.amount0In || 0) + Number(log.args?.amount1In || 0);
      return sum + netIn;
    }, 0);
    
    const annualVolume = volume24h * 365;
    const totalFees = annualVolume * fee;
    const protocolFees = totalFees * protocolFeeRate;
    const lpFees = totalFees - protocolFees;
    const swapFeeAPY = realTVL > 0 ? (lpFees / realTVL) * 100 : 0;
    const lendingYieldAPY = 3; // Placeholder
    const totalAPY = swapFeeAPY + lendingYieldAPY;
    
    // Risk metrics
    const utilizationRate = realTVL > 0 ? (Number(poolDetail.reserve0 || 0) + Number(poolDetail.reserve1 || 0)) / realTVL * 100 : 0;
    const healthScore = Math.min(100, Math.max(0, 100 - utilizationRate / 2));
    const liquidationDistance = Math.max(0, 100 - utilizationRate);
    
    // Curve parameters
    const concentrationX = Number(poolDetail.params?.concentrationX || 0) / 1e18;
    const concentrationY = Number(poolDetail.params?.concentrationY || 0) / 1e18;
    const priceX = Number(poolDetail.params?.priceX || 1);
    const priceY = Number(poolDetail.params?.priceY || 1);
    
    return {
      totalAPY,
      swapFeeAPY,
      lendingYieldAPY,
      realTVL,
      virtualTVL,
      volume24h,
      healthScore,
      liquidationDistance,
      utilizationRate,
      concentrationX,
      concentrationY,
      priceX,
      priceY
    };
  };
  
  const enhancedMetrics = calculateEnhancedMetrics();
  return (
    <>
      {/* Enhanced Pool Analytics */}
      {selectedPool && poolDetail && (
        <section style={{ 
          marginTop: '2rem', 
          textAlign: 'left', 
          background: '#fff', 
          borderRadius: 16, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', 
          padding: '2.5rem'
        }}>
          <PoolStatsCards />
          
          {/* Enhanced Metrics Cards */}
          {enhancedMetrics && (
            <EnhancedMetricsCards 
              totalAPY={enhancedMetrics.totalAPY}
              swapFeeAPY={enhancedMetrics.swapFeeAPY}
              lendingYieldAPY={enhancedMetrics.lendingYieldAPY}
              realTVL={enhancedMetrics.realTVL}
              volume24h={enhancedMetrics.volume24h}
              healthScore={enhancedMetrics.healthScore}
            />
          )}
          
          {/* JIT Liquidity and Risk Analysis */}
          {enhancedMetrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, margin: '2rem 0' }}>
              <JITLiquidityGauge 
                realTVL={enhancedMetrics.realTVL}
                virtualTVL={enhancedMetrics.virtualTVL}
                currentUtilization={enhancedMetrics.utilizationRate}
              />
              <RiskAssessment 
                healthScore={enhancedMetrics.healthScore}
                liquidationDistance={enhancedMetrics.liquidationDistance}
                utilizationRate={enhancedMetrics.utilizationRate}
                volatility={10} // Placeholder
              />
            </div>
          )}
          
          {/* Custom Curve Visualization */}
          {enhancedMetrics && (
            <div style={{ margin: '2rem 0' }}>
              <CurveVisualization 
                concentrationX={enhancedMetrics.concentrationX}
                concentrationY={enhancedMetrics.concentrationY}
                priceX={enhancedMetrics.priceX}
                priceY={enhancedMetrics.priceY}
              />
            </div>
          )}
          {/* Enhanced Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, margin: '2rem 0' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              borderRadius: 16, 
              padding: 24, 
              color: '#fff',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)'
            }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Protocol Fees</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{cumulativeMetrics.protocolFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Cumulative earnings</div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
              borderRadius: 16, 
              padding: 24, 
              color: '#fff',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>LP Fees</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{cumulativeMetrics.lpFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Liquidity provider rewards</div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
              borderRadius: 16, 
              padding: 24, 
              color: '#fff',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.25)'
            }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Total Fees</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{cumulativeMetrics.totalFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Combined fee revenue</div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
              borderRadius: 16, 
              padding: 24, 
              color: '#fff',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.25)'
            }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Trading Volume</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{cumulativeMetrics.tradingVolume?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '-'}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Total volume traded</div>
            </div>
          </div>
          {/* Enhanced Daily Metrics Table */}
          <div style={{ margin: '3rem 0' }}>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              color: '#1f2937', 
              marginBottom: 16
            }}>Daily Performance Breakdown</h3>
            <div style={{ 
              background: '#fff', 
              borderRadius: 16, 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  fontSize: 14,
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Date (UTC)</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Protocol Fees</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>LP Fees</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Total Fees</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Trading Volume</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Swaps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyMetrics.map((row: any, index: number) => (
                      <tr key={row.day} style={{ 
                        background: index % 2 === 0 ? '#fff' : '#f9fafb',
                        borderBottom: '1px solid #f1f5f9'
                      }}>
                        <td style={{ padding: '16px 20px', fontWeight: 500, color: '#1f2937' }}>{row.day}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>{row.protocolFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#3b82f6' }}>{row.lpFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#7c3aed' }}>{row.totalFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#d97706' }}>{row.tradingVolume.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>{row.swapCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Enhanced Charts Section - Larger and More Prominent */}
          <div style={{ margin: '3rem 0' }}>
            <h3 style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: '#1f2937', 
              marginBottom: 24,
              textAlign: 'center'
            }}>Analytics & Performance Charts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 30 }}>
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: 16, 
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#374151' }}>Volume Trends</h4>
                <VolumeChart data={dailyMetrics} />
              </div>
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: 16, 
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#374151' }}>Fee Breakdown</h4>
                <FeeBreakdownChart data={cumulativeMetrics} />
              </div>
            </div>
          </div>
          
          {/* Enhanced Price History Section */}
          <div style={{ margin: '3rem 0' }}>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              color: '#1f2937', 
              marginBottom: 16
            }}>Price History Analysis</h3>
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: 16, 
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <PriceHistoryChart />
            </div>
          </div>
          {/* Enhanced Transaction History Section */}
          <div style={{ margin: '3rem 0' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 20
            }}>
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: 600, 
                color: '#1f2937', 
                margin: 0
              }}>Recent Transaction History</h3>
              <div style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600
              }}>
                Volume: {swapVolume.toLocaleString()}
              </div>
            </div>
            <div style={{ 
              background: '#fff', 
              borderRadius: 16, 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  fontSize: 13,
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Sender</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Amount0 In</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Amount1 In</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Amount0 Out</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Amount1 Out</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Reserve0</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Reserve1</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>To</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swapHistory.slice(-20).reverse().map((log, index) => {
                      const args = log.args || {};
                      return (
                        <tr key={index} style={{ 
                          background: index % 2 === 0 ? '#fff' : '#f9fafb',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{args.sender?.slice(0, 10)}...</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1f2937' }}>{args.amount0In}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1f2937' }}>{args.amount1In}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1f2937' }}>{args.amount0Out}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#1f2937' }}>{args.amount1Out}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>{args.reserve0}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>{args.reserve1}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{args.to?.slice(0, 10)}...</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: '#1f2937' }}>{log.blockNumber}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default PoolAnalyzerMain; 