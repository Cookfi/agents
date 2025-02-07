import { elizaLogger } from "@elizaos/core";
import type { TokenResult } from "../../types/token";
import type { TradeDecision } from "../decisionMaker";
import type { TokenPair } from "../dexscreener/types";
import { TradingService } from "../trading";
import { EXECUTION_CONFIG } from "./config";
import type { ExecutionResult, ExecutionServiceConfig } from "./types";

export class ExecutionService {
    private isDryRun: boolean;
    private tradingService: TradingService;

    constructor(config: ExecutionServiceConfig = {}) {
        this.isDryRun = config.isDryRun || false;
        this.tradingService = new TradingService({
            rpcUrl: config.rpcUrl
        });
    }

    private calculateBuyAmount(confidence: number): number {
        const { MIN_LEVEL, MAX_LEVEL } = EXECUTION_CONFIG.CONFIDENCE;
        const { MIN_BUY_AMOUNT, MAX_BUY_AMOUNT } = EXECUTION_CONFIG.TRADE;

        // Scale buy amount based on confidence
        const confidenceScale = (confidence - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);
        const amount = MIN_BUY_AMOUNT + (MAX_BUY_AMOUNT - MIN_BUY_AMOUNT) * confidenceScale;

        return Math.min(MAX_BUY_AMOUNT, Math.max(MIN_BUY_AMOUNT, amount));
    }

    async executeDecision(
        token: TokenResult,
        decision: TradeDecision,
        marketData: TokenPair[]
    ): Promise<ExecutionResult> {
        if (decision.confidence < EXECUTION_CONFIG.CONFIDENCE.MIN_LEVEL) {
            return {
                success: true,
                action: "HOLD",
                error: "Confidence too low",
                token,
                decision,
                marketData
            };
        }

        if (this.isDryRun) {
            elizaLogger.log(`[DRY RUN] Would execute ${decision.recommendation} for ${token.symbol}`, {
                confidence: decision.confidence,
                reasoning: decision.reasoning
            });
            return { 
                success: true, 
                action: decision.recommendation,
                token,
                decision,
                marketData
            };
        }

        try {
            switch (decision.recommendation) {
                case "BUY": {
                    const amount = this.calculateBuyAmount(decision.confidence);
                    const result = await this.tradingService.swap({
                        fromToken: "SOL",
                        toToken: token.address,
                        amount,
                        slippage: EXECUTION_CONFIG.TRADE.SLIPPAGE
                    });
                    elizaLogger.log(`Executed BUY for ${token.symbol} (${amount} SOL)`);
                    return { 
                        success: true, 
                        action: "BUY", 
                        amount,
                        signature: result.signature,
                        token,
                        decision,
                        marketData
                    };
                }

                case "SELL": {
                    if (token.balance) {
                        const result = await this.tradingService.swap({
                            fromToken: token.address,
                            toToken: "SOL",
                            amount: token.balance.amount,
                        });
                        elizaLogger.log(`Executed SELL for ${token.symbol}`);
                        return { 
                            success: true, 
                            action: "SELL", 
                            amount: token.balance.amount,
                            signature: result.signature,
                            token,
                            decision,
                            marketData
                        };
                    }
                    return { 
                        success: false, 
                        action: "SELL", 
                        error: "No balance",
                        token,
                        decision,
                        marketData
                    };
                }

                case "HOLD":
                    elizaLogger.log(`Holding position in ${token.symbol}`);
                    return { 
                        success: true, 
                        action: "HOLD",
                        token,
                        decision,
                        marketData
                    };
            }
        } catch (error) {
            elizaLogger.error(`Failed to execute ${decision.recommendation} for ${token.symbol}:`, error);
            return {
                success: false,
                action: decision.recommendation,
                error: error instanceof Error ? error.message : "Unknown error",
                token,
                decision,
                marketData
            };
        }
    }
}

export default ExecutionService; 