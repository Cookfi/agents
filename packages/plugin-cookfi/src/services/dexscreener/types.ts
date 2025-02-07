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

export interface TokenResponse {
    tickers: string[];
    marketData: string[];
    addresses: string[];
    tokenNames: string[];
    scores: number[];
}

export function calculateTokenScore(pair: TokenPair): number {
    const {
        liquidity,
        volume,
        marketCap,
        txns,
        priceChange,
        fdv
    } = pair;

    // Weight factors (total = 1)
    const weights = {
        liquidity: 0.25,
        volume: 0.20,
        marketCap: 0.15,
        transactions: 0.15,
        priceStability: 0.15,
        fdvToMcap: 0.10
    };

    // Liquidity score (normalized to 10M USD)
    const liquidityScore = Math.min((liquidity?.usd || 0) / 10_000_000, 1) * weights.liquidity;

    // Volume score (normalized to 1M USD daily)
    const volumeScore = Math.min((volume?.h24 || 0) / 1_000_000, 1) * weights.volume;

    // Market cap score (normalized to 100M USD)
    const mcapScore = Math.min((marketCap || 0) / 100_000_000, 1) * weights.marketCap;

    // Transaction health score
    const h24Txns = txns?.h24 || { buys: 0, sells: 0 };
    const totalTxns = h24Txns.buys + h24Txns.sells;
    const txnRatio = totalTxns > 0 ? h24Txns.buys / totalTxns : 0.5;
    const txnScore = (txnRatio >= 0.4 && txnRatio <= 0.6 ? 1 : 
                      txnRatio >= 0.3 && txnRatio <= 0.7 ? 0.7 : 0.3) * weights.transactions;

    // Price stability score
    const priceVolatility = Math.abs(priceChange?.h24 || 0);
    const stabilityScore = (priceVolatility <= 10 ? 1 :
                           priceVolatility <= 20 ? 0.7 :
                           priceVolatility <= 30 ? 0.4 : 0.1) * weights.priceStability;

    // FDV to Market Cap ratio score (healthy if close to 1)
    const fdvToMcapRatio = (marketCap && fdv) ? marketCap / fdv : 0;
    const fdvScore = (fdvToMcapRatio >= 0.8 ? 1 :
                      fdvToMcapRatio >= 0.6 ? 0.8 :
                      fdvToMcapRatio >= 0.4 ? 0.5 : 0.2) * weights.fdvToMcap;

    const totalScore = liquidityScore + volumeScore + mcapScore + 
                      txnScore + stabilityScore + fdvScore;

    // Convert to 0-100 range
    return Math.min(Math.max(totalScore * 100, 0), 100);
}
