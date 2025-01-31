import { elizaLogger } from '@elizaos/core';
import { COOKIE_CONFIG } from './config';
import { formatSearchParams } from './formatters';
import type {
    CookieServiceConfig,
    SearchTweetsParams,
    SearchTweetsResponse
} from './types';

export class CookieService {
    private apiKey: string;
    private baseUrl: string;
    private lastRequestTime: number = 0;

    constructor(config: CookieServiceConfig) {
        this.apiKey = process.env.COOKFI_COOKIE_API_KEY;
        this.baseUrl = config.baseUrl || COOKIE_CONFIG.BASE_URL;
    }

    private async checkRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < (60000 / COOKIE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE)) {
            const waitTime = (60000 / COOKIE_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    private async makeRequest<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
        await this.checkRateLimit();

        const url = `${this.baseUrl}${endpoint}${params ? `?${params.toString()}` : ''}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Cookie API error: ${JSON.stringify(error)}`);
            }

            return response.json() as Promise<T>;
        } catch (error) {
            elizaLogger.error('Cookie API request failed:', error);
            throw error;
        }
    }

    /**
     * Search for tweets based on provided parameters
     * @param params Search parameters including query and optional filters
     * @returns Promise containing tweet search results
     */
    async searchTweets(params: SearchTweetsParams): Promise<SearchTweetsResponse> {
        const searchParams = formatSearchParams({
            ...params,
            max_results: params.max_results || COOKIE_CONFIG.DEFAULT_MAX_RESULTS
        });

        return this.makeRequest<SearchTweetsResponse>(
            COOKIE_CONFIG.ENDPOINTS.SEARCH_TWEETS,
            searchParams
        );
    }
}

export default CookieService;
