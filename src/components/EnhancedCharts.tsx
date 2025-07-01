import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// Enhanced Volume Chart Component
export const VolumeChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: 200, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--euler-dark-surface)', 
        borderRadius: 12,
        border: '1px solid var(--euler-dark-border)'
      }}>
        <span style={{ color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)' }}>No volume data available</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--euler-dark-border)" />
        <XAxis 
          dataKey="day" 
          stroke="var(--euler-text-secondary)"
          fontSize={12}
          fontFamily="var(--font-body)"
        />
        <YAxis 
          stroke="var(--euler-text-secondary)"
          fontSize={12}
          fontFamily="var(--font-body)"
          tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
        />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
          labelStyle={{ color: 'var(--euler-text-primary)', fontFamily: 'var(--font-body)' }}
          contentStyle={{ 
            background: 'var(--euler-dark-surface)', 
            border: '1px solid var(--euler-dark-border)', 
            borderRadius: 8,
            color: 'var(--euler-text-primary)',
            fontFamily: 'var(--font-body)'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="tradingVolume" 
          stroke="var(--euler-primary)" 
          fill="var(--euler-primary)" 
          fillOpacity={0.3}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Enhanced Fee Breakdown Chart
export const FeeBreakdownChart: React.FC<{ data: any }> = ({ data }) => {
  if (!data || (!data.lpFee && !data.protocolFee)) {
    return (
      <div style={{ 
        height: 200, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--euler-dark-surface)', 
        borderRadius: 12,
        border: '1px solid var(--euler-dark-border)'
      }}>
        <span style={{ color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)' }}>No fee data available</span>
      </div>
    );
  }

  const pieData = [
    { name: 'LP Fees', value: data.lpFee || 0, color: '#2AE5B9' },
    { name: 'Protocol Fees', value: data.protocolFee || 0, color: '#10263E' }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={60}
          fill="#2AE5B9"
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} 
          contentStyle={{ 
            background: 'var(--euler-dark-surface)', 
            border: '1px solid var(--euler-dark-border)', 
            borderRadius: 8,
            color: 'var(--euler-text-primary)',
            fontFamily: 'var(--font-body)'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// JIT Liquidity Gauge Component
export const JITLiquidityGauge: React.FC<{ 
  realTVL: number; 
  virtualTVL: number; 
  currentUtilization: number;
}> = ({ realTVL, virtualTVL, currentUtilization }) => {
  const utilizationPercent = Math.min(100, (currentUtilization / realTVL) * 100);
  const efficiencyRatio = virtualTVL / Math.max(realTVL, 1);
  
  return (
    <div style={{ 
      padding: 24, 
      background: 'var(--euler-dark-surface)', 
      borderRadius: 16, 
      textAlign: 'center',
      border: '1px solid var(--euler-dark-border)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ 
        margin: '0 0 20px 0', 
        color: 'var(--euler-text-primary)',
        fontFamily: 'var(--font-headline)',
        fontSize: 18,
        fontWeight: 400
      }}>JIT Liquidity Status</h4>
      
      {/* Circular Progress Gauge */}
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="var(--euler-dark-border)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={utilizationPercent > 80 ? '#ef4444' : utilizationPercent > 60 ? '#f59e0b' : 'var(--euler-primary)'}
            strokeWidth="8"
            strokeDasharray={`${(utilizationPercent / 100) * 314} 314`}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%) rotate(90deg)',
          fontSize: '18px',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          color: 'var(--euler-text-primary)'
        }}>
          {utilizationPercent.toFixed(1)}%
        </div>
      </div>
      
      {/* Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
        <div>
          <div style={{ color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Real TVL</div>
          <div style={{ fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>${realTVL.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Virtual TVL</div>
          <div style={{ fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>${virtualTVL.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Efficiency</div>
          <div style={{ fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>{efficiencyRatio.toFixed(1)}x</div>
        </div>
      </div>
    </div>
  );
};

// Custom Curve Visualization
export const CurveVisualization: React.FC<{ 
  concentrationX: number;
  concentrationY: number;
  priceX: number;
  priceY: number;
}> = ({ concentrationX, concentrationY, priceX, priceY }) => {
  // Generate curve points for visualization
  const generateCurvePoints = () => {
    const points = [];
    const numPoints = 50;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * 100;
      // Simplified curve calculation for visualization
      const concentration = (concentrationX + concentrationY) / 2;
      const y = 50 + (50 - x) * concentration + Math.sin(x * 0.1) * (1 - concentration) * 10;
      points.push({ x, y: Math.max(0, Math.min(100, y)) });
    }
    
    return points;
  };

  const curvePoints = generateCurvePoints();
  const concentrationLevel = ((concentrationX + concentrationY) / 2 * 100).toFixed(1);
  
  return (
    <div style={{ 
      padding: 24, 
      background: 'var(--euler-dark-surface)', 
      borderRadius: 16,
      border: '1px solid var(--euler-dark-border)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ 
        margin: '0 0 20px 0', 
        color: 'var(--euler-text-primary)',
        fontFamily: 'var(--font-headline)',
        fontSize: 18,
        fontWeight: 400
      }}>Custom AMM Curve</h4>
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curvePoints}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--euler-dark-border)" />
          <XAxis 
            dataKey="x" 
            domain={[0, 100]}
            type="number"
            tickFormatter={(value) => `${value}%`}
            stroke="var(--euler-text-secondary)"
            fontSize={12}
            fontFamily="var(--font-body)"
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="var(--euler-text-secondary)"
            fontSize={12}
            fontFamily="var(--font-body)"
          />
          <Tooltip 
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Price Impact']}
            labelFormatter={(value) => `Position: ${Number(value).toFixed(1)}%`}
            contentStyle={{ 
              background: 'var(--euler-dark-surface)', 
              border: '1px solid var(--euler-dark-border)', 
              borderRadius: 8,
              color: 'var(--euler-text-primary)',
              fontFamily: 'var(--font-body)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="var(--euler-primary)" 
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div style={{ 
        marginTop: 16, 
        fontSize: '12px', 
        color: 'var(--euler-text-secondary)', 
        textAlign: 'center',
        fontFamily: 'var(--font-body)'
      }}>
        <div>Concentration Level: <strong style={{ color: 'var(--euler-text-primary)' }}>{concentrationLevel}%</strong></div>
        <div>Price Ratio: <strong style={{ color: 'var(--euler-text-primary)' }}>{(priceX / Math.max(priceY, 1)).toFixed(4)}</strong></div>
      </div>
    </div>
  );
};

// Risk Assessment Radar Chart (simplified)
export const RiskAssessment: React.FC<{ 
  healthScore: number;
  liquidationDistance: number;
  utilizationRate: number;
  volatility: number;
}> = ({ healthScore, liquidationDistance, utilizationRate, volatility }) => {
  const riskColor = healthScore > 70 ? 'var(--euler-primary)' : healthScore > 40 ? '#f59e0b' : '#ef4444';
  
  return (
    <div style={{ 
      padding: 24, 
      background: 'var(--euler-dark-surface)', 
      borderRadius: 16,
      border: '1px solid var(--euler-dark-border)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ 
        margin: '0 0 20px 0', 
        color: 'var(--euler-text-primary)',
        fontFamily: 'var(--font-headline)',
        fontSize: 18,
        fontWeight: 400
      }}>Risk Assessment</h4>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ 
          width: 70, 
          height: 70, 
          borderRadius: '50%', 
          background: `conic-gradient(${riskColor} ${healthScore * 3.6}deg, var(--euler-dark-border) 0deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 20
        }}>
          <div style={{ 
            width: 50, 
            height: 50, 
            borderRadius: '50%', 
            background: 'var(--euler-dark-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            color: 'var(--euler-text-primary)'
          }}>
            {healthScore}
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 500, 
            marginBottom: 6,
            fontFamily: 'var(--font-body)',
            color: 'var(--euler-text-primary)',
            fontSize: 16
          }}>Health Score</div>
          <div style={{ 
            fontSize: '14px', 
            color: riskColor,
            fontFamily: 'var(--font-body)',
            fontWeight: 500
          }}>
            {healthScore > 70 ? 'Low Risk' : healthScore > 40 ? 'Medium Risk' : 'High Risk'}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '12px' }}>
        <div>
          <div style={{ 
            color: 'var(--euler-text-secondary)', 
            fontFamily: 'var(--font-body)',
            marginBottom: 4
          }}>Liquidation Distance</div>
          <div style={{ 
            fontWeight: 500, 
            fontFamily: 'var(--font-body)',
            color: 'var(--euler-text-primary)'
          }}>{liquidationDistance.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ 
            color: 'var(--euler-text-secondary)', 
            fontFamily: 'var(--font-body)',
            marginBottom: 4
          }}>Utilization Rate</div>
          <div style={{ 
            fontWeight: 500, 
            fontFamily: 'var(--font-body)',
            color: 'var(--euler-text-primary)'
          }}>{utilizationRate.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ 
            color: 'var(--euler-text-secondary)', 
            fontFamily: 'var(--font-body)',
            marginBottom: 4
          }}>Volatility Risk</div>
          <div style={{ 
            fontWeight: 500, 
            fontFamily: 'var(--font-body)',
            color: 'var(--euler-text-primary)'
          }}>{volatility ? volatility.toFixed(1) : 'N/A'}%</div>
        </div>
        <div>
          <div style={{ 
            color: 'var(--euler-text-secondary)', 
            fontFamily: 'var(--font-body)',
            marginBottom: 4
          }}>Overall Status</div>
          <div style={{ 
            fontWeight: 500, 
            color: riskColor,
            fontFamily: 'var(--font-body)'
          }}>
            {healthScore > 70 ? 'Healthy' : healthScore > 40 ? 'Caution' : 'Warning'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Metrics Cards
export const EnhancedMetricsCards: React.FC<{ 
  totalAPY: number;
  swapFeeAPY: number;
  lendingYieldAPY: number;
  realTVL: number;
  volume24h: number;
  healthScore: number;
}> = ({ totalAPY, swapFeeAPY, lendingYieldAPY, realTVL, volume24h, healthScore }) => {
  const cards = [
    { 
      title: 'Total APY', 
      value: `${totalAPY.toFixed(2)}%`, 
      subtitle: `Swap: ${swapFeeAPY.toFixed(2)}% + Lending: ${lendingYieldAPY.toFixed(2)}%`,
      color: 'var(--euler-primary)',
      trend: totalAPY > 10 ? '↗' : totalAPY > 5 ? '→' : '↘'
    },
    { 
      title: 'Real TVL', 
      value: `$${realTVL.toLocaleString()}`, 
      subtitle: 'Actual vault assets',
      color: 'var(--euler-secondary)',
      trend: '→'
    },
    { 
      title: '24h Volume', 
      value: `$${volume24h.toLocaleString()}`, 
      subtitle: 'Trading activity',
      color: 'var(--euler-accent)',
      trend: '→'
    },
    { 
      title: 'Health Score', 
      value: `${healthScore}/100`, 
      subtitle: healthScore > 70 ? 'Healthy' : healthScore > 40 ? 'Moderate' : 'Risk',
      color: healthScore > 70 ? 'var(--euler-primary)' : healthScore > 40 ? '#f59e0b' : '#ef4444',
      trend: '→'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, margin: '24px 0' }}>
      {cards.map((card, index) => (
        <div 
          key={index}
          style={{
            padding: 24,
            borderRadius: 16,
            background: 'var(--euler-dark-surface)',
            border: `2px solid ${card.color}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 80,
            height: 80,
            background: `linear-gradient(135deg, ${card.color}15, transparent)`,
            borderRadius: '0 16px 0 80px'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: 12, 
              color: 'var(--euler-text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: 1,
              marginBottom: 12,
              fontFamily: 'var(--font-body)',
              fontWeight: 500
            }}>
              {card.title}
            </div>
            
            <div style={{ 
              fontSize: 28, 
              fontWeight: 400, 
              fontFamily: 'var(--font-headline)',
              color: card.color,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              {card.value}
              <span style={{ fontSize: 20, color: 'var(--euler-text-secondary)' }}>{card.trend}</span>
            </div>
            
            <div style={{ 
              fontSize: 12, 
              color: 'var(--euler-text-secondary)',
              lineHeight: 1.4,
              fontFamily: 'var(--font-body)'
            }}>
              {card.subtitle}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};