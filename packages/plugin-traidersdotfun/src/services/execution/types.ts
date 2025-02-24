import type { TokenResult } from "../../types/token";
import type { TradeDecision } from "../decisionMaker";
import type { TokenPair } from "../dexscreener/types";

export interface ExecutionResult {
    success: boolean;
    action: "BUY" | "SELL" | "HOLD";
    error?: string;
    amount?: number;
    signature?: string;
    token?: TokenResult;
    decision?: TradeDecision;
    marketData?: TokenPair[];
}

export interface ExecutionServiceConfig {
    isDryRun?: boolean;
    rpcUrl?: string;
}
