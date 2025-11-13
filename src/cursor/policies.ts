/**
 * Cursor policy engine - evaluate rules and generate interventions
 */
import type { Env, CursorIntervention } from '../types';
import { DBHelpers, generateUUID, now } from '../utils/db';
import { generateIntervention } from '../utils/ai';

/**
 * Evaluate event payload against active policies
 */
export async function checkPolicies(
  env: Env,
  sessionId: string,
  eventData: any
): Promise<CursorIntervention[]> {
  const db = new DBHelpers(env);
  const policies = await db.getActivePolicies();
  const interventions: CursorIntervention[] = [];

  for (const policy of policies) {
    const matches = await evaluateCondition(policy.condition, eventData);

    if (matches) {
      // Generate AI-powered intervention
      const { instruction, reasoning } = await generateIntervention(
        env,
        policy.name,
        policy.description,
        eventData.payload,
        policy.ai_prompt || undefined
      );

      // Create intervention record
      const interventionId = await db.createIntervention({
        session_fk: sessionId,
        rule_id: policy.id,
        fired_at: now(),
        decision: policy.action as any,
        ai_reasoning: reasoning,
        instruction,
        delivered: 0,
        result: null
      });

      // Fetch the created intervention
      const intervention = await db.getInterventionsBySession(sessionId);
      const created = intervention.find(i => i.id === interventionId);

      if (created) {
        interventions.push(created);
      }
    }
  }

  return interventions;
}

/**
 * Evaluate policy condition against event data
 * Simple SQL LIKE-based matching for now
 */
async function evaluateCondition(condition: string, eventData: any): Promise<boolean> {
  try {
    const payload = JSON.stringify(eventData.payload || eventData);

    // Parse simple SQL LIKE conditions
    // Example: "payload LIKE '%workers-ai%'"
    const likeMatch = condition.match(/payload LIKE '([^']+)'/i);

    if (likeMatch) {
      const pattern = likeMatch[1];
      const regexPattern = pattern
        .replace(/%/g, '.*')
        .replace(/_/g, '.');

      const regex = new RegExp(regexPattern, 'i');
      return regex.test(payload);
    }

    // Compound OR conditions
    if (condition.includes(' OR ')) {
      const parts = condition.split(' OR ');
      for (const part of parts) {
        if (await evaluateCondition(part.trim(), eventData)) {
          return true;
        }
      }
      return false;
    }

    // Default: no match
    return false;
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}
