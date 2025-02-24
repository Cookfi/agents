import {
    Action,
    elizaLogger,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import TradingService from "../services/trading/solana";
import { TRADING_CONFIG } from "../services/trading/solana/config";

interface StakeData {
    amount: number;
}

const stake: Action = {
    name: "stake",
    description: "Stake SOL to receive jupSOL tokens",
    similes: ["stake", "liquid stake", "deposit"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.log("Message:", message);

        const data = message.content?.data as StakeData | undefined;
        if (!data) {
            elizaLogger.warn("No data provided in message");
            return false;
        }

        if (!data.amount || data.amount < TRADING_CONFIG.STAKE.MINIMUM_AMOUNT) {
            elizaLogger.warn(
                `Amount must be at least ${TRADING_CONFIG.STAKE.MINIMUM_AMOUNT} SOL`
            );
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
            const data = message.content?.data as StakeData;

            const result = await agent.stake({
                amount: data.amount,
            });

            elizaLogger.log("Staking completed successfully:", result);
            elizaLogger.info(
                `Successfully staked ${data.amount} SOL and received ${result.jupsolAmount} jupSOL.\nTransaction signature: ${result.signature}`
            );

            return true;
        } catch (error) {
            elizaLogger.error("Staking action failed:", error);
            elizaLogger.error(`Failed to stake SOL: ${error.message}`);
            return false;
        }
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Stake 1 SOL with Jupiter validator",
                    data: {
                        amount: 1.0,
                    },
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Staking 1.0 SOL to receive jupSOL...",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Create a liquid staking position with 2.5 SOL",
                    data: {
                        amount: 2.5,
                    },
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Staking 2.5 SOL to receive jupSOL...",
                },
            },
        ],
    ],
};

export default stake;
