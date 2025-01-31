export interface CookieTweet {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    public_metrics: {
        retweet_count: number;
        reply_count: number;
        like_count: number;
        quote_count: number;
    };
    entities?: {
        mentions?: Array<{
            start: number;
            end: number;
            username: string;
            id: string;
        }>;
        hashtags?: Array<{
            start: number;
            end: number;
            tag: string;
        }>;
        urls?: Array<{
            start: number;
            end: number;
            url: string;
            expanded_url: string;
            display_url: string;
        }>;
    };
}

export interface SearchTweetsResponse {
    data: CookieTweet[];
    meta: {
        result_count: number;
        next_token?: string;
    };
}

export interface SearchTweetsParams {
    query: string;
    max_results?: number;
    next_token?: string;
    start_time?: string;
    end_time?: string;
    sort_order?: "recency" | "relevancy";
}

export interface CookieServiceConfig {
    apiKey: string;
    baseUrl: string;
}
