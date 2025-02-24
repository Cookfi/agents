import { elizaLogger } from "@elizaos/core";
import Moralis from "moralis";
import { TokenResult } from "../../types/token";
import { PORTFOLIO_CONFIG } from "./config";
import type {
    PortfolioResponse,
    SwapHistoryResponse,
    SwapTransaction,
    TokenBalance,
} from "./types";

export class PortfolioService {
    private walletAddress: string;
    private lastFetchTime: number = 0;
    private cachedPortfolio: PortfolioResponse | null = null;

    constructor() {
        this.walletAddress = process.env.TRAIDERSDOTFUN_SOLANA_PUBLIC_KEY || "";
        if (!this.walletAddress) {
            elizaLogger.warn(
                "TRAIDERSDOTFUN_SOLANA_PUBLIC_KEY is not set in environment"
            );
        }
    }

    public async initialize(): Promise<void> {
        if (Moralis.Core.isStarted) return;

        const apiKey = process.env.TRAIDERSDOTFUN_MORALIS_API_KEY;
        if (!apiKey) {
            throw new Error(
                "TRAIDERSDOTFUN_MORALIS_API_KEY not found in environment variables"
            );
        }

        try {
            await Moralis.start({ apiKey });
        } catch (error) {
            elizaLogger.error("Failed to initialize Moralis:", error);
            throw error;
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

            await this.initialize();

            const response = await Moralis.SolApi.account.getPortfolio({
                network: PORTFOLIO_CONFIG.NETWORK,
                address: this.walletAddress,
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
     * Get all swap transactions for a specific token
     * @param tokenAddress The address of the token to get swaps for
     * @returns Promise containing array of swap transactions
     */
    async getAllSwaps(tokenAddress: string): Promise<SwapTransaction[]> {
        try {
            await this.initialize();

            const response = await fetch(
                `https://solana-gateway.moralis.io/account/${PORTFOLIO_CONFIG.NETWORK}/${this.walletAddress}/swaps?order=DESC&tokenAddress=${tokenAddress}`,
                {
                    method: "GET",
                    headers: {
                        accept: "application/json",
                        "X-API-Key":
                            process.env.TRAIDERSDOTFUN_MORALIS_API_KEY || "",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = (await response.json()) as SwapHistoryResponse;
            return data.result;
        } catch (error) {
            elizaLogger.error("Failed to fetch swap history:", error);
            throw error;
        }
    }

    /**
     * Calculate cost basis for a token based on swap history
     * @param tokenAddress The address of the token
     * @returns The cost basis in native token (SOL)
     */
    async calculateCostBasis(tokenAddress: string): Promise<number> {
        try {
            const swaps = await this.getAllSwaps(tokenAddress);

            let netTokens = 0; // Running total of tokens held
            let totalCost = 0; // Running total of SOL spent/received

            for (const swap of swaps) {
                if (swap.transactionType === "buy") {
                    if (
                        swap.bought.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                    ) {
                        // Buying tokens: Add to position
                        netTokens += parseFloat(swap.bought.amount);
                        totalCost += parseFloat(swap.sold.amount); // SOL spent
                    }
                } else if (swap.transactionType === "sell") {
                    if (
                        swap.sold.address.toLowerCase() ===
                        tokenAddress.toLowerCase()
                    ) {
                        // Selling tokens: Reduce position
                        netTokens -= parseFloat(swap.sold.amount);
                        totalCost -= parseFloat(swap.bought.amount); // SOL received
                    }
                }
            }

            // Return average cost basis in SOL for current holdings
            return netTokens > 0 ? totalCost / netTokens : 0;
        } catch (error) {
            elizaLogger.error("Failed to calculate cost basis:", error);
            return 0;
        }
    }

    /**
     * Get portfolio tokens with balance and cost basis information
     * @returns Promise containing array of token information
     */
    async getTokens(): Promise<TokenResult[]> {
        try {
            const portfolio = await this.getPortfolio();

            if (!portfolio?.tokens) {
                return [];
            }

            // Process tokens in parallel for better performance
            const tokens = await Promise.all(
                portfolio.tokens.map(async (token) => {
                    const costBasisNative = await this.calculateCostBasis(
                        token.mint
                    );

                    return {
                        symbol: token.symbol,
                        name: token.name,
                        address: token.mint,
                        chainId: "solana",
                        balance: {
                            amount: parseFloat(token.amount),
                            usdValue: 0,
                            costBasisNative,
                        },
                    };
                })
            );

            return tokens;
        } catch (error) {
            elizaLogger.warn("Failed to transform portfolio data:", error);
            return [];
        }
    }
}

export default PortfolioService;
