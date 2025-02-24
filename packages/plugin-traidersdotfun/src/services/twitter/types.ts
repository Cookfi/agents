import { z } from "zod";

export const TwitterConfigSchema = z.object({
    enabled: z.boolean(),
    username: z.string().min(1),
    password: z.string().min(1),
    email: z.string().email(),
    isEnabled: z.boolean().optional().default(false),
    dryRun: z.boolean().optional().default(false),
    twoFactorSecret: z.string().optional().default(""),
});

export type TwitterConfig = z.infer<typeof TwitterConfigSchema>;

export interface TradeAlert {
    token: string;
    tokenAddress: string;
    amount: number;
    confidence: number;
    riskLevel: string;
    marketData: {
        priceChange24h: number;
        volume24h: number;
        liquidity: {
            usd: number;
        };
    };
    timestamp: number;
    signature?: string;
    action: "BUY" | "SELL" | "HOLD";
    price?: number;
    reason?: string;
    profitPercent?: string;
    risks?: string[];
    opportunities?: string[];
}
