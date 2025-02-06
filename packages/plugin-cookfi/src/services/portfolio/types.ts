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
