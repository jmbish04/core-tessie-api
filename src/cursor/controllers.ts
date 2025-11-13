/**
 * Cursor session and event controllers
 */
import type { Env } from '../types';
import { DBHelpers, generateUUID, now } from '../utils/db';
import { checkPolicies } from './policies';

/**
 * Start a new Cursor telemetry session
 */
export async function startSession(env: Env, data: {
  sessionId?: string;
  project?: string;
  user?: string;
  agentProfile?: any;
  meta?: any;
}): Promise<{ sessionId: string; wsUrl: string }> {
  const db = new DBHelpers(env);

  const sessionId = data.sessionId || generateUUID();

  await db.createSession({
    id: sessionId,
    user: data.user || null,
    project: data.project || null,
    started_at: now(),
    last_seen_at: now(),
    status: 'active',
    agent_profile: data.agentProfile ? JSON.stringify(data.agentProfile) : null,
    meta: data.meta ? JSON.stringify(data.meta) : null
  });

  // Return WebSocket URL for realtime connection
  const wsUrl = `/cursor/ws?sessionId=${sessionId}`;

  return { sessionId, wsUrl };
}

/**
 * Update session heartbeat
 */
export async function updateHeartbeat(env: Env, sessionId: string, meta?: any): Promise<void> {
  const db = new DBHelpers(env);

  const updates: any = {
    last_seen_at: now()
  };

  if (meta) {
    updates.meta = JSON.stringify(meta);
  }

  await db.updateSession(sessionId, updates);
}

/**
 * Log a Cursor event and check policies
 */
export async function logEvent(env: Env, data: {
  sessionId: string;
  type: string;
  level?: string;
  payload: any;
  tags?: string[];
}): Promise<{ eventId: string; interventions: any[] }> {
  const db = new DBHelpers(env);

  // Create event
  const eventId = await db.createEvent({
    session_fk: data.sessionId,
    ts: now(),
    type: data.type,
    level: data.level || null,
    payload: JSON.stringify(data.payload),
    tags: data.tags ? JSON.stringify(data.tags) : null
  });

  // Check policies
  const interventions = await checkPolicies(env, data.sessionId, data);

  return {
    eventId,
    interventions: interventions.map(i => ({
      id: i.id,
      ruleId: i.rule_id,
      decision: i.decision,
      instruction: i.instruction,
      aiReasoning: i.ai_reasoning
    }))
  };
}

/**
 * Acknowledge an intervention
 */
export async function acknowledgeIntervention(env: Env, data: {
  interventionId: string;
  status: string;
  result?: any;
}): Promise<{ success: boolean; message: string }> {
  const db = new DBHelpers(env);

  await db.updateIntervention(data.interventionId, {
    delivered: 1,
    result: data.result ? JSON.stringify(data.result) : null
  });

  return {
    success: true,
    message: 'Intervention acknowledged'
  };
}

/**
 * List Cursor sessions
 */
export async function listSessions(env: Env, filters: {
  status?: string;
  project?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: any[]; total: number }> {
  const db = new DBHelpers(env);

  const sessions = await db.listSessions(filters);

  // Get event and intervention counts for each session
  const enriched = await Promise.all(
    sessions.map(async (session) => {
      const events = await db.getEventsBySession(session.id, 1);
      const interventions = await db.getInterventionsBySession(session.id);

      return {
        ...session,
        agentProfile: session.agent_profile ? JSON.parse(session.agent_profile) : null,
        meta: session.meta ? JSON.parse(session.meta) : null,
        eventCount: events.length,
        interventionCount: interventions.length
      };
    })
  );

  return {
    sessions: enriched,
    total: enriched.length
  };
}

/**
 * Get session details
 */
export async function getSessionDetail(env: Env, sessionId: string): Promise<any | null> {
  const db = new DBHelpers(env);

  const session = await db.getSession(sessionId);
  if (!session) {
    return null;
  }

  const events = await db.getEventsBySession(sessionId, 50);
  const interventions = await db.getInterventionsBySession(sessionId);

  return {
    session: {
      ...session,
      agentProfile: session.agent_profile ? JSON.parse(session.agent_profile) : null,
      meta: session.meta ? JSON.parse(session.meta) : null
    },
    recentEvents: events.map(e => ({
      ...e,
      payload: JSON.parse(e.payload)
    })),
    interventions: interventions.map(i => ({
      ...i,
      delivered: i.delivered === 1
    }))
  };
}
