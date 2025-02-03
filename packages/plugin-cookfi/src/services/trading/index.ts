import { elizaLogger } from "@elizaos/core";
import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "solana-agent-kit";
import { TRADING_CONFIG } from "./config";
import type {
    TradingServiceConfig,
    SwapParams,
    SwapResponse,
    TransferParams,
    TransferResponse,
    LendParams,
    LendResponse,
    StakeParams,
    StakeResponse,
} from "./types";

export class TradingService {
    private connection: Connection;
    private agent: SolanaAgentKit;

    constructor(config: TradingServiceConfig) {
        this.connection = new Connection(
            config.rpcUrl || TRADING_CONFIG.DEFAULT_RPC_URL
        );

        // Initialize SolanaAgentKit
        this.agent = new SolanaAgentKit(
            process.env.SOLANA_PRIVATE_KEY!,
            config.rpcUrl || TRADING_CONFIG.DEFAULT_RPC_URL,
            { OPENAI_API_KEY: process.env.OPENAI_API_KEY! }
        );
    }

    /**
     * Swap tokens using Jupiter aggregator
     * @param params Swap parameters including fromToken, toToken, and amount
     * @returns Promise containing swap transaction signature and amounts
     */
    async swap(params: SwapParams): Promise<SwapResponse> {
        try {
            const outputMint = new PublicKey(params.toToken);
            const inputMint = params.fromToken
                ? new PublicKey(params.fromToken)
                : undefined;
            const slippageBps = params.slippage
                ? params.slippage * 100
                : undefined; // Convert percentage to basis points

            const signature = await this.agent.trade(
                outputMint,
                params.amount,
                inputMint,
                slippageBps
            );

            // For simplicity, we're returning estimated amounts
            // In a production environment, you'd want to fetch the actual amounts from the transaction
            return {
                signature,
                fromAmount: params.amount,
                toAmount: params.amount, // This should be calculated based on actual exchange rate
            };
        } catch (error) {
            elizaLogger.error("Swap failed:", error);
            throw error;
        }
    }

    /**
     * Transfer tokens to another address
     * @param params Transfer parameters including token, recipient, and amount
     * @returns Promise containing transfer transaction signature
     */
    async transfer(params: TransferParams): Promise<TransferResponse> {
        try {
            const recipient = new PublicKey(params.recipient);
            const tokenMint =
                params.token !== "SOL"
                    ? new PublicKey(params.token)
                    : undefined;

            const signature = await this.agent.transfer(
                recipient,
                params.amount,
                tokenMint
            );

            return {
                signature,
                amount: params.amount,
            };
        } catch (error) {
            elizaLogger.error("Transfer failed:", error);
            throw error;
        }
    }

    /**
     * Lend tokens to a lending protocol
     * @param params Lending parameters including token and amount
     * @returns Promise containing lending transaction signature
     */
    async lend(params: LendParams): Promise<LendResponse> {
        try {
            // Implementation here
            throw new Error(
                "Lending functionality not implemented in Solana Agent Kit"
            );
        } catch (error) {
            elizaLogger.error("Lending failed:", error);
            throw error;
        }
    }

    /**
     * Stake SOL to receive jupSOL
     * @param params Staking parameters including amount
     * @returns Promise containing staking transaction signature
     */
    async stake(params: StakeParams): Promise<StakeResponse> {
        try {
            if (params.amount < TRADING_CONFIG.STAKE.MINIMUM_AMOUNT) {
                throw new Error(
                    `Minimum staking amount is ${TRADING_CONFIG.STAKE.MINIMUM_AMOUNT} SOL`
                );
            }

            // Use the agent's stake method
            const signature = await this.agent.stake(params.amount);

            // Get jupSOL balance after staking
            const jupsolMint = new PublicKey(TRADING_CONFIG.TOKENS.JUPSOL);
            const jupsolBalance = await this.agent.getBalance(jupsolMint);

            return {
                signature,
                amount: params.amount,
                jupsolAmount: jupsolBalance,
            };
        } catch (error) {
            elizaLogger.error("Staking failed:", error);
            throw error;
        }
    }
}

export default TradingService;
