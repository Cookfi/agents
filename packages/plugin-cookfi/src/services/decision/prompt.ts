import { ChatPromptTemplate } from "@langchain/core/prompts";

const SYSTEM_TEMPLATE = `You are a helpful assistant that analyzes market data from {source}.
You provide clear, concise insights based on the provided data.
Your analysis should focus on key trends, sentiment, and actionable insights.

Context:
{context}`;

const HUMAN_TEMPLATE = `Based on the above data, provide a comprehensive analysis. 
Focus on:
- Overall market sentiment
- Key trends and patterns
- Notable insights or concerns
- Potential market implications`;

export const ANALYSIS_PROMPT = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    ["human", HUMAN_TEMPLATE],
]);
