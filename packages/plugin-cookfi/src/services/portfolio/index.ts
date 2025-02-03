import { elizaLogger } from "@elizaos/core";
import type { TokenResult } from "../../types/token";
import type {
    BirdeyePortfolioResponse
} from "./types";

const BIRDEYE_ENDPOINT = "https://public-api.birdeye.so/v1/wallet/token_list";

export class PortfolioService {
    private walletAddress: string;

    constructor() {
        this.walletAddress = process.env.WALLET_PUBLIC_KEY || "";
        if (!this.walletAddress) {
            elizaLogger.warn("WALLET_PUBLIC_KEY is not set in environment");
        }
    }

    /**
     * Fetch portfolio data from Birdeye API
     */
    private async fetchPortfolioData(): Promise<BirdeyePortfolioResponse | null> {
        if (!this.walletAddress || !process.env.COOKFI_BIRDEYE_API_KEY) {
            elizaLogger.warn(
                "Missing required environment variables for portfolio service"
            );
            return null;
        }

        try {
            const response = await fetch(
                `${BIRDEYE_ENDPOINT}?wallet=${this.walletAddress}`,
                {
                    headers: {
                        "X-API-KEY": process.env.COOKFI_BIRDEYE_API_KEY,
                        Accept: "application/json"
                    }
                }
            );

            if (!response.ok) {
                elizaLogger.warn(`Birdeye API error: ${response.status}`);
                return null;
            }

            const data = await response.json();
            return data as BirdeyePortfolioResponse;
        } catch (error) {
            elizaLogger.warn("Failed to fetch portfolio data:", error);
            return null;
        }
    }

    /**
     * Get portfolio tokens with balance information
     */
    async getTokens(): Promise<TokenResult[]> {
        const data = await this.fetchPortfolioData();
        
        if (!data?.data?.items) {
            return [];
        }

        try {
            const tokens = data.data.items
                .filter(item => item.symbol !== "SOL") // Filter out SOL token
                .map(item => ({
                    symbol: item.symbol,
                    name: item.name,
                    address: item.address,
                    chainId: "solana",
                    balance: {
                        amount: item.amount,
                        usdValue: item.value
                    }
                }));

            return tokens;
        } catch (error) {
            elizaLogger.warn("Failed to transform portfolio data:", error);
            return [];
        }
    }
}

export default PortfolioService; 