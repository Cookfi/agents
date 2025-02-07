import type { TokenResult } from "../../types/token";
import { CookieService } from "../cookie";
import { DexScreenerService } from "../dexscreener";
import type { TokenPair } from "../dexscreener/types";
import type { PositionAnalysis, TokenAnalysisResult } from "./types";
import { TokenReportService } from "./token_report";

    
export class TokenAnalysisService {
    private cookieService: CookieService;
    private dexScreenerService: DexScreenerService;

    private tokenReportService: TokenReportService;

    constructor() {
        this.cookieService = new CookieService();
        this.dexScreenerService = new DexScreenerService();
        
        this.tokenReportService = new TokenReportService();
    }

    async analyzeToken(token: TokenResult): Promise<TokenAnalysisResult> {
        if (!token?.symbol || !token?.chainId) {
            throw new Error('Invalid token input: missing required fields');
        }

        console.log(`\n=== Starting analysis for token ${token.symbol} ===`);
        
        // Step 1: Fetch market data and trending token info in parallel
        const [marketData, trendingTokenInfo] = await Promise.all([
            this.dexScreenerService.getTokenInfo(token.address, token.chainId),
            this.dexScreenerService.getTrendingTokenInfo(token.address, token.chainId)
        ]);

        // Validate trending token info
        if (!trendingTokenInfo?.tickers?.length) {
            console.warn('No trending token info found');
        }

        // Step 2: Fetch and analyze token using the TokenReportService
        const { allAnalysis: socialAnalysis } = await this.tokenReportService.analyzeAllTickers(trendingTokenInfo);

        // Step 3: Calculate position analysis
        const positionAnalysis = this.calculatePositionAnalysis(token, marketData);

        // Step 4: Return the results
        return {
            marketData,
            socialData: socialAnalysis,
            positionAnalysis,
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