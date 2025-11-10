/**
 * Main API router
 */
import { Hono } from 'hono';
import type { Env } from './types';
import { runTests, getTestSession } from './tests/runner';
import { DBHelpers, generateUUID } from './utils/db';
import { analyzeText } from './utils/ai';
import {
  RunTestsRequestSchema,
  CreateTaskRequestSchema,
  AnalyzeRequestSchema
} from './schemas/apiSchemas';

export const apiRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/health
 * System health check
 */
apiRouter.get('/health', async (c) => {
  const db = new DBHelpers(c.env);

  try {
    // Quick health checks
    const testsExist = await db.getActiveTests();
    const dbHealthy = testsExist.length >= 0;

    let aiHealthy = false;
    try {
      await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt: 'OK',
        max_tokens: 1
      });
      aiHealthy = true;
    } catch (e) {
      aiHealthy = false;
    }

    let doHealthy = false;
    try {
      const id = c.env.ROOM_DO.idFromName('health-check');
      const stub = c.env.ROOM_DO.get(id);
      const response = await stub.fetch('https://fake/stats');
      doHealthy = response.ok;
    } catch (e) {
      doHealthy = false;
    }

    const allHealthy = dbHealthy && aiHealthy && doHealthy;
    const status = allHealthy ? 'healthy' : 'degraded';

    // Get recent test metrics
    const recentTests = await db.getTestResultsBySession('latest');
    const passRate = recentTests.length > 0
      ? recentTests.filter(t => t.status === 'pass').length / recentTests.length
      : 0;

    return c.json({
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy,
        ai: aiHealthy,
        durableObjects: doHealthy
      },
      metrics: {
        activeTests: testsExist.length,
        lastTestRun: recentTests[0]?.started_at || null,
        passRate
      }
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        ai: false,
        durableObjects: false
      },
      error: String(error)
    }, 500);
  }
});

/**
 * POST /api/tests/run
 * Execute health tests
 */
apiRouter.post('/tests/run', async (c) => {
  try {
    const body = await c.req.json();
    const validated = RunTestsRequestSchema.parse(body);

    if (validated.async) {
      const sessionId = generateUUID();

      // Run tests in background
      c.executionCtx.waitUntil(runTests(c.env, { sessionId, testIds: validated.testIds }));

      return c.json({
        sessionId,
        status: 'running',
        testsScheduled: validated.testIds?.length || 0
      });
    } else {
      const result = await runTests(c.env, { testIds: validated.testIds });

      return c.json({
        sessionId: result.sessionId,
        status: 'completed',
        testsScheduled: result.summary.total,
        results: result.results,
        summary: result.summary
      });
    }
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * GET /api/tests/session/:sessionId
 * Get test session results
 */
apiRouter.get('/tests/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const result = await getTestSession(c.env, sessionId);

    if (!result) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({
      sessionId: result.sessionId,
      startedAt: result.results[0]?.started_at || null,
      finishedAt: result.results[result.results.length - 1]?.finished_at || null,
      results: result.results.map(r => ({
        id: r.id,
        testName: r.test_fk,
        status: r.status,
        duration: r.duration_ms,
        errorCode: r.error_code,
        aiSuggestion: r.ai_prompt_to_fix_error
      }))
    });
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * POST /api/tasks (example business API)
 * Create a new task
 */
apiRouter.post('/tasks', async (c) => {
  try {
    const body = await c.req.json();
    const validated = CreateTaskRequestSchema.parse(body);

    const task = {
      id: `task-${generateUUID()}`,
      title: validated.title,
      description: validated.description || '',
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return c.json(task, 201);
  } catch (error) {
    return c.json({ error: 'Invalid request', details: String(error) }, 400);
  }
});

/**
 * POST /api/analyze
 * Analyze text with Workers AI
 */
apiRouter.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const validated = AnalyzeRequestSchema.parse(body);

    const result = await analyzeText(
      c.env,
      validated.text,
      validated.model
    );

    return c.json({
      result,
      model: validated.model || '@cf/meta/llama-3-8b-instruct',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Analysis failed', details: String(error) }, 500);
  }
});
