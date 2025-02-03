import type { Plugin } from "@elizaos/core";
import analyzeTweets from "./actions/analyzeTweets";
import CookfiClientInterface from "./clients/cookfiClient";

// Export the config validation for use by other modules
export { validateCookfiConfig, type CookfiConfig } from "./environment";

export const cookfiPlugin: Plugin = {
    name: "cookfi",
    description: "DeFi trading plugin for Eliza",
    clients: [CookfiClientInterface],
    actions: [analyzeTweets],
    evaluators: [],
    services: [],
};

export default cookfiPlugin;
