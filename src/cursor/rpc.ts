/**
 * Cursor RPC methods for interventions and corrective actions
 */
import type { Env, RPCMethod } from '../types';
import { DBHelpers } from '../utils/db';
import { generateSessionSuggestions } from '../utils/ai';

export const cursorRPCMethods: RPCMethod[] = [
  {
    name: 'cursor.issueInstruction',
    description: 'Issue a manual instruction to a Cursor session',
    async handler(params: { sessionId: string; instruction: string }, env: Env) {
      // Push instruction to session via Durable Object
      const id = env.CURSOR_ROOM_DO.idFromName(params.sessionId);
      const stub = env.CURSOR_ROOM_DO.get(id);

      await stub.fetch('https://fake/push-intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          ruleId: 'manual-intervention',
          decision: 'advise',
          instruction: params.instruction,
          aiReasoning: 'Manual instruction from operator'
        })
      });

      return { success: true, message: 'Instruction delivered' };
    }
  },
  {
    name: 'cursor.getSuggestions',
    description: 'Get AI-generated suggestions for a session',
    async handler(params: { sessionId: string }, env: Env) {
      const db = new DBHelpers(env);

      const events = await db.getEventsBySession(params.sessionId, 20);
      const policies = await db.getActivePolicies();

      const suggestions = await generateSessionSuggestions(
        env,
        events.map(e => ({ ...e, payload: JSON.parse(e.payload) })),
        policies
      );

      return { sessionId: params.sessionId, suggestions };
    }
  },
  {
    name: 'cursor.requestFix',
    description: 'Request AI to generate a fix for a specific issue',
    async handler(params: { sessionId: string; issue: string }, env: Env) {
      // Use Workers AI to generate fix suggestion
      const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt: `Generate a concise fix for this issue in Cursor IDE:\n\n${params.issue}\n\nProvide a step-by-step solution.`,
        max_tokens: 300
      });

      const fix = typeof response === 'string' ? response : response.response || 'Unable to generate fix';

      return {
        sessionId: params.sessionId,
        issue: params.issue,
        suggestedFix: fix
      };
    }
  }
];
