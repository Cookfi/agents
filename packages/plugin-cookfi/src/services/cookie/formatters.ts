import { calculateTweetScore } from "./scoring";
import { CookieAPIResponse, EnhancedTweet, TokenAnalysis } from "./types";

const formatDate = (dateStr: string): string => {
    const tweetDate = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor(
        (now.getTime() - tweetDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) {
        return "just now";
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
};

const formatEngagement = (tweet: EnhancedTweet): string => {
    return `👍 ${tweet.likesCount} 🔄 ${tweet.retweetsCount} 💬 ${tweet.repliesCount}`;
};

export function formatCookieData(response: CookieAPIResponse): EnhancedTweet[] {
    if (!response.ok || !Array.isArray(response.ok)) {
        return [];
    }
    console.log("CookieResponse:", response);
    return response.ok.map(tweet => ({
        ...tweet,
        score: calculateTweetScore(tweet),
        formattedDate: formatDate(tweet.createdAt),
        formattedEngagement: formatEngagement(tweet as EnhancedTweet),
        formattedText: tweet.text.replace(/\n/g, " ")
    }));
}

export function formatTokenQueries(tokenSymbol: string, tokenName: string): string[] {
    return [
        `$${tokenSymbol}`,
        `$${tokenSymbol} token`,
        `"${tokenName}"`
    ];
}

export function formatTokenAnalysis(
    tokenSymbol: string,
    tokenName: string, 
    tweets: EnhancedTweet[]
): TokenAnalysis {
    // Filter tweets that mention the token symbol or name
    const filteredTweets = tweets.filter(tweet => 
        tweet.formattedText.includes(`$${tokenSymbol}`) ||
        tweet.formattedText.toLowerCase().includes(tokenName.toLowerCase())
    );

    // Calculate total engagement score
    const totalScore = filteredTweets.reduce((sum, tweet) => sum + tweet.score, 0);

    return {
        symbol: tokenSymbol,
        tweets: filteredTweets,
        totalEngagementScore: totalScore,
        tweetCount: filteredTweets.length,
        averageScore: filteredTweets.length > 0 ? totalScore / filteredTweets.length : 0
    };
}

export function getEmptyTokenAnalysis(tokenSymbol: string): TokenAnalysis {
    return {
        symbol: tokenSymbol,
        tweets: [],
        totalEngagementScore: 0,
        tweetCount: 0,
        averageScore: 0
    };
}
