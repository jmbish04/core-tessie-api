-- vehicles & settings
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_settings (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vehicle_id, key),
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

-- telemetry/state slices
CREATE TABLE IF NOT EXISTS charges (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  battery_level INTEGER,
  charge_rate REAL,
  charging_state TEXT,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS drives (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  odometer REAL,
  latitude REAL,
  longitude REAL,
  speed REAL,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS climates (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  interior_temp REAL,
  exterior_temp REAL,
  is_auto BOOLEAN,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS software_updates (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  version TEXT,
  status TEXT,
  raw JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

-- raw pulls & sync runs
CREATE TABLE IF NOT EXISTS tessie_raw (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT,
  endpoint TEXT NOT NULL,
  status INTEGER,
  payload JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  status TEXT,
  summary TEXT
);

-- verbose logs (full traceability)
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  route TEXT,
  request_id TEXT,
  actor TEXT,
  message TEXT,
  payload JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- energy reports
CREATE TABLE IF NOT EXISTS energy_reports (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  summary JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);

-- agent I/O
CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,         -- user|assistant|system|tool
  content TEXT NOT NULL,
  metadata JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,       -- queued|running|succeeded|failed
  input JSON,
  result JSON,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
