import {
    Action,
    elizaLogger,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import TradingService from "../services/trading/solana";

interface SwapData {
    fromToken: string;
    toToken: string;
    amount: number;
    slippage?: number;
}

const COMMON_TOKENS = {
    SOL: "So11111111111111111111111111111111111111112",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
} as const;

const swap: Action = {
    name: "swap",
    description: "Swap tokens using Jupiter aggregator",
    similes: ["trade", "exchange", "convert"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Message:", message);

        const data = message.content?.data as SwapData | undefined;
        if (!data) {
            elizaLogger.warn("No data provided in message");
            return false;
        }

        if (!data.fromToken || !data.toToken || !data.amount) {
            elizaLogger.warn("Missing required parameters");
            return false;
        }

        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: { [key: string]: unknown }
    ): Promise<boolean> => {
        try {
            const agent = new TradingService({});
            const data = message.content?.data as SwapData;

            // Convert token symbols to addresses if needed
            const fromToken =
                COMMON_TOKENS[
                    data.fromToken.toUpperCase() as keyof typeof COMMON_TOKENS
                ] || data.fromToken;
            const toToken =
                COMMON_TOKENS[
                    data.toToken.toUpperCase() as keyof typeof COMMON_TOKENS
                ] || data.toToken;

            const result = await agent.swap({
                fromToken,
                toToken,
                amount: data.amount,
                slippage: data.slippage || 0.5, // Default 0.5% slippage
            });

            elizaLogger.log("Swap completed successfully:", result);
            elizaLogger.info(
                `Successfully swapped ${data.amount} ${data.fromToken} for ${data.toToken}.\nTransaction signature: ${result.signature}`
            );

            return true;
        } catch (error) {
            elizaLogger.error("Swap action failed:", error);
            elizaLogger.error(`Failed to execute swap: ${error.message}`);
            return false;
        }
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "I want to swap 1 SOL for USDC",
                    data: {
                        fromToken: "SOL",
                        toToken: "USDC",
                        amount: 1.0,
                        slippage: 0.5,
                    },
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Swapping 1.0 SOL for USDC...",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Exchange 100 USDC for BONK",
                    data: {
                        fromToken: "USDC",
                        toToken: "BONK",
                        amount: 100.0,
                    },
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Swapping 100.0 USDC for BONK...",
                },
            },
        ],
    ],
};

export default swap;
