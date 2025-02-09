export interface ChangeMetrics {
    "1h": number;
    "1d": number;
    "1w": number;
    "1M": number;
}

export interface ExperiencedBuyerToken {
    chain_id: string;
    token_address: string;
    token_name: string;
    token_symbol: string;
    token_logo: string;
    price_usd: number;
    security_score: number;
    market_cap: number;
    fully_diluted_valuation: number;
    twitter_followers: number;
    holders_change: ChangeMetrics;
    liquidity_change_usd: ChangeMetrics;
    experienced_net_buyers_change: ChangeMetrics;
    volume_change_usd: ChangeMetrics;
    net_volume_change_usd: ChangeMetrics;
    price_percent_change_usd: ChangeMetrics;
}

export interface MoralisSearchParams {
    chain?: string;
    one_week_experienced_net_buyers_change?: number;
    min_market_cap?: number;
    twitter_followers?: number;
    one_month_volume_change_usd?: number;
    security_score?: number;
    one_month_price_percent_change_usd?: number;
}
