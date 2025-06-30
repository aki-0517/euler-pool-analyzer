// EulerSwap read-only curve analysis helpers

export type PoolParams = {
  priceX: bigint;
  priceY: bigint;
  equilibriumReserve0: bigint;
  equilibriumReserve1: bigint;
  concentrationX: bigint;
  concentrationY: bigint;
};

const c1e18 = 10n ** 18n;

export function verify(x: bigint, y: bigint, _px: bigint, _py: bigint, x0: bigint, y0: bigint, _cx: bigint, _cy: bigint): boolean {
  // Simplified verification for read-only analysis
  // Check if point is in valid region relative to equilibrium
  if (x >= x0 && y >= y0) return true;
  if (x < x0 && y < y0) return false;
  
  // Basic boundary check using equilibrium reserves
  const xRatio = x0 > 0n ? (x * c1e18) / x0 : c1e18;
  const yRatio = y0 > 0n ? (y * c1e18) / y0 : c1e18;
  
  return xRatio + yRatio >= c1e18;
}

export function verifyOnCurveExact(params: PoolParams, x: bigint, y: bigint): boolean {
  let v1 = verifyPoint(params, x, y);
  let v2 = x === 0n || !verifyPoint(params, x - 1n, y);
  let v3 = y === 0n || !verifyPoint(params, x, y - 1n);
  return (v1 && v2 && v3);
}

export function verifyPoint(params: PoolParams, x: bigint, y: bigint): boolean {
  return verify(
    x,
    y,
    params.priceX,
    params.priceY,
    params.equilibriumReserve0,
    params.equilibriumReserve1,
    params.concentrationX,
    params.concentrationY
  );
}


export function getCurrentPrice(params: PoolParams, reserve0: bigint, reserve1: bigint): bigint {
  // Simplified price calculation for read-only analysis
  // Returns the ratio of reserves adjusted by price parameters
  if (reserve0 === 0n || reserve1 === 0n) {
    return params.priceX * c1e18 / params.priceY;
  }
  
  // Basic price calculation: (reserve1 / reserve0) * (priceX / priceY)
  const basePrice = (reserve1 * c1e18) / reserve0;
  const priceRatio = (params.priceX * c1e18) / params.priceY;
  return (basePrice * priceRatio) / c1e18;
}

export function computePriceFraction(price: string | number, decimals0: number, decimals1: number): [bigint, bigint] {
  let price18scale: bigint;
  let inverted = false;
  let p = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(p) || !p) throw Error('not a valid price');
  if (p < 1) {
    inverted = true;
    p = 1 / p;
  }
  price18scale = BigInt(Math.floor(p * 1e18));
  let output: [bigint, bigint] = [
    10n ** BigInt(decimals1),
    10n ** BigInt(decimals0),
  ];
  if (!inverted) {
    output[0] = output[0] * price18scale / c1e18;
  } else {
    output[1] = output[1] * price18scale / c1e18;
  }
  return output;
}

// Additional read-only analysis utilities
export function formatReserve(reserve: bigint, decimals: number = 18): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = reserve / divisor;
  const fraction = reserve % divisor;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
}

export function calculateUtilization(reserve: bigint, equilibrium: bigint): number {
  if (equilibrium === 0n) return 0;
  return Number((reserve * 10000n) / equilibrium) / 100; // Returns percentage
}

export function getPoolHealth(params: PoolParams, reserve0: bigint, reserve1: bigint): {
  utilization0: number;
  utilization1: number;
  balanceRatio: number;
  isBalanced: boolean;
} {
  const util0 = calculateUtilization(reserve0, params.equilibriumReserve0);
  const util1 = calculateUtilization(reserve1, params.equilibriumReserve1);
  const balanceRatio = reserve1 > 0n ? Number((reserve0 * c1e18) / reserve1) / 1e18 : 0;
  const isBalanced = Math.abs(util0 - util1) < 20; // Within 20% difference
  
  return {
    utilization0: util0,
    utilization1: util1,
    balanceRatio,
    isBalanced
  };
}




 