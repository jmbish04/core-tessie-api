import type { Env } from '../types';
import type { TestDef, TestResult } from './db';

/**
 * Analyzes a failed test result using Workers AI to generate a human-readable
 * description of the error and a suggested prompt for fixing it.
 */
export async function analyzeTestFailure(
    env: Env,
    testDef: TestDef,
    testResult: TestResult
): Promise<{ humanReadableError: string; fixSuggestion: string }> {

    if (!env.AI) {
        console.warn("Workers AI binding 'AI' not found. Skipping analysis.");
        return {
            humanReadableError: "AI analysis skipped: AI binding not configured.",
            fixSuggestion: "AI analysis skipped: AI binding not configured."
        };
    }

    // Construct a detailed prompt for the AI model
    const prompt = `
        A health test for our system has failed. Your task is to analyze the failure and provide a clear, concise, human-readable explanation and a suggested fix.

        **Test Details:**
        - **Test Name:** ${testDef.name}
        - **Description:** ${testDef.description}
        - **Severity:** ${testDef.severity}

        **Failure Information:**
        - **Error Code:** ${testResult.error_code || 'N/A'}
        - **Raw Output/Logs:**
        \`\`\`json
        ${testResult.raw}
        \`\`\`

        **Instructions:**
        1.  **Analyze the Failure:** Based on all the provided information, determine the likely root cause of the failure.
        2.  **Generate Human-Readable Error:** Write a brief, one-sentence description of the problem that a non-technical stakeholder can understand.
        3.  **Generate Fix Suggestion:** Write a clear, actionable prompt or series of steps that an engineer could use to begin debugging and fixing this issue.

        **Respond in the following JSON format ONLY:**
        {
          "human_readable_error": "Your one-sentence summary here.",
          "fix_suggestion": "Your detailed fix suggestion for an engineer here."
        }
    `;

    try {
        const response = await env.AI.run('@cf/meta/llama-2-7b-chat-fp16', {
            prompt: prompt,
            stream: false, // We expect a single JSON object
        });

        // The AI response might be a string containing JSON. We need to parse it.
        const responseText = typeof response === 'string' ? response : (response as {response: string}).response;

        // Sometimes the model returns markdown with the JSON, so we need to extract it.
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI response did not contain a valid JSON object.");
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            humanReadableError: parsed.human_readable_error || "AI analysis could not determine the cause.",
            fixSuggestion: parsed.fix_suggestion || "AI could not generate a fix suggestion."
        };

    } catch (error: any) {
        console.error("Error during Workers AI analysis:", error);
        return {
            humanReadableError: "Failed to analyze error with AI.",
            fixSuggestion: `An error occurred during AI analysis: ${error.message}`
        };
    }
}
