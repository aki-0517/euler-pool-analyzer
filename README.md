# EulerSwap Analytics Dashboard

A read-only monitoring and analytics application for EulerSwap pools across multiple blockchain networks.

## Features

### 🔍 **Read-Only Pool Analysis**
- Real-time pool discovery and monitoring
- Comprehensive pool metrics (fees, TVL, balance ratios)
- Vault availability tracking
- Historical swap data analysis
- Price chart visualization
- Fee and volume analytics

### 🌐 **Multi-Network Support**
- Ethereum Mainnet
- Base
- Avalanche
- BSC (Binance Smart Chain)
- Unichain
- Local development environment

### 📊 **Analytics Features**
- Pool performance metrics
- Daily and cumulative trading statistics
- APR estimates based on fee generation
- Swap history with detailed transaction data
- Network-wide protocol statistics

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Blockchain**: Viem library for Ethereum interactions
- **Styling**: CSS + inline styles (no CSS framework)
- **Build Tool**: Vite with TypeScript compilation

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

5. **Lint code**:
   ```bash
   npm run lint
   ```

### Usage

1. **Select Network**: Choose from supported blockchain networks in the sidebar
2. **Browse Pools**: View all available pools for the selected network
3. **Analyze Pool**: Click on any pool to view detailed analytics including:
   - Pool parameters and reserves
   - Fee structure and APR estimates
   - Vault availability for both assets
   - Historical trading data and charts
   - Daily/cumulative metrics

## Key Components

### **App.tsx**
- Main application component
- Network management and switching
- Pool data fetching and state management
- Analytics calculations

### **PoolAnalyzerMain.tsx**
- Primary analytics dashboard
- Pool metrics visualization
- Historical data display

### **LibEulerSwap.ts**
- Mathematical utilities for price calculations
- Pool health analysis functions
- Read-only curve verification

### **Network Configuration**
- `src/assets/networks.ts` - Network configurations
- `src/assets/tokenlist.ts` - Token definitions per network

## Security

⚠️ **This application is READ-ONLY** - it cannot perform any blockchain transactions or interact with smart contracts beyond reading data. All functionality is strictly limited to:
- Reading pool data
- Fetching historical events
- Calculating analytics
- Displaying information

No private keys, wallets, or transaction capabilities are included.

## Architecture

The application follows a clean architecture pattern:

```
src/
├── App.tsx                 # Main application component
├── lib/
│   └── LibEulerSwap.ts    # Mathematical utilities
├── pages/
│   └── PoolAnalyzerMain.tsx # Analytics dashboard
├── assets/
│   ├── networks.ts        # Network configurations
│   └── tokenlist.ts       # Token definitions
└── main.tsx               # Application entry point
```

### Smart Contract Integration

The app interacts with:
- **Factory Contract**: Pool discovery and protocol parameters
- **Pool Contract**: Pool data, reserves, and parameters
- **Vault Contract**: ERC4626 vault balance information

All interactions are read-only via the Viem library.