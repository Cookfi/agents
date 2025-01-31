import { type Client, elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { TradingWorkflow } from "../workflows/tradingWorkflow";

/**
 * A manager that orchestrates all DeFi trading logic
 */
class CookfiManager {
    trading: TradingWorkflow;

    constructor(runtime: IAgentRuntime) {
        // Trading workflow
        this.trading = new TradingWorkflow(runtime);
    }
}

export const CookfiClientInterface: Client = {
    async start(runtime: IAgentRuntime) {
        elizaLogger.log("Cookfi client started");

        const manager = new CookfiManager(runtime);

        // Start the trading workflow
        await manager.trading.start();

        return manager;
    },

    async stop(_runtime: IAgentRuntime) {
        elizaLogger.warn("Cookfi client does not support stopping yet");
    },
};

export default CookfiClientInterface; 