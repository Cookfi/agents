import { elizaLogger } from "@elizaos/core";
import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "solana-agent-kit";
import { TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { TRADING_CONFIG } from "./config";
import type {
    TradingServiceConfig,
    SwapParams,
    SwapResponse,
    TransferParams,
    TransferResponse,
    TokenInfo,
    LendParams,
    LendResponse,
    StakeParams,
    StakeResponse,
} from "./types";

export class TradingService {
    private connection: Connection;
    private agent: SolanaAgentKit;
    private lastRequestTime: number = 0;

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

    private async checkRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (
            timeSinceLastRequest <
            60000 / TRADING_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE
        ) {
            const waitTime =
                60000 / TRADING_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE -
                timeSinceLastRequest;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Swap tokens using Jupiter aggregator
     * @param params Swap parameters including fromToken, toToken, and amount
     * @returns Promise containing swap transaction signature and amounts
     */
    async swap(params: SwapParams): Promise<SwapResponse> {
        await this.checkRateLimit();
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
        await this.checkRateLimit();
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
     * Get token information
     * @param tokenAddress The token's mint address
     * @returns Promise containing token information
     */
    async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
        await this.checkRateLimit();
        try {
            const tokenMint = new PublicKey(tokenAddress);
            const mintInfo = await getMint(this.connection, tokenMint);

            return {
                address: tokenAddress,
                symbol: "Unknown", // We'd need additional integration to get token metadata
                name: "Unknown", // We'd need additional integration to get token metadata
                decimals: mintInfo.decimals,
                supply: Number(mintInfo.supply),
            };
        } catch (error) {
            elizaLogger.error("Get token info failed:", error);
            throw error;
        }
    }

    /**
     * Lend tokens to a lending protocol
     * @param params Lending parameters including token and amount
     * @returns Promise containing lending transaction signature
     */
    async lend(params: LendParams): Promise<LendResponse> {
        await this.checkRateLimit();
        try {
            // Note: Lending functionality might need to be implemented separately
            // as it's not directly available in the base Solana Agent Kit
            throw new Error(
                "Lending functionality not implemented in Solana Agent Kit"
            );
        } catch (error) {
            elizaLogger.error("Lending failed:", error);
            throw error;
        }
    }

    /**
     * Stake tokens
     * @param params Staking parameters including token and amount
     * @returns Promise containing staking transaction signature
     */
    async stake(params: StakeParams): Promise<StakeResponse> {
        await this.checkRateLimit();
        try {
            // Note: Staking functionality might need to be implemented separately
            // as it's not directly available in the base Solana Agent Kit
            throw new Error(
                "Staking functionality not implemented in Solana Agent Kit"
            );
        } catch (error) {
            elizaLogger.error("Staking failed:", error);
            throw error;
        }
    }
}

export default TradingService;
