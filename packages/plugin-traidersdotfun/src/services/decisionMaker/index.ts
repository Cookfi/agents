import {
    composeContext,
    elizaLogger,
    generateObject,
    ModelClass,
    stringToUuid,
    type IAgentRuntime,
} from "@elizaos/core";
import type { TokenResult } from "../../types/token";
import type { TokenAnalysisResult } from "../tokenAnalysis/types";
import { decisionSchema, TradeDecision } from "./types";

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
                elizaLogger.warn(
                    `No market data available for ${token.symbol}`
                );
                return null;
            }

            const hasPosition = token.balance && token.balance.amount > 0;
            console.log({
                hasPosition,
                balance: token.balance,
                symbol: token.symbol,
            });
            const positionInfo = hasPosition
                ? `
Current Position Details:
- ROI: ${analysis.positionAnalysis.roiNative.toFixed(2)}% in SOL
- Unrealized P&L: ${analysis.positionAnalysis.unrealizedPnlNative.toFixed(
                      4
                  )} SOL
- Current Price: ${analysis.positionAnalysis.currentPriceNative.toFixed(8)} SOL
- Position Size: ${token.balance.amount} ${token.symbol}`
                : "";

            const template = `Analyze the following token data and provide a trading recommendation.
${
    hasPosition
        ? `Note: We already own this token. Consider the current ROI of ${analysis.positionAnalysis.roiNative.toFixed(
              2
          )}% when deciding between SELL or HOLD.`
        : "Note: We don't own this token yet, so only BUY is possible."
}

## Chain of Thought Instructions

Complete the json response with your chain of thought following these steps: 
1. Identify the key technical elements in the conversation, including references from the injected data, position, analysis.
2. Break down the data into smaller logical steps.
3. Analyze the relevant technical details, context
4. Formulate a preliminary conclusion or solution that addresses the technical requirements
5. Use the above reasoning to generate your final, well-structured technical response what make you take this decision

Return the response as a JSON object with the following structure:
{
  "recommendation": "${hasPosition ? '"SELL" | "HOLD"' : '"BUY"'}",
  "confidence": number (0-100),
  "reasoning": string explaining the decision,
  "risks": array of potential risks,
  "opportunities": array of potential opportunities,
  "chainOfThought": string of the chain of thought process
}

Analysis Data:
Token: ${token.symbol}${positionInfo}

Market Analysis:
${JSON.stringify(analysis.marketAnalysis[0], null, 2)}

Social Analysis:
- Tweet Count: ${analysis.socialAnalysis.length}
- Recent Social Activity: ${JSON.stringify(
                analysis.socialAnalysis.slice(0, 3),
                null,
                2
            )}

Trading Guidelines:
${
    hasPosition
        ? `
- Consider taking profits (SELL) if ROI > 100%
- Consider cutting losses (SELL) if ROI < -50%
- You must SELL everything if the price is down > 90%
- Consider holding (HOLD) if momentum is positive despite negative ROI
- Evaluate recent price action and social sentiment`
        : `
- Look for strong upward price momentum
- Consider social sentiment and trading volume
- Evaluate market cap and liquidity`
}`;

            const context = composeContext({
                state: await this.runtime.composeState({
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    roomId: stringToUuid(`trade-${token.symbol}`),
                    content: {
                        text: token.symbol,
                        type: "trade_analysis",
                    },
                }),
                template,
            });

            const result = await generateObject({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: decisionSchema,
            });

            if (!result.object) {
                throw new Error("No decision generated");
            }

            const decision = result.object as TradeDecision;

            if (decision.chainOfThought) {
                console.log("Logging chain of thought");
                await this.runtime.databaseAdapter.log({
                    userId: this.runtime.agentId,
                    type: "chain-of-thought",
                    body: {
                        log: decision.chainOfThought,
                        userMessage: `Analyze ${token.symbol}`,
                    },
                    roomId: stringToUuid(`trade-${token.symbol}`),
                });
            }

            // Validate the recommendation based on position
            if (hasPosition && decision.recommendation === "BUY") {
                elizaLogger.warn(
                    `Invalid BUY recommendation for ${token.symbol} when position exists, defaulting to HOLD`
                );
                decision.recommendation = "HOLD";
            } else if (
                !hasPosition &&
                (decision.recommendation === "SELL" ||
                    decision.recommendation === "HOLD")
            ) {
                elizaLogger.warn(
                    `Invalid ${decision.recommendation} recommendation for ${token.symbol} when no position exists, defaulting to BUY`
                );
                decision.recommendation = "BUY";
            }

            elizaLogger.log(`Trade decision for ${token.symbol}:`, decision);

            return decision;
        } catch (error) {
            elizaLogger.error(
                `Decision making failed for ${token.symbol}:`,
                error
            );
            return null;
        }
    }
}

export default DecisionMakerService;
