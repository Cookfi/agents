export interface ExecutionResult {
    success: boolean;
    action: "BUY" | "SELL" | "HOLD";
    amount?: number;
    error?: string;
}

export interface ExecutionServiceConfig {
    isDryRun?: boolean;
    rpcUrl?: string;
}
