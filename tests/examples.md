# Multi-Protocol Cloudflare Worker: Usage Examples

This document provides examples for interacting with the various API surfaces of the worker.

**Note:** Replace `$BASE` with the actual URL of your deployed worker (e.g., `http://localhost:8787` when running `wrangler dev`).

---

## 1. REST API

The REST API provides standard HTTP endpoints for interacting with the service.

### Create a Task

```bash
curl -sX POST "$BASE/api/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"My first task from REST"}' | jq
```

### List Tasks

```bash
curl -s "$BASE/api/tasks" | jq
```

### Run Analysis

```bash
# First, create a task to get a real UUID
TASK_ID=$(curl -sX POST "$BASE/api/tasks" -H 'Content-Type: application/json' -d '{"title":"Task for analysis"}' | jq -r '.task.id')

echo "Analyzing task with ID: $TASK_ID"

curl -sX POST "$BASE/api/analyze" \
  -H 'Content-Type: application/json' \
  -d '{"taskId":"'"$TASK_ID"'","depth":2}' | jq
```

---

## 2. MCP (Model Context Protocol)

The MCP endpoints are designed for AI models or other automated agents.

### List Available Tools

```bash
curl -s "$BASE/mcp/tools" | jq
```

### Execute a Tool

This example executes the `runAnalysis` tool.

```bash
curl -sX POST "$BASE/mcp/execute" \
  -H 'Content-Type: application/json' \
  -d '{"tool":"runAnalysis","params":{"taskId":"00000000-0000-4000-8000-000000000000","depth":2}}' | jq
```

---

## 3. RPC (via HTTP Harness)

The `/rpc` endpoint provides a simple way to invoke RPC methods over HTTP. This is primarily for testing and convenience.

### Create a Task via RPC

```bash
curl -sX POST "$BASE/rpc" \
  -H 'Content-Type: application/json' \
  -d '{"method":"createTask","params":{"title":"My first task from RPC"}}' | jq
```

---

## 4. WebSocket API

The WebSocket API is ideal for real-time, bidirectional communication.

### Browser (Developer Console) Example

Open your browser's developer console on any page and run the following code. Remember to replace the URL with your worker's address.

```javascript
const wsUrl = `wss://${location.hostname}:8787/ws?projectId=my-project`; // Or your deployed worker URL
const ws = new WebSocket(wsUrl.replace('http', 'ws'));

ws.onopen = () => {
  console.log("WebSocket connection established.");
  // Send a message to the room
  ws.send(JSON.stringify({ type: "greeting", payload: "Hello from the browser!" }));
};

ws.onmessage = (event) => {
  console.log("Received message:", event.data);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("WebSocket connection closed.");
};

// To send another message later:
// ws.send(JSON.stringify({ type: "update", payload: "Here is new data." }));
```

### Node.js Example

To run this, you'll need a WebSocket client library like `ws`.

```bash
npm install ws
```

```javascript
// ws-client.js
const WebSocket = require('ws');

const wsUrl = 'ws://localhost:8787/ws?projectId=my-project';
const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('Connected to WebSocket server.');
  ws.send(JSON.stringify({ type: 'greeting', payload: 'Hello from Node.js!' }));
});

ws.on('message', function incoming(data) {
  console.log('Received:', data.toString());
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('Disconnected from WebSocket server.');
});
```

Run the client:

```bash
node ws-client.js
```

---
## 5. RPC from another worker (Service Binding)

To call this worker's RPC methods from another worker, you need to set up a service binding in the calling worker's `wrangler.toml`.

**`wrangler.toml` of the consumer worker:**
```toml
[[services]]
binding = "CORE" # The name to use in `env`
service = "multi-protocol-worker" # The name of this worker
```
**`index.ts` of the consumer worker**
```typescript
interface Env {
    CORE: Service;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const rpcRequest = new Request("https://fake-url/rpc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "createTask",
                params: { title: "Created from another worker!" },
            }),
        });

        const resp = await env.CORE.fetch(rpcRequest);
        const result = await resp.json();

        return Response.json({ success: true, rpcResult: result });
    }
}
```
