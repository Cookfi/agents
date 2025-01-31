import { type IAgentRuntime } from "@elizaos/core";
import { z, ZodError } from "zod";

/**
 * This schema defines required environment settings for the Cookfi plugin
 */
export const cookfiEnvSchema = z.object({
    COOKFI_COOKIE_API_KEY: z.string().min(1, "Cookie API key is required"),
});

export type CookfiConfig = z.infer<typeof cookfiEnvSchema>;

/**
 * Validates or constructs a CookfiConfig object using zod,
 * taking values from the IAgentRuntime or process.env as needed.
 */
export async function validateCookfiConfig(
    runtime: IAgentRuntime
): Promise<CookfiConfig> {
    try {
        const cookfiConfig = {
            COOKFI_COOKIE_API_KEY:
                runtime.getSetting("COOKFI_COOKIE_API_KEY") ||
                process.env.COOKFI_COOKIE_API_KEY ||
                "",
        };

        return cookfiEnvSchema.parse(cookfiConfig);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Cookfi configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
} 