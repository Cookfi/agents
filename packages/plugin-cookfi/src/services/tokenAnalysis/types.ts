import type { EnhancedTweet } from "../cookie/types";
import type { TokenPair } from "../dexscreener/types";
import type { TokenEngagement } from "./db";

export interface PositionAnalysis {
    currentPriceUsd: number;
    currentPriceNative: number;
    roiNative: number;
    unrealizedPnlNative: number;
    hasPosition: boolean;
}

export interface TokenAnalysisResult {
    marketData: TokenPair[];
    socialAnalysis: {
        ticker: string;
        tweets: EnhancedTweet[]
       
        marketScore: number;
    }[];
    
    positionAnalysis: PositionAnalysis;
} 