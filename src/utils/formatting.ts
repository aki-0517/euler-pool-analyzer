// Comprehensive formatting utilities for EulerSwap dashboard

export const formatNumber = (value: number | bigint | string | null | undefined, options: {
  decimals?: number;
  notation?: 'standard' | 'compact' | 'scientific';
  currency?: boolean;
  percentage?: boolean;
  maxDecimals?: number;
  minDecimals?: number;
} = {}): string => {
  if (value === null || value === undefined || value === '' || value === '-') {
    return '-';
  }

  const {
    decimals = 18,
    notation = 'standard',
    currency = false,
    percentage = false,
    maxDecimals = 2,
    minDecimals = 0
  } = options;

  let numericValue: number;

  // Handle different input types
  if (typeof value === 'bigint') {
    numericValue = Number(value) / Math.pow(10, decimals);
  } else if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return '-';
    numericValue = parsed;
  } else {
    numericValue = Number(value);
  }

  // Handle invalid numbers
  if (!isFinite(numericValue) || isNaN(numericValue)) {
    return '-';
  }

  // Apply percentage formatting
  if (percentage) {
    numericValue = numericValue * 100;
  }

  // Format the number
  const formatter = new Intl.NumberFormat('en-US', {
    notation,
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    style: currency ? 'currency' : 'decimal',
    currency: currency ? 'USD' : undefined,
  });

  let result = formatter.format(numericValue);

  // Add percentage symbol
  if (percentage && !result.includes('%')) {
    result += '%';
  }

  return result;
};

export const formatTokenAmount = (
  amount: bigint | string | number | null | undefined,
  decimals: number = 18,
  symbol?: string,
  options: {
    showSymbol?: boolean;
    compact?: boolean;
    maxDecimals?: number;
  } = {}
): string => {
  const { showSymbol = true, compact = false, maxDecimals = 4 } = options;
  
  if (amount === null || amount === undefined) return '-';
  
  const formatted = formatNumber(amount, {
    decimals,
    notation: compact ? 'compact' : 'standard',
    maxDecimals,
  });
  
  if (formatted === '-') return '-';
  
  return showSymbol && symbol ? `${formatted} ${symbol}` : formatted;
};

export const formatUSD = (
  value: number | bigint | string | null | undefined,
  options: {
    compact?: boolean;
    decimals?: number;
  } = {}
): string => {
  const { compact = false, decimals = 18 } = options;
  
  return formatNumber(value, {
    decimals,
    currency: true,
    notation: compact ? 'compact' : 'standard',
    maxDecimals: 2,
  });
};

export const formatPercentage = (
  value: number | string | null | undefined,
  options: {
    decimals?: number;
    showSign?: boolean;
  } = {}
): string => {
  const { decimals = 2, showSign = false } = options;
  
  if (value === null || value === undefined) return '-';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue) || !isFinite(numValue)) return '-';
  
  const formatted = numValue.toFixed(decimals);
  const sign = showSign && numValue > 0 ? '+' : '';
  
  return `${sign}${formatted}%`;
};

export const formatAddress = (
  address: string | null | undefined,
  options: {
    short?: boolean;
    startChars?: number;
    endChars?: number;
  } = {}
): string => {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return 'None';
  }
  
  const { short = true, startChars = 6, endChars = 4 } = options;
  
  if (!short || address.length <= startChars + endChars + 2) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const formatTimeAgo = (timestamp: number | null | undefined): string => {
  if (!timestamp) return '-';
  
  const now = Date.now();
  const diff = now - (timestamp * 1000);
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const getChainIcon = (chainKey: string): string => {
  const chainIcons: Record<string, string> = {
    mainnet: 'ethereum',
    base: 'base',
    avalanche: 'avalanche',
    bsc: 'binance',
    unichain: 'unichain',
    devland: 'ethereum', // fallback
  };
  
  const iconName = chainIcons[chainKey] || 'ethereum';
  return `https://icons.llamao.fi/icons/chains/rsz_${iconName}?w=48&h=48`;
};

export const getHealthColor = (score: number): string => {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#8BC34A'; // Light Green
  if (score >= 40) return '#FF9800'; // Orange
  if (score >= 20) return '#FF5722'; // Red Orange
  return '#F44336'; // Red
};

export const getRiskLevel = (score: number): string => {
  if (score >= 80) return 'Very Low';
  if (score >= 60) return 'Low';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'High';
  return 'Very High';
};

// Validate and sanitize display values
export const sanitizeDisplayValue = (
  value: any,
  fallback: string = '-'
): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  if (typeof value === 'bigint') {
    // Prevent display of raw bigint values
    return formatTokenAmount(value);
  }
  
  if (typeof value === 'number') {
    if (!isFinite(value) || isNaN(value)) {
      return fallback;
    }
    // Prevent display of extremely large percentages
    if (value > 1000) {
      return formatPercentage(value / 100);
    }
    return value.toString();
  }
  
  return String(value);
};