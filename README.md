# CookFi AI

A degen cooking up alpha and gains.

## Key Goals:

1. **Autonomous Trading Agent**: Build an AI agent capable of fully autonomous buy and sell decisions on Solana, leveraging Web3 data and AI-driven analysis.
2. **Data-Driven Decision Making**: Use data from platforms like Cookie, Dexscreener, and Birdeye, analyzing market conditions (e.g., liquidity, volume, and market cap) to guide investment choices.
3. **Custom Investment Strategy**: Develop a tailored investment strategy that accounts for risk levels, liquidity, and other market factors, guiding the agent’s decision-making process.
4. **Automated Rebalancing**: Implement an automated system that allows the agent to monitor its portfolio and make sell decisions based on pre-defined triggers, ensuring optimal performance.
5. **Social Media Integration**: Allow the AI agent to autonomously manage a Twitter account, sharing updates on trades and investment decisions.
6. **Yield Optimization**: Explore DeFi protocols to maximize returns on the agent's holdings by generating yield alongside the trading strategy.

## Install 

- Setup env variables
```
  TELEGRAM_BOT_TOKEN=
  OPENAI_API_KEY=
  COOKFI_COOKIE_API_KEY=
  COOKFI_BIRDEYE_API_KEY=
  COOKFI_BIRDEYE_DRY_RUN=true
  COOKFI_SOLANA_PRIVATE_KEY=
  COOKFI_SOLANA_PUBLIC_KEY=
  COOKFI_SOLANA_RPC_URL=https://api.devnet.solana.com
```
- Then run
  - `pnpm install`
  - `pnpm build`
  - `pnpm start:debug --character="../characters/cookfi.character.json" | tee output.log`
