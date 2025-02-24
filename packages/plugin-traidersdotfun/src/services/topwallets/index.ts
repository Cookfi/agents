import { elizaLogger } from "@elizaos/core";
import axios, { AxiosInstance } from "axios";
import type { TokenResult } from "../../types/token";
import { TOPWALLETS_CONFIG } from "./config";
import type { TopTokenResponse } from "./types";

export class TopWalletsService {
    private client: AxiosInstance;
    private static instance: TopWalletsService;

    private constructor() {
        if (!TOPWALLETS_CONFIG.API_KEY) {
            throw new Error(
                "Missing TRAIDERSDOTFUN_TOPWALLETS_API_KEY environment variable. Please set it in your .env file"
            );
        }

        this.client = axios.create({
            baseURL: TOPWALLETS_CONFIG.API_URL,
            headers: {
                Authorization: `Bearer ${TOPWALLETS_CONFIG.API_KEY}`,
                "Content-Type": "application/json",
            },
        });
    }

    public static getInstance(): TopWalletsService {
        if (!TopWalletsService.instance) {
            TopWalletsService.instance = new TopWalletsService();
        }
        return TopWalletsService.instance;
    }

    /**
     * Get the top 3 tokens traded in the last hour on Solana by top 100 traders + top kols
     * @returns TokenResult[]
     */
    async getTopWalletsToken(): Promise<TokenResult[]> {
        try {
            const response = await this.client.get<TopTokenResponse>(
                "/api/bot/solana/top-wallets-token"
            );

            if (!response.data.success) {
                elizaLogger.warn("Top wallets token fetch failed", {
                    error: response.data.message,
                });
                throw new Error(response.data.message);
            }

            // Take only the first 3 tokens
            const topTokens = response.data.data.tokens.slice(0, 3);

            return topTokens.map((token) => ({
                symbol: token.symbol,
                name: token.name,
                address: token.address,
                chainId: "solana",
            }));
        } catch (error) {
            elizaLogger.error("Top wallets token error", { error });
            return [];
        }
    }
}

export default TopWalletsService;
