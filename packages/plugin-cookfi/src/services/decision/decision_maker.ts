import * as dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { CookieService } from '../cookie';
import { ANALYSIS_PROMPT } from './prompt';

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

// Helper function to create ServiceData from CookieService
export const cookie = async (tokens: string[]): Promise<ServiceData> => {
    const service = new CookieService({});
    const data = await service.searchMultipleQueries(tokens);
    return {
        data,
        source: 'cookie'
    };
};

// dexscreener is not implemented yet
// export const dexscreener = async (tokens: string[]): Promise<ServiceData> => {
//     const service = new DexScreenerService({});
//     const data = await service.getPrices(tokens);
//     return {
//         data,
//         source: 'dexscreener'
//     };
// };

// Example usage:
const main = async () => {
    try {
        const decisionMaker = new DecisionMakerService(cookie(['bitcoin', 'solana']));
        const analysis = await decisionMaker.analyze();
        console.log("Analysis:", analysis);
    } catch (error) {
        console.error("Error:", error);
    }
};

if (require.main === module) {
    main();
}

export default DecisionMakerService;
