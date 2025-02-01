export interface BirdeyeTokenBalance {
    address: string;
    symbol: string;
    name: string;
    logoURI: string;
    decimals: number;
    price: number;
    value: number;
    amount: number;
    coingeckoId: string;
    holder: number;
    supply: string;
    volume: number;
}

export interface BirdeyePortfolioResponse {
    data: {
        items: BirdeyeTokenBalance[];
        totalValue: number;
        solValue: number;
        tokenValue: number;
    };
    success: boolean;
}

export interface TokenBalance {
    mint: string;
    symbol: string;
    name: string;
    logo?: string;
    amount: number;
    decimals: number;
    usdValue: number;
    price: number;
}

export interface PortfolioBalance {
    sol: {
        amount: number;
        usdValue: number;
    };
    tokens: TokenBalance[];
    totalUsdValue: number;
}

export interface PortfolioServiceConfig {
    walletAddress: string;
}

export interface TokenMetadata {
    symbol: string;
    decimals: number;
    price?: number;
}

export interface PriceData {
    [tokenAddress: string]: {
        price: number;
        timestamp: number;
    };
}
