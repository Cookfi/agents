export const TRADING_CONFIG = {
    DEFAULT_RPC_URL: "https://api.mainnet-beta.solana.com",
    DEFAULT_SLIPPAGE: 0.5, // 0.5%
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60,
    },
    ENDPOINTS: {
        SWAP: "/swap",
        TRANSFER: "/transfer",
        TOKEN_INFO: "/token",
        LEND: "/lend",
        STAKE: "/stake",
        JUPITER_TOKEN_LIST: "https://tokens.jup.ag/all",
        DEXSCREENER_SEARCH: "https://api.dexscreener.com/latest/dex/search",
    },
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
