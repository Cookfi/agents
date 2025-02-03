import type { TokenResult } from "../../types/token";
import { CookieService } from "../cookie";
import type { EnhancedTweet } from "../cookie/types";
import { DexScreenerService } from "../dexscreener";
import type { TokenPair } from "../dexscreener/types";

export interface TokenAnalysisResult {
    marketAnalysis: TokenPair[];
    socialAnalysis: EnhancedTweet[];
}

export class TokenAnalysisService {
    private cookieService: CookieService;
    private dexScreenerService: DexScreenerService;

    constructor() {
        this.cookieService = new CookieService();
        this.dexScreenerService = new DexScreenerService();
    }

    async analyzeToken(token: TokenResult): Promise<TokenAnalysisResult> {
        // Get market and social data in parallel
        const [marketData, socialData] = await Promise.all([
            this.dexScreenerService.getTokenInfo(token.address, token.chainId),
            this.cookieService.searchTweets({
                query: `${token.symbol} $${token.symbol}`,
                max_results: 10
            })
        ]);

        return {
            marketAnalysis: marketData,
            socialAnalysis: socialData
        };
    }
}

export default TokenAnalysisService; 