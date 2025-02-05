import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

import { COOKIE_CONFIG } from './config';
import { formatCookieData } from './formatters';
import type { CookieAPIResponse, EnhancedTweet, SearchTweetsParams } from './types';

export class CookieService {
    private apiKey: string;
    private baseUrl: string;
    private lastRequestTime: number = 0;

    constructor() {
        if (!process.env.COOKFI_COOKIE_API_KEY) {
            throw new Error('COOKFI_COOKIE_API_KEY is not set');
        }
        this.apiKey = process.env.COOKFI_COOKIE_API_KEY;
        this.baseUrl = COOKIE_CONFIG.BASE_URL;
    }

    private async checkRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minDelay = 60000 / (COOKIE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE / 2); // More conservative rate limit
        if (timeSinceLastRequest < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    async searchTweets(params: SearchTweetsParams): Promise<EnhancedTweet[]> {
        await this.checkRateLimit();
        const from = new Date();
        from.setDate(from.getDate() - 3);
        const to = new Date();

        const response = await axios.get<CookieAPIResponse>(
            `${this.baseUrl}${COOKIE_CONFIG.ENDPOINTS.SEARCH_TWEETS}/${encodeURIComponent(params.query)}`,
            {
                params: { 
                    from: from.toISOString(), 
                    to: to.toISOString(),
                    max_results: params.max_results || COOKIE_CONFIG.DEFAULT_MAX_RESULTS
                },
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        return formatCookieData(response.data);
    }

    private async processBatch(queries: string[], maxResults: number): Promise<EnhancedTweet[]> {
        const batchPromises = queries.map(query => 
            this.searchTweets({ query, max_results: maxResults })
        );
        const results = await Promise.all(batchPromises);
        return results.flat();
    }

    async searchMultipleQueries(queries: string[], maxResults: number): Promise<EnhancedTweet[]> {
        const batchSize = 1; // Process 1 query at a time
        const results: EnhancedTweet[] = [];
        
        for (let i = 0; i < queries.length; i += batchSize) {
            try {
                const batch = queries.slice(i, i + batchSize);
                const batchResults = await this.processBatch(batch, maxResults);
                results.push(...batchResults);
                
                // Longer delay between batches (5 seconds)
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                if (error.response?.status === 429) {
                    // If rate limited, wait 30 seconds and retry
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    i -= batchSize; // Retry this batch
                    continue;
                }
                throw error;
            }
        }
        
        return results;
    }
}

// // Test function
// async function testCookieService() {
//     const service = new CookieService();
//     try {
//         console.log('Testing Cookie Service...');
        
//         const allTweets = await service.searchMultipleQueries(
//             [ "$BBB"
//               ],  // Array of queries
//             5  // max_results per query
//         );
        
//         console.log('=== Combined Tweets from all queries ===');
//         console.log(`Total tweets found: ${allTweets.length}`);
//         allTweets.forEach((tweet, index) => {
//             console.log(`\n[Tweet ${index + 1}]`);
//             console.log(`Text: ${tweet.formattedText}`);
//             console.log(`Score: ${tweet.score}`);
//             console.log(`Engagement: ${tweet.formattedEngagement}`);
//             console.log('------------------------');
//         });
        
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

// // Run test if this file is executed directly
// if (require.main === module) {
//     testCookieService();
// }

export default CookieService;