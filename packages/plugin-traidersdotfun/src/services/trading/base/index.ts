import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import { elizaLogger } from "@elizaos/core";
import { BASE_TRADING_CONFIG } from "./config";
import type { BaseSwapParams, BaseSwapResponse } from "./types";

export class BaseTradingService {
    private wallet: Wallet | null = null;
    private isConfigured: boolean = false;

    constructor() {
        const apiKeyName = process.env.TRAIDERSDOTFUN_CDP_API_KEY_NAME;
        const privateKey = process.env.TRAIDERSDOTFUN_CDP_PRIVATE_KEY;

        if (!apiKeyName || !privateKey) {
            elizaLogger.warn(
                "Base trading service not configured: TRAIDERSDOTFUN_CDP_API_KEY_NAME and/or TRAIDERSDOTFUN_CDP_PRIVATE_KEY missing"
            );
            return;
        }

        // Initialize CDP SDK
        Coinbase.configure({ apiKeyName, privateKey });
        this.isConfigured = true;
    }

    /**
     * Initialize or retrieve a wallet
     */
    private async getWallet(networkId?: string): Promise<Wallet> {
        if (!this.isConfigured) {
            throw new Error(
                "Base trading service not configured - missing environment variables"
            );
        }

        try {
            if (!this.wallet) {
                this.wallet = await Wallet.create({
                    networkId: networkId || BASE_TRADING_CONFIG.DEFAULT_NETWORK,
                });
            }
            return this.wallet;
        } catch (error) {
            elizaLogger.error("Failed to initialize wallet:", error);
            throw error;
        }
    }

    /**
     * Attempt swap with retries and increasing slippage
     */
    async swapWithRetry(params: BaseSwapParams): Promise<BaseSwapResponse> {
        let retryCount = 0;
        let currentSlippage =
            params.slippage || BASE_TRADING_CONFIG.DEFAULT_SLIPPAGE;
        let lastError: Error | null = null;

        // Check initial slippage is within bounds
        if (currentSlippage > BASE_TRADING_CONFIG.MAX_SLIPPAGE) {
            const error = new Error(
                `Initial slippage ${currentSlippage.toFixed(
                    1
                )}% exceeds maximum allowed ${
                    BASE_TRADING_CONFIG.MAX_SLIPPAGE
                }%`
            );
            elizaLogger.error("Swap failed - slippage too high:", {
                initialSlippage: `${currentSlippage.toFixed(1)}%`,
                maxAllowed: `${BASE_TRADING_CONFIG.MAX_SLIPPAGE}%`,
            });
            throw error;
        }

        while (retryCount < BASE_TRADING_CONFIG.MAX_RETRIES) {
            try {
                elizaLogger.log(
                    `Swap attempt ${retryCount + 1}/${
                        BASE_TRADING_CONFIG.MAX_RETRIES
                    }`,
                    {
                        slippage: `${currentSlippage}%`,
                        fromToken: params.fromToken,
                        toToken: params.toToken,
                        amount: params.amount,
                        network:
                            params.networkId ||
                            BASE_TRADING_CONFIG.DEFAULT_NETWORK,
                    }
                );

                return await this.swap({
                    ...params,
                    slippage: currentSlippage,
                });
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));
                retryCount++;

                elizaLogger.warn(
                    `Swap failed, attempt ${retryCount}/${BASE_TRADING_CONFIG.MAX_RETRIES}`,
                    {
                        error: lastError.message,
                        currentSlippage: `${currentSlippage}%`,
                        nextSlippage: `${Math.min(
                            currentSlippage * 2,
                            BASE_TRADING_CONFIG.MAX_SLIPPAGE
                        )}%`,
                    }
                );

                const nextSlippage = Math.min(
                    currentSlippage * 2,
                    BASE_TRADING_CONFIG.MAX_SLIPPAGE
                );

                if (
                    retryCount >= BASE_TRADING_CONFIG.MAX_RETRIES ||
                    nextSlippage > BASE_TRADING_CONFIG.MAX_SLIPPAGE
                ) {
                    break;
                }

                currentSlippage = nextSlippage;
                await new Promise((resolve) =>
                    setTimeout(resolve, BASE_TRADING_CONFIG.RETRY_DELAY)
                );
            }
        }

        const errorMessage =
            `Swap failed after ${retryCount} attempts. ` +
            `Last error: ${lastError?.message || "Unknown error"}. ` +
            `Final slippage tried: ${currentSlippage.toFixed(1)}%`;

        elizaLogger.error("All swap attempts failed:", {
            attempts: retryCount,
            maxSlippageReached:
                currentSlippage >= BASE_TRADING_CONFIG.MAX_SLIPPAGE,
            lastError: lastError?.message || "Unknown error",
            finalSlippage: `${currentSlippage.toFixed(1)}%`,
        });

        throw new Error(errorMessage);
    }

    /**
     * Execute a token swap on Base network
     */
    async swap(params: BaseSwapParams): Promise<BaseSwapResponse> {
        try {
            const wallet = await this.getWallet(params.networkId);

            elizaLogger.log("Executing Base network swap:", {
                fromToken: params.fromToken,
                toToken: params.toToken,
                amount: params.amount,
                network:
                    params.networkId || BASE_TRADING_CONFIG.DEFAULT_NETWORK,
            });

            // Create and execute trade using CDP SDK
            const trade = await wallet.createTrade({
                amount: params.amount,
                fromAssetId: params.fromToken,
                toAssetId: params.toToken,
            });

            // Wait for trade to complete
            const completedTrade = await trade.wait();

            elizaLogger.log("Base swap successful:", completedTrade);

            return {
                signature: completedTrade.getId() || completedTrade.toString(),
                fromAmount: params.amount,
                toAmount: params.amount, // Actual amount should be retrieved from trade result
                networkId:
                    params.networkId || BASE_TRADING_CONFIG.DEFAULT_NETWORK,
            };
        } catch (error) {
            elizaLogger.error("Base swap failed:", {
                error,
                message:
                    error instanceof Error ? error.message : "Unknown error",
                params,
            });
            throw error;
        }
    }
}

export default BaseTradingService;
