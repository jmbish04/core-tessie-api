/**
 * Main entry point - Multi-protocol Cloudflare Worker
 * Supports: REST, WebSocket, RPC, MCP, and static assets
 */
import { Hono } from 'hono';
import type { Env } from './types';
import { apiRouter } from './router';
import { cursorRouter } from './cursor/router';
import { mcpRouter } from './mcp';
import { handleRPC } from './rpc';
import { generateOpenAPIJSON, generateOpenAPIYAML } from './utils/openapi';
import { applyCORS, applySecurityHeaders, handlePreflight } from './utils/security';
import { cronHealthCheck } from './tests/runner';

// Export Durable Objects
export { RoomDO } from './do/RoomDO';
export { CursorRoomDO } from './do/CursorRoomDO';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

/**
 * Global CORS middleware for API routes
 */
app.use('/api/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return handlePreflight(c.req);
  }
  await next();
  return applyCORS(c.res, c.req);
});

app.use('/cursor/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return handlePreflight(c.req);
  }
  await next();
  return applyCORS(c.res, c.req);
});

/**
 * OpenAPI documentation endpoints
 */
app.get('/openapi.json', (c) => {
  const doc = generateOpenAPIJSON(c.env);
  return c.json(doc);
});

app.get('/openapi.yaml', (c) => {
  const yaml = generateOpenAPIYAML(c.env);
  return new Response(yaml, {
    headers: {
      'Content-Type': 'application/yaml'
    }
  });
});

/**
 * Mount API routers
 */
app.route('/api', apiRouter);
app.route('/api/cursor', cursorRouter);
app.route('/mcp', mcpRouter);

/**
 * RPC endpoint
 */
app.post('/rpc', async (c) => {
  const response = await handleRPC(c.req.raw, c.env);
  return response;
});

/**
 * General WebSocket endpoint
 */
app.get('/ws', async (c) => {
  const url = new URL(c.req.url);
  const roomId = url.searchParams.get('room') || 'default';

  // Get or create Durable Object for this room
  const id = c.env.ROOM_DO.idFromName(roomId);
  const stub = c.env.ROOM_DO.get(id);

  // Forward request to Durable Object
  return stub.fetch(c.req.raw);
});

/**
 * Cursor WebSocket endpoint
 */
app.get('/cursor/ws', async (c) => {
  const url = new URL(c.req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return c.json({ error: 'Missing sessionId parameter' }, 400);
  }

  // Get or create Durable Object for this Cursor session
  const id = c.env.CURSOR_ROOM_DO.idFromName(sessionId);
  const stub = c.env.CURSOR_ROOM_DO.get(id);

  // Forward request to Durable Object
  return stub.fetch(c.req.raw);
});

/**
 * Fallback to static assets
 */
app.get('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

/**
 * Main fetch handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await app.fetch(request, env, ctx);
      return applySecurityHeaders(response);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Cron trigger handler
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cronHealthCheck(env));
  }
};
