export const DEXSCREENER_CONFIG = {
    BASE_URL: 'https://api.dexscreener.com/latest',
    ENDPOINTS: {
        TRENDING: '/dex/tokens/trending',
        SEARCH: '/dex/search',
        PAIRS: '/dex/pairs'
    },
    DEFAULT_CHAIN: 'solana',
    DEFAULT_LIMIT: 20,
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60
    }
}; 