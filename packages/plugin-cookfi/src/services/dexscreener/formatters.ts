import { TokenPair } from "./types";
import { calculateTokenScore } from "./scoring";

export function formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
}

export function formatTokenData(
    pairs: TokenPair[]
): {
    tickers: string[];
    marketData: string[];
} {
    return {
        tickers: pairs.map(pair => `$${pair.baseToken.symbol}`),
        marketData: pairs.map(pair => {
            const score = calculateTokenScore(pair);
            return `${pair.baseToken.symbol} | $${pair.priceUsd} | ` +
                   `Vol: $${formatNumber(pair.volume?.h24)} | ` +
                   `Liq: $${formatNumber(pair.liquidity?.usd)} | ` +
                   `Score: ${score.toFixed(1)} | ` +
                   `${pair.dexId} | ${pair.chainId}`;
        })
    };
}
