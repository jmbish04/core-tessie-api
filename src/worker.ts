/**
 * TypeScript Tessie API Proxy Worker with Hono
 * Full observability, WebSocket support, and comprehensive logging
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Logger, getLogsFromD1, LogFilter } from './logging';
import { generateOpenAPISpec, convertToYAML } from './openapi';
import { TessieClient } from '../src_typescript/TessieClient';
import { flashLights } from '../src_typescript/lights';
import { honkHorn } from '../src_typescript/horn';
import { getState } from '../src_typescript/state';

// Cloudflare Workers bindings
type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  AI: any;
  BUCKET: R2Bucket;
  QUEUE: Queue;
  ANALYTICS_ENGINE: AnalyticsEngineDataset;
  TESSIE_API_KEY?: string;
};

type Variables = {
  logger: Logger;
  requestId: string;
  startTime: number;
  apiKey?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Request ID and timing middleware
app.use('/*', async (c, next) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const startTime = Date.now();
  c.set('requestId', requestId);
  c.set('startTime', startTime);

  // Initialize logger with request context
  const logger = new Logger(c.env.DB, {
    request_id: requestId,
    route: c.req.path,
    method: c.req.method,
    ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
    user_agent: c.req.header('User-Agent'),
  });
  c.set('logger', logger);

  await logger.info(`Request started: ${c.req.method} ${c.req.path}`, {
    tags: ['request', 'start']
  });

  await next();

  const duration = Date.now() - startTime;
  await logger.info(`Request completed: ${c.req.method} ${c.req.path}`, {
    status_code: c.res.status,
    duration_ms: duration,
    tags: ['request', 'end']
  });
});

// Authentication middleware
const authenticate = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  const logger = c.get('logger') as Logger;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logger.warn('Authentication failed: Missing or invalid Authorization header', {
      tags: ['auth', 'failure']
    });
    return c.json({ error: 'Unauthorized: API key required', status: 401 }, 401);
  }

  const apiKey = authHeader.substring(7);
  c.set('apiKey', apiKey);

  await logger.info('Authentication successful', {
    actor: apiKey.substring(0, 8) + '...',
    tags: ['auth', 'success']
  });

  await next();
};

// Routes

// Frontend HTML
app.get('/', async (c) => {
  const logger = c.get('logger') as Logger;
  await logger.info('Serving frontend', { tags: ['frontend'] });

  return c.html(FRONTEND_HTML);
});

// Health check
app.get('/api/health', async (c) => {
  const logger = c.get('logger') as Logger;
  await logger.debug('Health check', { tags: ['health'] });

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get logs with filtering
app.get('/api/logs', authenticate, async (c) => {
  const logger = c.get('logger') as Logger;

  const filter: LogFilter = {
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
    level: c.req.query('level') as any,
    route: c.req.query('route'),
    actor: c.req.query('actor'),
    keywords: c.req.query('keywords'),
    limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 100,
    offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0,
  };

  await logger.info('Fetching logs', { payload: filter, tags: ['logs', 'query'] });

  try {
    const result = await getLogsFromD1(c.env.DB, filter);

    await logger.info(`Retrieved ${result.logs.length} logs`, {
      payload: { total: result.total },
      tags: ['logs', 'success']
    });

    return c.json({
      logs: result.logs,
      total: result.total,
      limit: filter.limit,
      offset: filter.offset
    });
  } catch (error: any) {
    await logger.error('Failed to fetch logs', {
      error_stack: error.stack,
      tags: ['logs', 'error']
    });
    return c.json({ error: 'Failed to fetch logs', status: 500 }, 500);
  }
});

// Vehicle operations

// Honk horn
app.post('/api/vehicle/:vin/honk', authenticate, async (c) => {
  const vin = c.req.param('vin');
  const apiKey = c.get('apiKey') as string;
  const logger = c.get('logger') as Logger;

  await logger.info(`Honking horn for vehicle ${vin}`, {
    payload: { vin },
    tags: ['vehicle', 'honk']
  });

  try {
    const client = new TessieClient(apiKey);
    const result = await honkHorn(client, { vin });

    await logger.info(`Horn honked successfully for ${vin}`, {
      payload: result,
      tags: ['vehicle', 'honk', 'success']
    });

    return c.json({ result });
  } catch (error: any) {
    await logger.error(`Failed to honk horn for ${vin}`, {
      error_stack: error.stack,
      payload: { vin },
      tags: ['vehicle', 'honk', 'error']
    });
    return c.json({ error: error.message, status: 500 }, 500);
  }
});

// Flash lights
app.post('/api/vehicle/:vin/flash', authenticate, async (c) => {
  const vin = c.req.param('vin');
  const apiKey = c.get('apiKey') as string;
  const logger = c.get('logger') as Logger;

  await logger.info(`Flashing lights for vehicle ${vin}`, {
    payload: { vin },
    tags: ['vehicle', 'flash']
  });

  try {
    const client = new TessieClient(apiKey);
    const result = await flashLights(client, { vin });

    await logger.info(`Lights flashed successfully for ${vin}`, {
      payload: result,
      tags: ['vehicle', 'flash', 'success']
    });

    return c.json({ result });
  } catch (error: any) {
    await logger.error(`Failed to flash lights for ${vin}`, {
      error_stack: error.stack,
      payload: { vin },
      tags: ['vehicle', 'flash', 'error']
    });
    return c.json({ error: error.message, status: 500 }, 500);
  }
});

// Get vehicle state
app.get('/api/vehicle/:vin/state', authenticate, async (c) => {
  const vin = c.req.param('vin');
  const apiKey = c.get('apiKey') as string;
  const useCache = c.req.query('use_cache') !== 'false';
  const logger = c.get('logger') as Logger;

  await logger.info(`Getting state for vehicle ${vin}`, {
    payload: { vin, useCache },
    tags: ['vehicle', 'state']
  });

  try {
    const client = new TessieClient(apiKey);
    const result = await getState(client, { vin, useCache });

    await logger.info(`State retrieved successfully for ${vin}`, {
      tags: ['vehicle', 'state', 'success']
    });

    return c.json(result);
  } catch (error: any) {
    await logger.error(`Failed to get state for ${vin}`, {
      error_stack: error.stack,
      payload: { vin },
      tags: ['vehicle', 'state', 'error']
    });
    return c.json({ error: error.message, status: 500 }, 500);
  }
});

// OpenAPI documentation
app.get('/openapi.json', async (c) => {
  const logger = c.get('logger') as Logger;
  await logger.debug('Serving OpenAPI JSON', { tags: ['openapi', 'json'] });

  const spec = generateOpenAPISpec({
    title: 'Tessie API Proxy',
    version: '1.0.0',
    description: 'TypeScript-based Tessie API proxy with comprehensive logging and WebSocket support'
  });

  return c.json(spec);
});

app.get('/openapi.yaml', async (c) => {
  const logger = c.get('logger') as Logger;
  await logger.debug('Serving OpenAPI YAML', { tags: ['openapi', 'yaml'] });

  const spec = generateOpenAPISpec({
    title: 'Tessie API Proxy',
    version: '1.0.0',
    description: 'TypeScript-based Tessie API proxy with comprehensive logging and WebSocket support'
  });

  const yaml = convertToYAML(spec);
  return c.text(yaml, 200, { 'Content-Type': 'application/yaml' });
});

// WebSocket upgrade handler
app.get('/ws', async (c) => {
  const logger = c.get('logger') as Logger;

  // Check authentication
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logger.warn('WebSocket auth failed: Missing API key', {
      tags: ['websocket', 'auth', 'failure']
    });
    return c.json({ error: 'Unauthorized', status: 401 }, 401);
  }

  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  await logger.info('WebSocket connection established', {
    tags: ['websocket', 'connected']
  });

  server.addEventListener('message', async (event: MessageEvent) => {
    await logger.debug('WebSocket message received', {
      payload: { message: event.data },
      tags: ['websocket', 'message']
    });

    // Echo back with timestamp
    server.send(JSON.stringify({
      type: 'echo',
      data: event.data,
      timestamp: new Date().toISOString()
    }));
  });

  server.addEventListener('close', async () => {
    await logger.info('WebSocket connection closed', {
      tags: ['websocket', 'closed']
    });
  });

  server.addEventListener('error', async (event: any) => {
    await logger.error('WebSocket error', {
      error_stack: event.error?.stack,
      tags: ['websocket', 'error']
    });
  });

  // Send initial connection success message
  server.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connection established',
    timestamp: new Date().toISOString()
  }));

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
});

// Frontend HTML with WebSocket monitoring
const FRONTEND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tessie API Proxy - Monitor</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .status {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(255,255,255,0.2);
      font-size: 14px;
      margin-top: 10px;
    }
    .status.connected {
      background: #10b981;
    }
    .status.disconnected {
      background: #ef4444;
    }
    .content {
      padding: 30px;
    }
    .auth-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #374151;
    }
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    .button-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    button {
      padding: 16px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      color: white;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .btn-connect {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .btn-honk {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
    .btn-flash {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    .btn-state {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    }
    .monitor {
      background: #1f2937;
      border-radius: 8px;
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #e5e7eb;
    }
    .log-entry {
      margin-bottom: 8px;
      padding: 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.05);
    }
    .log-time {
      color: #9ca3af;
      margin-right: 10px;
    }
    .log-type {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 10px;
    }
    .log-type.connected {
      background: #10b981;
      color: white;
    }
    .log-type.log {
      background: #3b82f6;
      color: white;
    }
    .log-type.error {
      background: #ef4444;
      color: white;
    }
    .log-type.status {
      background: #8b5cf6;
      color: white;
    }
    .log-message {
      color: #f3f4f6;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Tessie API Proxy Monitor</h1>
      <div class="status disconnected" id="connectionStatus">Disconnected</div>
    </div>

    <div class="content">
      <div class="auth-section">
        <h2 style="margin-bottom: 15px; color: #111827;">Authentication</h2>
        <div class="form-group">
          <label for="apiKey">Tessie API Key</label>
          <input type="password" id="apiKey" placeholder="Enter your Tessie API key">
        </div>
        <div class="form-group">
          <label for="vin">Vehicle VIN</label>
          <input type="text" id="vin" placeholder="Enter your vehicle VIN">
        </div>
      </div>

      <div class="button-group">
        <button class="btn-connect" onclick="connectWebSocket()">Connect WebSocket</button>
        <button class="btn-honk" onclick="honkHorn()" id="btnHonk" disabled>🔊 Honk Horn</button>
        <button class="btn-flash" onclick="flashLights()" id="btnFlash" disabled>💡 Flash Lights</button>
        <button class="btn-state" onclick="getState()" id="btnState" disabled>📊 Get State</button>
      </div>

      <h3 style="margin-bottom: 15px; color: #111827;">Realtime Monitor</h3>
      <div class="monitor" id="monitor">
        <div class="log-entry">
          <span class="log-time">[Waiting for connection...]</span>
        </div>
      </div>
    </div>

    <div class="footer">
      Powered by Cloudflare Workers + Hono |
      <a href="/openapi.json" target="_blank" style="color: #667eea;">OpenAPI JSON</a> |
      <a href="/openapi.yaml" target="_blank" style="color: #667eea;">OpenAPI YAML</a>
    </div>
  </div>

  <script>
    let ws = null;
    let apiKey = '';
    let vin = '';

    function log(type, message, data = null) {
      const monitor = document.getElementById('monitor');
      const entry = document.createElement('div');
      entry.className = 'log-entry';

      const time = new Date().toLocaleTimeString();
      const dataStr = data ? JSON.stringify(data, null, 2) : '';

      entry.innerHTML = \`
        <span class="log-time">[\${time}]</span>
        <span class="log-type \${type}">\${type.toUpperCase()}</span>
        <span class="log-message">\${message}</span>
        \${dataStr ? '<pre style="margin-top: 8px; color: #9ca3af;">' + dataStr + '</pre>' : ''}
      \`;

      monitor.insertBefore(entry, monitor.firstChild);

      // Keep only last 50 entries
      while (monitor.children.length > 50) {
        monitor.removeChild(monitor.lastChild);
      }
    }

    function connectWebSocket() {
      apiKey = document.getElementById('apiKey').value;
      vin = document.getElementById('vin').value;

      if (!apiKey) {
        alert('Please enter your API key');
        return;
      }

      if (!vin) {
        alert('Please enter your vehicle VIN');
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;

      log('status', 'Connecting to WebSocket...', { url: wsUrl });

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        log('connected', 'WebSocket connected successfully!');
        document.getElementById('connectionStatus').textContent = 'Connected';
        document.getElementById('connectionStatus').className = 'status connected';

        // Enable buttons
        document.getElementById('btnHonk').disabled = false;
        document.getElementById('btnFlash').disabled = false;
        document.getElementById('btnState').disabled = false;

        // Send auth
        ws.send(JSON.stringify({ type: 'auth', apiKey }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('log', data.message || 'Message received', data);
        } catch (e) {
          log('log', event.data);
        }
      };

      ws.onerror = (error) => {
        log('error', 'WebSocket error occurred', error);
      };

      ws.onclose = () => {
        log('status', 'WebSocket disconnected');
        document.getElementById('connectionStatus').textContent = 'Disconnected';
        document.getElementById('connectionStatus').className = 'status disconnected';

        // Disable buttons
        document.getElementById('btnHonk').disabled = true;
        document.getElementById('btnFlash').disabled = true;
        document.getElementById('btnState').disabled = true;
      };
    }

    async function honkHorn() {
      if (!apiKey || !vin) return;

      log('status', 'Honking horn...', { vin });

      try {
        const response = await fetch(\`/api/vehicle/\${vin}/honk\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${apiKey}\`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          log('log', '🔊 Horn honked successfully!', data);
        } else {
          log('error', 'Failed to honk horn', data);
        }
      } catch (error) {
        log('error', 'Error honking horn', { error: error.message });
      }
    }

    async function flashLights() {
      if (!apiKey || !vin) return;

      log('status', 'Flashing lights...', { vin });

      try {
        const response = await fetch(\`/api/vehicle/\${vin}/flash\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${apiKey}\`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          log('log', '💡 Lights flashed successfully!', data);
        } else {
          log('error', 'Failed to flash lights', data);
        }
      } catch (error) {
        log('error', 'Error flashing lights', { error: error.message });
      }
    }

    async function getState() {
      if (!apiKey || !vin) return;

      log('status', 'Fetching vehicle state...', { vin });

      try {
        const response = await fetch(\`/api/vehicle/\${vin}/state\`, {
          headers: {
            'Authorization': \`Bearer \${apiKey}\`
          }
        });

        const data = await response.json();

        if (response.ok) {
          log('log', '📊 Vehicle state retrieved', data);
        } else {
          log('error', 'Failed to get vehicle state', data);
        }
      } catch (error) {
        log('error', 'Error getting vehicle state', { error: error.message });
      }
    }
  </script>
</body>
</html>`;

export default app;
