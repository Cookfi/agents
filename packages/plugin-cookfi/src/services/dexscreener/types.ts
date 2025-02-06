export enum TimePeriod {
    M5 = "m5", // 5 minutes
    H1 = "h1", // 1 hour
    H6 = "h6", // 6 hours
    H24 = "h24" // 24 hours
}

export enum SocialType {
    TWITTER = "twitter",
    TELEGRAM = "telegram",
    DISCORD = "discord",
    MEDIUM = "medium",
    GITHUB = "github"
}

export enum WebsiteLabel {
    WEBSITE = "Website",
    DOCS = "Docs",
    WHITEPAPER = "Whitepaper",
    AUDIT = "Audit"
}

interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
}

interface TxnStats {
    buys: number;
    sells: number;
}

interface Website {
    label: WebsiteLabel;
    url: string;
}

interface Social {
    type: SocialType;
    url: string;
}

interface TokenInfo {
    imageUrl: string;
    header: string;
    openGraph?: string;
    websites: Website[];
    socials: Social[];
}

export interface TokenPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: TokenInfo;
    quoteToken: TokenInfo;
    priceNative: string;
    priceUsd: string;
    txns: {
        [period in TimePeriod]?: TxnStats;
    };
    volume: {
        [period in TimePeriod]?: number;
    };
    priceChange: {
        [period in TimePeriod]?: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    marketCap: number;
    pairCreatedAt: number;
    info: TokenInfo;
    boosts: {
        active: number;
    };
}

interface TokenLink {
    type: string;
    label: string;
    url: string;
}

export interface BoostedToken {
    url: string;
    chainId: string;
    tokenAddress: string;
    amount: number;
    totalAmount: number;
    icon: string;
    header: string;
    description?: string;
    links: TokenLink[];
}

export type DexScreenerAPIResponse = TokenPair[];

export interface SearchTokensParams {
    chainId?: string;
    maxResults?: number;
}

export interface TokenDataResponse {
    tickers: string[];
    marketData: string[];
}
