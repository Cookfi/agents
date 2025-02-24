import { type Client, elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { TradingWorkflow } from "../workflows/tradingWorkflow";

export const TraidersdotfunClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        elizaLogger.log("Traidersdotfun client started");

        this.trading = new TradingWorkflow(runtime);

        // Start the trading workflow
        await this.trading.start();
    },

    async stop(_runtime: IAgentRuntime) {
        elizaLogger.warn("Traidersdotfun client does not support stopping yet");
    },
};

export default TraidersdotfunClientInterface;
