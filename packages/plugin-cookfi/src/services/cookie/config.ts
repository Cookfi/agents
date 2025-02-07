export const COOKIE_CONFIG = {
    BASE_URL: "https://api.cookie.fun/v1/hackathon",
    DEFAULT_MAX_RESULTS: 10,
    ENDPOINTS: {
        SEARCH_TWEETS: "/search"
    },
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 10,
        RETRY_AFTER: 120 * 1000 // 1 minute in milliseconds
    }
};
