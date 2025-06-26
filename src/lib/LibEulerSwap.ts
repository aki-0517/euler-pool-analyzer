// EulerSwap math/curve helpers (TypeScript移植)

export type PoolParams = {
  priceX: bigint;
  priceY: bigint;
  equilibriumReserve0: bigint;
  equilibriumReserve1: bigint;
  concentrationX: bigint;
  concentrationY: bigint;
};

const c1e18 = 10n ** 18n;

export function verify(x: bigint, y: bigint, px: bigint, py: bigint, x0: bigint, y0: bigint, cx: bigint, cy: bigint): boolean {
  if (x >= x0) {
    if (y >= y0) return true;
    return x >= f(y, py, px, y0, x0, cy);
  } else {
    if (y < y0) return false;
    return y >= f(x, px, py, x0, y0, cx);
  }
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

export function tightenToCurve(params: PoolParams, x: bigint, y: bigint): [bigint, bigint] {
  if (!verifyPoint(params, x, y)) throw Error('not on or above curve');
  if (verifyOnCurveExact(params, x, y)) return [x, y];
  let tighten = (dim: boolean) => {
    let val = 1n;
    while (true) {
      let [tx, ty] = dim ? [x - val, y] : [x, y - val];
      if (verifyPoint(params, tx, ty)) {
        [x, y] = [tx, ty];
        val *= 2n;
      } else {
        break;
      }
    }
    while (true) {
      if (val > 1n) val /= 2n;
      let [tx, ty] = dim ? [x - val, y] : [x, y - val];
      if (verifyPoint(params, tx, ty)) {
        [x, y] = [tx, ty];
      } else {
        if (val === 1n) break;
      }
    }
  };
  tighten(true);
  tighten(false);
  return [x, y];
}

export function getCurrentPrice(params: PoolParams, reserve0: bigint, reserve1: bigint): bigint {
  let price: bigint;
  if (reserve0 <= params.equilibriumReserve0) {
    if (reserve0 === params.equilibriumReserve0) return params.priceX * c1e18 / params.priceY;
    price = -df_dx(reserve0, params.priceX, params.priceY, params.equilibriumReserve0, params.concentrationX);
  } else {
    if (reserve1 === params.equilibriumReserve1) return params.priceY * c1e18 / params.priceX;
    price = -df_dx(reserve1, params.priceY, params.priceX, params.equilibriumReserve1, params.concentrationY);
    price = c1e18 * c1e18 / price;
  }
  return price;
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

export function f(x: bigint, px: bigint, py: bigint, x0: bigint, y0: bigint, c: bigint): bigint {
  let v = (px * (x0 - x)) * (c * x + (c1e18 - c) * x0);
  let denom = x * c1e18;
  v = (v + (denom - 1n)) / denom;
  return y0 + (v + (py - 1n)) / py;
}

export function fInverse(y: bigint, px: bigint, py: bigint, x0: bigint, y0: bigint, cx: bigint): bigint {
  const term1 = (((py * c1e18 * (y - y0)) / px) * c1e18) / px;
  const term2 = (2n * cx - c1e18) * x0;
  const B = (term1 - term2) / c1e18;
  const C = ((c1e18 - cx) * x0 * x0) / c1e18;
  const fourAC = (4n * cx * C) / c1e18;
  const absB = B >= 0n ? B : -B;
  let sqrt = 0n;
  let squaredB = 0n;
  let discriminant = 0n;
  if (absB < 10n ** 36n) {
    squaredB = absB * absB;
    discriminant = squaredB + fourAC;
    sqrt = bigintSqrt(discriminant);
  } else {
    const scale = computeScale(absB);
    squaredB = ((absB / scale) * absB) / scale;
    discriminant = squaredB + fourAC / (scale * scale);
    sqrt = bigintSqrt(discriminant);
    sqrt = sqrt * scale;
  }
  let x = 0n;
  if (B <= 0n) {
    x = (absB + sqrt) / 2n + 1n;
  } else {
    x = bigintCeil((2n * C) / (absB + sqrt)) + 1n;
  }
  if (x >= x0) {
    return x0;
  }
  return x;
}

export function df_dx(x: bigint, px: bigint, py: bigint, x0: bigint, cx: bigint): bigint {
  const r = (((x0 * x0) / x) * c1e18) / x;
  return (-px * (cx + ((c1e18 - cx) * r) / c1e18)) / py;
}

function computeScale(x: bigint): bigint {
  let bits = 0n;
  let remaining = x;
  while (remaining > 0n) {
    remaining >>= 1n;
    bits++;
  }
  if (bits > 128n) {
    const excessBits = bits - 128n;
    return 1n << excessBits;
  }
  return 1n;
}

function bigintSqrt(x: bigint): bigint {
  if (x < 0n) throw new Error('Square root of negative number');
  if (x < 2n) return x;
  function newtonIteration(n: bigint, x0: bigint): bigint {
    const x1 = (n / x0 + x0) >> 1n;
    if (x0 === x1 || x0 === x1 - 1n) return x0;
    return newtonIteration(n, x1);
  }
  return newtonIteration(x, 1n << (BigInt(x.toString(2).length) >> 1n));
}

function bigintCeil(x: bigint): bigint {
  if (x >= 0n) return x;
  const absX = x >= 0n ? x : -x;
  const quotient = absX / c1e18;
  const remainder = absX % c1e18;
  return remainder === 0n ? quotient : quotient + 1n;
} 