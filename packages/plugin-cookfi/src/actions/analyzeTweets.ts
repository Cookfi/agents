import {
    type Action,
    type ActionExample,
    composeContext,
    elizaLogger,
    generateObject,
    generateText,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
} from "@elizaos/core";
import { z } from "zod";
import { CookieService } from "../services/cookie";
import { EnhancedTweet } from "../services/cookie/types";

const topicExtractionTemplate = `Look at the user's message and identify the main cryptocurrency or token they want to analyze.
Extract ONLY the token name/symbol without any prefixes (like $ or #).

For example:
- "What are people saying about Bitcoin?" -> "bitcoin"
- "Check the latest $ETH tweets" -> "eth"
- "What's up with PINGU token?" -> "pingu"
- "Analyze recent discussions about Solana" -> "solana"

Return the token name in a JSON object.

Last message:
{{text}}`;

const analyzeTemplate = `Analyze these tweets about cryptocurrency and provide a summary of the key insights.
Format the response as 3 points: 
- First point: One sentence with the 2 most important news about the project.
- Second point: One sentence with the overall sentiment and engagement levels.
- Third point: If tweets mentions a token, One sentence with analyse of the price predictions, chart information, technical analysis mentions.

Tweets to analyze:
{{tweets}}`;

interface TopicFields {
    topic: string;
}

export const analyzeTweetsAction: Action = {
    name: "ANALYZE_TWEETS",
    description: "Search and analyze recent tweets about a cryptocurrency",
    similes: [
        "SEARCH_TWEETS",
        "FIND_TWEETS",
        "CHECK_CRYPTO_TWEETS",
        "ANALYZE_CRYPTO_TWEETS",
        "GET_TWEET_ANALYSIS",
    ],

    validate: async () => true,

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const actionId = Date.now().toString();
        elizaLogger.info("Starting tweet analysis", { actionId });

        try {
            // Initialize or update state
            let localState = state;
            if (!localState) {
                localState = await runtime.composeState(message);
            } else {
                localState = await runtime.updateRecentMessageState(localState);
            }

            // Extract topic using LLM
            const topicContext = composeContext({
                state: {
                    ...localState,
                    text: message.content.text
                },
                template: topicExtractionTemplate,
            });

            // Define schema for topic extraction
            const schema = z.object({
                topic: z.string().min(1, "Topic is required"),
            });

            // Extract topic using LLM
            const results = await generateObject({
                runtime,
                context: topicContext,
                modelClass: ModelClass.SMALL,
                schema,
            });

            const topicFields = results.object as TopicFields;

            if (!topicFields.topic) {
                if (callback) {
                    callback({
                        text: "I couldn't determine which cryptocurrency you want me to analyze. Please specify a token name or symbol.",
                    });
                }
                return false;
            }

            const cookieService = new CookieService();

            // Search for tweets using the extracted topic
            const searchResults = await cookieService.searchTweets({
                query: topicFields.topic,
                max_results: 10
            });

            if (!searchResults || searchResults.length === 0) {
                if (callback) {
                    callback({
                        text: `No tweets found for ${topicFields.topic}`,
                    });
                }
                return false;
            }

            // Format tweets for analysis
            const formattedTweets = searchResults
                .map((tweet: EnhancedTweet) => 
                    `Tweet: ${tweet.formattedText} (Likes: ${tweet.likesCount}, Retweets: ${tweet.retweetsCount}, Replies: ${tweet.repliesCount}, Quotes: ${tweet.quotesCount}, Smart Engagement: ${tweet.smartEngagementPoints}, Score: ${tweet.score})`)
                .join("\n---\n");

            // Generate analysis
            const context = composeContext({
                state: {
                    ...localState,
                    tweets: formattedTweets
                },
                template: analyzeTemplate,
            });

            const analysis = await generateText({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            if (!analysis) {
                throw new Error("Failed to generate analysis");
            }

            // Select and format the top tweets by engagement
            const topTweets = searchResults
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            const formattedResponse = `<b>My analysis:</b>\n\n${analysis}\n\n<b>Top Tweets:</b>\n\n${topTweets.map((tweet, index) => (
                `${index + 1}. <a href="https://twitter.com/${tweet.authorUsername}">@${tweet.authorUsername}</a> (${tweet.formattedDate}) - ${tweet.formattedEngagement}\n${tweet.formattedText}\n`
            )).join('\n')}`;

            if (callback) {
                callback({
                    text: formattedResponse,
                    parseMode: "HTML"
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Tweet analysis failed:", error);
            
            if (callback) {
                callback({
                    text: `Failed to analyze tweets: ${error.message}`
                });
            }
            
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What are people saying about Bitcoin on Twitter?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll analyze recent tweets about Bitcoin for you.",
                    action: "ANALYZE_TWEETS",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "1. Strong bullish sentiment as Bitcoin breaks $50k resistance\n2. Multiple traders reporting increased institutional buying pressure\n3. Technical analysts predict potential move to $52k in short term\n4. Growing discussion about ETF impact on market dynamics\n5. Concerns about potential profit-taking at current levels",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "what's people are saying about $PINGU?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check what people are saying about PINGU token.",
                    action: "ANALYZE_TWEETS",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "1. Community excitement over new DEX listing announcement\n2. Recent partnership with gaming platform gaining traction\n3. Meme contest driving increased social engagement\n4. Price showing 24% gain in last 24 hours\n5. Upcoming AMA with dev team scheduled for next week",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you analyze recent ETH tweets?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll analyze the latest tweets about Ethereum.",
                    action: "ANALYZE_TWEETS",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "1. Ethereum gas fees hitting monthly lows after network upgrade\n2. DeFi protocols reporting record TVL on Ethereum\n3. Growing optimism about ETH staking yields\n4. Layer 2 adoption showing significant growth\n5. Developers highlighting new EIP proposals for scaling",
                },
            },
        ],
    ] as ActionExample[][]
};

export default analyzeTweetsAction;
