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
}

export interface BoostedToken {
    chainId: string;
    tokenAddress: string;
    url: string;
    totalAmount: number;
    description?: string;
}

export interface DexScreenerAPIResponse {
    pairs: TokenPair[];
}

export interface SearchTokensParams {
    chainId?: string;
    maxResults?: number;
}

export interface TokenDataResponse {
    tickers: string[];
    marketData: string[];
}
