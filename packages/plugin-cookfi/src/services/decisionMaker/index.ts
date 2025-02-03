import {
    composeContext,
    elizaLogger,
    generateObject,
    ModelClass,
    stringToUuid,
    type IAgentRuntime
} from "@elizaos/core";
import { z } from "zod";
import type { TokenResult } from "../../types/token";
import type { TokenAnalysisResult } from "../tokenAnalysis";

export interface TradeDecision {
    recommendation: "BUY" | "SELL" | "HOLD";
    confidence: number;
    reasoning: string;
    risks: string[];
    opportunities: string[];
}

const decisionSchema = z.object({
    recommendation: z.enum(["BUY", "SELL", "HOLD"]),
    confidence: z.number().min(0).max(100),
    reasoning: z.string(),
    risks: z.array(z.string()),
    opportunities: z.array(z.string())
});

export class DecisionMakerService {
    private runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
    }

    async analyzeToken(
        token: TokenResult,
        analysis: TokenAnalysisResult
    ): Promise<TradeDecision | null> {
        try {
            if (!analysis.marketAnalysis.length) {
                elizaLogger.warn(`No market data available for ${token.symbol}`);
                return null;
            }

            const hasPosition = token.balance && token.balance.amount > 0;

            // Compose minimal state following Memory interface
            const state = await this.runtime.composeState({
                userId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                roomId: stringToUuid(`trade-${token.symbol}`),
                content: {
                    text: token.symbol,
                    type: "trade_analysis"
                }
            });

            const template = `Analyze the following token data and provide a trading recommendation.
${!hasPosition ? "Note: We don't own this token yet, so only BUY is possible." : ""}

Return the response as a JSON object with the following structure:
{
  "recommendation": "${hasPosition ? '"BUY" | "SELL" | "HOLD"' : '"BUY"'}",
  "confidence": number (0-100),
  "reasoning": string explaining the decision,
  "risks": array of potential risks,
  "opportunities": array of potential opportunities
}

Analysis Data:
${JSON.stringify({
    token,
    marketAnalysis: analysis.marketAnalysis,
    socialAnalysis: analysis.socialAnalysis
}, null, 2)}`;

            const context = composeContext({
                state,
                template
            });

            const result = await generateObject({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: decisionSchema
            });

            if (!result.object) {
                throw new Error("No decision generated");
            }

            const decision = result.object as TradeDecision;
            
            elizaLogger.log(
                `Trade decision for ${token.symbol}:`,
                decision
            );

            return decision;

        } catch (error) {
            elizaLogger.error(`Decision making failed for ${token.symbol}:`, error);
            return null;
        }
    }
}

export default DecisionMakerService; 