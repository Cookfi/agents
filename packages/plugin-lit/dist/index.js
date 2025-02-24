import { ethers } from 'ethers';
import LitJsSdk from '@lit-protocol/lit-node-client';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import { createSiweMessage, generateAuthSig, LitActionResource } from '@lit-protocol/auth-helpers';
import { composeContext, generateObjectDeprecated, ModelClass } from '@elizaos/core';
import { z } from 'zod';
import { BaseEthereumAddressSchema, NETWORK_CONFIGS } from '@lit-protocol/aw-tool';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// src/actions/helloLit/helloLit.ts

// src/actions/helloLit/helloLitAction.ts
var _litActionCode = async () => {
  console.log(magicNumber);
  try {
    LitActions.setResponse({ response: JSON.stringify({ message: "Hello from Lit Protocol!" }) });
  } catch (error) {
    LitActions.setResponse({ response: error.message });
  }
};
var litActionCode = `(${_litActionCode.toString()})();`;

// src/actions/helloLit/helloLit.ts
var HELLO_LIT_ACTION = {
  name: "hello",
  similes: ["Hello World", "Basic Lit Action"],
  description: "This interacts with Lit",
  validate: async (runtime, message) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const litNodeClient = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        litNetwork: LIT_NETWORK.DatilDev,
        debug: false
      });
      await litNodeClient.connect();
      console.log("Connected to Lit Network");
      const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
      const ethersWallet = new ethers.Wallet(privateKey);
      console.log("Wallet Address:", ethersWallet.address);
      const sessionSignatures = await litNodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + 1e3 * 60 * 10).toISOString(),
        // 10 minutes
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution
          }
        ],
        authNeededCallback: async ({
          uri,
          expiration,
          resourceAbilityRequests
        }) => {
          const toSign = await createSiweMessage({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: ethersWallet.address,
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient
          });
          return await generateAuthSig({
            signer: ethersWallet,
            toSign
          });
        }
      });
      const response = await litNodeClient.executeJs({
        sessionSigs: sessionSignatures,
        code: litActionCode,
        jsParams: {
          magicNumber: 43
          // Example parameter
        }
      });
      console.log("Lit Action Response:", response);
      if (callback) {
        callback({
          text: `Lit Action executed successfully. Response: ${JSON.stringify(response)}`,
          content: {
            success: true,
            response
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in lit action handler:", error);
      if (callback) {
        callback({
          text: `Error executing Lit Action: ${error.message}`,
          content: {
            error: error.message
          }
        });
      }
      throw error;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I'd like to deploy a lit action" }
      },
      {
        user: "{{user2}}",
        content: { text: "Deploying a basic Lit Action", action: "HELLO_LIT_ACTION" }
      }
    ]
  ]
};
var policySchema = z.object({
  type: z.literal("ERC20Transfer"),
  // Policy type must be 'ERC20Transfer'
  version: z.string(),
  // Version of the policy
  erc20Decimals: z.string().refine(
    (val) => {
      try {
        const bn = ethers.BigNumber.from(val);
        return !bn.isNegative() && bn.lte(255);
      } catch {
        return false;
      }
    },
    {
      message: "Invalid amount format. Must be a non-negative integer and not exceed 255."
    }
  ),
  // Number of decimals for the ERC20 token
  maxAmount: z.string().refine(
    (val) => {
      try {
        const bn = ethers.BigNumber.from(val);
        return !bn.isNegative();
      } catch {
        return false;
      }
    },
    { message: "Invalid amount format. Must be a non-negative integer." }
  ),
  allowedTokens: z.array(BaseEthereumAddressSchema),
  // Array of allowed token addresses
  allowedRecipients: z.array(BaseEthereumAddressSchema)
  // Array of allowed recipient addresses
});
function encodePolicy(policy) {
  policySchema.parse(policy);
  return ethers.utils.defaultAbiCoder.encode(
    [
      "tuple(uint8 erc20Decimals, uint256 maxAmount, address[] allowedTokens, address[] allowedRecipients)"
    ],
    [
      {
        erc20Decimals: policy.erc20Decimals,
        maxAmount: ethers.utils.parseUnits(policy.maxAmount, policy.erc20Decimals).toString(),
        allowedTokens: policy.allowedTokens,
        allowedRecipients: policy.allowedRecipients
      }
    ]
  );
}
function decodePolicy(encodedPolicy) {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    [
      "tuple(uint8 erc20Decimals, uint256 maxAmount, address[] allowedTokens, address[] allowedRecipients)"
    ],
    encodedPolicy
  )[0];
  const policy = {
    type: "ERC20Transfer",
    version: "1.0.0",
    erc20Decimals: decoded.erc20Decimals.toString(),
    maxAmount: decoded.maxAmount.toString(),
    allowedTokens: decoded.allowedTokens,
    allowedRecipients: decoded.allowedRecipients
  };
  return policySchema.parse(policy);
}
var ERC20TransferPolicy = {
  type: {},
  // Placeholder for the policy type
  version: "1.0.0",
  // Version of the policy schema
  schema: policySchema,
  // Zod schema for validation
  encode: encodePolicy,
  // Function to encode a policy
  decode: decodePolicy
  // Function to decode a policy
};
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var DEFAULT_CIDS = {
  "datil-dev": {
    tool: "QmUPnnuz8E3wKYG7bCxqnjjhV9anE9uMxHXY4fTv7Z5Y6A",
    defaultPolicy: "QmVHC5cTWE1nzBSzEASULdwfHo1QiYMEr5Ht83anxe6uWB"
  },
  "datil-test": {
    tool: "QmRcwjz5EpUaABPMwhgYwsDsy1noYNYkhr6nC8JqWUPEoy",
    defaultPolicy: "QmVHC5cTWE1nzBSzEASULdwfHo1QiYMEr5Ht83anxe6uWB"
  },
  datil: {
    tool: "QmQ1k3ZzmoPDukAphQ353WJ73XaNFnhmztr1v2hfTprW3V",
    defaultPolicy: "QmVHC5cTWE1nzBSzEASULdwfHo1QiYMEr5Ht83anxe6uWB"
  }
};
var deployedCids = DEFAULT_CIDS;
var ipfsPath = join(__dirname, "../../../dist/ipfs.json");
if (existsSync(ipfsPath)) {
  try {
    const ipfsModule = await import(ipfsPath, { assert: { type: 'json' } });
    deployedCids = ipfsModule.default;
  } catch (error) {
    console.warn("Failed to load ipfs.json, using default CIDs:", error);
  }
} else {
  console.warn(
    "ipfs.json not found. Using default deployed CIDs."
  );
}
var IPFS_CIDS = deployedCids;

