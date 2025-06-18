export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
};

export type TokenList = Record<string, TokenInfo[]>;

export const TOKEN_LIST: Record<string, TokenInfo[]> = {
  mainnet: [
    { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, name: 'Ether' },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, name: 'USD Coin' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, name: 'Tether USD' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, name: 'Dai Stablecoin' },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, name: 'Wrapped BTC' },
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, name: 'Wrapped Ether' },
  ],
  base: [
    { symbol: 'ETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, name: 'Ether' },
    { symbol: 'USDC', address: '0xd9AAEC86B65d86F6A7B5b1b0c42FFA531710b6CA', decimals: 6, name: 'USD Coin' },
    { symbol: 'DAI', address: '0xF14F9596430931E177469715c591513308244e8F', decimals: 18, name: 'Dai Stablecoin' },
    { symbol: 'USDbC', address: '0xd9AAEC86B65d86F6A7B5b1b0c42FFA531710b6CA', decimals: 6, name: 'USD Base Coin' },
  ],
  avalanche: [
    { symbol: 'AVAX', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18, name: 'Avalanche' },
    { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6, name: 'USD Coin' },
    { symbol: 'USDT', address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', decimals: 6, name: 'Tether USD' },
    { symbol: 'DAI', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', decimals: 18, name: 'Dai Stablecoin' },
    { symbol: 'WETH', address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', decimals: 18, name: 'Wrapped Ether' },
  ],
  bsc: [
    { symbol: 'BNB', address: '0x0000000000000000000000000000000000000000', decimals: 18, name: 'BNB' },
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, name: 'Tether USD' },
    { symbol: 'USDC', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, name: 'USD Coin' },
    { symbol: 'DAI', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, name: 'Dai Stablecoin' },
    { symbol: 'WBNB', address: '0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, name: 'Wrapped BNB' },
  ],
  // Add more networks/tokens as needed
}; 