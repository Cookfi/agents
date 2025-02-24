export const EXECUTION_CONFIG = {
    CONFIDENCE: {
        MIN_LEVEL: 75, // Minimum confidence to execute trades
        MAX_LEVEL: 100 // Maximum confidence level
    },
    TRADE: {
        MIN_BUY_AMOUNT: 0.001, // Minimum SOL amount to buy
        MAX_BUY_AMOUNT: 0.005, // Maximum SOL amount to buy
        SLIPPAGE: 1.0 // 1% slippage
    }
};
