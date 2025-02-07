import type { TokenResult } from "../../types/token";
import { CookieService } from "../cookie";
import { DexScreenerService } from "../dexscreener";
import type { TokenPair } from "../dexscreener/types";
import type { PositionAnalysis, TokenAnalysisResult } from "./types";

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

        const positionAnalysis = this.calculatePositionAnalysis(token, marketData);

        return {
            marketAnalysis: marketData,
            socialAnalysis: socialData,
            positionAnalysis
        };
    }

    private calculatePositionAnalysis(token: TokenResult, marketData: TokenPair[]): PositionAnalysis {
        // If no balance or market data, return default values
        if (!token.balance?.amount || marketData.length === 0) {
            return {
                currentPriceUsd: 0,
                currentPriceNative: 0,
                roiNative: 0,
                unrealizedPnlNative: 0,
                hasPosition: false
            };
        }

        const currentPair = marketData[0];
        const currentPriceNative = parseFloat(currentPair.priceNative);
        const currentPriceUsd = parseFloat(currentPair.priceUsd);
        
        // Calculate value in native token (SOL)
        const currentValueNative = currentPriceNative * token.balance.amount;
        const costBasisNative = token.balance.costBasisNative || currentValueNative;
        
        // ROI calculation
        const unrealizedPnlNative = currentValueNative - costBasisNative;
        const roiNative = ((currentPriceNative / costBasisNative) - 1) * 100;

        return {
            currentPriceUsd,
            currentPriceNative,
            roiNative,
            unrealizedPnlNative,
            hasPosition: true
        };
    }
}

export default TokenAnalysisService; 