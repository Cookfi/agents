import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { DecisionMakerService } from "../services/decisionMaker";
import { DexScreenerService } from "../services/dexscreener";
import { ExecutionService } from "../services/execution";
import { PortfolioService } from "../services/portfolio";
import { TokenAnalysisService } from "../services/tokenAnalysis";
import { TradingService } from "../services/trading";
import { deduplicateTokens } from "../utils/token";

export class TradingWorkflow {
    private runtime: IAgentRuntime;
    private isProcessing = false;
    private stopProcessing = false;
    private readonly ANALYSIS_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private isDryRun: boolean;
    
    private dexScreenerService: DexScreenerService;
    private portfolioService: PortfolioService;
    private tokenAnalysisService: TokenAnalysisService;
    private decisionMakerService: DecisionMakerService;
    private tradingService: TradingService;
    private executionService: ExecutionService;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.isDryRun = process.env.COOKFI_BIRDEYE_DRY_RUN === 'true';
        this.dexScreenerService = new DexScreenerService();
        this.portfolioService = new PortfolioService();
        this.tokenAnalysisService = new TokenAnalysisService();
        this.decisionMakerService = new DecisionMakerService(runtime);
        this.tradingService = new TradingService({
            rpcUrl: process.env.SOLANA_RPC_URL
        });
        this.executionService = new ExecutionService({
            isDryRun: process.env.COOKFI_BIRDEYE_DRY_RUN === 'true',
            rpcUrl: process.env.SOLANA_RPC_URL
        });
    }

    async start() {
        elizaLogger.log("Starting trading workflow");
        this.runAnalysisLoop();
    }

    async stop() {
        elizaLogger.log("Stopping trading workflow");
        this.stopProcessing = true;
    }

    private async runAnalysisLoop() {
        if (this.isProcessing) {
            elizaLogger.log("Already processing trading analysis, skipping");
            return;
        }

        while (!this.stopProcessing) {
            try {
                this.isProcessing = true;
                
                // Fetch trending tokens and portfolio data in parallel
                const [trendingTokens, portfolioTokens] = await Promise.all([
                    this.dexScreenerService.getTrendingTokens(),
                    this.portfolioService.getTokens()
                ]);

                // Combine and deduplicate tokens
                const tokensToAnalyze = deduplicateTokens([
                    ...portfolioTokens, // Portfolio tokens take priority
                    ...trendingTokens
                ]);

                elizaLogger.log(
                    `Analyzing ${tokensToAnalyze.length} unique tokens`
                );

                // Analyze each token
                const analysisResults = await Promise.all(
                    tokensToAnalyze.map(token =>
                        this.tokenAnalysisService.analyzeToken(token)
                    )
                );

                // Make trading decisions using complete analysis results
                const decisions = await Promise.all(
                    tokensToAnalyze.map((token, index) =>
                        this.decisionMakerService.analyzeToken(
                            token,
                            analysisResults[index]
                        )
                    )
                );

                // Log results
                tokensToAnalyze.forEach((token, index) => {
                    const analysis = analysisResults[index];
                    const decision = decisions[index];
                    elizaLogger.log(
                        `Analysis for ${token.symbol}:`,
                        {
                            pairs: analysis.marketAnalysis.length,
                            bestPrice: analysis.marketAnalysis[0]?.priceUsd,
                            socialMentions: analysis.socialAnalysis.length,
                            decision: decision?.recommendation,
                            confidence: decision?.confidence,
                            balance: token.balance
                        }
                    );
                });

                // Execute trading decisions
                for (let i = 0; i < tokensToAnalyze.length; i++) {
                    const token = tokensToAnalyze[i];
                    const decision = decisions[i];
                    const analysis = analysisResults[i];

                    if (decision) {
                        await this.executionService.executeDecision(
                            token,
                            decision,
                            analysis.marketAnalysis
                        );
                    }
                }

                await new Promise(resolve => 
                    setTimeout(resolve, this.ANALYSIS_INTERVAL)
                );
                
            } catch (error) {
                elizaLogger.error("Error in trading analysis loop:", error);
                await new Promise(resolve => setTimeout(resolve, 30000));
            } finally {
                this.isProcessing = false;
            }
        }
    }
}
