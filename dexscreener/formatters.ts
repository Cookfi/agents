import { DexScreenerAPIResponse, FormattedToken, Token } from './types';

export function formatTokenForTicker(token: Token): string {
    // Format for cookie service to search tweets
    return `${token.name} ${token.symbol}`;
}

export function formatTokenForAnalysis(token: Token): string {
    // Format for decision maker analysis
    return `${token.name} (${token.symbol}):
    - Price: $${token.priceUsd}
    - 24h Volume: $${formatNumber(token.volume24h)}
    - Liquidity: $${formatNumber(token.liquidity)}
    - 24h Change: ${token.priceChange.h24}%
    - FDV: $${formatNumber(token.fdv)}`;
}

export function formatDexScreenerData(data: DexScreenerAPIResponse): {
    tickers: string[];
    marketData: string[];
} {
    if (!data.pairs || !Array.isArray(data.pairs)) {
        console.log('No pairs found in data:', data);
        return { tickers: [], marketData: [] };
    }

    try {
        console.log('Total pairs received:', data.pairs.length);

        const formattedTokens = data.pairs
            .filter(pair => {
                // Ensure we have valid data
                return pair && pair.baseToken && pair.priceUsd;
            })
            .map(pair => ({
                symbol: pair.baseToken?.symbol || 'Unknown',
                name: pair.baseToken?.name || 'Unknown',
                price: parseFloat(pair.priceUsd || '0'),
                volume24h: pair.volume?.h24 || 0,
                liquidity: pair.liquidity?.usd || 0,
                priceChange24h: pair.priceChange?.h24 || 0,
                marketData: `${pair.baseToken?.symbol || 'Unknown'} | $${parseFloat(pair.priceUsd || '0').toFixed(6)} | Vol: $${formatNumber(pair.volume?.h24 || 0)} | Liq: $${formatNumber(pair.liquidity?.usd || 0)} | ${pair.dexId || 'Unknown'} | ${pair.chainId || 'Unknown'}`
            }))
            .slice(0, 10); // Only take top 10

        return {
            tickers: formattedTokens.map(token => token.symbol),
            marketData: formattedTokens.map(token => token.marketData)
        };
    } catch (error) {
        console.error('Error formatting data:', error);
        return { tickers: [], marketData: [] };
    }
}

export function formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

export function formatTokenData(detailedTokenData: any[]): {
    tickers: string[];
    marketData: string[];
} {
    return {
        tickers: detailedTokenData.map(token => `$${token.symbol}`),
        marketData: detailedTokenData.map(token => 
            `${token.symbol} | $${token.price} | Vol: $${formatNumber(token.volume24h)} | Liq: $${formatNumber(token.liquidity)} | ${token.dexId} | ${token.chainId} | Boost: ${token.boostAmount}`
        )
    };
} 