# Core Cursor API

> Multi-protocol Cloudflare Worker with Cursor IDE telemetry, AI-powered interventions, and health monitoring

## 🚀 Features

- **Multi-Protocol Support**: REST, WebSocket, JSON-RPC, and MCP (Model Context Protocol)
- **Cursor IDE Telemetry**: Real-time event streaming and session management
- **AI-Powered Interventions**: Workers AI analyzes code patterns and suggests fixes
- **Policy Engine**: Enforce coding standards, detect deprecated APIs, prevent security issues
- **Health Monitoring**: Automated health checks with AI-generated diagnostics
- **Durable Objects**: Hibernatable WebSocket rooms for scalable realtime connections
- **OpenAPI 3.1.0**: Full API documentation with Zod-to-OpenAPI generation
- **Cinematic Frontend**: Landing page, health dashboard, and operations console

## 📦 Installation

```bash
# Install dependencies
npm install

# Create D1 database
npm run db:create

# Update wrangler.jsonc with database_id from output

# Run migrations (local)
npm run db:migrate

# Start development server
npm run dev
```

## 🏗️ Project Structure

```
├── public/                 # Static assets (HTML, CSS, JS)
│   ├── index.html         # Landing page
│   ├── health.html        # Health dashboard
│   ├── operations.html    # Operations console
│   ├── session.html       # Session details with xterm.js
│   ├── nav.html           # Shared navigation
│   ├── styles.css         # Comprehensive styles
│   └── client.js          # Frontend API client
├── src/
│   ├── do/                # Durable Objects
│   │   ├── RoomDO.ts      # General WebSocket room
│   │   └── CursorRoomDO.ts # Cursor session room
│   ├── schemas/           # Zod schemas
│   │   ├── apiSchemas.ts  # REST API schemas
│   │   └── cursorSchemas.ts # Cursor telemetry schemas
│   ├── utils/             # Utilities
│   │   ├── openapi.ts     # OpenAPI 3.1.0 generation
│   │   ├── ws.ts          # WebSocket helpers
│   │   ├── ai.ts          # Workers AI utilities
│   │   ├── db.ts          # D1 + Kysely helpers
│   │   └── security.ts    # CORS & security headers
│   ├── tests/             # Test runner & definitions
│   │   ├── runner.ts      # Test orchestrator
│   │   └── defs.ts        # Built-in health tests
│   ├── cursor/            # Cursor-specific modules
│   │   ├── router.ts      # Cursor REST routes
│   │   ├── rpc.ts         # Cursor RPC methods
│   │   ├── policies.ts    # Policy engine
│   │   └── controllers.ts # Session controllers
│   ├── router.ts          # Main API router
│   ├── rpc.ts             # RPC registry
│   ├── mcp.ts             # MCP router
│   ├── types.ts           # TypeScript types
│   └── index.ts           # Main entry point
├── migrations/            # D1 migrations
│   ├── 0001_init.sql      # Health tests tables
│   └── 0002_cursor.sql    # Cursor telemetry tables
├── tests/
│   └── examples.md        # API usage examples
├── wrangler.jsonc         # Cloudflare Worker config
├── package.json
└── tsconfig.json
```

## 🔧 Configuration

### 1. Set Database ID
After creating the D1 database, update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "cursor-core-db",
    "database_id": "YOUR_DATABASE_ID_HERE"
  }
]
```

### 2. Run Migrations

```bash
# Local
wrangler d1 migrations apply cursor-core-db --local

# Production
wrangler d1 migrations apply cursor-core-db --remote
```

## 🌐 API Endpoints

### Health & Testing
- `GET /api/health` - System health check
- `POST /api/tests/run` - Execute health tests
- `GET /api/tests/session/:id` - Get test results

### Cursor IDE Telemetry
- `POST /api/cursor/session/start` - Start telemetry session
- `POST /api/cursor/session/heartbeat` - Update session
- `POST /api/cursor/event` - Log event
- `POST /api/cursor/intervention/ack` - Acknowledge intervention
- `GET /api/cursor/sessions` - List sessions
- `GET /api/cursor/session/:id` - Get session details

### WebSocket
- `GET /ws?room=:id` - General WebSocket room
- `GET /cursor/ws?sessionId=:id` - Cursor session WebSocket

### RPC
- `POST /rpc` - JSON-RPC 2.0 endpoint
  - `health.runTests`
  - `health.getStatus`
  - `cursor.getSuggestions`
  - `cursor.issueInstruction`
  - `cursor.requestFix`

### MCP
- `GET /mcp/tools` - List available tools
- `POST /mcp/execute` - Execute tool

### Documentation
- `GET /openapi.json` - OpenAPI 3.1.0 JSON
- `GET /openapi.yaml` - OpenAPI 3.1.0 YAML

## 🧪 Testing

See `tests/examples.md` for comprehensive API usage examples including:
- cURL commands for all endpoints
- WebSocket client examples (JavaScript, Python)
- RPC method calls
- MCP tool execution
- Cursor client integration examples

## 🚀 Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy

# Run migrations on production
npm run db:migrate:prod
```

## 🎨 Frontend Dashboards

- **Landing Page**: `/` - Feature overview and documentation
- **Health Dashboard**: `/health.html` - System health and test results
- **Operations Console**: `/operations.html` - Cursor session management
- **Session Details**: `/session.html?id=SESSION_ID` - Live terminal and AI suggestions

## 🤖 Cursor Client Integration

Example Node.js client:

```javascript
import WebSocket from 'ws';

const sessionId = 'your-session-id';
const ws = new WebSocket(`wss://your-worker.workers.dev/cursor/ws?sessionId=${sessionId}`);

ws.on('message', (data) => {
  const message = JSON.parse(data);

  if (message.type === 'intervention') {
    console.log('AI Intervention:', message.instruction);
    // Apply fix or notify user
  }
});
```

Full examples in `tests/examples.md`.

## 📝 Policy Examples

Built-in policies (see `migrations/0002_cursor.sql`):

1. **Deprecated Workers AI Import**: Detect `workers-ai` imports, suggest `env.AI.run`
2. **Outdated OpenAPI**: Detect OpenAPI 3.0.x, recommend 3.1.0
3. **Legacy DO WebSocket**: Block `server.accept()`, require `this.ctx.acceptWebSocket()`
4. **Missing Error Handling**: Advise adding logging to catch blocks
5. **Hardcoded Secrets**: Block hardcoded API keys, enforce environment variables

## 🛠️ Development

```bash
# Start local dev server
npm run dev

# Generate TypeScript types from bindings
npm run types

# Lint and format (if configured)
npm run lint
```

## 📊 Architecture

- **Workers Runtime**: Executes TypeScript code on Cloudflare's edge
- **Durable Objects**: Hibernatable WebSocket rooms (RoomDO, CursorRoomDO)
- **D1 Database**: SQL storage for sessions, events, interventions, test results
- **Workers AI**: LLaMA-3-8B for diagnostics and intervention generation
- **Assets Binding**: Serves static HTML/CSS/JS for frontend

## 🔐 Security

- CORS enabled for `/api/*` and `/cursor/*`
- Security headers (CSP, X-Frame-Options, etc.)
- Sanitized logging (redacts secrets)
- Input validation with Zod schemas

## 📄 License

See LICENSE file.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

For issues or questions, open a GitHub issue or contact the maintainers.

---

**Built with Cloudflare Workers, Durable Objects, D1, Workers AI, Hono, Zod, and Kysely.**
