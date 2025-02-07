import { TwitterClientInterface } from "@elizaos/client-twitter";
import type { IAgentRuntime } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import type { ExecutionResult } from "../execution/types";
import type { TradeAlert, TwitterConfig } from "./types";
import { TwitterConfigSchema } from "./types";

export class TwitterService {
    private client: any;
    private config: TwitterConfig;
    private static instance: TwitterService;

    private constructor(client: any, config: TwitterConfig) {
        this.client = client;
        this.config = config;
    }

    public static async getInstance(runtime: IAgentRuntime): Promise<TwitterService | undefined> {
        if (!TwitterService.instance) {
            const username = runtime.getSetting("COOKFI_TWITTER_USERNAME");
            const password = runtime.getSetting("COOKFI_TWITTER_PASSWORD");
            const email = runtime.getSetting("COOKFI_TWITTER_EMAIL");

            if (!username || !password || !email) {
                elizaLogger.warn("Twitter credentials not configured, notifications disabled");
                return undefined;
            }

            try {
                const config = TwitterConfigSchema.parse({
                    enabled: true,
                    username,
                    password,
                    email,
                    dryRun: runtime.getSetting("TWITTER_DRY_RUN") === "true"
                });

                const twitterClient = await TwitterClientInterface.start(runtime);
                TwitterService.instance = new TwitterService(twitterClient, config);
            } catch (error) {
                elizaLogger.error("Failed to initialize Twitter service:", error);
                return undefined;
            }
        }
        return TwitterService.instance;
    }

    private calculateRiskLevel(marketData: TradeAlert["marketData"], confidence: number): string {
        // Base risk on price volatility, liquidity, and confidence
        const volatilityRisk = Math.abs(marketData.priceChange24h) > 20 ? 1 : 0;
        const liquidityRisk = marketData.liquidity.usd < 10000 ? 1 : 0;
        const confidenceRisk = confidence < 0.6 ? 1 : 0;

        const totalRiskFactors = volatilityRisk + liquidityRisk + confidenceRisk;

        if (totalRiskFactors >= 2) return "HIGH";
        if (totalRiskFactors === 1) return "MEDIUM";
        return "LOW";
    }

    private formatTradeAlert(alert: TradeAlert): string {
        const priceChangePrefix = alert.marketData.priceChange24h >= 0 ? "+" : "";
        const confidenceEmoji = alert.confidence >= 0.8 ? "🟢" : alert.confidence >= 0.5 ? "🟡" : "🔴";

        if (alert.action === "SELL") {
            const actionEmoji = Number(alert.profitPercent?.replace("%", "")) >= 0 
                ? "💰 PROFIT SELL" 
                : "🔴 LOSS SELL";

            const lines = [
                `${actionEmoji} | ${alert.token}`,
                `📊 P/L: ${alert.profitPercent}`,
                `⚠️ Risk: ${alert.riskLevel}`,
                `💲 Price: $${alert.price?.toFixed(6)}`,
                `📈 24h: ${priceChangePrefix}${alert.marketData.priceChange24h.toFixed(1)}%`,
                alert.signature ? `🔍 https://solscan.io/tx/${alert.signature}` : null,
                `$${alert.token}`,
            ];

            return lines.filter(Boolean).join("\n");
        } else {
            const lines = [
                `🟢 BUY | ${alert.token}`,
                `🎯 Confidence: ${confidenceEmoji} ${(alert.confidence * 100).toFixed(0)}%`,
                `📈 24h: ${priceChangePrefix}${alert.marketData.priceChange24h.toFixed(1)}%`,
                `⚠️ Risk: ${alert.riskLevel}`,
                `💲 Price: $${alert.price?.toFixed(6)}`,
                alert.signature ? `🔍 https://solscan.io/tx/${alert.signature}` : null,
                `$${alert.token}`,
            ];

            return lines.filter(Boolean).join("\n");
        }
    }

    async notifySuccessfulTrades(executions: ExecutionResult[]): Promise<void> {
        const successfulTrades = executions.filter(exec => 
            exec.success && 
            (exec.action === "BUY" || exec.action === "SELL") &&
            exec.token &&
            exec.marketData?.[0]
        );

        for (const trade of successfulTrades) {
            const marketData = trade.marketData![0];
            const confidence = trade.decision?.confidence || 0;
            
            const alert: TradeAlert = {
                token: trade.token!.symbol,
                tokenAddress: trade.token!.address,
                amount: trade.amount || 0,
                confidence,
                riskLevel: this.calculateRiskLevel(
                    {
                        priceChange24h: marketData.priceChange?.h24 || 0,
                        volume24h: marketData.volume?.h24 || 0,
                        liquidity: {
                            usd: marketData.liquidity?.usd || 0
                        }
                    },
                    confidence
                ),
                marketData: {
                    priceChange24h: marketData.priceChange?.h24 || 0,
                    volume24h: marketData.volume?.h24 || 0,
                    liquidity: {
                        usd: marketData.liquidity?.usd || 0
                    }
                },
                timestamp: Date.now(),
                signature: trade.signature,
                action: trade.action,
                price: Number(marketData.priceUsd),
                reason: trade.decision?.reasoning
            };

            await this.postTradeAlert(alert);
        }
    }

    async postTradeAlert(alert: TradeAlert): Promise<boolean> {
        try {
            const tweetContent = this.formatTradeAlert(alert);

            if (this.config.dryRun) {
                elizaLogger.log("Dry run mode - would have posted tweet:", tweetContent);
                return true;
            }

            await this.client.post.client.twitterClient.sendTweet(tweetContent);
            elizaLogger.log("Successfully posted trade alert to Twitter:", {
                content: tweetContent,
            });

            return true;
        } catch (error) {
            elizaLogger.error("Failed to post trade alert to Twitter:", {
                error: error instanceof Error ? error.message : String(error),
                alert,
            });
            return false;
        }
    }
}

export default TwitterService; 