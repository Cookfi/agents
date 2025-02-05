import { TokenPair } from './types';

export interface TokenScore {
    tokenName: string;
    tokenSymbol: string;
    trustScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    reason: string;
}

export class TokenScoring {
    private static readonly LIQUIDITY_WEIGHT = 0.4;
    private static readonly VOLUME_WEIGHT = 0.4;
    private static readonly MCAP_WEIGHT = 0.2;

    static calculateTokenScore(pair: TokenPair): TokenScore {
        const trustScore = this.calculateTrustScore(pair);
        const riskLevel = trustScore > 0.7 ? "LOW" :
                         trustScore > 0.4 ? "MEDIUM" : "HIGH";

        return {
            tokenName: pair.baseToken?.name || 'Unknown',
            tokenSymbol: pair.baseToken?.symbol || 'Unknown',
            trustScore,
            riskLevel,
            reason: `Trust Score: ${trustScore}`
        };
    }

    private static calculateTrustScore(pair: TokenPair): number {
        const liquidityScore = Math.min(pair.liquidity?.usd / 100000 || 0, 1) * this.LIQUIDITY_WEIGHT;
        const volumeScore = Math.min(pair.volume?.h24 / 50000 || 0, 1) * this.VOLUME_WEIGHT;
        const mcapScore = Math.min(pair.marketCap / 1000000 || 0, 1) * this.MCAP_WEIGHT;

        return Number((liquidityScore + volumeScore + mcapScore).toFixed(2));
    }
}
