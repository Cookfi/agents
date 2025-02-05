import * as dotenv from 'dotenv';
import axios from 'axios';
import { DEXSCREENER_CONFIG } from './config';
import { formatTokenData } from './formatters';
import type { DexScreenerServiceConfig, SearchTokensParams } from './types';
import { TokenScoring, TokenScore } from './scoring';

dotenv.config();

interface TokenResponse {
    tickers: string[];
    marketData: string[];
    addresses: string[];
    tokenNames: string[];
    scores: TokenScore[];
}

export class DexScreenerService {
    private baseUrl: string;
    private lastRequestTime: number = 0;
    private maxTokens: number = 10;

    constructor(config: DexScreenerServiceConfig) {
        this.baseUrl = config.baseUrl || DEXSCREENER_CONFIG.BASE_URL;
        if (config.maxTokens) {
            this.maxTokens = config.maxTokens;
        }
    }

    private async checkRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < (60000 / DEXSCREENER_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE)) {
            await new Promise(resolve => setTimeout(resolve, (60000 / DEXSCREENER_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
    }

    async getTrendingTokens(params: SearchTokensParams = {}): Promise<TokenResponse> {
        await this.checkRateLimit();
        return getTopBoostedTokens(this.maxTokens);
    }

    async getSolanaTokenInfo(tokenAddress: string): Promise<TokenResponse> {
        await this.checkRateLimit();
        const response = await axios.get(
            `${this.baseUrl}${DEXSCREENER_CONFIG.ENDPOINTS.PAIRS}`,
            {
                params: {
                    chainId: 'solana',
                    tokenAddress
                }
            }
        );
        return formatTokenData(response.data);
    }
}

interface BoostedToken {
    chainId: string;
    tokenAddress: string;
    url: string;
    description?: string;
}

async function getTopBoostedTokens(maxTokens: number = 10): Promise<TokenResponse> {
    try {
        const boostedResponse = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
        });
        
        const boostedTokens = await boostedResponse.json();
        const limitedTokens = boostedTokens.slice(0, maxTokens);
        
        const detailedTokenData = [];
        const scores: TokenScore[] = [];
        
        for (const token of limitedTokens) {
            const pairResponse = await fetch(
                `https://api.dexscreener.com/latest/dex/tokens/${token.tokenAddress}`,
                {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                    },
                }
            );
            
            const pairData = await pairResponse.json();
            if (pairData.pairs && pairData.pairs.length > 0) {
                const mainPair = pairData.pairs[0];
                const score = TokenScoring.calculateTokenScore(mainPair);
                scores.push(score);
                
                detailedTokenData.push({
                    symbol: mainPair.baseToken.symbol,
                    name: mainPair.baseToken.name,
                    address: token.tokenAddress,
                    price: mainPair.priceUsd,
                    volume24h: mainPair.volume?.h24,
                    liquidity: mainPair.liquidity?.usd,
                    priceChange24h: mainPair.priceChange?.h24,
                    dexId: mainPair.dexId,
                    chainId: mainPair.chainId,
                    boostAmount: token.totalAmount,
                    trustScore: score.trustScore,
                    riskLevel: score.riskLevel
                });
            }
        }
        
        const formatted = formatTokenData(detailedTokenData);
        return {
            ...formatted,
            scores
        };

    } catch (error) {
        console.error('Error fetching boosted tokens:', error);
        return { tickers: [], marketData: [], addresses: [], tokenNames: [], scores: [] };
    }
}

// Example usage with 3 tokens
const dexService = new DexScreenerService({ maxTokens: 3 });
dexService.getTrendingTokens()
    .then(({ tickers, marketData, addresses, tokenNames, scores }) => {
        console.log('Tickers for Cookie:', tickers);
        console.log('Market Data for Analysis:', marketData);
        console.log('Token Addresses:', addresses);
        console.log('Token Names:', tokenNames);
        console.log('Scores:', scores);
    })
    .catch(console.error);

export default DexScreenerService; 