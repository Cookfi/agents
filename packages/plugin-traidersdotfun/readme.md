# Traidersdotfun Plugin

An automated DEFAI plugin for Solana with integrated autonomous trading based on market analysis, social analysis, trust scoring.

## Features

- Automated trading on Solana blockchain
  - Executed with SolanaAgentKit
  - Decision based on:
    - Real-time market data analysis using Moralis
    - Social data analysis using Cookie.fun
    - Top wallets trading activity analysis using TopWallets.ai
  - With configurable strategy 
    - Safety limits and risk management
    - Strategy setup (min marketcap, min/max invest by day/trade)
    - Rate limiting and cache management
- Automated defi strategy on Solana blockchain executed with SolanaAgentKit
- Automated social integration
  - Twitter tweets about trades and placements
- Performance tracking and trade history

## Installation

```bash
npm install @elizaos/plugin-traidersdotfun
```

## Prerequisites

The following environment variables need to be configured:

```bash
# Traidersdotfun Plugin Configuration

# API Keys
TRAIDERSDOTFUN_COOKIE_API_KEY=           # API key for Cookie.fun social data
TRAIDERSDOTFUN_MORALIS_API_KEY=          # API key for Moralis market data
TRAIDERSDOTFUN_TOPWALLETS_API_KEY=       # API key for TopWallets.ai trading analysis

# TopWallets Configuration
TRAIDERSDOTFUN_TOPWALLETS_API_URL=       # TopWallets API URL (defaults to https://www.topwallets.ai)

# Solana Configuration
TRAIDERSDOTFUN_SOLANA_PRIVATE_KEY=       # Your Solana wallet private key
TRAIDERSDOTFUN_SOLANA_PUBLIC_KEY=        # Your Solana wallet public address
TRAIDERSDOTFUN_SOLANA_RPC_URL=           # Solana RPC endpoint (defaults to https://api.mainnet-beta.solana.com)

# Execution Mode
TRAIDERSDOTFUN_DRY_RUN=true             # Set to true for testing without real transactions
```

## Usage

```typescript
import createTraidersdotfunPlugin from '@elizaos/plugin-traidersdotfun';
import { IAgentRuntime } from '@elizaos/core';

const plugin = await createTraidersdotfunPlugin(
  (key: string) => process.env[key],
  runtime
);

// Plugin will automatically start monitoring and trading if enabled
```

## Configuration

### Safety Limits

The plugin includes built-in safety limits that can be configured:

```typescript
export const SAFETY_LIMITS = {
  MINIMUM_TRADE: 0.01,        // Minimum SOL per trade
  MAX_POSITION_SIZE: 0.1,     // Maximum 10% of token liquidity
  MAX_SLIPPAGE: 0.05,        // Maximum 5% slippage allowed
  MIN_LIQUIDITY: 1000,       // Minimum $1000 liquidity required
  MIN_VOLUME: 2000,          // Minimum $2000 24h volume required
  STOP_LOSS: 0.2,           // 20% stop loss trigger
  TAKE_PROFIT: 0.12,        // Take profit at 12% gain
  TRAILING_STOP: 0.2        // 20% trailing stop from highest
};
```

### Trading Parameters

Default trading parameters can be adjusted in the configuration:

```typescript
{
  CHECK_INTERVAL: 5 * 60 * 1000,     // Check every 5 minutes
  REENTRY_DELAY: 60 * 60 * 1000,     // Wait 1 hour before re-entering
  MAX_ACTIVE_POSITIONS: 5,           // Maximum concurrent positions
  MIN_WALLET_BALANCE: 0.05           // Keep minimum 0.05 SOL in wallet
}
```

## API Integration

The plugin integrates with multiple APIs:

- **TopWallets.ai**: Real-time analysis of top 100 traders and KOLs trading activity
  - Tracks tokens traded in the last hour
  - Provides insights from top performing wallets
  - Helps identify emerging trading opportunities
- **Moralis**: Market data and token information
  - Price feeds and market analysis
  - Token metadata and contract information
  - Trading volume and liquidity data
- **Cookie.fun**: Social data and sentiment analysis
- **Solana agent kit**: Solana onchain execution

The TopWallets integration specifically monitors the trading activity of the top 100 traders and key opinion leaders (KOLs) on Solana, providing real-time insights into which tokens are being actively traded by successful traders. This data is used to identify potential trading opportunities before they become widely known.
