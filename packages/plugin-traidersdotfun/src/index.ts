import type { Plugin } from "@elizaos/core";
import analyzeTweets from "./actions/analyzeTweets";
import TraidersdotfunClientInterface from "./clients/traidersdotfunClient";
import { RecallService } from "./services/recall";

// Export the config validation for use by other modules
export {
    validateTraidersdotfunConfig,
    type TraidersdotfunConfig,
} from "./environment";

export const traidersdotfunPlugin: Plugin = {
    name: "traidersdotfun",
    description: "DeFi trading plugin for Eliza",
    clients: [TraidersdotfunClientInterface],
    actions: [analyzeTweets],
    evaluators: [],
    services: [RecallService.getInstance()],
};

export default traidersdotfunPlugin;
