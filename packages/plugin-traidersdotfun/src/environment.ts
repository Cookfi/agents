import { type IAgentRuntime } from "@elizaos/core";
import { z, ZodError } from "zod";

/**
 * This schema defines required environment settings for the Traidersdotfun plugin
 */
export const traidersdotfunEnvSchema = z.object({
    TRAIDERSDOTFUN_COOKIE_API_KEY: z
        .string()
        .min(1, "Cookie API key is required"),
});

export type TraidersdotfunConfig = z.infer<typeof traidersdotfunEnvSchema>;

/**
 * Validates or constructs a TraidersdotfunConfig object using zod,
 * taking values from the IAgentRuntime or process.env as needed.
 */
export async function validateTraidersdotfunConfig(
    runtime: IAgentRuntime
): Promise<TraidersdotfunConfig> {
    try {
        const traidersdotfunConfig = {
            TRAIDERSDOTFUN_COOKIE_API_KEY:
                runtime.getSetting("TRAIDERSDOTFUN_COOKIE_API_KEY") ||
                process.env.TRAIDERSDOTFUN_COOKIE_API_KEY ||
                "",
        };

        return traidersdotfunEnvSchema.parse(traidersdotfunConfig);
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Traidersdotfun configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
