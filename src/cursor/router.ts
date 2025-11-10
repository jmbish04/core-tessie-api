/**
 * Cursor API REST router
 */
import { Hono } from 'hono';
import type { Env } from '../types';
import {
  startSession,
  updateHeartbeat,
  logEvent,
  acknowledgeIntervention,
  listSessions,
  getSessionDetail
} from './controllers';
import {
  StartSessionRequestSchema,
  HeartbeatRequestSchema,
  LogEventRequestSchema,
  AckInterventionRequestSchema,
  ListSessionsQuerySchema
} from '../schemas/cursorSchemas';

export const cursorRouter = new Hono<{ Bindings: Env }>();

/**
 * POST /api/cursor/session/start
 * Start a new Cursor telemetry session
 */
cursorRouter.post('/session/start', async (c) => {
  try {
    const body = await c.req.json();
    const validated = StartSessionRequestSchema.parse(body);

    const result = await startSession(c.env, validated);

    return c.json({
      sessionId: result.sessionId,
      status: 'active',
      wsUrl: result.wsUrl
    });
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * POST /api/cursor/session/heartbeat
 * Update session heartbeat
 */
cursorRouter.post('/session/heartbeat', async (c) => {
  try {
    const body = await c.req.json();
    const validated = HeartbeatRequestSchema.parse(body);

    await updateHeartbeat(c.env, validated.sessionId, validated.meta);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * POST /api/cursor/event
 * Log a Cursor IDE event
 */
cursorRouter.post('/event', async (c) => {
  try {
    const body = await c.req.json();
    const validated = LogEventRequestSchema.parse(body);

    const result = await logEvent(c.env, validated);

    return c.json({
      eventId: result.eventId,
      interventions: result.interventions
    });
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * POST /api/cursor/intervention/ack
 * Acknowledge an intervention
 */
cursorRouter.post('/intervention/ack', async (c) => {
  try {
    const body = await c.req.json();
    const validated = AckInterventionRequestSchema.parse(body);

    const result = await acknowledgeIntervention(c.env, validated);

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * GET /api/cursor/sessions
 * List Cursor sessions
 */
cursorRouter.get('/sessions', async (c) => {
  try {
    const query = c.req.query();
    const validated = ListSessionsQuerySchema.parse(query);

    const result = await listSessions(c.env, validated);

    return c.json({
      sessions: result.sessions,
      total: result.total,
      limit: validated.limit,
      offset: validated.offset
    });
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * GET /api/cursor/session/:id
 * Get session details
 */
cursorRouter.get('/session/:id', async (c) => {
  try {
    const sessionId = c.req.param('id');
    const result = await getSessionDetail(c.env, sessionId);

    if (!result) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});
