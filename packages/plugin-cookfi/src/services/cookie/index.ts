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
        if (timeSinceLastRequest < (60000 / COOKIE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE)) {
            await new Promise(resolve => setTimeout(resolve, (60000 / COOKIE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) - timeSinceLastRequest));
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

    async searchMultipleQueries(queries: string[], maxResults: number = 10): Promise<EnhancedTweet[]> {
        // Calculate actual requests we can make per minute considering weight
        const WEIGHT_PER_REQUEST = 12;
        const actualRequestsPerMinute = Math.floor(COOKIE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE / WEIGHT_PER_REQUEST); // = 5
        
        // Use a smaller batch size to be safe (3 requests per batch)
        const batchSize = Math.min(3, actualRequestsPerMinute);
        const allTweets: EnhancedTweet[] = [];
        
        // Process queries in smaller batches
        for (let i = 0; i < queries.length; i += batchSize) {
            const batch = queries.slice(i, i + batchSize);
            const batchResults = await this.processBatch(batch, maxResults);
            allTweets.push(...batchResults);
            
            // Add a longer delay between batches to respect the weighted rate limit
            if (i + batchSize < queries.length) {
                // Wait for 20 seconds between batches to be safe
                // (60 seconds / 3 batches = 20 seconds)
                await new Promise(resolve => setTimeout(resolve, 20000));
            }
        }
        
        return allTweets;
    }
}

export default CookieService;
