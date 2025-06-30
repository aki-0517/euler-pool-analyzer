# EulerSwap Contract Integration Guide

This document provides comprehensive information about EulerSwap contracts and how to integrate them into the euler-guard-app dashboard for accurate data reading and display.

## Overview

EulerSwap is an automated market maker (AMM) that integrates with Euler credit vaults to provide just-in-time liquidity. The protocol offers up to 40x deeper liquidity than traditional AMMs by borrowing from Euler vaults as needed.

## Contract Architecture

### Core Contracts

#### 1. EulerSwapFactory
The factory contract manages the creation and tracking of EulerSwap pool instances.

**Contract Address by Network:**
- **Mainnet**: `0xb013be1D0D380C13B58e889f412895970A2Cf228`
- **Base**: `0xf0CFe22d23699ff1B2CFe6B8f706A6DB63911262`
- **Avalanche**: `0x8A1D3a4850ed7deeC9003680Cf41b8E75D27e440`
- **BSC**: `0x3e378e5E339DF5e0Da32964F9EEC2CDb90D28Cc7`
- **Unichain**: `0x45b146BC07c9985589B52df651310e75C6BE066A`

**Key Functions:**
```solidity
// Get total number of pools
function poolsLength() external view returns (uint256)

// Get pool address by index
function pools(uint256 index) external view returns (address)

// Get pools for a specific asset pair
function poolsByPair(address asset0, address asset1, uint256 index) external view returns (address)

// Get number of pools for a specific pair
function poolsByPairLength(address asset0, address asset1) external view returns (uint256)

// Get pool by Euler account address
function poolByEulerAccount(address account) external view returns (address)

// Get multiple pools at once (efficient batch operation)
function poolsSlice(uint256 start, uint256 end) external view returns (address[] memory)
```

#### 2. EulerSwap (Pool Contract)
Individual pool contracts that execute swaps and manage liquidity.

**Key Functions:**
```solidity
// Get underlying asset addresses
function getAssets() external view returns (address asset0, address asset1)

// Get all pool parameters
function getParams() external view returns (Params memory)

// Get current reserves and status
function getReserves() external view returns (uint256 reserve0, uint256 reserve1, uint256 status)

// Get price quote for exact input
function computeQuote(bool zeroForOne, uint256 amountIn, uint256 amountOut) external view returns (uint256, uint256)

// Get maximum tradeable amounts
function getLimits() external view returns (uint256 maxIn0, uint256 maxOut0, uint256 maxIn1, uint256 maxOut1)

// Get curve identifier
function curve() external pure returns (string memory)
```

#### 3. EulerSwapPeriphery
Provides user-friendly swap functions with slippage protection.

**Contract Address by Network:**
- **Mainnet**: `0x208fF5Eb543814789321DaA1B5Eb541881D6b06`

**Key Functions:**
```solidity
// Get quote for exact input swap
function quoteExactInput(address pool, bool zeroForOne, uint256 amountIn) external view returns (uint256 amountOut)

// Get quote for exact output swap
function quoteExactOutput(address pool, bool zeroForOne, uint256 amountOut) external view returns (uint256 amountIn)
```

## Data Structures

### Pool Parameters (Params)
```solidity
struct Params {
    address vault0;              // Euler vault for asset0
    address vault1;              // Euler vault for asset1
    address eulerAccount;        // Account managing the pool
    uint256 equilibriumReserve0; // Virtual reserve limit for asset0
    uint256 equilibriumReserve1; // Virtual reserve limit for asset1
    uint256 priceX;              // Price ratio numerator
    uint256 priceY;              // Price ratio denominator
    uint256 concentrationX;      // Curve concentration for asset0 (0-1e18)
    uint256 concentrationY;      // Curve concentration for asset1 (0-1e18)
    uint256 fee;                 // Swap fee (fraction of 1e18)
    uint256 protocolFee;         // Protocol fee portion
    address protocolFeeRecipient; // Address receiving protocol fees
}
```

### Pool Status Values
- **0**: Unactivated
- **1**: Unlocked (available for trading)
- **2**: Locked (currently processing a swap)

## Reading Contract Data

### 1. Pool Discovery
```typescript
// Get all pools
const poolsLength = await publicClient.readContract({
  address: FACTORY_ADDRESS,
  abi: factoryAbi,
  functionName: 'poolsLength'
});

// Get pools in batches (more efficient)
const pools = await publicClient.readContract({
  address: FACTORY_ADDRESS,
  abi: factoryAbi,
  functionName: 'poolsSlice',
  args: [0n, 10n] // Get first 10 pools
});
```

