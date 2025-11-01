-- Enhanced logs table with better filtering capabilities
DROP TABLE IF EXISTS logs;

CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level TEXT NOT NULL, -- DEBUG, INFO, WARN, ERROR, FATAL
  route TEXT,
  method TEXT, -- GET, POST, etc.
  status_code INTEGER,
  request_id TEXT,
  actor TEXT, -- API key identifier or user
  message TEXT NOT NULL,
  payload JSON,
  duration_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  error_stack TEXT,
  tags TEXT, -- comma-separated tags for easy filtering
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient filtering
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_route ON logs(route);
CREATE INDEX idx_logs_request_id ON logs(request_id);
CREATE INDEX idx_logs_actor ON logs(actor);
CREATE INDEX idx_logs_created_at ON logs(created_at);

-- Full-text search support for message and tags
CREATE INDEX idx_logs_message ON logs(message);
CREATE INDEX idx_logs_tags ON logs(tags);
