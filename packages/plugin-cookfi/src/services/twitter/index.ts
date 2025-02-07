import type { IAgentRuntime } from "@elizaos/core";
import { composeContext, elizaLogger, generateText, ModelClass, stringToUuid } from "@elizaos/core";
import { Scraper } from 'agent-twitter-client';
import type { ExecutionResult } from "../execution/types";
import type { TradeAlert, TwitterConfig } from "./types";
import { TwitterConfigSchema } from "./types";

export class TwitterService {
    private client: Scraper;
    private config: TwitterConfig;
    private static instance: TwitterService;
    private runtime: IAgentRuntime;

    private constructor(client: Scraper, config: TwitterConfig, runtime: IAgentRuntime) {
        this.client = client;
        this.config = config;
        this.runtime = runtime;
    }

    public static async getInstance(runtime: IAgentRuntime): Promise<TwitterService | undefined> {
        if (!TwitterService.instance) {
            const username = process.env.COOKFI_TWITTER_USERNAME;
            const password = process.env.COOKFI_TWITTER_PASSWORD;
            const email = process.env.COOKFI_TWITTER_EMAIL;

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
                    dryRun: false
                });

                const scraper = new Scraper();
                await scraper.login(username, password, email);

                TwitterService.instance = new TwitterService(scraper, config, runtime);
            } catch (error) {
                console.log("Failed to initialize Twitter service:", error);
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

    private async generateTweetContent(alert: TradeAlert): Promise<string> {
        const template = `Create a concise trading alert tweet (max 280 chars) for ${alert.token} with the following data:

Action: ${alert.action}
Price: $${alert.price?.toFixed(6)}
24h Change: ${alert.marketData.priceChange24h.toFixed(1)}%
Risk Level: ${alert.riskLevel}
Confidence: ${(alert.confidence * 100).toFixed(0)}%
Reasoning: ${alert.reason}

Guidelines:
- Never use emojis
- Include cashtag $${alert.token}
- Include transaction link if available
- For SELL, include profit/loss
- Keep it professional and informative
- Must be under 280 characters`;

        const context = composeContext({
            state: await this.runtime.composeState({
                userId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                roomId: stringToUuid(`tweet-${alert.token}`),
                content: {
                    text: alert.token,
                    type: "trade_alert"
                }
            }),
            template
        });

        const result = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        return result.trim();
    }

    async notifySuccessfulTrades(executions: ExecutionResult[]): Promise<void> {
        const successfulTrades = executions.filter(exec => 
            exec.success && 
            (exec.action === "BUY" || exec.action === "SELL") &&
            exec.token &&
            exec.marketData?.[0] &&
            // Skip LOSS SELL notifications
            !(exec.action === "SELL" && exec.decision?.recommendation === "SELL" && 
              (exec.decision.reasoning.toLowerCase().includes("loss") || 
               exec.decision.reasoning.toLowerCase().includes("stop loss")))
        );

        for (const trade of successfulTrades) {
            const marketData = trade.marketData![0];
            const confidence = trade.decision?.confidence || 0;
            
            const alert: TradeAlert = {
                token: trade.token!.symbol,
                tokenAddress: trade.token!.address,
                amount: trade.amount || 0,
                confidence: confidence / 100, // Convert from 0-100 to 0-1 scale
                riskLevel: this.calculateRiskLevel(
                    {
                        priceChange24h: marketData.priceChange?.h24 || 0,
                        volume24h: marketData.volume?.h24 || 0,
                        liquidity: {
                            usd: marketData.liquidity?.usd || 0
                        }
                    },
                    confidence / 100
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
                reason: trade.decision?.reasoning,
                profitPercent: trade.decision?.opportunities?.[0] || undefined // This should be updated to use actual P/L data if available
            };

            await this.postTradeAlert(alert);
        }
    }

    async postTradeAlert(alert: TradeAlert): Promise<boolean> {
        try {
            const tweetContent = await this.generateTweetContent(alert);

            if (this.config.dryRun) {
                elizaLogger.log("Dry run mode - would have posted tweet:", tweetContent);
                return true;
            }

            await this.client.sendTweet(tweetContent);
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