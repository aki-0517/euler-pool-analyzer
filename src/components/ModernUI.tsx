import React from 'react';
import { formatNumber, formatTokenAmount, formatUSD, formatPercentage, formatAddress, getChainIcon, sanitizeDisplayValue } from '../utils/formatting';

// Modern Network Selector
export const NetworkSelector: React.FC<{
  networks: any[];
  selectedNetwork: string;
  onNetworkChange: (networkKey: string) => void;
}> = ({ networks, selectedNetwork, onNetworkChange }) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ 
        display: 'block', 
        fontSize: 12, 
        fontWeight: 600, 
        color: '#6b7280', 
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1
      }}>
        Network
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {networks.map(network => (
          <button
            key={network.key}
            onClick={() => onNetworkChange(network.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: selectedNetwork === network.key ? '2px solid #3b82f6' : '2px solid #e5e7eb',
              background: selectedNetwork === network.key ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: 14,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (selectedNetwork !== network.key) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedNetwork !== network.key) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
              }
            }}
          >
            <img 
              src={getChainIcon(network.key)} 
              alt={network.name}
              width={20}
              height={20}
              style={{ borderRadius: 4 }}
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzM3NDE1MSIvPgo8L3N2Zz4K';
              }}
            />
            <span>{network.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Protocol Overview Card
export const ProtocolOverview: React.FC<{
  network: any;
  poolCount: number;
  protocolFee: string | null;
  protocolFeeRecipient: string;
  factoryAddress: string;
}> = ({ network, poolCount, protocolFee, factoryAddress }) => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 16,
      padding: 24,
      color: '#fff',
      marginBottom: 24,
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <img 
          src={getChainIcon(network.key)} 
          alt={network.name}
          width={48}
          height={48}
          style={{ borderRadius: 8, background: 'rgba(255,255,255,0.2)', padding: 4 }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>EulerSwap Analytics</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 16 }}>{network.name}</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Total Pools</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{poolCount.toLocaleString()}</div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Protocol Fee</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {formatPercentage(protocolFee ? parseFloat(protocolFee) * 100 : 0)}
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Factory</div>
          <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'monospace' }}>
            {formatAddress(factoryAddress)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Pool Selection Grid
export const PoolSelectionGrid: React.FC<{
  pools: string[];
  selectedPool: string | null;
  onPoolSelect: (pool: string) => void;
  loading: boolean;
}> = ({ pools, selectedPool, onPoolSelect, loading }) => {
  if (loading) {
    return (
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 12, 
        padding: 40, 
        textAlign: 'center',
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '3px solid #e2e8f0', 
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <div style={{ color: '#64748b', fontSize: 16 }}>Loading pools...</div>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 12, 
        padding: 40, 
        textAlign: 'center',
        border: '2px dashed #cbd5e1'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏊‍♂️</div>
        <div style={{ color: '#64748b', fontSize: 16 }}>No pools available on this network</div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: '#1f2937', 
        fontSize: 18, 
        fontWeight: 600 
      }}>
        Select Pool ({pools.length} available)
      </h3>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxHeight: 'calc(100vh - 300px)',
        overflowY: 'auto',
        padding: 4
      }}>
        {pools.map((address, index) => (
          <button
            key={address}
            onClick={() => onPoolSelect(address)}
            style={{
              background: selectedPool === address ? '#eff6ff' : '#fff',
              border: selectedPool === address ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedPool === address ? '0 2px 8px rgba(59, 130, 246, 0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (selectedPool !== address) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPool !== address) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              }
            }}
          >
            <div style={{ 
              fontSize: 12, 
              color: '#6b7280', 
              marginBottom: 4,
              fontWeight: 600
            }}>
              Pool #{index + 1}
            </div>
            <div style={{ 
              fontSize: 14, 
              color: '#1f2937', 
              fontFamily: 'monospace',
              fontWeight: 500,
              wordBreak: 'break-all'
            }}>
              {formatAddress(address, { short: true, startChars: 8, endChars: 6 })}
            </div>
            {selectedPool === address && (
              <div style={{
                fontSize: 11,
                color: '#3b82f6',
                marginTop: 4,
                fontWeight: 600
              }}>
                ✓ Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Enhanced Metrics Grid
export const MetricsGrid: React.FC<{
  metrics: Array<{
    label: string;
    value: string | number | bigint;
    subtitle?: string;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
    type?: 'currency' | 'percentage' | 'number' | 'token';
    decimals?: number;
    symbol?: string;
  }>;
}> = ({ metrics }) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: 16, 
      margin: '24px 0' 
    }}>
      {metrics.map((metric, index) => {
        let formattedValue = '-';
        
        try {
          switch (metric.type) {
            case 'currency':
              formattedValue = formatUSD(metric.value);
              break;
            case 'percentage':
              formattedValue = formatPercentage(Number(metric.value));
              break;
            case 'token':
              formattedValue = formatTokenAmount(
                metric.value, 
                metric.decimals || 18, 
                metric.symbol
              );
              break;
            default:
              formattedValue = formatNumber(metric.value);
          }
        } catch {
          formattedValue = sanitizeDisplayValue(metric.value);
        }

        return (
          <div 
            key={index}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              border: `2px solid ${metric.color || '#e5e7eb'}`,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background accent */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              background: `linear-gradient(135deg, ${metric.color || '#e5e7eb'}20, transparent)`,
              borderRadius: '0 12px 0 60px',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 12, 
                color: '#6b7280', 
                textTransform: 'uppercase', 
                letterSpacing: 1,
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{metric.label}</span>
                {metric.trend && (
                  <span style={{ color: getTrendColor(metric.trend) }}>
                    {getTrendIcon(metric.trend)}
                  </span>
                )}
              </div>
              
              <div style={{ 
                fontSize: 22, 
                fontWeight: 700, 
                color: metric.color || '#1f2937',
                marginBottom: 4,
                wordBreak: 'break-word'
              }}>
                {formattedValue}
              </div>
              
              {metric.subtitle && (
                <div style={{ 
                  fontSize: 11, 
                  color: '#9ca3af',
                  lineHeight: 1.3
                }}>
                  {metric.subtitle}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Pool Info Header
export const PoolInfoHeader: React.FC<{
  poolAddress: string;
  asset0Info?: any;
  asset1Info?: any;
  poolDetail?: any;
}> = ({ poolAddress, asset0Info, asset1Info, poolDetail }) => {
  if (!poolDetail) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
      borderRadius: 16,
      padding: 24,
      color: '#fff',
      marginBottom: 24,
      boxShadow: '0 10px 30px rgba(31, 41, 55, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}>
          🏊‍♂️
        </div>
        
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: 24, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>{asset0Info?.symbol || 'Token0'}</span>
            <span style={{ opacity: 0.7 }}>•</span>
            <span>{asset1Info?.symbol || 'Token1'}</span>
          </h2>
          <p style={{ 
            margin: '4px 0 0 0', 
            opacity: 0.8, 
            fontSize: 14,
            fontFamily: 'monospace'
          }}>
            {formatAddress(poolAddress)}
          </p>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Pool Status</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {poolDetail.status === 1 ? '🟢 Active' : 
             poolDetail.status === 2 ? '🟡 Locked' : '🔴 Inactive'}
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Current Reserves</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {formatTokenAmount(poolDetail.reserve0, 18, asset0Info?.symbol, { compact: true })} • {' '}
            {formatTokenAmount(poolDetail.reserve1, 18, asset1Info?.symbol, { compact: true })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add keyframes for loading animation
export const GlobalStyles: React.FC = () => (
  <style>
    {`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: #f1f5f9;
      }
      
      button {
        border: none;
        outline: none;
        font-family: inherit;
      }
      
      input {
        outline: none;
        font-family: inherit;
      }
    `}
  </style>
);