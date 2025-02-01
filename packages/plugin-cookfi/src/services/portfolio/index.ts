import { elizaLogger } from "@elizaos/core";
import { PORTFOLIO_CONFIG } from "./config";
import type {
    BirdeyePortfolioResponse,
    PortfolioBalance,
    PortfolioServiceConfig,
    TokenBalance
} from "./types";

export class PortfolioService {
    private walletAddress: string;

    constructor(config: PortfolioServiceConfig) {
        this.walletAddress = config.walletAddress;
    }

    /**
     * Fetch portfolio data from Birdeye API
     */
    private async fetchPortfolioData(): Promise<BirdeyePortfolioResponse> {
        try {
            const response = await fetch(
                `${PORTFOLIO_CONFIG.BIRDEYE_ENDPOINT}?wallet=${this.walletAddress}`,
                {
                    headers: {
                        'X-API-KEY': process.env.COOKFI_BIRDEYE_API_KEY,
                        'Accept': 'application/json',
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Birdeye API error: ${response.status}`);
            }

            const data = await response.json();
            return data as BirdeyePortfolioResponse;
        } catch (error) {
            elizaLogger.error("Failed to fetch portfolio data:", error);
            throw error;
        }
    }

    /**
     * Transform Birdeye response to our PortfolioBalance format
     */
    private transformPortfolioData(data: BirdeyePortfolioResponse): PortfolioBalance {
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
                    // SOL amount is included in the items array
                    amount: tokens.find(t => t.symbol === 'SOL')?.amount || 0,
                    usdValue: data.data.solValue
                },
                tokens: tokens.filter(t => t.symbol !== 'SOL'), // Remove SOL from tokens array
                totalUsdValue: data.data.totalValue
            };
        } catch (error) {
            elizaLogger.error("Failed to transform portfolio data:", error);
            throw error;
        }
    }

    /**
     * Get complete portfolio balance including USD values
     */
    async getPortfolioBalance(): Promise<PortfolioBalance> {
        try {
            const birdeyeData = await this.fetchPortfolioData();
            return this.transformPortfolioData(birdeyeData);
        } catch (error) {
            elizaLogger.error("Failed to get portfolio balance:", error);
            throw error;
        }
    }
}

export default PortfolioService; 