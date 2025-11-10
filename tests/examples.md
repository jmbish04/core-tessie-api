# Core Cursor API - Examples

## Table of Contents
- [REST API Examples](#rest-api-examples)
- [WebSocket Examples](#websocket-examples)
- [RPC Examples](#rpc-examples)
- [MCP Examples](#mcp-examples)
- [Cursor Client Integration](#cursor-client-integration)

## REST API Examples

### Health Check
```bash
curl https://your-worker.workers.dev/api/health
```

### Run Health Tests
```bash
curl -X POST https://your-worker.workers.dev/api/tests/run \
  -H "Content-Type: application/json" \
  -d '{"testIds": ["health-db-check", "health-ai-check"], "async": false}'
```

### Get Test Session Results
```bash
curl https://your-worker.workers.dev/api/tests/session/SESSION_UUID
```

### Start Cursor Session
```bash
curl -X POST https://your-worker.workers.dev/api/cursor/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "project": "/Users/dev/my-project",
    "user": "developer-1",
    "agentProfile": {
      "model": "claude-3-opus",
      "temperature": 0.7
    }
  }'
```

### Log Cursor Event
```bash
curl -X POST https://your-worker.workers.dev/api/cursor/event \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "your-session-id",
    "type": "command",
    "level": "info",
    "payload": {
      "command": "npm install",
      "exitCode": 0
    },
    "tags": ["npm", "install"]
  }'
```

### List Cursor Sessions
```bash
curl "https://your-worker.workers.dev/api/cursor/sessions?status=active&limit=10"
```

### Get Session Details
```bash
curl https://your-worker.workers.dev/api/cursor/session/SESSION_ID
```

## WebSocket Examples

### General WebSocket Connection (JavaScript)
```javascript
const ws = new WebSocket('wss://your-worker.workers.dev/ws?room=my-room');

ws.onopen = () => {
  console.log('Connected');

  // Send a broadcast message
  ws.send(JSON.stringify({
    type: 'broadcast',
    data: { message: 'Hello from client!' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Cursor WebSocket Connection (JavaScript)
```javascript
const sessionId = 'your-session-id';
const ws = new WebSocket(`wss://your-worker.workers.dev/cursor/ws?sessionId=${sessionId}`);

ws.onopen = () => {
  // Send hello message
  ws.send(JSON.stringify({
    type: 'hello',
    data: { version: '1.0.0' }
  }));

  // Send heartbeat every 10 seconds
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      sessionId
    }));
  }, 10000);
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'intervention') {
    console.log('Intervention received:');
    console.log('  Rule:', message.ruleId);
    console.log('  Decision:', message.decision);
    console.log('  Instruction:', message.instruction);

    // Acknowledge intervention
    ws.send(JSON.stringify({
      type: 'ack',
      interventionId: message.id,
      status: 'acknowledged'
    }));
  }
};
```

## RPC Examples

### Call RPC Method (cURL)
```bash
curl -X POST https://your-worker.workers.dev/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "health.runTests",
    "params": {
      "testIds": ["health-db-check"]
    }
  }'
```

### Get Cursor Suggestions
```bash
curl -X POST https://your-worker.workers.dev/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "cursor.getSuggestions",
    "params": {
      "sessionId": "your-session-id"
    }
  }'
```

### Issue Manual Intervention
```bash
curl -X POST https://your-worker.workers.dev/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "cursor.issueInstruction",
    "params": {
      "sessionId": "your-session-id",
      "instruction": "Replace deprecated API usage with the new v2 endpoint"
    }
  }'
```

## MCP Examples

### List MCP Tools
```bash
curl https://your-worker.workers.dev/mcp/tools
```

### Execute MCP Tool
```bash
curl -X POST https://your-worker.workers.dev/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "cursor.getSuggestions",
    "params": {
      "sessionId": "your-session-id"
    }
  }'
```

## Cursor Client Integration

### Node.js Client Example
```javascript
import WebSocket from 'ws';
import fetch from 'node-fetch';

