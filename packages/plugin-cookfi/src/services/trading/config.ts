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
    },
} as const;
