import React from 'react';
import { formatNumber, formatTokenAmount, formatUSD, formatPercentage, formatAddress, getChainIcon, sanitizeDisplayValue } from '../utils/formatting';
import eulerLogo from '../assets/euler-logo-color-white.svg';

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
        color: 'var(--euler-text-secondary)', 
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
              border: selectedNetwork === network.key ? '2px solid var(--euler-primary)' : '2px solid var(--euler-dark-border)',
              background: selectedNetwork === network.key ? 'rgba(0, 212, 255, 0.1)' : 'var(--euler-dark-surface)',
              color: 'var(--euler-text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: 14,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (selectedNetwork !== network.key) {
                e.currentTarget.style.borderColor = 'var(--euler-primary)';
                e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedNetwork !== network.key) {
                e.currentTarget.style.borderColor = 'var(--euler-dark-border)';
                e.currentTarget.style.background = 'var(--euler-dark-surface)';
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
      background: 'linear-gradient(135deg, var(--euler-secondary) 0%, var(--euler-dark-bg) 100%)',
      borderRadius: 16,
      padding: 24,
      color: '#fff',
      marginBottom: 24,
      boxShadow: '0 10px 30px rgba(42, 229, 185, 0.2)',
      border: '1px solid var(--euler-primary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <img 
          src={eulerLogo} 
          alt="Euler"
          width={48}
          height={48}
          style={{ borderRadius: 8, background: 'rgba(255,255,255,0.1)', padding: 8 }}
        />
        <div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 400, fontFamily: 'var(--font-headline)' }}>EulerSwap Analytics</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 16, fontFamily: 'var(--font-body)' }}>{network.name}</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: 'rgba(42, 229, 185, 0.15)', borderRadius: 12, padding: 16, border: '1px solid rgba(42, 229, 185, 0.3)' }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontFamily: 'var(--font-body)', fontWeight: 500 }}>Total Pools</div>
          <div style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-headline)', color: '#fff' }}>{poolCount.toLocaleString()}</div>
        </div>
        
        <div style={{ background: 'rgba(42, 229, 185, 0.15)', borderRadius: 12, padding: 16, border: '1px solid rgba(42, 229, 185, 0.3)' }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontFamily: 'var(--font-body)', fontWeight: 500 }}>Protocol Fee</div>
          <div style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-headline)', color: '#fff' }}>
            {formatPercentage(protocolFee ? parseFloat(protocolFee) * 100 : 0)}
          </div>
        </div>
        
        <div style={{ background: 'rgba(42, 229, 185, 0.15)', borderRadius: 12, padding: 16, border: '1px solid rgba(42, 229, 185, 0.3)' }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontFamily: 'var(--font-body)', fontWeight: 500 }}>Factory</div>
          <div style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-body)', color: '#fff' }}>
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
        background: 'var(--euler-dark-surface)', 
        borderRadius: 12, 
        padding: 40, 
        textAlign: 'center',
        border: '2px dashed var(--euler-dark-border)'
      }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '3px solid var(--euler-dark-border)', 
          borderTop: '3px solid var(--euler-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <div style={{ color: 'var(--euler-text-secondary)', fontSize: 16 }}>Loading pools...</div>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div style={{ 
        background: 'var(--euler-dark-surface)', 
        borderRadius: 12, 
        padding: 40, 
        textAlign: 'center',
        border: '2px dashed var(--euler-dark-border)'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏊‍♂️</div>
        <div style={{ color: 'var(--euler-text-secondary)', fontSize: 16 }}>No pools available on this network</div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        color: 'var(--euler-text-primary)', 
        fontSize: 18, 
        fontWeight: 400,
        fontFamily: 'var(--font-headline)'
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
              background: selectedPool === address ? 'rgba(0, 212, 255, 0.1)' : 'var(--euler-dark-surface)',
              border: selectedPool === address ? '2px solid var(--euler-primary)' : '1px solid var(--euler-dark-border)',
              color: 'var(--euler-text-primary)',
              borderRadius: 8,
              padding: 12,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedPool === address ? '0 2px 8px rgba(0, 212, 255, 0.15)' : '0 1px 2px rgba(0,0,0,0.2)',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (selectedPool !== address) {
                e.currentTarget.style.borderColor = 'var(--euler-primary)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,212,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPool !== address) {
                e.currentTarget.style.borderColor = 'var(--euler-dark-border)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
              }
            }}
          >
            <div style={{ 
              fontSize: 12, 
              color: 'var(--euler-text-secondary)', 
              marginBottom: 4,
              fontWeight: 600
            }}>
              Pool #{index + 1}
            </div>
            <div style={{ 
              fontSize: 14, 
              color: 'var(--euler-text-primary)', 
              fontFamily: 'monospace',
              fontWeight: 500,
              wordBreak: 'break-all'
            }}>
              {formatAddress(address, { short: true, startChars: 8, endChars: 6 })}
            </div>
            {selectedPool === address && (
              <div style={{
                fontSize: 11,
                color: 'var(--euler-primary)',
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
              background: 'var(--euler-dark-surface)',
              borderRadius: 12,
              padding: 20,
              border: `2px solid ${metric.color || 'var(--euler-dark-border)'}`,
              color: 'var(--euler-text-primary)',
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
              background: `linear-gradient(135deg, ${metric.color || 'var(--euler-dark-border)'}20, transparent)`,
              borderRadius: '0 12px 0 60px',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 12, 
                color: 'var(--euler-text-secondary)', 
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
                color: metric.color || 'var(--euler-text-primary)',
                marginBottom: 4,
                wordBreak: 'break-word'
              }}>
                {formattedValue}
              </div>
              
              {metric.subtitle && (
                <div style={{ 
                  fontSize: 11, 
                  color: 'var(--euler-text-secondary)',
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
      background: 'var(--euler-dark-surface)',
      borderRadius: 16,
      padding: 24,
      color: 'var(--euler-text-primary)',
      marginBottom: 24,
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      border: '1px solid var(--euler-dark-border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          background: 'var(--euler-primary)',
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
            fontWeight: 400,
            fontFamily: 'var(--font-headline)',
            color: 'var(--euler-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>{asset0Info?.symbol || 'Token0'}</span>
            <span style={{ opacity: 0.7, color: 'var(--euler-text-secondary)' }}>•</span>
            <span>{asset1Info?.symbol || 'Token1'}</span>
          </h2>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: 'var(--euler-text-secondary)', 
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            fontWeight: 400
          }}>
            {formatAddress(poolAddress)}
          </p>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        flexWrap: 'wrap',
        background: 'rgba(42, 229, 185, 0.1)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid rgba(42, 229, 185, 0.2)'
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Pool Status</div>
          <div style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>
            {poolDetail.status === 1 ? '🟢 Active' : 
             poolDetail.status === 2 ? '🟡 Locked' : '🔴 Inactive'}
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 12, color: 'var(--euler-text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Current Reserves</div>
          <div style={{ fontSize: 16, fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--euler-text-primary)' }}>
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
        font-family: var(--font-body);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: var(--euler-dark-bg);
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