import { type Client, elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { TradingWorkflow } from "../workflows/tradingWorkflow";

export const CookfiClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        elizaLogger.log("Cookfi client started");

        this.trading = new TradingWorkflow(runtime);

        // Start the trading workflow
        await this.trading.start();
    },

    async stop(_runtime: IAgentRuntime) {
        elizaLogger.warn("Cookfi client does not support stopping yet");
    },
};

export default CookfiClientInterface; 