-- Cursor IDE Telemetry and Intervention Tables

CREATE TABLE IF NOT EXISTS cursor_sessions (
  id TEXT PRIMARY KEY,
  user TEXT,
  project TEXT,
  started_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  agent_profile TEXT,
  meta TEXT
);

CREATE INDEX IF NOT EXISTS idx_cursor_sessions_status ON cursor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cursor_sessions_project ON cursor_sessions(project);

CREATE TABLE IF NOT EXISTS cursor_events (
  id TEXT PRIMARY KEY,
  session_fk TEXT NOT NULL REFERENCES cursor_sessions(id),
  ts TEXT NOT NULL,
  type TEXT NOT NULL,
  level TEXT,
  payload TEXT NOT NULL,
  tags TEXT
);

CREATE INDEX IF NOT EXISTS idx_cursor_events_sess_ts ON cursor_events(session_fk, ts);
CREATE INDEX IF NOT EXISTS idx_cursor_events_type ON cursor_events(type);

CREATE TABLE IF NOT EXISTS cursor_interventions (
  id TEXT PRIMARY KEY,
  session_fk TEXT NOT NULL REFERENCES cursor_sessions(id),
  rule_id TEXT NOT NULL,
  fired_at TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('advise','warn','block','auto-fix')),
  ai_reasoning TEXT,
  instruction TEXT,
  delivered INTEGER NOT NULL DEFAULT 0,
  result TEXT
);

CREATE INDEX IF NOT EXISTS idx_cursor_interventions_session ON cursor_interventions(session_fk);
CREATE INDEX IF NOT EXISTS idx_cursor_interventions_rule ON cursor_interventions(rule_id);

CREATE TABLE IF NOT EXISTS cursor_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  condition TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('advise','warn','block','auto-fix')),
  ai_prompt TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Seed default Cursor policies
INSERT OR IGNORE INTO cursor_policies (id, name, description, condition, action, ai_prompt) VALUES
  (
    'deprecated-workers-ai-import',
    'Deprecated Workers AI Import',
    'Detects usage of deprecated workers-ai or workersai-provider imports',
    'payload LIKE ''%workers-ai%'' OR payload LIKE ''%workersai-provider%''',
    'warn',
    'Suggest replacing deprecated import with env.AI.run and wrangler types for proper Workers AI bindings.'
  ),
  (
    'openapi-version-old',
    'Outdated OpenAPI Version',
    'Detects OpenAPI specs below version 3.1.0',
    'payload LIKE ''%openapi: 3.0%'' OR payload LIKE ''%"openapi":"3.0%''',
    'advise',
    'Recommend upgrading to OpenAPI 3.1.0 and adding operationId to all endpoints for better tooling support.'
  ),
  (
    'legacy-do-websocket',
    'Legacy DO WebSocket API',
    'Detects usage of deprecated server.accept() in Durable Objects',
    'payload LIKE ''%server.accept()%''',
    'block',
    'Replace server.accept() with this.ctx.acceptWebSocket(server) for hibernatable WebSocket support.'
  ),
  (
    'missing-error-handling',
    'Missing Error Handling',
    'Detects try-catch blocks without proper error logging',
    'payload LIKE ''%catch%'' AND payload NOT LIKE ''%console.error%'' AND payload NOT LIKE ''%logger%''',
    'advise',
    'Add proper error logging in catch blocks for better debugging and observability.'
  ),
  (
    'hardcoded-secrets',
    'Hardcoded Secrets Detected',
    'Detects potential hardcoded API keys or secrets',
    'payload LIKE ''%api_key = ""%'' OR payload LIKE ''%secret = ""%'' OR payload LIKE ''%password = ""%''',
    'block',
    'Never hardcode secrets. Use wrangler secret put or environment variables via env bindings.'
  );
