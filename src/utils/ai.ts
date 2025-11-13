/**
 * Workers AI utilities for diagnostics and suggestions
 */
import type { Env } from '../types';

export interface AIAnalysisResult {
  humanReadable: string;
  fixPrompt: string;
  confidence: number;
}

/**
 * Analyze a test failure and generate human-readable error + fix suggestion
 */
export async function analyzeTestFailure(
  env: Env,
  testName: string,
  errorCode: string | null,
  rawError: string | null
): Promise<AIAnalysisResult> {
  try {
    const prompt = `You are a debugging assistant. Analyze this test failure and provide:
1. A concise human-readable explanation of what went wrong
2. A specific fix suggestion or next steps

Test: ${testName}
Error Code: ${errorCode || 'N/A'}
Error Details: ${rawError || 'N/A'}

Respond in JSON format:
{
  "humanReadable": "...",
  "fixPrompt": "...",
  "confidence": 0.0-1.0
}`;

    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 256
    });

    // Parse AI response
    const text = typeof response === 'string' ? response : response.response || '';

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        humanReadable: parsed.humanReadable || 'Failed to analyze error',
        fixPrompt: parsed.fixPrompt || 'Retry the operation',
        confidence: parsed.confidence || 0.5
      };
    }

    // Fallback if JSON parsing fails
    return {
      humanReadable: text.substring(0, 200),
      fixPrompt: 'Check logs and retry',
      confidence: 0.3
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      humanReadable: 'AI analysis unavailable',
      fixPrompt: 'Manual investigation required',
      confidence: 0
    };
  }
}

/**
 * Generate intervention instruction based on policy and event
 */
export async function generateIntervention(
  env: Env,
  policyName: string,
  policyDescription: string,
  eventPayload: any,
  customPrompt?: string
): Promise<{ instruction: string; reasoning: string }> {
  try {
    const prompt = customPrompt || `You are a code quality assistant for Cursor IDE.

Policy: ${policyName}
Description: ${policyDescription}
Event Payload: ${JSON.stringify(eventPayload, null, 2)}

Provide a concise intervention instruction (1-2 sentences) and brief reasoning.
Respond in JSON:
{
  "instruction": "...",
  "reasoning": "..."
}`;

    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 200
    });

    const text = typeof response === 'string' ? response : response.response || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        instruction: parsed.instruction || 'Review and fix the issue',
        reasoning: parsed.reasoning || 'Policy violation detected'
      };
    }

    return {
      instruction: `${policyName}: ${policyDescription}`,
      reasoning: 'Automated policy enforcement'
    };
  } catch (error) {
    console.error('Intervention generation failed:', error);
    return {
      instruction: `Policy violation: ${policyName}`,
      reasoning: policyDescription
    };
  }
}

/**
 * Generate AI suggestions for a Cursor session
 */
export async function generateSessionSuggestions(
  env: Env,
  recentEvents: any[],
  policies: any[]
): Promise<string[]> {
  try {
    const prompt = `Based on the following recent Cursor IDE events, provide 3 helpful suggestions to improve code quality or workflow:

Recent Events:
${JSON.stringify(recentEvents.slice(0, 10), null, 2)}

Active Policies:
${policies.map(p => `- ${p.name}: ${p.description}`).join('\n')}

Respond with a JSON array of 3 concise suggestions:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 300
    });

    const text = typeof response === 'string' ? response : response.response || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    }

    return [
      'Keep error handling consistent',
      'Add type annotations for better type safety',
      'Consider adding tests for new functionality'
    ];
  } catch (error) {
    console.error('Suggestion generation failed:', error);
    return [
      'Review recent changes for potential issues',
      'Ensure proper error handling',
      'Keep code modular and well-documented'
    ];
  }
}

/**
 * Analyze text sentiment or classification
 */
export async function analyzeText(
  env: Env,
  text: string,
  model = '@cf/meta/llama-3-8b-instruct'
): Promise<any> {
  try {
    const response = await env.AI.run(model, {
      prompt: `Analyze the following text and provide insights:\n\n${text}`,
      max_tokens: 512
    });

    return response;
  } catch (error) {
    console.error('Text analysis failed:', error);
    throw new Error('AI analysis failed');
  }
}
