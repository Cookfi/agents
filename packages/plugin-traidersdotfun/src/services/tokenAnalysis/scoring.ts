import { TokenPair } from "../dexscreener/types";

export function calculateTokenScore(pair: TokenPair): number {
    const {
        liquidity,
        volume,
        marketCap,
        txns,
        priceChange,
        fdv,
        pairCreatedAt
    } = pair;
    const pairAge = (Date.now() - pairCreatedAt * 1000) / (60 * 60 * 1000); // Age in hours

    // Dynamic thresholds based on pair age
    const thresholds = {
        liquidity:
            pairAge <= 0.5
                ? 10_000 // 10K for first 30 minutes
                : pairAge <= 1
                ? 20_000 // 20K for first hour
                : pairAge <= 6
                ? 50_000 // 50K for first 6 hours
                : pairAge <= 24
                ? 100_000 // 100K for first day
                : 200_000, // 200K after first day

        volume:
            pairAge <= 0.5
                ? 5_000 // 5K volume in first 30 minutes
                : pairAge <= 1
                ? 10_000 // 10K volume in first hour
                : pairAge <= 6
                ? 25_000 // 25K for first 6 hours
                : pairAge <= 24
                ? 50_000 // 50K for first day
                : 100_000, // 100K after first day

        marketCap:
            pairAge <= 0.5
                ? 25_000 // 25K mcap in first 30 minutes
                : pairAge <= 1
                ? 50_000 // 50K mcap in first hour
                : pairAge <= 6
                ? 100_000 // 100K mcap in first 6 hours
                : pairAge <= 24
                ? 200_000 // 200K mcap in first day
                : 500_000, // 500K mcap after first day

        txns:
            pairAge <= 0.5
                ? 10 // 10 txns in first 30 minutes
                : pairAge <= 1
                ? 20 // 20 txns in first hour
                : pairAge <= 6
                ? 50 // 50 txns in first 6 hours
                : pairAge <= 24
                ? 100 // 100 txns in first day
                : 200 // 200 txns after first day
    };

    // Weight factors adjusted for token age
    const weights = {
        liquidity: pairAge <= 0.5 ? 0.4 : pairAge <= 6 ? 0.35 : 0.3, // Even more important for very new tokens
        volume: pairAge <= 0.5 ? 0.35 : pairAge <= 6 ? 0.3 : 0.25, // More emphasis on early volume
        transactions: 0.2,
        priceStability: pairAge <= 0.5 ? 0.05 : pairAge <= 6 ? 0.1 : 0.15, // Much less important for very new tokens
        marketCap: 0.05,
        fdvToMcap: pairAge <= 0.5 ? 0 : pairAge <= 6 ? 0 : 0.05 // Ignore FDV for new tokens
    };

    // Liquidity score with dynamic threshold
    const liquidityScore =
        Math.min((liquidity?.usd || 0) / thresholds.liquidity, 1) *
        weights.liquidity;

    // Volume score with dynamic threshold
    const volumeScore =
        Math.min((volume?.h24 || 0) / thresholds.volume, 1) * weights.volume;

    // Market cap score with dynamic threshold
    const mcapScore =
        Math.min((marketCap || 0) / thresholds.marketCap, 1) *
        weights.marketCap;

    // Transaction health score with dynamic threshold
    const h24Txns = txns?.h24 || { buys: 0, sells: 0 };
    const totalTxns = h24Txns.buys + h24Txns.sells;

    let txnScore = 0;
    if (totalTxns > 0) {
        const buyRatio = h24Txns.buys / totalTxns;
        const txnVolume = Math.min(totalTxns / thresholds.txns, 1);

        // More lenient buy ratio requirements for newer tokens
        const buyRatioScore =
            pairAge <= 6
                ? buyRatio >= 0.5
                    ? 1 // More balanced for new tokens
                    : buyRatio >= 0.4
                    ? 0.8
                    : buyRatio >= 0.3
                    ? 0.6
                    : 0.3
                : buyRatio >= 0.6
                ? 1 // Stricter for older tokens
                : buyRatio >= 0.45
                ? 0.8
                : buyRatio >= 0.3
                ? 0.5
                : 0.2;

        txnScore = buyRatioScore * txnVolume * weights.transactions;
    }

    // Price stability expectations vary by age
    const priceVolatility = Math.abs(priceChange?.h24 || 0);
    const stabilityScore =
        (pairAge <= 6
            ? priceVolatility <= 40
                ? 1 // More volatile is ok for new tokens
                : priceVolatility <= 60
                ? 0.8
                : priceVolatility <= 80
                ? 0.5
                : 0.2
            : priceVolatility <= 20
            ? 1 // Expect more stability from older tokens
            : priceVolatility <= 40
            ? 0.8
            : priceVolatility <= 60
            ? 0.5
            : priceVolatility <= 80
            ? 0.3
            : 0.1) * weights.priceStability;

    // FDV to Market Cap ratio score (ignored for very new tokens)
    const fdvToMcapRatio = marketCap && fdv ? marketCap / fdv : 0;
    const fdvScore =
        pairAge <= 6
            ? 0
            : (fdvToMcapRatio >= 0.6
                  ? 1
                  : fdvToMcapRatio >= 0.4
                  ? 0.8
                  : fdvToMcapRatio >= 0.2
                  ? 0.5
                  : 0.2) * weights.fdvToMcap;

    // Age-based bonus (higher for newer tokens with good metrics)
    const ageBonus =
        pairAge <= 0.5
            ? 15 // +15 points in first 30 minutes
            : pairAge <= 1
            ? 10 // +10 points in first hour
            : pairAge <= 6
            ? 7 // +7 points in first 6 hours
            : pairAge <= 24
            ? 5
            : 0; // +5 points in first day

    const totalScore =
        (liquidityScore +
            volumeScore +
            mcapScore +
            txnScore +
            stabilityScore +
            fdvScore) *
            100 +
        ageBonus;

    return Math.min(Math.max(totalScore, 0), 100);
}
