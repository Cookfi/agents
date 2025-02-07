import { elizaLogger } from '@elizaos/core';
import axios from 'axios';
import type { TokenResult } from '../../types/token';
import { DEXSCREENER_CONFIG } from './config';


import type {
    BoostedToken,
    SearchTokensParams,
    TokenPair,
    TokenResponse
} from './types';
import { calculateTokenScore } from './types';
import { formatNumber } from './formatters';

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

    async getTrendingTokenInfo(tokenAddress: string, chainId: string = 'solana', tokenInfo?: TokenPair[]): Promise<TokenResponse> {
        try {
            // If tokenInfo is not provided, fetch it
            if (!tokenInfo) {
                tokenInfo = await this.getTokenInfo(tokenAddress, chainId);
            }

            const response = await axios.get<DexScreenerResponse>(
                `${this.baseUrl}/latest/dex/tokens/${tokenAddress}`
            );

            if (!response.data.pairs || response.data.pairs.length === 0) {
                return {
                    tickers: [],
                    marketData: [],
                    addresses: [],
                    tokenNames: [],
                    scores: []
                };
            }

            const pairs = response.data.pairs;
            const mainPair = pairs[0]; // Get the main/most liquid pair

            // Use Set to remove duplicates and convert back to array
            const uniqueTokenNames = [...new Set(tokenInfo.map(token => token.baseToken.name))];

            return {
                tickers: [`$${mainPair.baseToken.symbol}`],
                marketData: [
                    `${mainPair.baseToken.symbol} | $${mainPair.priceUsd} | Vol: $${
                        formatNumber(mainPair.volume?.h24)
                    } | Liq: $${formatNumber(mainPair.liquidity?.usd)} | ${
                        mainPair.dexId
                    } | ${mainPair.chainId}`
                ],
                addresses: [tokenAddress],
                tokenNames: uniqueTokenNames, // Use the deduplicated array
                scores: [calculateTokenScore(mainPair)]
            };

        } catch (error) {
            elizaLogger.error(`Error fetching token data for ${tokenAddress}:`, error);
            return {
                tickers: [],
                marketData: [],
                addresses: [],
                tokenNames: [],
                scores: []
            };
        }
    }
}

interface DexScreenerResponse {
    pairs: TokenPair[];
}

export default DexScreenerService;
