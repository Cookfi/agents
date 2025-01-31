export const COOKIE_CONFIG = {
    BASE_URL: "https://api.cookie.fun",
    DEFAULT_MAX_RESULTS: 10,
    ENDPOINTS: {
        SEARCH_TWEETS: "/v1/tweets/search"
    },
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60,
        RETRY_AFTER: 60 * 1000 // 1 minute in milliseconds
    }
};
