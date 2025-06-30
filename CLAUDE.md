# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint on all TypeScript/React files
- `npm run preview` - Preview production build locally

## Project Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Blockchain**: Viem library for Ethereum interactions
- **Routing**: React Router for multi-page navigation
- **Styling**: CSS + inline styles (no CSS framework)

### Core Structure
This is a DeFi application for interacting with EulerSwap protocol across multiple blockchain networks:

- **Multi-network support**: Ethereum Mainnet, Base, Avalanche, BSC, Unichain, and local dev environment
- **Pool management**: Analyze liquidity pools, create pools, deposit liquidity
- **Swap functionality**: Token swapping with quote simulation
- **Real-time data**: Fetches pool data, reserves, swap history, and metrics from blockchain

### Key Components

#### Main App (`src/App.tsx`)
- Central application state management
- Network switching logic
- Pool data fetching and caching
- Routing configuration
- Contains extensive pool analysis logic including:
  - Fee and volume metrics calculation
  - Vault availability checking
  - Swap simulation and limits
  - Event log processing

#### Pages
- `PoolAnalyzerMain.tsx` - Main pool analysis dashboard
- `Swap.tsx` - Token swapping interface  
- `CreatePool.tsx` - Pool creation form
- `DepositPool.tsx` - Liquidity deposit interface

#### Core Libraries
- `src/lib/LibEulerSwap.ts` - Mathematical functions for EulerSwap curve calculations, price computations, and liquidity math
- `src/assets/networks.ts` - Network configurations with factory addresses and chain details
- `src/assets/tokenlist.ts` - Token definitions per network

#### Smart Contract Integration
- Factory contract interactions for pool discovery
- Pool contract calls for reserves, parameters, quotes
- Vault contract integration for available liquidity
- Event log processing for swap history and metrics

### Development Patterns
- Uses React hooks extensively for state management
- Async blockchain calls with proper error handling
- Real-time data updates with useEffect cleanup patterns
- Responsive sidebar + main content layout
- Extensive use of BigInt for precise financial calculations

### Network Configuration
The app supports multiple blockchain networks with different factory contracts and token lists. Network switching updates the entire application context including client, factory address, and available tokens.

### Smart Contract ABIs
Contains embedded ABIs for:
- Factory contract (pool management)
- Pool contract (swaps, quotes, reserves)
- Vault contract (ERC4626 vault operations)