const WORKER_URL = 'https://your-worker.workers.dev';
const WS_URL = 'wss://your-worker.workers.dev';

class CursorTelemetryClient {
  constructor(project, user) {
    this.project = project;
    this.user = user;
    this.sessionId = null;
    this.ws = null;
  }

  async start() {
    // Start session
    const response = await fetch(`${WORKER_URL}/api/cursor/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: this.project,
        user: this.user,
        agentProfile: {
          model: 'claude-3-opus',
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    this.sessionId = data.sessionId;

    // Connect WebSocket
    this.ws = new WebSocket(`${WS_URL}/cursor/ws?sessionId=${this.sessionId}`);

    this.ws.on('open', () => {
      console.log('Connected to Cursor telemetry');
      this.ws.send(JSON.stringify({ type: 'hello', data: { version: '1.0.0' } }));

      // Start heartbeat
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 10000);
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });

    this.ws.on('close', () => {
      console.log('Disconnected from Cursor telemetry');
      clearInterval(this.heartbeatInterval);
    });
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'heartbeat',
        sessionId: this.sessionId
      }));
    }
  }

  logEvent(type, payload, level = 'info', tags = []) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'event',
        data: {
          sessionId: this.sessionId,
          type,
          level,
          payload,
          tags
        }
      }));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'intervention':
        console.log('INTERVENTION:', message.data.instruction);
        console.log('Reasoning:', message.data.aiReasoning);

        // TODO: Apply intervention via Cursor API
        // For now, just acknowledge
        this.acknowledgeIntervention(message.data.id);
        break;

      case 'connected':
        console.log('Session connected:', message.data.sessionId);
        break;

      default:
        console.log('Message:', message);
    }
  }

  acknowledgeIntervention(interventionId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ack',
        data: {
          interventionId,
          status: 'acknowledged'
        }
      }));
    }
  }

  async stop() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
async function main() {
  const client = new CursorTelemetryClient('/Users/dev/my-project', 'developer-1');

  await client.start();

  // Log some events
  client.logEvent('command', { command: 'npm install', exitCode: 0 }, 'info', ['npm']);
  client.logEvent('diff', { file: 'src/index.ts', additions: 10, deletions: 2 }, 'info', ['code']);

  // Keep running
  process.on('SIGINT', async () => {
    await client.stop();
    process.exit();
  });
}

main().catch(console.error);
```

### Python Client Example
```python
import asyncio
import aiohttp
import json
import os

WORKER_URL = os.getenv('WORKER_URL', 'https://your-worker.workers.dev')

async def start_cursor_session(project, user):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f'{WORKER_URL}/api/cursor/session/start',
            json={
                'project': project,
                'user': user,
                'agentProfile': {
                    'model': 'claude-3-opus',
                    'temperature': 0.7
                }
            }
        ) as response:
            data = await response.json()
            return data['sessionId']

async def log_event(session_id, event_type, payload):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f'{WORKER_URL}/api/cursor/event',
            json={
                'sessionId': session_id,
                'type': event_type,
                'level': 'info',
                'payload': payload
            }
        ) as response:
            data = await response.json()
            return data

async def main():
    session_id = await start_cursor_session('/path/to/project', 'developer-1')
    print(f'Started session: {session_id}')

    result = await log_event(session_id, 'command', {
        'command': 'pip install requests',
        'exitCode': 0
    })

    print('Event logged:', result)

if __name__ == '__main__':
    asyncio.run(main())
```

## OpenAPI Documentation
Visit `https://your-worker.workers.dev/openapi.json` to get the full OpenAPI 3.1.0 specification.

## Frontend Dashboards
- **Landing Page:** `https://your-worker.workers.dev/`
- **Health Dashboard:** `https://your-worker.workers.dev/health.html`
- **Operations Dashboard:** `https://your-worker.workers.dev/operations.html`
- **Session Details:** `https://your-worker.workers.dev/session.html?id=SESSION_ID`
