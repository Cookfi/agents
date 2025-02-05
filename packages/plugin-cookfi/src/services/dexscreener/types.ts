export interface TokenPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        h24: number;
        h6: number;
        h1: number;
        m5: number;
    };
    priceChange: {
        m5?: number;
        h1?: number;
        h6?: number;
        h24?: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    marketCap: number;
    info?: {
        imageUrl?: string;
        header?: string;
        openGraph?: string;
        websites?: Array<{
            label: string;
            url: string;
        }>;
        socials?: Array<{
            type: string;
            url: string;
        }>;
    };
}

export interface BoostedToken {
    url: string;
    chainId: string;
    tokenAddress: string;
    icon?: string;
    header?: string;
    openGraph?: string;
    description?: string;
    links?: Array<{
        type?: string;
        label?: string;
        url: string;
    }>;
    totalAmount: number;
}

export interface DexScreenerAPIResponse {
    pairs: TokenPair[];
    success: boolean;
    error: string | null;
}

export interface FormattedToken {
    symbol: string;
    name: string;
    price: number;
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    marketData: string;  // Formatted string for decision maker
}

export interface SearchTokensParams {
    chain?: string;
    limit?: number;
}

export interface DexScreenerServiceConfig {
    baseUrl?: string;
    maxTokens?: number;
} 