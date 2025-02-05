export const EXECUTION_CONFIG = {
    CONFIDENCE: {
        MIN_LEVEL: 80, // Minimum confidence to execute trades
        MAX_LEVEL: 100 // Maximum confidence level
    },
    TRADE: {
        MIN_BUY_AMOUNT: 0.01, // Minimum SOL amount to buy
        MAX_BUY_AMOUNT: 0.1, // Maximum SOL amount to buy
        SLIPPAGE: 1.0 // Default slippage percentage
    }
};
