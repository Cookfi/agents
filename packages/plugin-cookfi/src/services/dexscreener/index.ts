import axios from 'axios';
import type { TokenResult } from '../../types/token';
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

    async getTrendingTokens(params: SearchTokensParams = {}): Promise<TokenResult[]> {
        const boostedResponse = await axios.get<BoostedToken[]>(
            "https://api.dexscreener.com/token-boosts/top/v1"
        );
        const maxResults = params.maxResults || DEXSCREENER_CONFIG.DEFAULT_MAX_RESULTS;
        const limitedTokens = boostedResponse.data.slice(0, maxResults);
        
        return limitedTokens.map(token => ({
            symbol: token.tokenAddress.split("/").pop() || "",
            name: token.description || token.tokenAddress,
            address: token.tokenAddress,
            chainId: token.chainId
            // balance is undefined for trending tokens
        }));
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