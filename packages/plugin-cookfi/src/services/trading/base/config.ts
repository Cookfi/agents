export const BASE_TRADING_CONFIG = {
    NETWORKS: {
        BASE_MAINNET: "base-mainnet",
        BASE_SEPOLIA: "base-sepolia"
    },
    ASSETS: {
        ETH: "ETH",
        USDC: "USDC"
    },
    DEFAULT_NETWORK: "base-sepolia",
    DEFAULT_SLIPPAGE: 1, // 1%
    MAX_SLIPPAGE: 30, // 30%
    MAX_RETRIES: 5,
    RETRY_DELAY: 5000 // 5 seconds
} as const;
