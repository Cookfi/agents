export interface SwapParams {
    fromToken: string;
    toToken: string;
    amount: number;
    slippage?: number;
}

export interface SwapResponse {
    signature: string;
    fromAmount: number;
    toAmount: number;
}

export interface TransferParams {
    token: string;
    recipient: string;
    amount: number;
}

export interface TransferResponse {
    signature: string;
    amount: number;
}

export interface LendParams {
    token: string;
    amount: number;
    duration?: number;
}

export interface LendResponse {
    signature: string;
    amount: number;
    apy: number;
}

export interface StakeParams {
    amount: number;
}

export interface StakeResponse {
    signature: string;
    amount: number;
    jupsolAmount: number;
}
