-- Health and Testing System Tables

CREATE TABLE IF NOT EXISTS test_defs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  severity TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  error_map TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS test_results (
  id TEXT PRIMARY KEY,
  session_uuid TEXT NOT NULL,
  test_fk TEXT NOT NULL REFERENCES test_defs(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pass','fail')),
  error_code TEXT,
  raw TEXT,
  ai_human_readable_error_description TEXT,
  ai_prompt_to_fix_error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_results_session ON test_results(session_uuid);
CREATE INDEX IF NOT EXISTS idx_results_testfk ON test_results(test_fk);
CREATE INDEX IF NOT EXISTS idx_results_finished ON test_results(finished_at);

-- Seed default health tests
INSERT OR IGNORE INTO test_defs (id, name, description, category, severity) VALUES
  ('health-db-check', 'Database Connectivity', 'Verify D1 database is accessible and responsive', 'infrastructure', 'critical'),
  ('health-ai-check', 'Workers AI Availability', 'Verify Workers AI binding is functional', 'infrastructure', 'high'),
  ('health-do-check', 'Durable Objects Health', 'Verify Durable Objects are accessible', 'infrastructure', 'high'),
  ('health-api-endpoints', 'API Endpoints Validation', 'Test critical API endpoints respond correctly', 'api', 'medium'),
  ('health-ws-connection', 'WebSocket Connectivity', 'Verify WebSocket rooms can be created and messaged', 'connectivity', 'medium');
