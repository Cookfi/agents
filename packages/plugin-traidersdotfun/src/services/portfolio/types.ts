export interface NativeBalance {
    lamports: string;
    solana: string;
}

export interface TokenBalance {
    associatedTokenAddress: string;
    mint: string;
    amountRaw: string;
    amount: string;
    decimals: number;
    name: string;
    symbol: string;
    logo: string | null;
}

export interface SwapToken {
    address: string;
    name: string;
    symbol: string;
    logo: string | null;
    amount: string;
    usdPrice: number;
    usdAmount: number;
    tokenType: string;
}

export interface SwapTransaction {
    transactionHash: string;
    transactionType: "buy" | "sell";
    transactionIndex: number;
    subCategory: string;
    blockTimestamp: string;
    blockNumber: number;
    walletAddress: string;
    pairAddress: string;
    pairLabel: string;
    exchangeAddress: string;
    exchangeName: string;
    exchangeLogo: string;
    baseToken: string;
    quoteToken: string;
    bought: SwapToken;
    sold: SwapToken;
    baseQuotePrice: string;
    totalValueUsd: number;
}

export interface SwapHistoryResponse {
    cursor: string | null;
    page: number;
    pageSize: number;
    result: SwapTransaction[];
}

export interface PortfolioResponse {
    nativeBalance: NativeBalance;
    tokens: TokenBalance[];
}

export interface TokenMetadata {
    mint: string;
    name: string;
    symbol: string;
    logo: string | null;
    decimals: number;
}
