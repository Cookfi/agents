import type { TokenResult } from "../types/token";

/**
 * Removes duplicate tokens based on symbol (case-insensitive)
 * Priority is given to tokens that appear earlier in the array
 */
export function deduplicateTokens(tokens: TokenResult[]): TokenResult[] {
    const seenSymbols = new Set<string>();
    return tokens.filter(token => {
        const symbol = token.symbol.toLowerCase();
        if (seenSymbols.has(symbol)) {
            return false;
        }
        seenSymbols.add(symbol);
        return true;
    });
}
