import axios from 'axios';
import { DEXSCREENER_CONFIG } from './config';
import type {
    BoostedToken,
    DexScreenerAPIResponse,
    SearchTokensParams,
    TokenPair
} from './types';

export class DexScreenerService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = "https://api.dexscreener.com/latest";
    }

    async getTrendingTokens(params: SearchTokensParams = {}): Promise<TokenPair[]> {
        const boostedResponse = await axios.get<BoostedToken[]>(
            "https://api.dexscreener.com/token-boosts/top/v1"
        );
        const maxResults = params.maxResults || DEXSCREENER_CONFIG.DEFAULT_MAX_RESULTS;
        const limitedTokens = boostedResponse.data.slice(0, maxResults);
        
        const pairs: TokenPair[] = [];
        
        for (const token of limitedTokens) {
            const pairResponse = await axios.get<DexScreenerAPIResponse>(
                `${this.baseUrl}/dex/pairs/${token.tokenAddress}`
            );
            
            if (pairResponse.data.pairs?.[0]) {
                pairs.push(pairResponse.data.pairs[0]);
            }
        }
        
        return pairs;
    }

    async getTokenInfo(tokenAddress: string, chainId: string = 'solana'): Promise<TokenPair[]> {
        const response = await axios.get<DexScreenerAPIResponse>(
            `${this.baseUrl}/dex/pairs`,
            {
                params: { chainId, tokenAddress }
            }
        );

        return response.data.pairs || [];
    }
}

export default DexScreenerService; 