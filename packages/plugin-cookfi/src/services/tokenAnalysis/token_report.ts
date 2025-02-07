import { CookieService } from "../cookie";
import type { EnhancedTweet } from "../cookie/types";
import type { TokenResponse } from '../dexscreener/types';

export class TokenReportService {
    private cookieService: CookieService;
    

    constructor() {
        this.cookieService = new CookieService();
        
    }

    async analyzeAllTickers(trendingTokenInfo: TokenResponse): Promise<{
        allAnalysis: {
            ticker: string;
            tweets: EnhancedTweet[];
           
            marketScore: number;
        }[];
    }> {
        const allAnalysis = [];
        
        for (const [index, ticker] of trendingTokenInfo.tickers.entries()) {
            try {
                const tokenSymbol = ticker.replace('$', '');
                const tokenName = trendingTokenInfo.tokenNames[index];

                const allQueries = [
                    `$${tokenSymbol}`,
                    `$${tokenSymbol} token`,
                    `"${tokenName}"`
                ];

                const allTweets = await this.cookieService.searchMultipleQueries(allQueries, 5);
                console.log(`Found total ${allTweets.length} tweets for ${tokenSymbol}`);

                const filteredTweets = allTweets.filter(tweet => 
                    tweet.formattedText.includes(`$${tokenSymbol}`)
                );

                const totalScore = filteredTweets.reduce((sum, tweet) => sum + tweet.score, 0);

                // Save engagement to DB
               

                allAnalysis.push({
                    ticker,
                    tweets: filteredTweets,
                    
                    marketScore: trendingTokenInfo.scores[index]
                });
            } catch (error) {
                console.error(`Error analyzing ticker ${ticker}:`, error);
                // Still add the ticker but with empty tweets
                allAnalysis.push({
                    ticker,
                    tweets: [],
                    marketScore: trendingTokenInfo.scores[index]
                });
            }
        }

        return { allAnalysis };
    }

 
}
export default TokenReportService;