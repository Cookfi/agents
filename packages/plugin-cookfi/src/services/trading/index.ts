import { elizaLogger } from "@elizaos/core";
import { Connection, PublicKey, SendTransactionError } from "@solana/web3.js";
import { SolanaAgentKit } from "solana-agent-kit";
import { TRADING_CONFIG } from "./config";
import type {
    LendParams,
    LendResponse,
    StakeParams,
    StakeResponse,
    SwapParams,
    SwapResponse,
    TradingServiceConfig,
    TransferParams,
    TransferResponse,
} from "./types";

const SOL_ADDRESS = "So11111111111111111111111111111111111111112";

export class TradingService {
    private connection: Connection;
    private agent: SolanaAgentKit;

    constructor(config: TradingServiceConfig) {
        const privateKeyString = process.env.COOKFI_SOLANA_PRIVATE_KEY;
        if (!privateKeyString) {
            throw new Error("COOKFI_SOLANA_PRIVATE_KEY is required");
        }

        const rpcUrl = process.env.COOKFI_SOLANA_RPC_URL;
        if (!rpcUrl) {
            throw new Error("COOKFI_SOLANA_RPC_URL is required");
        }

        this.connection = new Connection(rpcUrl);

        // Initialize SolanaAgentKit with decoded private key
        this.agent = new SolanaAgentKit(
            privateKeyString,
            rpcUrl,
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
            // Handle SOL address consistently
            const outputMint = new PublicKey(
                params.toToken === "SOL" ? SOL_ADDRESS : params.toToken
            );
            const inputMint = params.fromToken ? new PublicKey(
                params.fromToken === "SOL" ? SOL_ADDRESS : params.fromToken
            ) : undefined;

            // Convert slippage to basis points (1% = 100 basis points)
            const slippageBps = params.slippage ? Math.floor(params.slippage * 100) : 100;

            elizaLogger.log("Executing swap:", {
                outputMint: outputMint.toString(),
                inputMint: inputMint?.toString(),
                inputAmount: params.amount,
                slippageBps
            });

            try {
                const signature = await this.agent.trade(
                    outputMint,
                    params.amount,
                    inputMint,
                    slippageBps
                );

                elizaLogger.log("Swap successful:", signature);

                return {
                    signature,
                    fromAmount: params.amount,
                    toAmount: params.amount
                };
            } catch (error) {
                if (error instanceof SendTransactionError) {
                    const logs = error.logs;
                    elizaLogger.error("Swap transaction failed. Full logs:", logs);
                    
                    // Check for specific error conditions
                    if (logs?.some(log => log.includes("insufficient funds"))) {
                        throw new Error("Insufficient funds for swap");
                    }
                    if (logs?.some(log => log.includes("slippage tolerance exceeded"))) {
                        throw new Error("Price moved too much, try increasing slippage");
                    }
                }
                throw error;
            }
        } catch (error) {
            elizaLogger.error("Swap failed:", {
                error,
                message: error instanceof Error ? error.message : "Unknown error",
                token: params.toToken,
                amount: params.amount
            });
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
