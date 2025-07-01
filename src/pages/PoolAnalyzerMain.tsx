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
          background: 'var(--euler-dark-surface)', 
          borderRadius: 16, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)', 
          padding: '2.5rem',
          border: '1px solid var(--euler-dark-border)'
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
            {(() => {
              // Helper function to get fee card colors based on value
              const getFeeColors = (value: number, type: 'fee' | 'volume') => {
                if (type === 'fee') {
                  if (value >= 1000) return { primary: '#22c55e', secondary: '#16a34a', status: 'High Revenue' };
                  if (value >= 100) return { primary: 'var(--euler-primary)', secondary: '#0891b2', status: 'Good Revenue' };
                  if (value >= 10) return { primary: '#f59e0b', secondary: '#d97706', status: 'Moderate Revenue' };
                  return { primary: '#ef4444', secondary: '#dc2626', status: 'Low Revenue' };
                } else {
                  if (value >= 100000) return { primary: '#22c55e', secondary: '#16a34a', status: 'High Volume' };
                  if (value >= 10000) return { primary: 'var(--euler-primary)', secondary: '#0891b2', status: 'Good Volume' };
                  if (value >= 1000) return { primary: '#f59e0b', secondary: '#d97706', status: 'Moderate Volume' };
                  return { primary: '#ef4444', secondary: '#dc2626', status: 'Low Volume' };
                }
              };

              const protocolFeeColors = getFeeColors(cumulativeMetrics.protocolFee || 0, 'fee');
              const lpFeeColors = getFeeColors(cumulativeMetrics.lpFee || 0, 'fee');
              const totalFeeColors = getFeeColors(cumulativeMetrics.totalFee || 0, 'fee');
              const volumeColors = getFeeColors(cumulativeMetrics.tradingVolume || 0, 'volume');

              const feeCards = [
                {
                  title: 'Protocol Fees',
                  value: cumulativeMetrics.protocolFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '0',
                  subtitle: protocolFeeColors.status,
                  colors: protocolFeeColors
                },
                {
                  title: 'LP Fees',
                  value: cumulativeMetrics.lpFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '0',
                  subtitle: lpFeeColors.status,
                  colors: lpFeeColors
                },
                {
                  title: 'Total Fees',
                  value: cumulativeMetrics.totalFee?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '0',
                  subtitle: totalFeeColors.status,
                  colors: totalFeeColors
                },
                {
                  title: 'Trading Volume',
                  value: cumulativeMetrics.tradingVolume?.toLocaleString(undefined, { maximumFractionDigits: 6 }) || '0',
                  subtitle: volumeColors.status,
                  colors: volumeColors
                }
              ];

              return feeCards.map((card, index) => (
                <div 
                  key={index}
                  style={{ 
                    background: 'var(--euler-dark-surface)', 
                    borderRadius: 16, 
                    padding: 24, 
                    color: 'var(--euler-text-primary)',
                    boxShadow: `0 8px 25px ${card.colors.primary}40, 0 4px 8px rgba(0,0,0,0.2)`,
                    border: `2px solid ${card.colors.primary}`,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Status indicator bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${card.colors.primary}, ${card.colors.secondary})`,
                    borderRadius: '16px 16px 0 0'
                  }} />
                  
                  {/* Color gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    background: `linear-gradient(135deg, ${card.colors.primary}20, transparent)`,
                    borderRadius: '0 16px 0 60px'
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      fontSize: 14, 
                      color: 'var(--euler-text-secondary)', 
                      marginBottom: 8, 
                      textTransform: 'uppercase', 
                      letterSpacing: 1, 
                      fontFamily: 'var(--font-body)', 
                      fontWeight: 500 
                    }}>
                      {card.title}
                    </div>
                    <div style={{ 
                      fontSize: 28, 
                      fontWeight: 400, 
                      fontFamily: 'var(--font-headline)', 
                      color: card.colors.primary,
                      marginBottom: 4
                    }}>
                      {card.value}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: card.colors.secondary, 
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500
                    }}>
                      {card.subtitle}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
          {/* Enhanced Daily Metrics Table */}
          <div style={{ margin: '3rem 0' }}>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 400, 
              fontFamily: 'var(--font-headline)',
              color: 'var(--euler-text-primary)', 
              marginBottom: 16
            }}>Daily Performance Breakdown</h3>
            <div style={{ 
              background: 'var(--euler-dark-surface)', 
              borderRadius: 16, 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid var(--euler-dark-border)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  fontSize: 14,
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ background: 'var(--euler-dark-bg)' }}>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Date (UTC)</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Protocol Fees</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>LP Fees</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Total Fees</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Trading Volume</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Swaps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyMetrics.map((row: any, index: number) => (
                      <tr key={row.day} style={{ 
                        background: index % 2 === 0 ? 'var(--euler-dark-surface)' : 'var(--euler-dark-bg)',
                        borderBottom: '1px solid var(--euler-dark-border)'
                      }}>
                        <td style={{ padding: '16px 20px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{row.day}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-primary)' }}>{row.protocolFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-accent)' }}>{row.lpFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-secondary)' }}>{row.totalFee.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-primary)' }}>{row.tradingVolume.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-secondary)' }}>{row.swapCount}</td>
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
              fontWeight: 400, 
              fontFamily: 'var(--font-headline)',
              color: 'var(--euler-text-primary)', 
              marginBottom: 24,
              textAlign: 'center'
            }}>Analytics & Performance Charts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 30 }}>
              <div style={{ 
                background: 'var(--euler-dark-surface)', 
                borderRadius: 16, 
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: '1px solid var(--euler-dark-border)'
              }}>
                <h4 style={{ fontSize: 18, fontWeight: 400, fontFamily: 'var(--font-headline)', marginBottom: 16, color: 'var(--euler-text-primary)' }}>Volume Trends</h4>
                <VolumeChart data={dailyMetrics} />
              </div>
              <div style={{ 
                background: 'var(--euler-dark-surface)', 
                borderRadius: 16, 
                padding: 24,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                border: '1px solid var(--euler-dark-border)'
              }}>
                <h4 style={{ fontSize: 18, fontWeight: 400, fontFamily: 'var(--font-headline)', marginBottom: 16, color: 'var(--euler-text-primary)' }}>Fee Breakdown</h4>
                <FeeBreakdownChart data={cumulativeMetrics} />
              </div>
            </div>
          </div>
          
          {/* Enhanced Price History Section */}
          <div style={{ margin: '3rem 0' }}>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 400, 
              fontFamily: 'var(--font-headline)',
              color: 'var(--euler-text-primary)', 
              marginBottom: 16
            }}>Price History Analysis</h3>
            <div style={{ 
              background: 'var(--euler-dark-surface)', 
              borderRadius: 16, 
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid var(--euler-dark-border)'
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
                fontWeight: 400, 
                fontFamily: 'var(--font-headline)',
                color: 'var(--euler-text-primary)', 
                margin: 0
              }}>Recent Transaction History</h3>
              <div style={{ 
                background: 'var(--euler-primary)',
                color: 'var(--euler-dark-bg)',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'var(--font-body)'
              }}>
                Volume: {swapVolume.toLocaleString()}
              </div>
            </div>
            <div style={{ 
              background: 'var(--euler-dark-surface)', 
              borderRadius: 16, 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              border: '1px solid var(--euler-dark-border)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  fontSize: 13,
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ background: 'var(--euler-dark-bg)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Sender</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Amount0 In</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Amount1 In</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Amount0 Out</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Amount1 Out</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Reserve0</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Reserve1</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>To</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)', borderBottom: '2px solid var(--euler-dark-border)' }}>Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swapHistory.slice(-20).reverse().map((log, index) => {
                      const args = log.args || {};
                      return (
                        <tr key={index} style={{ 
                          background: index % 2 === 0 ? 'var(--euler-dark-surface)' : 'var(--euler-dark-bg)',
                          borderBottom: '1px solid var(--euler-dark-border)'
                        }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--euler-text-secondary)' }}>{args.sender?.slice(0, 10)}...</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{args.amount0In}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{args.amount1In}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{args.amount0Out}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{args.amount1Out}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-text-secondary)' }}>{args.reserve0}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-body)', color: 'var(--euler-text-secondary)' }}>{args.reserve1}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--euler-text-secondary)' }}>{args.to?.slice(0, 10)}...</td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{log.blockNumber}</td>
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