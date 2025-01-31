# Cookfi Plugin

An automated DEFAI plugin for Solana with integrated autonomous trading based on market analysis, social analysis, trust scoring.

## Features

- Automated trading on Solana blockchain
  - Executed with SolanaAgentKit
  - Decision based on:
    - Real-time market data analysis using DexScreener / Birdeye
    - Social data analysis using Cookie.fun
  - With configurable strategy 
    - Safety limits and risk management
    - Strategy setup (min marketcap, min/max invest by day/trade)
    - Rate limiting and cache management
- Automated defi strategy on Solana blockchain exected with SolanaAgentKit
- Automated social integration
  - Twitter tweets about his trades, placements..
- Performance tracking and trade history

## Installation

```bash
npm install @elizaos/plugin-cookfi
```

## Prerequisites

The following environment variables need to be configured:

- `WALLET_PRIVATE_KEY`: Your Solana wallet private key
- `WALLET_PUBLIC_KEY`: Your Solana wallet public address
- `SOLANA_RPC_URL`: Solana RPC endpoint (defaults to mainnet)
- `BIRDEYE_API_KEY`: API key for Birdeye data provider
- `TWITTER_ENABLED`: Enable/disable Twitter notifications
- `TWITTER_USERNAME`: Twitter username for notifications

## Usage

```typescript
import createCookfiPlugin from '@elizaos/plugin-cookfi';
import { IAgentRuntime } from '@elizaos/core';

const plugin = await createCookfiPlugin(
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

- **DexScreener**: Real-time trading data and market analysis
- **Birdeye API**: Market data and token security information
- **Cookie.fun**: Social data
- **Solana agent kit**: Solana onchain execution
