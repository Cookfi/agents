import { elizaLogger } from "@elizaos/core";
import axios from "axios";
import type { TokenResult } from "../../types/token";
import { MORALIS_CONFIG } from "./config";
import type { ExperiencedBuyerToken, MoralisSearchParams } from "./types";

export class MoralisService {
    private readonly baseUrl = "https://deep-index.moralis.io/api/v2.2";

    constructor() {
        if (!process.env.TRAIDERSDOTFUN_MORALIS_API_KEY) {
            throw new Error(
                "TRAIDERSDOTFUN_MORALIS_API_KEY environment variable is required"
            );
        }
    }

    async getExperiencedBuyerTokens(
        params: MoralisSearchParams = {}
    ): Promise<TokenResult[]> {
        try {
            const searchParams = {
                chain: params.chain || MORALIS_CONFIG.DEFAULT_CHAIN,
                ...MORALIS_CONFIG.DEFAULT_PARAMS,
                ...params,
            };

            const response = await axios.get<ExperiencedBuyerToken[]>(
                `${this.baseUrl}/discovery/tokens/experienced-buyers`,
                {
                    params: searchParams,
                    headers: {
                        Accept: "application/json",
                        "X-API-Key": process.env.TRAIDERSDOTFUN_MORALIS_API_KEY,
                    },
                }
            );

            return response.data.map((token) => ({
                symbol: token.token_symbol,
                name: token.token_name,
                address: token.token_address,
                chainId: token.chain_id,
            }));
        } catch (error) {
            elizaLogger.error(
                "Failed to fetch experienced buyer tokens:",
                error
            );
            return [];
        }
    }
}

export default MoralisService;