// src/actions/tools/erc20transfer/tool.ts
var ERC20TransferLitActionSchema = z.object({
  pkpEthAddress: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)"
  ),
  tokenIn: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum contract address (0x followed by 40 hexadecimal characters)"
  ),
  recipientAddress: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)"
  ),
  amountIn: z.string().regex(
    /^\d*\.?\d+$/,
    'Must be a valid decimal number as a string (e.g. "1.5" or "100")'
  ),
  chainId: z.string().regex(/^\d+$/, "Must be a valid chain ID number as a string"),
  rpcUrl: z.string().url().startsWith(
    "https://",
    "Must be a valid HTTPS URL for the blockchain RPC endpoint"
  )
});
var ERC20TransferLitActionParameterDescriptions = {
  pkpEthAddress: "The Ethereum address of the PKP that will be used to sign and send the transaction.",
  tokenIn: "The Ethereum contract address of the ERC20 token you want to send. Must be a valid Ethereum address starting with 0x.",
  recipientAddress: "The Ethereum wallet address of the recipient who will receive the tokens. Must be a valid Ethereum address starting with 0x.",
  amountIn: `The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted based on the token's decimals.`,
  chainId: "The ID of the blockchain network to send the tokens on (e.g. 1 for Ethereum mainnet, 84532 for Base Sepolia).",
  rpcUrl: 'The RPC URL of the blockchain network to connect to (e.g. "https://base-sepolia-rpc.publicnode.com").'
};
var validateERC20TransferParameters = (params) => {
  const result = ERC20TransferLitActionSchema.safeParse(params);
  if (result.success) {
    return true;
  }
  return result.error.issues.map((issue) => ({
    param: issue.path[0],
    error: issue.message
  }));
};
var createNetworkTool = (network, config) => ({
  name: "ERC20Transfer",
  description: `A Lit Action that sends ERC-20 tokens.`,
  ipfsCid: IPFS_CIDS[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS[network].defaultPolicy,
  parameters: {
    type: {},
    schema: ERC20TransferLitActionSchema,
    descriptions: ERC20TransferLitActionParameterDescriptions,
    validate: validateERC20TransferParameters
  },
  policy: ERC20TransferPolicy
});
var ERC20Transfer = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool(network)
  }),
  {}
);

