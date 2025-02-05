import { elizaLogger } from '@elizaos/core';
import axios from 'axios';
import type { TokenResult } from '../../types/token';
import { DEXSCREENER_CONFIG } from './config';
import type {
    BoostedToken,
    SearchTokensParams,
    TokenPair
} from './types';

export class DexScreenerService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "https://api.dexscreener.com";
    }

    async getTrendingTokens(params: SearchTokensParams = {}): Promise<TokenResult[]> {
        const boostedResponse = await axios.get<BoostedToken[]>(
            `${this.baseUrl}/token-boosts/top/v1`
        );
        const maxResults = params.maxResults || DEXSCREENER_CONFIG.DEFAULT_MAX_RESULTS;
        const limitedTokens = boostedResponse.data.slice(0, maxResults);
        
        return limitedTokens.map(token => ({
            symbol: token.tokenAddress.split("/").pop() || "",
            name: token.description || token.tokenAddress,
            address: token.tokenAddress,
            chainId: token.chainId
        }));
    }

    async getTokenInfo(tokenAddress: string, chainId: string = 'solana'): Promise<TokenPair[]> {
        try {
            const response = await axios.get<TokenPair[]>(
                `${this.baseUrl}/token-pairs/v1/${chainId}/${tokenAddress}`
            );

            if (!response.data?.length) {
                elizaLogger.warn(`No pairs found for token ${tokenAddress} on ${chainId}`);
                return [];
            }

            return response.data;
        } catch (error) {
            elizaLogger.error(`Failed to fetch token pairs for ${tokenAddress}:`, error);
            return [];
        }
    }
}

export default DexScreenerService; 