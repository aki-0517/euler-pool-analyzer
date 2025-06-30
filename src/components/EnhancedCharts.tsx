import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// Enhanced Volume Chart Component
export const VolumeChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: 8 }}>
        <span style={{ color: '#666' }}>No volume data available</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="day" 
          stroke="#666"
          fontSize={12}
        />
        <YAxis 
          stroke="#666"
          fontSize={12}
          tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
        />
        <Tooltip 
          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
          labelStyle={{ color: '#333' }}
          contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
        />
        <Area 
          type="monotone" 
          dataKey="tradingVolume" 
          stroke="#2196F3" 
          fill="#2196F3" 
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Enhanced Fee Breakdown Chart
export const FeeBreakdownChart: React.FC<{ data: any }> = ({ data }) => {
  if (!data || (!data.lpFee && !data.protocolFee)) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: 8 }}>
        <span style={{ color: '#666' }}>No fee data available</span>
      </div>
    );
  }

  const pieData = [
    { name: 'LP Fees', value: data.lpFee || 0, color: '#4CAF50' },
    { name: 'Protocol Fees', value: data.protocolFee || 0, color: '#FF9800' }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
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
    <div style={{ padding: 20, background: '#f8f9fa', borderRadius: 12, textAlign: 'center' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>JIT Liquidity Status</h4>
      
      {/* Circular Progress Gauge */}
      <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' }}>
        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={utilizationPercent > 80 ? '#f44336' : utilizationPercent > 60 ? '#ff9800' : '#4caf50'}
            strokeWidth="10"
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
          fontWeight: 'bold',
          color: '#333'
        }}>
          {utilizationPercent.toFixed(1)}%
        </div>
      </div>
      
      {/* Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
        <div>
          <div style={{ color: '#666' }}>Real TVL</div>
          <div style={{ fontWeight: 'bold' }}>${realTVL.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Virtual TVL</div>
          <div style={{ fontWeight: 'bold' }}>${virtualTVL.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Efficiency</div>
          <div style={{ fontWeight: 'bold' }}>{efficiencyRatio.toFixed(1)}x</div>
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
    <div style={{ padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>Custom AMM Curve</h4>
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curvePoints}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="x" 
            domain={[0, 100]}
            type="number"
            tickFormatter={(value) => `${value}%`}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#666"
            fontSize={12}
          />
          <Tooltip 
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Price Impact']}
            labelFormatter={(value) => `Position: ${Number(value).toFixed(1)}%`}
            contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="#9c27b0" 
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div style={{ marginTop: 12, fontSize: '12px', color: '#666', textAlign: 'center' }}>
        <div>Concentration Level: <strong>{concentrationLevel}%</strong></div>
        <div>Price Ratio: <strong>{(priceX / Math.max(priceY, 1)).toFixed(4)}</strong></div>
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
  const riskColor = healthScore > 70 ? '#4caf50' : healthScore > 40 ? '#ff9800' : '#f44336';
  
  return (
    <div style={{ padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>Risk Assessment</h4>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ 
          width: 60, 
          height: 60, 
          borderRadius: '50%', 
          background: `conic-gradient(${riskColor} ${healthScore * 3.6}deg, #e0e0e0 0deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {healthScore}
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Health Score</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {healthScore > 70 ? 'Low Risk' : healthScore > 40 ? 'Medium Risk' : 'High Risk'}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '12px' }}>
        <div>
          <div style={{ color: '#666' }}>Liquidation Distance</div>
          <div style={{ fontWeight: 'bold' }}>{liquidationDistance.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Utilization Rate</div>
          <div style={{ fontWeight: 'bold' }}>{utilizationRate.toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Volatility Risk</div>
          <div style={{ fontWeight: 'bold' }}>{volatility ? volatility.toFixed(1) : 'N/A'}%</div>
        </div>
        <div>
          <div style={{ color: '#666' }}>Overall Status</div>
          <div style={{ fontWeight: 'bold', color: riskColor }}>
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
      color: '#4CAF50',
      trend: totalAPY > 10 ? '↗' : totalAPY > 5 ? '→' : '↘'
    },
    { 
      title: 'Real TVL', 
      value: `$${realTVL.toLocaleString()}`, 
      subtitle: 'Actual vault assets',
      color: '#2196F3',
      trend: '→'
    },
    { 
      title: '24h Volume', 
      value: `$${volume24h.toLocaleString()}`, 
      subtitle: 'Trading activity',
      color: '#FF9800',
      trend: '→'
    },
    { 
      title: 'Health Score', 
      value: `${healthScore}/100`, 
      subtitle: healthScore > 70 ? 'Healthy' : healthScore > 40 ? 'Moderate' : 'Risk',
      color: healthScore > 70 ? '#4CAF50' : healthScore > 40 ? '#FF9800' : '#F44336',
      trend: '→'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, margin: '20px 0' }}>
      {cards.map((card, index) => (
        <div 
          key={index}
          style={{
            padding: 20,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            border: `2px solid ${card.color}`,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 60,
            height: 60,
            background: `linear-gradient(135deg, ${card.color}20, ${card.color}10)`,
            borderRadius: '0 12px 0 60px'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              fontSize: 12, 
              color: '#666', 
              textTransform: 'uppercase', 
              letterSpacing: 1,
              marginBottom: 8
            }}>
              {card.title}
            </div>
            
            <div style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: card.color,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {card.value}
              <span style={{ fontSize: 16 }}>{card.trend}</span>
            </div>
            
            <div style={{ 
              fontSize: 10, 
              color: '#888',
              lineHeight: 1.3
            }}>
              {card.subtitle}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};