export interface Tweet {
    authorUsername: string;
    createdAt: string;
    engagementsCount: number;
    impressionsCount: number;
    isQuote: boolean;
    isReply: boolean;
    likesCount: number;
    quotesCount: number;
    repliesCount: number;
    retweetsCount: number;
    smartEngagementPoints: number;
    text: string;
    matchingScore: number;
}

export interface EnhancedTweet extends Tweet {
    score: number;
    formattedDate: string;
    formattedEngagement: string;
    formattedText: string;
}

export interface CookieAPIResponse {
    ok: Tweet[];
    success: boolean;
    error: string | null;
}

export interface FormattedTweet {
    author: string;
    date: string;
    text: string;
    engagement: {
        likes: number;
        retweets: number;
        replies: number;
        quotes: number;
        impressions: number;
        total: number;
    };
    score: number;
}

export interface SearchTweetsParams {
    query: string;
    max_results?: number;
}
