export const TRADING_CONFIG = {
    DEFAULT_RPC_URL: "https://api.mainnet-beta.solana.com",
    DEFAULT_SLIPPAGE: 0.5, // 0.5%
    TOKENS: {
        SOL: "So11111111111111111111111111111111111111112",
        USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        JUPSOL: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
    },
    STAKE: {
        MINIMUM_AMOUNT: 0.1,
    },
} as const;
