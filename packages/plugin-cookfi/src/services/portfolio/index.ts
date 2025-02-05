import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import Moralis from "moralis";
import { PORTFOLIO_CONFIG } from "./config";
import type {
    PortfolioServiceConfig,
    PortfolioResponse,
    TokenBalance,
} from "./types";
import { TokenResult } from "../../types/token";

export class PortfolioService {
    private address: string;
    private lastFetchTime: number = 0;
    private cachedPortfolio: PortfolioResponse | null = null;

    constructor(config: PortfolioServiceConfig) {
        this.address = config.address;
    }

    private async initializeMoralis() {
        if (!Moralis.Core.isStarted) {
            const apiKey = process.env.MORALIS_API_KEY;
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
     * Get portfolio tokens with balance information
     * @returns Promise containing array of token information
     */
    async getTokens(): Promise<TokenResult[]> {
        try {
            const portfolio = await this.getPortfolio();

            if (!portfolio?.tokens) {
                return [];
            }

            const tokens = portfolio.tokens.map((token) => ({
                symbol: token.symbol,
                name: token.name,
                address: token.mint,
                chainId: "solana",
                balance: {
                    amount: parseFloat(token.amount),
                    usdValue: 0, // Note: Moralis doesn't provide USD value directly
                },
            }));

            return tokens;
        } catch (error) {
            elizaLogger.warn("Failed to transform portfolio data:", error);
            return [];
        }
    }
}

export default PortfolioService;
