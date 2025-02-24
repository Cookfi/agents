import type { IAgentRuntime } from "@elizaos/core";
import {
    composeContext,
    elizaLogger,
    generateText,
    ModelClass,
    stringToUuid,
} from "@elizaos/core";
import { Scraper } from "agent-twitter-client";
import type { ExecutionResult } from "../execution/types";
import type { TradeAlert, TwitterConfig } from "./types";
import { TwitterConfigSchema } from "./types";

export class TwitterService {
    private client: Scraper;
    private config: TwitterConfig;
    private static instance: TwitterService;
    private runtime: IAgentRuntime;
    private tweetedTokens: Map<string, Set<string>> = new Map();

    private constructor(
        client: Scraper,
        config: TwitterConfig,
        runtime: IAgentRuntime
    ) {
        this.client = client;
        this.config = config;
        this.runtime = runtime;
    }

    public static async getInstance(
        runtime: IAgentRuntime
    ): Promise<TwitterService | undefined> {
        if (!TwitterService.instance) {
            const username = process.env.TRAIDERSDOTFUN_TWITTER_USERNAME;
            const password = process.env.TRAIDERSDOTFUN_TWITTER_PASSWORD;
            const email = process.env.TRAIDERSDOTFUN_TWITTER_EMAIL;

            if (!username || !password || !email) {
                elizaLogger.warn(
                    "Twitter credentials not configured, notifications disabled"
                );
                return undefined;
            }

            try {
                const config = TwitterConfigSchema.parse({
                    enabled: true,
                    username,
                    password,
                    email,
                    dryRun: false,
                });

                const scraper = new Scraper();
                await scraper.login(username, password, email);

                TwitterService.instance = new TwitterService(
                    scraper,
                    config,
                    runtime
                );
            } catch (error) {
                console.log("Failed to initialize Twitter service:", error);
                return undefined;
            }
        }
        return TwitterService.instance;
    }

    private calculateRiskLevel(
        marketData: TradeAlert["marketData"],
        confidence: number
    ): string {
        // Base risk on price volatility, liquidity, and confidence
        const volatilityRisk = Math.abs(marketData.priceChange24h) > 20 ? 1 : 0;
        const liquidityRisk = marketData.liquidity.usd < 10000 ? 1 : 0;
        const confidenceRisk = confidence < 0.6 ? 1 : 0;

        const totalRiskFactors =
            volatilityRisk + liquidityRisk + confidenceRisk;

        if (totalRiskFactors >= 2) return "HIGH";
        if (totalRiskFactors === 1) return "MEDIUM";
        return "LOW";
    }

    private async generateTweetContent(alert: TradeAlert): Promise<string> {
        const template = `You are a degen trader experimenting with Solana memecoins. Write a casual, fun tweet about your ${
            alert.action
        } trade.

Context:
Token: ${alert.token}
Action: ${alert.action}
Price: $${alert.price?.toFixed(6)}
Reasoning: ${alert.reason}
Key Opportunities: ${alert.opportunities?.join(", ")}
Risks: ${alert.risks?.join(", ")}

Guidelines:
- Be casual and fun, like you're talking to friends
- For BUY: Express excitement about potential but stay humble
- For SELL: Share brief thoughts on the trade
- Don't mention specific numbers or stats
- Add cashtag $${alert.token}
- Always end with "DYOR" or "NFA DYOR"
- Keep it under 280 characters
- Never use emojis
- Sound like a real person, not a bot
- Include transaction link if available
- For SELL, briefly mention if profit/loss but don't give specific numbers
- never put link in the tweet

Example BUY style:
"Aping into $XXX, loving the community vibes. Team seems based, could be interesting. DYOR"

Example SELL style:
"Taking some profits on $XXX, been a fun ride! Thanks for the gains anon. DYOR"`;

        const context = composeContext({
            state: await this.runtime.composeState({
                userId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                roomId: stringToUuid(`tweet-${alert.token}`),
                content: {
                    text: alert.token,
                    type: "trade_alert",
                },
            }),
            template,
        });

        const result = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        return result.trim();
    }

    private getTokenActionKey(token: string, action: string): string {
        return `${token}-${action}`;
    }

    private hasTokenBeenTweeted(token: string, action: string): boolean {
        const key = this.getTokenActionKey(token, action);
        return this.tweetedTokens.has(key);
    }

    private markTokenAsTweeted(token: string, action: string): void {
        const key = this.getTokenActionKey(token, action);
        this.tweetedTokens.set(key, new Set([Date.now().toString()]));
    }

    async notifySuccessfulTrades(executions: ExecutionResult[]): Promise<void> {
        const successfulTrades = executions.filter(
            (exec) =>
                exec.success &&
                (exec.action === "BUY" || exec.action === "SELL") &&
                exec.token &&
                exec.marketData?.[0] &&
                // Skip LOSS SELL notifications
                !(
                    exec.action === "SELL" &&
                    exec.decision?.recommendation === "SELL" &&
                    (exec.decision.reasoning.toLowerCase().includes("loss") ||
                        exec.decision.reasoning
                            .toLowerCase()
                            .includes("stop loss"))
                ) &&
                // Add check for previously tweeted tokens
                !this.hasTokenBeenTweeted(exec.token.symbol, exec.action)
        );

        for (const trade of successfulTrades) {
            const marketData = trade.marketData![0];
            const confidence = trade.decision?.confidence || 0;

            const alert: TradeAlert = {
                token: trade.token!.symbol,
                tokenAddress: trade.token!.address,
                amount: trade.amount || 0,
                confidence: confidence / 100,
                riskLevel: this.calculateRiskLevel(
                    {
                        priceChange24h: marketData.priceChange?.h24 || 0,
                        volume24h: marketData.volume?.h24 || 0,
                        liquidity: {
                            usd: marketData.liquidity?.usd || 0,
                        },
                    },
                    confidence / 100
                ),
                marketData: {
                    priceChange24h: marketData.priceChange?.h24 || 0,
                    volume24h: marketData.volume?.h24 || 0,
                    liquidity: {
                        usd: marketData.liquidity?.usd || 0,
                    },
                },
                timestamp: Date.now(),
                signature: trade.signature,
                action: trade.action,
                price: Number(marketData.priceUsd),
                reason: trade.decision?.reasoning,
                // Add decision points
                risks: trade.decision?.risks || [],
                opportunities: trade.decision?.opportunities || [],
                profitPercent: trade.decision?.opportunities?.[0] || undefined,
            };

            const success = await this.postTradeAlert(alert);
            if (success) {
                // Mark the token as tweeted only if the tweet was successful
                this.markTokenAsTweeted(trade.token!.symbol, trade.action);
            }
        }
    }

    async postTradeAlert(alert: TradeAlert): Promise<boolean> {
        try {
            const tweetContent = await this.generateTweetContent(alert);

            if (this.config.dryRun) {
                elizaLogger.log(
                    "Dry run mode - would have posted tweet:",
                    tweetContent
                );
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