// src/templates/index.ts
var litWalletTransferTemplate = `
You are an AI assistant specialized in processing Lit Protocol wallet transfer requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested transfer:
1. PKP Ethereum Address (must be a valid Ethereum address)
2. RPC URL (must be a valid URL)
3. Chain ID (must be a valid chain ID)
4. Token Address (must be a valid Ethereum address or null for native token)
5. Recipient Address (must be a valid Ethereum address)
6. Amount to transfer (in tokens, without the symbol)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the PKP Ethereum Address.
   - Quote the part mentioning the RPC URL.
   - Quote the part mentioning the Chain ID.
   - Quote the part mentioning the Token Address.
   - Quote the part mentioning the Recipient Address.
   - Quote the part mentioning the Amount.

2. Validate each piece of information:
   - PKP Ethereum Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - RPC URL: Ensure it is a valid URL.
   - Chain ID: Ensure it is a valid number.
   - Token Address: Check that it starts with "0x" and count the number of characters (should be 42) or set to null for native token.
   - Recipient Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - Amount: Attempt to convert the amount to a number to verify it's valid.

3. If any information is missing or invalid, prepare an appropriate error message.

4. If all information is valid, summarize your findings.

5. Prepare the JSON structure based on your analysis.

After your analysis, provide the final output in a JSON markdown block. All fields are required. The JSON should have this structure:

\`\`\`json
{
    "pkpEthAddress": string,
    "rpcUrl": string,
    "chainId": number,
    "tokenIn": string | null,
    "recipientAddress": string,
    "amountIn": string
}
\`\`\`

Now, process the user's request and provide your response.
`;
var uniswapSwapTemplate = `
You are an AI assistant specialized in processing Uniswap swap requests using the Lit Protocol. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested swap:
1. PKP Ethereum Address (must be a valid Ethereum address)
2. RPC URL (must be a valid URL)
3. Chain ID (must be a valid chain ID)
4. Token In Address (must be a valid Ethereum address)
5. Token Out Address (must be a valid Ethereum address)
6. Amount In (in tokens, without the symbol)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the PKP Ethereum Address.
   - Quote the part mentioning the RPC URL.
   - Quote the part mentioning the Chain ID.
   - Quote the part mentioning the Token In Address.
   - Quote the part mentioning the Token Out Address.
   - Quote the part mentioning the Amount In.

2. Validate each piece of information:
   - PKP Ethereum Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - RPC URL: Ensure it is a valid URL.
   - Chain ID: Ensure it is a valid number.
   - Token In Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - Token Out Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - Amount In: Attempt to convert the amount to a number to verify it's valid.

3. If any information is missing or invalid, prepare an appropriate error message.

4. If all information is valid, summarize your findings.

5. Prepare the JSON structure based on your analysis.

After your analysis, provide the final output in a JSON markdown block. All fields are required. The JSON should have this structure:

\`\`\`json
{
    "pkpEthAddress": string,
    "rpcUrl": string,
    "chainId": number,
    "tokenIn": string,
    "tokenOut": string,
    "amountIn": string
}
\`\`\`

Now, process the user's request and provide your response.
`;
var ecdsaSignTemplate = `
You are an AI assistant specialized in processing ECDSA signing requests using the Lit Protocol. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested signing:
1. PKP Ethereum Address (must be a valid Ethereum address)
2. Message (must be a valid string)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the PKP Ethereum Address.
   - Quote the part mentioning the Message.

2. Validate each piece of information:
   - PKP Ethereum Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - Message: Ensure it is a non-empty string.

3. If any information is missing or invalid, prepare an appropriate error message.

4. If all information is valid, summarize your findings.

5. Prepare the JSON structure based on your analysis.

After your analysis, provide the final output in a JSON markdown block. All fields are required. The JSON should have this structure:

\`\`\`json
{
    "pkpEthAddress": string,
    "message": string
}
\`\`\`

Now, process the user's request and provide your response.
`;
var buildLitWalletTransferDetails = async (state, runtime) => {
  const context = composeContext({
    state,
    template: litWalletTransferTemplate
  });
  const transferDetails = await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL
  });
  return {
    ...transferDetails,
    chainId: transferDetails.chainId.toString()
  };
};
var WALLET_TRANSFER_LIT_ACTION = {
  name: "lit-wallet-transfer",
  similes: ["Lit Wallet Transfer", "Lit Protocol Transfer", "Transfer tokens"],
  description: "This interacts with Lit Protocol to execute a wallet transfer using the ERC20Transfer tool",
  validate: async (runtime, message) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const transferDetails = await buildLitWalletTransferDetails(state, runtime);
      const tool = ERC20Transfer[LIT_NETWORK.DatilDev];
      const validationResult = tool.parameters.validate(transferDetails);
      if (validationResult !== true) {
        const errors = validationResult.map((err) => `${err.param}: ${err.error}`).join(", ");
        throw new Error(`Invalid parameters: ${errors}`);
      }
      const policy = {
        type: "ERC20Transfer",
        version: ERC20TransferPolicy.version,
        erc20Decimals: "18",
        maxAmount: transferDetails.amountIn,
        allowedTokens: [transferDetails.tokenIn],
        allowedRecipients: [transferDetails.recipientAddress]
      };
      ERC20TransferPolicy.schema.parse(policy);
      const encodedPolicy = ERC20TransferPolicy.encode(policy);
      const ipfsCid = IPFS_CIDS["datil-dev"].tool;
      const litNodeClient = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        litNetwork: LIT_NETWORK.DatilDev,
        debug: false
      });
      await litNodeClient.connect();
      const wallet = new ethers.Wallet(runtime.getSetting("EVM_PRIVATE_KEY"));
      const sessionSigs = await litNodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + 1e3 * 60 * 10).toISOString(),
        // 10 minutes
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution
          }
        ],
        authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
          const toSign = await createSiweMessage({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: wallet.address,
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient
          });
          return await generateAuthSig({
            signer: wallet,
            toSign
          });
        }
      });
      const response = await litNodeClient.executeJs({
        sessionSigs,
        ipfsId: ipfsCid,
        jsParams: {
          params: {
            ...transferDetails,
            encodedPolicy
          }
        }
      });
      console.log("ERC20Transfer Response:", response);
      if (callback) {
        callback({
          text: `Token transfer executed successfully. Response: ${JSON.stringify(response)}`,
          content: {
            success: true,
            response
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in ERC20Transfer handler:", error);
      if (callback) {
        callback({
          text: `Error executing token transfer: ${error.message}`,
          content: {
            error: error.message
          }
        });
      }
      throw error;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "please attempt a lit wallet transfer pkp addy: 0xc8BB61FB32cbfDc0534136798099709d779086b4 rpc: https://base-sepolia-rpc.publicnode.com chain ID 84532 token address 0x00cdfea7e11187BEB4a0CE835fea1745b124B26e sending 1 token to 0xDFdC570ec0586D5c00735a2277c21Dcc254B3917" }
      },
      {
        user: "{{user2}}",
        content: { text: "Executing ERC20 token transfer", action: "WALLET_TRANSFER_LIT_ACTION" }
      }
    ]
  ]
};
var policySchema2 = z.object({
  /** The type of policy, must be `SignEcdsa`. */
  type: z.literal("SignEcdsa"),
  /** The version of the policy. */
  version: z.string(),
  /** An array of allowed message prefixes. */
  allowedPrefixes: z.array(z.string())
});
function encodePolicy2(policy) {
  policySchema2.parse(policy);
  return ethers.utils.defaultAbiCoder.encode(
    ["tuple(string[] allowedPrefixes)"],
    [
      {
        allowedPrefixes: policy.allowedPrefixes
      }
    ]
  );
}
function decodePolicy2(encodedPolicy) {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ["tuple(string[] allowedPrefixes)"],
    encodedPolicy
  )[0];
  const policy = {
    type: "SignEcdsa",
    version: "1.0.0",
    allowedPrefixes: decoded.allowedPrefixes
  };
  return policySchema2.parse(policy);
}
var SignEcdsaPolicy = {
  /** The type of the policy. */
  type: {},
  /** The version of the policy. */
  version: "1.0.0",
  /** The schema for validating SignEcdsa policies. */
  schema: policySchema2,
  /** Encodes a SignEcdsa policy into a format suitable for on-chain storage. */
  encode: encodePolicy2,
  /** Decodes a SignEcdsa policy from its on-chain encoded format. */
  decode: decodePolicy2
};
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = dirname(__filename2);
var DEFAULT_CIDS2 = {
  "datil-dev": {
    tool: "QmZJovPgBBBmuLKRtdVwdV47opNSmLiV2AZCNTtWzeog1Q",
    defaultPolicy: "QmPaViiSPUVViC2VkTn3PiRWpkqxnh44BxNY8TcHsuTpJi"
  },
  "datil-test": {
    tool: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
    defaultPolicy: "QmPaViiSPUVViC2VkTn3PiRWpkqxnh44BxNY8TcHsuTpJi"
  },
  datil: {
    tool: "QmPjxnXWSPYGYR2gZyiZHpRE7dMAeb7K181R4Cfvkw5KM8",
    defaultPolicy: "QmPaViiSPUVViC2VkTn3PiRWpkqxnh44BxNY8TcHsuTpJi"
  }
};
var deployedCids2 = DEFAULT_CIDS2;
var ipfsPath2 = join(__dirname2, "../../../dist/ipfs.json");
if (existsSync(ipfsPath2)) {
  try {
    const ipfsModule = await import(ipfsPath2, { assert: { type: 'json' } });
    deployedCids2 = ipfsModule.default;
  } catch (error) {
    console.warn("Failed to load ipfs.json, using default CIDs:", error);
  }
} else {
  console.warn(
    "ipfs.json not found. Using default CIDs. You should run `npx nx deploy:lit-action` to update the ipfs.json files."
  );
}
var IPFS_CIDS2 = deployedCids2;

