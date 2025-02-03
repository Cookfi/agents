import * as dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { CookieService } from '../cookie';
import { ANALYSIS_PROMPT } from './prompt';
import { DexScreenerService } from '../dexscreener';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export type ServiceData = {
    data: string[];
    source: string;
}

export class DecisionMakerService {
    private model: ChatOpenAI;
    private chain: RunnableSequence;
    private serviceData: Promise<ServiceData>;

    constructor(serviceData: Promise<ServiceData>) {
        this.serviceData = serviceData;
        this.model = new ChatOpenAI({
            modelName: "gpt-4",
            temperature: 0.7,
        });

        this.chain = RunnableSequence.from([
            {
                context: async (input: string) => {
                    const data = await this.serviceData;
                    return data.data.join("\n");
                },
                source: async (input: string) => {
                    const data = await this.serviceData;
                    return data.source;
                }
            },
            ANALYSIS_PROMPT,
            this.model,
            new StringOutputParser(),
        ]);
    }

    async analyze(): Promise<string> {
        try {
            return await this.chain.invoke("");
        } catch (error) {
            console.error("Error in analysis:", error);
            throw error;
        }
    }
}

// Helper function to combine market and social data
export const analyzeMarketAndSocial = async (): Promise<ServiceData> => {
    try {
        const dexService = new DexScreenerService({ maxTokens: 3 });
        const { tickers, marketData } = await dexService.getTrendingTokens();
        
        try {
            const cookieService = new CookieService({});
            const tweetData = await cookieService.searchMultipleQueries(tickers, 3);

            return {
                data: [
                    "=== Market Data ===",
                    ...marketData,
                    "\n=== Social Sentiment ===",
                    ...tweetData
                ],
                source: 'market_and_social_data'
            };
        } catch (cookieError) {
            console.error("Error fetching tweets:", cookieError);
            return {
                data: [
                    "=== Market Data ===",
                    ...marketData
                ],
                source: 'market_data_only'
            };
        }
    } catch (error) {
        console.error("Error fetching market data:", error);
        throw error;
    }
};

// Test function to check tweets
const testTweets = async () => {
    try {
        const dexService = new DexScreenerService({ maxTokens: 3 });
        const { tickers, marketData } = await dexService.getTrendingTokens();
        
        console.log("Tickers found:", tickers);
        console.log("\nMarket Data:", marketData);
        
        try {
            const cookieService = new CookieService({});
            console.log("\nFetching tweets for:", tickers);
            
            const tweetData = await cookieService.searchMultipleQueries(tickers, 5);
            console.log("\nTweets found:", tweetData);
        } catch (cookieError) {
            console.error("\nError fetching tweets:", cookieError);
        }
    } catch (error) {
        console.error("Error in test:", error);
    }
};

// Test function to check LLM analysis
const testLLM = async () => {
    try {
        const decisionMaker = new DecisionMakerService(analyzeMarketAndSocial());
        const analysis = await decisionMaker.analyze();
        console.log("\nLLM Analysis:", analysis);
    } catch (error) {
        console.error("Error in LLM test:", error);
    }
};

// Run tests if this file is run directly
if (require.main === module) {
    // Test tweets first
    testTweets()
        .then(() => {
            console.log("\n=== Tweet test completed, starting LLM test ===\n");
            return testLLM();
        })
        .catch(console.error);
}

export default DecisionMakerService;

