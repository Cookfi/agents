import type { TokenResult } from "../../types/token";
import { CookieService } from "../cookie";
import { DexScreenerService } from "../dexscreener";
import type { TimePeriod, TokenPair } from "../dexscreener/types";
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
        const [rawMarketData, socialData] = await Promise.all([
            this.dexScreenerService.getTokenInfo(token.address, token.chainId),
            this.cookieService.searchTweets({
                query: `${token.symbol} $${token.symbol}`,
                max_results: 10
            })
        ]);

        // Filter market data based on pair age
        const marketData = this.filterMarketDataByAge(rawMarketData);

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

    private filterMarketDataByAge(marketData: TokenPair[]): TokenPair[] {
        return marketData.map(pair => {
            const pairCreationTime = pair.pairCreatedAt * 1000; // Convert to milliseconds
            const now = Date.now();
            
            // Create a filtered copy of the pair
            const filteredPair: TokenPair = {
                ...pair,
                txns: {},
                volume: {},
                priceChange: {}
            };

            // Helper function to check if a period is valid
            const isPeriodValid = (period: TimePeriod): boolean => {
                const periodInMs = {
                    m5: 5 * 60 * 1000,        // 5 minutes
                    h1: 60 * 60 * 1000,       // 1 hour
                    h6: 6 * 60 * 60 * 1000,   // 6 hours
                    h24: 24 * 60 * 60 * 1000  // 24 hours
                };

                return (now - pairCreationTime) >= periodInMs[period];
            };

            // Filter txns
            Object.entries(pair.txns || {}).forEach(([period, stats]) => {
                if (isPeriodValid(period as TimePeriod)) {
                    filteredPair.txns[period] = stats;
                }
            });

            // Filter volume
            Object.entries(pair.volume || {}).forEach(([period, value]) => {
                if (isPeriodValid(period as TimePeriod)) {
                    filteredPair.volume[period] = value;
                }
            });

            // Filter price changes
            Object.entries(pair.priceChange || {}).forEach(([period, value]) => {
                if (isPeriodValid(period as TimePeriod)) {
                    filteredPair.priceChange[period] = value;
                }
            });

            return filteredPair;
        });
    }
}

export default TokenAnalysisService; 