// src/actions/tools/ecdsaSign/tool.ts
var SignEcdsaLitActionSchema = z.object({
  pkpEthAddress: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)"
  ),
  message: z.string()
});
var SignEcdsaLitActionParameterDescriptions = {
  pkpEthAddress: "The Ethereum address of the PKP that will be used to sign the message.",
  message: "The message you want to sign."
};
var validateSignEcdsaParameters = (params) => {
  const result = SignEcdsaLitActionSchema.safeParse(params);
  if (result.success) {
    return true;
  }
  return result.error.issues.map((issue) => ({
    param: issue.path[0],
    error: issue.message
  }));
};
var createNetworkTool2 = (network, config) => ({
  name: "SignEcdsa",
  description: `A Lit Action that signs a message with an allowlist of message prefixes.`,
  ipfsCid: IPFS_CIDS2[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS2[network].defaultPolicy,
  parameters: {
    type: {},
    schema: SignEcdsaLitActionSchema,
    descriptions: SignEcdsaLitActionParameterDescriptions,
    validate: validateSignEcdsaParameters
  },
  policy: SignEcdsaPolicy
});
var SignEcdsa = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool2(network)
  }),
  {}
);
var buildEcdsaSignDetails = async (state, runtime) => {
  const context = composeContext({
    state,
    template: ecdsaSignTemplate
    // Use the ECDSA signing template
  });
  const signDetails = await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL
  });
  return signDetails;
};
var ECDSA_SIGN_LIT_ACTION = {
  name: "ecdsa-sign",
  similes: ["ECDSA Sign", "Sign Message", "Execute ECDSA Sign"],
  description: "This interacts with Lit Protocol to sign a message using the SignEcdsa tool.",
  validate: async (runtime, message) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const signDetails = await buildEcdsaSignDetails(state, runtime);
      const tool = SignEcdsa[LIT_NETWORK.DatilDev];
      const validationResult = tool.parameters.validate(signDetails);
      if (validationResult !== true) {
        const errors = validationResult.map((err) => `${err.param}: ${err.error}`).join(", ");
        throw new Error(`Invalid parameters: ${errors}`);
      }
      const policy = {
        type: "SignEcdsa",
        version: SignEcdsaPolicy.version,
        allowedMessages: [signDetails.message]
        // Allow only the specific message to be signed
      };
      SignEcdsaPolicy.schema.parse(policy);
      const encodedPolicy = SignEcdsaPolicy.encode(policy);
      const ipfsCid = IPFS_CIDS2["datil-dev"].tool;
      const litNodeClient = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        litNetwork: LIT_NETWORK.DatilDev,
        debug: false
      });
      await litNodeClient.connect();
      const wallet = new ethers.Wallet(runtime.getSetting("EVM_PRIVATE_KEY"));
      const sessionSigs = await litNodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + 1e3 * 60 * 10).toISOString(),
        // 10 minutes
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution
          }
        ],
        authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
          const toSign = await createSiweMessage({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: wallet.address,
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient
          });
          return await generateAuthSig({
            signer: wallet,
            toSign
          });
        }
      });
      const response = await litNodeClient.executeJs({
        sessionSigs,
        ipfsId: ipfsCid,
        jsParams: {
          params: {
            ...signDetails,
            encodedPolicy
          }
        }
      });
      console.log("ECDSA Sign Response:", response);
      if (callback) {
        callback({
          text: `Message signed successfully. Response: ${JSON.stringify(response)}`,
          content: {
            success: true,
            response
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in ECDSA Sign handler:", error);
      if (callback) {
        callback({
          text: `Error signing message: ${error.message}`,
          content: {
            error: error.message
          }
        });
      }
      throw error;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "please sign the message 'Hello, world!' with PKP address 0xc8BB61FB32cbfDc0534136798099709d779086b4" }
      },
      {
        user: "{{user2}}",
        content: { text: "Executing ECDSA sign", action: "ECDSA_SIGN_LIT_ACTION" }
      }
    ]
  ]
};
var policySchema3 = z.object({
  type: z.literal("UniswapSwap"),
  // Policy type must be 'UniswapSwap'
  version: z.string(),
  // Version of the policy
  maxAmount: z.string().refine(
    (val) => {
      try {
        const bn = ethers.BigNumber.from(val);
        return !bn.isNegative();
      } catch {
        return false;
      }
    },
    { message: "Invalid amount format. Must be a non-negative integer." }
  ),
  allowedTokens: z.array(BaseEthereumAddressSchema)
  // Array of allowed token addresses
});
function encodePolicy3(policy) {
  policySchema3.parse(policy);
  return ethers.utils.defaultAbiCoder.encode(
    ["tuple(uint256 maxAmount, address[] allowedTokens)"],
    [
      {
        maxAmount: policy.maxAmount,
        allowedTokens: policy.allowedTokens
      }
    ]
  );
}
function decodePolicy3(encodedPolicy) {
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ["tuple(uint256 maxAmount, address[] allowedTokens)"],
    encodedPolicy
  )[0];
  const policy = {
    type: "UniswapSwap",
    version: "1.0.0",
    maxAmount: decoded.maxAmount.toString(),
    allowedTokens: decoded.allowedTokens
  };
  return policySchema3.parse(policy);
}
var UniswapSwapPolicy = {
  type: {},
  // Placeholder for the policy type
  version: "1.0.0",
  // Version of the policy schema
  schema: policySchema3,
  // Zod schema for validation
  encode: encodePolicy3,
  // Function to encode a policy
  decode: decodePolicy3
  // Function to decode a policy
};
var __filename3 = fileURLToPath(import.meta.url);
var __dirname3 = dirname(__filename3);
var DEFAULT_CIDS3 = {
  "datil-dev": {
    tool: "QmQPUjXmFiAe363TYAiv3DPciyTDSFLym2S9FR1d78ZRWs",
    defaultPolicy: "Qmc6RAbV3WAqfNLvkAxp4hYjd4TDim4PwjWyhGbM9X7nbR"
  },
  "datil-test": {
    tool: "QmaLAZCJEk5B4BW962pjENxCDHvwGtPptCamhckk9GJxJe",
    defaultPolicy: "Qmc6RAbV3WAqfNLvkAxp4hYjd4TDim4PwjWyhGbM9X7nbR"
  },
  datil: {
    tool: "QmStLtPzAvyUAQXbkUorZUJ7mgst6tU4xhJoFYHMZp9etH",
    defaultPolicy: "Qmc6RAbV3WAqfNLvkAxp4hYjd4TDim4PwjWyhGbM9X7nbR"
  }
};
var deployedCids3 = DEFAULT_CIDS3;
var ipfsPath3 = join(__dirname3, "../../../dist/ipfs.json");
if (existsSync(ipfsPath3)) {
  try {
    const ipfsModule = await import(ipfsPath3, { assert: { type: 'json' } });
    deployedCids3 = ipfsModule.default;
  } catch (error) {
    console.warn("Failed to load ipfs.json, using default CIDs:", error);
  }
} else {
  console.warn(
    "ipfs.json not found. Using default CIDs. You should run `npx nx deploy:lit-action` to update the ipfs.json files."
  );
}
var IPFS_CIDS3 = deployedCids3;

