import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaAgentKit } from "solana-agent-kit";
import { TRADING_CONFIG } from "./config";
import LitService from "../lit";
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

export class SolanaAgentKitService {
    private connection: Connection;
    private agent: SolanaAgentKit | null = null;
    private litService: LitService;
    private runtime: IAgentRuntime;

    constructor(config: TradingServiceConfig, runtime: IAgentRuntime) {
        this.connection = new Connection(
            config.rpcUrl || TRADING_CONFIG.DEFAULT_RPC_URL
        );
        this.runtime = runtime;
        this.litService = new LitService(runtime);
    }

    private async initializeAgent() {
        if (this.agent) return;

        try {
            await this.litService.connect();

            // Retrieve the encrypted private key & decryption metadata
            const encryptedKeyBase64 = this.runtime.getSetting(
                "ENCRYPTED_PRIVATE_KEY"
            );
            const accessControlConditions = JSON.parse(
                this.runtime.getSetting("ACCESS_CONTROL_CONDITIONS")
            );
            const dataToEncryptHash = this.runtime.getSetting(
                "DATA_TO_ENCRYPT_HASH"
            );

            if (
                !encryptedKeyBase64 ||
                !accessControlConditions ||
                !dataToEncryptHash
            ) {
                throw new Error(
                    "Missing encryption metadata in runtime settings."
                );
            }

            // Decrypt the private key
            const privateKey = await this.litService.decryptPrivateKey(
                encryptedKeyBase64, // Pass as Base64 string (correct format)
                accessControlConditions,
                dataToEncryptHash
            );

            // Initialize SolanaAgentKit with decrypted key
            this.agent = new SolanaAgentKit(
                privateKey,
                this.runtime.getSetting("SOLANA_RPC_URL"),
                { OPENAI_API_KEY: this.runtime.getSetting("OPENAI_API_KEY") }
            );
        } catch (error) {
            elizaLogger.error("Failed to initialize agent:", error);
            throw error;
        }
    }

    /**
     * Swap tokens using Jupiter aggregator
     * @param params Swap parameters including fromToken, toToken, and amount
     * @returns Promise containing swap transaction signature and amounts
     */
    async swap(params: SwapParams): Promise<SwapResponse> {
        try {
            await this.initializeAgent();
            if (!this.agent) throw new Error("Agent not initialized");

            const outputMint = new PublicKey(params.toToken);
            const inputMint = params.fromToken
                ? new PublicKey(params.fromToken)
                : undefined;
            const slippageBps = params.slippage
                ? params.slippage * 100
                : undefined;

            const signature = await this.agent.trade(
                outputMint,
                params.amount,
                inputMint,
                slippageBps
            );

            return {
                signature,
                fromAmount: params.amount,
                toAmount: params.amount, // Adjust if needed
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
            await this.initializeAgent();
            if (!this.agent) throw new Error("Agent not initialized");

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

            return { signature, amount: params.amount };
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
            await this.initializeAgent();
            if (!this.agent) throw new Error("Agent not initialized");

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
            await this.initializeAgent();
            if (!this.agent) throw new Error("Agent not initialized");

            if (params.amount < TRADING_CONFIG.STAKE.MINIMUM_AMOUNT) {
                throw new Error(
                    `Minimum staking amount is ${TRADING_CONFIG.STAKE.MINIMUM_AMOUNT} SOL`
                );
            }

            const signature = await this.agent.stake(params.amount);
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

export default SolanaAgentKitService;
