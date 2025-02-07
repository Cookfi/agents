import type { EnhancedTweet } from "../cookie/types";
import type { TokenPair } from "../dexscreener/types";

export interface PositionAnalysis {
    currentPriceUsd: number;
    currentPriceNative: number;
    roiNative: number;
    unrealizedPnlNative: number;
    hasPosition: boolean;
}

export interface TokenAnalysisResult {
    marketAnalysis: TokenPair[];
    socialAnalysis: EnhancedTweet[];
    positionAnalysis: PositionAnalysis;
} 