// src/actions/tools/uniswapSwap/tool.ts
var UniswapSwapLitActionSchema = z.object({
  pkpEthAddress: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum address (0x followed by 40 hexadecimal characters)"
  ),
  tokenIn: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum contract address (0x followed by 40 hexadecimal characters)"
  ),
  tokenOut: z.string().regex(
    /^0x[a-fA-F0-9]{40}$/,
    "Must be a valid Ethereum contract address (0x followed by 40 hexadecimal characters)"
  ),
  amountIn: z.string().regex(
    /^\d*\.?\d+$/,
    'Must be a valid decimal number as a string (e.g. "1.5" or "100")'
  ),
  chainId: z.string().regex(/^\d+$/, "Must be a valid chain ID number as a string"),
  rpcUrl: z.string().url().startsWith(
    "https://",
    "Must be a valid HTTPS URL for the blockchain RPC endpoint"
  )
});
var UniswapSwapLitActionParameterDescriptions = {
  pkpEthAddress: "The Ethereum address of the PKP that will be used to sign the transaction.",
  tokenIn: "The Ethereum contract address of the ERC20 token you want to send. Must be a valid Ethereum address starting with 0x.",
  tokenOut: "The Ethereum contract address of the ERC20 token you want to receive. Must be a valid Ethereum address starting with 0x.",
  amountIn: `The amount of tokens to send, specified as a string. This should be a decimal number (e.g. "1.5" or "100"). The amount will be automatically adjusted based on the token's decimals.`,
  chainId: "The ID of the blockchain network to send the tokens on (e.g. 1 for Ethereum mainnet, 84532 for Base Sepolia).",
  rpcUrl: 'The RPC URL of the blockchain network to connect to (e.g. "https://base-sepolia-rpc.publicnode.com").'
};
var validateUniswapSwapParameters = (params) => {
  const result = UniswapSwapLitActionSchema.safeParse(params);
  if (result.success) {
    return true;
  }
  return result.error.issues.map((issue) => ({
    param: issue.path[0],
    error: issue.message
  }));
};
var createNetworkTool3 = (network, config) => ({
  name: "UniswapSwap",
  description: `A Lit Action that swaps tokens on Uniswap.`,
  ipfsCid: IPFS_CIDS3[network].tool,
  defaultPolicyIpfsCid: IPFS_CIDS3[network].defaultPolicy,
  parameters: {
    type: {},
    schema: UniswapSwapLitActionSchema,
    descriptions: UniswapSwapLitActionParameterDescriptions,
    validate: validateUniswapSwapParameters
  },
  policy: UniswapSwapPolicy
});
var UniswapSwap = Object.entries(NETWORK_CONFIGS).reduce(
  (acc, [network, config]) => ({
    ...acc,
    [network]: createNetworkTool3(network)
  }),
  {}
);
var buildUniswapSwapDetails = async (state, runtime) => {
  const context = composeContext({
    state,
    template: uniswapSwapTemplate
    // Use the Uniswap swap template
  });
  const swapDetails = await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL
  });
  return swapDetails;
};
var UNISWAP_SWAP_LIT_ACTION = {
  name: "uniswap-swap",
  similes: ["Uniswap Swap", "Swap Tokens", "Execute Uniswap Swap"],
  description: "This interacts with Lit Protocol to execute a Uniswap swap using the UniswapSwap tool.",
  validate: async (runtime, message) => {
    const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  handler: async (runtime, message, state, options, callback) => {
    try {
      const swapDetails = await buildUniswapSwapDetails(state, runtime);
      const tool = UniswapSwap[LIT_NETWORK.DatilDev];
      const validationResult = tool.parameters.validate(swapDetails);
      if (validationResult !== true) {
        const errors = validationResult.map((err) => `${err.param}: ${err.error}`).join(", ");
        throw new Error(`Invalid parameters: ${errors}`);
      }
      const policy = {
        type: "UniswapSwap",
        version: UniswapSwapPolicy.version,
        tokenIn: swapDetails.tokenIn,
        tokenOut: swapDetails.tokenOut,
        amountIn: swapDetails.amountIn,
        maxSlippage: "0.5"
        // Example slippage tolerance (0.5%)
      };
      UniswapSwapPolicy.schema.parse(policy);
      const encodedPolicy = UniswapSwapPolicy.encode(policy);
      const ipfsCid = IPFS_CIDS3["datil-dev"].tool;
      const litNodeClient = new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        litNetwork: LIT_NETWORK.DatilDev,
        debug: false
      });
      await litNodeClient.connect();
      const wallet = new ethers.Wallet(runtime.getSetting("EVM_PRIVATE_KEY"));
      const sessionSigs = await litNodeClient.getSessionSigs({
        chain: "ethereum",
        expiration: new Date(Date.now() + 1e3 * 60 * 10).toISOString(),
        // 10 minutes
        resourceAbilityRequests: [
          {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution
          }
        ],
        authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
          const toSign = await createSiweMessage({
            uri,
            expiration,
            resources: resourceAbilityRequests,
            walletAddress: wallet.address,
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient
          });
          return await generateAuthSig({
            signer: wallet,
            toSign
          });
        }
      });
      const response = await litNodeClient.executeJs({
        sessionSigs,
        ipfsId: ipfsCid,
        jsParams: {
          params: {
            ...swapDetails,
            encodedPolicy
          }
        }
      });
      console.log("UniswapSwap Response:", response);
      if (callback) {
        callback({
          text: `Uniswap swap executed successfully. Response: ${JSON.stringify(response)}`,
          content: {
            success: true,
            response
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error in UniswapSwap handler:", error);
      if (callback) {
        callback({
          text: `Error executing Uniswap swap: ${error.message}`,
          content: {
            error: error.message
          }
        });
      }
      throw error;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "please attempt a Uniswap swap pkp addy: 0xc8BB61FB32cbfDc0534136798099709d779086b4 rpc: https://base-sepolia-rpc.publicnode.com chain ID 84532 tokenIn address 0x00cdfea7e11187BEB4a0CE835fea1745b124B26e tokenOut address 0xDFdC570ec0586D5c00735a2277c21Dcc254B3917 amountIn 1" }
      },
      {
        user: "{{user2}}",
        content: { text: "Executing Uniswap swap", action: "UNISWAP_SWAP_LIT_ACTION" }
      }
    ]
  ]
};

// src/index.ts
var litPlugin = {
  name: "lit",
  description: "Lit Protocol integration plugin",
  providers: [],
  evaluators: [],
  services: [],
  actions: [
    WALLET_TRANSFER_LIT_ACTION,
    HELLO_LIT_ACTION,
    ECDSA_SIGN_LIT_ACTION,
    UNISWAP_SWAP_LIT_ACTION
  ]
};
var index_default = litPlugin;

export { ECDSA_SIGN_LIT_ACTION, HELLO_LIT_ACTION, UNISWAP_SWAP_LIT_ACTION, WALLET_TRANSFER_LIT_ACTION, index_default as default, litPlugin };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map