### 2. Pool Information
```typescript
// Get pool assets
const [asset0, asset1] = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'getAssets'
});

// Get pool parameters
const params = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'getParams'
});

// Get current reserves
const [reserve0, reserve1, status] = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'getReserves'
});
```

### 3. Price Quotes
```typescript
// Get quote for exact input
const [amountOut, ] = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'computeQuote',
  args: [true, parseEther('1'), 0n] // 1 token0 for token1
});

// Get trade limits
const [maxIn0, maxOut0, maxIn1, maxOut1] = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'getLimits'
});
```

### 4. Vault Information
```typescript
// Get vault balance (shares)
const vaultShares = await publicClient.readContract({
  address: params.vault0,
  abi: vaultAbi,
  functionName: 'balanceOf',
  args: [params.eulerAccount]
});

// Convert shares to assets
const vaultAssets = await publicClient.readContract({
  address: params.vault0,
  abi: vaultAbi,
  functionName: 'convertToAssets',
  args: [vaultShares]
});
```

## Events and Historical Data

### Swap Events
```solidity
event Swap(
    address indexed sender,
    address indexed recipient,
    bool indexed zeroForOne,
    uint256 amountIn,
    uint256 amountOut,
    uint256 reserve0,
    uint256 reserve1
);
```

### Pool Events
```solidity
event EulerSwapActivated(
    address indexed pool,
    address indexed asset0,
    address indexed asset1
);
```

### Factory Events
```solidity
event PoolDeployed(
    address indexed pool,
    address indexed asset0,
    address indexed asset1,
    address indexed eulerAccount
);
```

## Metrics Calculation

### 1. Total Value Locked (TVL)
```typescript
const tvl = (vaultAssets0 * asset0Price) + (vaultAssets1 * asset1Price);
```

### 2. Trading Volume
```typescript
// Get swap events from recent blocks
const swapLogs = await publicClient.getLogs({
  address: poolAddress,
  event: parseAbiItem('event Swap(address indexed sender, address indexed recipient, bool indexed zeroForOne, uint256 amountIn, uint256 amountOut, uint256 reserve0, uint256 reserve1)'),
  fromBlock: 'earliest',
  toBlock: 'latest'
});

// Calculate volume
const volume = swapLogs.reduce((sum, log) => {
  const { amountIn, amountOut } = log.args;
  return sum + (amountIn * asset0Price) + (amountOut * asset1Price);
}, 0);
```

### 3. Fee Calculations
```typescript
// Daily fees earned
const dailyFees = dailyVolume * (params.fee / 1e18);

// Protocol fees
const protocolFees = dailyFees * (params.protocolFee / 1e18);

// LP fees
const lpFees = dailyFees - protocolFees;
```

## Network Configuration

### Supported Networks
```typescript
const networks = {
  mainnet: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    factory: '0xb013be1D0D380C13B58e889f412895970A2Cf228',
    periphery: '0x208fF5Eb543814789321DaA1B5Eb541881D6b06'
  },
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    factory: '0xf0CFe22d23699ff1B2CFe6B8f706A6DB63911262'
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    factory: '0x8A1D3a4850ed7deeC9003680Cf41b8E75D27e440'
  },
  bsc: {
    id: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    factory: '0x3e378e5E339DF5e0Da32964F9EEC2CDb90D28Cc7'
  },
  unichain: {
    id: 1301,
    name: 'Unichain',
    rpcUrl: 'https://sepolia.unichain.org',
    factory: '0x45b146BC07c9985589B52df651310e75C6BE066A'
  }
};
```

## Error Handling

### Common Issues and Solutions

#### 1. Pool Status Locked
```typescript
const [, , status] = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'getReserves'
});

if (status === 2n) {
  // Pool is locked, retry after a short delay
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

#### 2. Reserve Desynchronization
Reserves can become desynchronized due to:
- Interest accrual on vaults
- External fee collection
- Liquidations affecting vault balances

Always use the latest reserves from `getReserves()` for accurate calculations.

#### 3. Quote Limits
```typescript
const [maxIn0, maxOut0, maxIn1, maxOut1] = await publicClient.readContract({
  address: poolAddress,
  abi: poolAbi,
  functionName: 'getLimits'
});

