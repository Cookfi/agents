import { settings } from "@elizaos/core";

export const TRADING_CONFIG = {
    DEFAULT_RPC_URL: settings.SOLANA_RPC_URL,
    TOKENS: {
        JUPSOL: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
    },
    STAKE: {
        MINIMUM_AMOUNT: 0.1,
    },
} as const;
