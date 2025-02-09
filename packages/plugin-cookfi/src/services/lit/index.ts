import { elizaLogger, type IAgentRuntime } from "@elizaos/core";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_NETWORK } from "@lit-protocol/constants";
import { AccsDefaultParams } from "@lit-protocol/types";
import { SiweMessage } from "siwe";
import { ethers } from "ethers";

interface AuthSig {
    sig: string;
    derivedVia: string;
    signedMessage: string;
    address: string;
}

interface EncryptResponse {
    ciphertext: string; // Base64-encoded encrypted data
    dataToEncryptHash: string;
}

export class LitService {
    private litNodeClient: LitNodeClient;
    private runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.litNodeClient = new LitNodeClient({
            litNetwork: LIT_NETWORK.DatilTest, // Ensure this is a valid network
            debug: false,
        });
    }

    async connect() {
        try {
            await this.litNodeClient.connect();
        } catch (error) {
            elizaLogger.error("Failed to connect to Lit Protocol:", error);
            throw error;
        }
    }

    private async getAuthSig(): Promise<AuthSig> {
        const privateKey = this.runtime.getSetting("ETH_PRIVATE_KEY") as string;
        if (!privateKey) {
            throw new Error("ETH_PRIVATE_KEY is not set in runtime settings.");
        }

        const wallet = new ethers.Wallet(privateKey);
        const address = await wallet.getAddress();

        const domain = "localhost";
        const origin = "https://localhost/login";
        const statement = "Sign this message to access Lit Protocol";

        const siweMessage = new SiweMessage({
            domain,
            address,
            statement,
            uri: origin,
            version: "1",
            chainId: 1,
            nonce: Math.floor(Math.random() * 1000000).toString(),
        });

        const messageToSign = siweMessage.prepareMessage();
        const signature = await wallet.signMessage(messageToSign);

        return {
            sig: signature,
            derivedVia: "web3.eth.personal.sign",
            signedMessage: messageToSign,
            address: address.toLowerCase(),
        };
    }

    /**
     * Encrypt private key using Lit Protocol
     * @param privateKey The private key to encrypt
     * @returns Encrypted private key and access control conditions
     */
    async encryptPrivateKey(privateKey: string): Promise<{
        encryptedKey: string; // Updated to match EncryptResponse type
        accessControlConditions: AccsDefaultParams[];
        dataToEncryptHash: string;
    }> {
        try {
            const ethAddress = this.runtime.getSetting("ETH_ADDRESS") as string;
            if (!ethAddress) {
                throw new Error("ETH_ADDRESS is not set in runtime settings.");
            }

            const accessControlConditions: AccsDefaultParams[] = [
                {
                    contractAddress: "",
                    standardContractType: "",
                    chain: "ethereum",
                    method: "",
                    parameters: [":userAddress"],
                    returnValueTest: {
                        comparator: "=",
                        value: ethAddress,
                    },
                },
            ];

            const authSig = await this.getAuthSig();
            const dataToEncrypt = new TextEncoder().encode(privateKey);

            const encryptedResponse: EncryptResponse =
                await this.litNodeClient.encrypt({
                    accessControlConditions,
                    dataToEncrypt,
                });

            return {
                encryptedKey: encryptedResponse.ciphertext, // Updated type
                accessControlConditions,
                dataToEncryptHash: encryptedResponse.dataToEncryptHash,
            };
        } catch (error) {
            elizaLogger.error("Failed to encrypt private key:", error);
            throw error;
        }
    }

    /**
     * Decrypt private key using Lit Protocol
     * @param encryptedKey The encrypted private key (Base64 string)
     * @param accessControlConditions The access control conditions
     * @param dataToEncryptHash The hash of the original data before encryption
     * @returns Decrypted private key
     */
    async decryptPrivateKey(
        encryptedKey: string, // Updated to match EncryptResponse type
        accessControlConditions: AccsDefaultParams[],
        dataToEncryptHash: string
    ): Promise<string> {
        try {
            const authSig = await this.getAuthSig();

            const decryptedResponse = await this.litNodeClient.decrypt({
                accessControlConditions,
                chain: "ethereum",
                authSig,
                ciphertext: encryptedKey,
                dataToEncryptHash, // Required for decryption verification
            });

            return new TextDecoder().decode(decryptedResponse.decryptedData); // Corrected return type
        } catch (error) {
            elizaLogger.error("Failed to decrypt private key:", error);
            throw error;
        }
    }
}

export default LitService;
