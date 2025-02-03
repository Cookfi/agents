import { elizaLogger } from "@elizaos/core";
import type {
    BirdeyePortfolioResponse,
    PortfolioBalance,
    TokenBalance
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
     * Transform Birdeye response to our PortfolioBalance format
     */
    private transformPortfolioData(
        data: BirdeyePortfolioResponse | null
    ): PortfolioBalance {
        const emptyBalance: PortfolioBalance = {
            sol: { amount: 0, usdValue: 0 },
            tokens: [],
            totalUsdValue: 0
        };

        if (!data?.data?.items) {
            return emptyBalance;
        }

        try {
            const tokens: TokenBalance[] = data.data.items.map(item => ({
                mint: item.address,
                symbol: item.symbol,
                name: item.name,
                logo: item.logoURI,
                amount: item.amount,
                decimals: item.decimals,
                usdValue: item.value,
                price: item.price
            }));

            return {
                sol: {
                    amount: tokens.find(t => t.symbol === "SOL")?.amount || 0,
                    usdValue: data.data.solValue
                },
                tokens: tokens.filter(t => t.symbol !== "SOL"),
                totalUsdValue: data.data.totalValue
            };
        } catch (error) {
            elizaLogger.warn("Failed to transform portfolio data:", error);
            return emptyBalance;
        }
    }

    /**
     * Get complete portfolio balance including USD values
     */
    async getPortfolioBalance(): Promise<PortfolioBalance> {
        const birdeyeData = await this.fetchPortfolioData();
        return this.transformPortfolioData(birdeyeData);
    }
}

export default PortfolioService; 