// Ensure trade amount is within limits
if (amountIn > (zeroForOne ? maxIn0 : maxIn1)) {
  throw new Error('Trade amount exceeds pool limits');
}
```

## Best Practices

### 1. Batch Operations
Use `poolsSlice()` to fetch multiple pools efficiently:
```typescript
const batchSize = 50;
const pools = await publicClient.readContract({
  address: FACTORY_ADDRESS,
  abi: factoryAbi,
  functionName: 'poolsSlice',
  args: [BigInt(start), BigInt(start + batchSize)]
});
```

### 2. Caching Strategy
- Cache pool parameters (immutable)
- Refresh reserves and quotes frequently (mutable)
- Update vault balances periodically

### 3. Real-time Updates
```typescript
// Subscribe to new blocks for real-time updates
const unwatch = publicClient.watchBlocks({
  onBlock: async (block) => {
    // Update pool reserves and quotes
    await updatePoolData();
  }
});
```

### 4. Price Calculations
```typescript
// Calculate effective price including fees
const effectivePrice = amountOut / amountIn;
const feeAmount = amountIn * (params.fee / 1e18);
const priceWithoutFees = amountOut / (amountIn - feeAmount);
```

## Mathematical Functions

### Curve Calculations
The EulerSwap uses custom AMM curves with concentration parameters. Use the provided `LibEulerSwap.ts` library for accurate calculations:

```typescript
import { verifyCurve, getAmountOut } from './lib/LibEulerSwap';

// Verify curve parameters are valid
const isValid = verifyCurve(params);

// Calculate trade output
const amountOut = getAmountOut(
  amountIn,
  reserve0,
  reserve1,
  params.concentrationX,
  params.concentrationY,
  params.fee
);
```

## Security Considerations

### 1. Trusted Factories
Only interact with verified factory contracts. Verify addresses match the official deployments.

### 2. Slippage Protection
Always implement slippage protection for user trades:
```typescript
const minAmountOut = expectedAmountOut * (1 - slippageTolerance);
```

### 3. Authorization Checks
Verify that the EulerSwap operator is properly authorized on the Euler account:
```typescript
// Check if operator is installed
const isAuthorized = await publicClient.readContract({
  address: eulerAccount,
  abi: accountAbi,
  functionName: 'isOperatorAuthorized',
  args: [poolAddress]
});
```

## Troubleshooting

### Common Display Issues

#### 1. Incorrect TVL Calculation
- Ensure you're using `convertToAssets()` to convert vault shares to underlying assets
- Account for different token decimals
- Use accurate price feeds

#### 2. Wrong Fee Calculations
- Pool fees are stored as fractions of 1e18
- Protocol fees are percentages of total fees
- Cumulative fees require historical swap data

#### 3. Reserve Mismatches
- Use `getReserves()` for current state
- Reserves can change due to interest, not just trades
- Status field indicates if pool is locked

### Debug Utilities
```typescript
// Log pool state for debugging
const debugPool = async (poolAddress) => {
  const [asset0, asset1] = await publicClient.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: 'getAssets'
  });
  
  const params = await publicClient.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: 'getParams'
  });
  
  const [reserve0, reserve1, status] = await publicClient.readContract({
    address: poolAddress,
    abi: poolAbi,
    functionName: 'getReserves'
  });
  
  console.log({
    poolAddress,
    assets: { asset0, asset1 },
    params,
    reserves: { reserve0, reserve1, status }
  });
};
```

## Performance Optimization

### 1. Multicall Pattern
Use multicall for batch operations:
```typescript
const multicallData = [
  { address: poolAddress, abi: poolAbi, functionName: 'getAssets' },
  { address: poolAddress, abi: poolAbi, functionName: 'getParams' },
  { address: poolAddress, abi: poolAbi, functionName: 'getReserves' }
];
```

### 2. Event Filtering
Optimize event queries:
```typescript
const swapLogs = await publicClient.getLogs({
  address: poolAddress,
  event: swapEventAbi,
  fromBlock: BigInt(latestBlock - 5000), // Last 5000 blocks
  toBlock: 'latest'
});
```

### 3. Connection Management
Reuse public clients and implement connection pooling for better performance.

This documentation should provide the euler-guard-app frontend with all necessary information to correctly read and display EulerSwap contract data. Regular updates to this document ensure compatibility with protocol upgrades and new network deployments.