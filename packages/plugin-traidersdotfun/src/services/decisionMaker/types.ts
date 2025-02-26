import { z } from "zod";

export const decisionSchema = z.object({
    recommendation: z.enum(["BUY", "SELL", "HOLD"]),
    confidence: z.number().min(0).max(100),
    reasoning: z.string(),
    risks: z.array(z.string()),
    opportunities: z.array(z.string()),
    chainOfThought: z.string(),
});

export type TradeDecision = z.infer<typeof decisionSchema>;
