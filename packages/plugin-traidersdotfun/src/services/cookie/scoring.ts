import { Tweet } from "./types";

export function calculateTweetScore(tweet: Tweet): number {
    const baseScore =
        tweet.likesCount * 1 +
        tweet.repliesCount * 3 +
        tweet.retweetsCount * 5 +
        tweet.quotesCount * 10;

    const engagementBonus = tweet.smartEngagementPoints * 5;

    return baseScore + engagementBonus;
}
