import type { SearchTweetsParams } from './types';
import { CookieAPIResponse } from './types';

export function formatSearchParams(params: SearchTweetsParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    // Add required query parameter
    searchParams.append('query', params.query);

    // Add optional parameters if they exist
    if (params.max_results) {
        searchParams.append('max_results', params.max_results.toString());
    }
    if (params.next_token) {
        searchParams.append('next_token', params.next_token);
    }
    if (params.start_time) {
        searchParams.append('start_time', params.start_time);
    }
    if (params.end_time) {
        searchParams.append('end_time', params.end_time);
    }
    if (params.sort_order) {
        searchParams.append('sort_order', params.sort_order);
    }

    return searchParams;
}

export function formatCookieData(response: CookieAPIResponse): string[] {
    if (!response.ok || !Array.isArray(response.ok)) {
        return [];
    }
    return response.ok.map(tweet => tweet.text);
} 