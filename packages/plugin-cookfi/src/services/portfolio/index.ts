import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import Moralis from "moralis";
import { PORTFOLIO_CONFIG } from "./config";
import type {
    PortfolioServiceConfig,
    PortfolioResponse,
    TokenMetadata,
    TokenBalance,
} from "./types";

export class PortfolioService {
    private address: string;
    private runtime: IAgentRuntime;
    private lastFetchTime: number = 0;
    private cachedPortfolio: PortfolioResponse | null = null;

    constructor(config: PortfolioServiceConfig, runtime: IAgentRuntime) {
        this.address = config.address;
        this.runtime = runtime;
    }

    private async initializeMoralis() {
        if (!Moralis.Core.isStarted) {
            const apiKey = this.runtime.getSetting("MORALIS_API_KEY");
            if (!apiKey) {
                throw new Error(
                    "MORALIS_API_KEY not found in environment variables"
                );
            }
            await Moralis.start({ apiKey });
        }
    }

    private shouldRefreshCache(): boolean {
        return (
            !this.cachedPortfolio ||
            Date.now() - this.lastFetchTime > PORTFOLIO_CONFIG.CACHE_TTL
        );
    }

    private transformMoralisResponse(response: any): PortfolioResponse {
        return {
            nativeBalance: response.nativeBalance,
            tokens: response.tokens.map(
                (token: any): TokenBalance => ({
                    associatedTokenAddress: token.associatedTokenAddress,
                    mint: token.mint,
                    amountRaw: token.amountRaw,
                    amount: token.amount,
                    decimals: token.decimals,
                    name: token.name,
                    symbol: token.symbol,
                    logo: token.logo || null,
                })
            ),
        };
    }

    /**
     * Get portfolio balance including SOL and all tokens
     * @returns Promise containing portfolio balance information
     */
    async getPortfolio(): Promise<PortfolioResponse> {
        try {
            if (!this.shouldRefreshCache()) {
                return this.cachedPortfolio!;
            }

            await this.initializeMoralis();

            const response = await Moralis.SolApi.account.getPortfolio({
                network: PORTFOLIO_CONFIG.NETWORK,
                address: this.address,
            });

            this.cachedPortfolio = this.transformMoralisResponse(response.raw);
            this.lastFetchTime = Date.now();

            return this.cachedPortfolio;
        } catch (error) {
            elizaLogger.error("Failed to fetch portfolio:", error);
            throw error;
        }
    }

    /**
     * Get metadata for a specific token
     * @param mint Token mint address
     * @returns Promise containing token metadata
     */
    async getTokenMetadata(mint: string): Promise<TokenMetadata | null> {
        try {
            const portfolio = await this.getPortfolio();
            const token = portfolio.tokens.find((t) => t.mint === mint);

            if (!token) {
                return null;
            }

            return {
                mint: token.mint,
                name: token.name,
                symbol: token.symbol,
                logo: token.logo,
                decimals: token.decimals,
            };
        } catch (error) {
            elizaLogger.error("Failed to get token metadata:", error);
            throw error;
        }
    }
}

export default PortfolioService;
