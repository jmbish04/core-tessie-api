/**
 * Comprehensive D1 logging utilities for full transparency and observability
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  id?: string;
  timestamp?: string;
  level: LogLevel;
  route?: string;
  method?: string;
  status_code?: number;
  request_id?: string;
  actor?: string;
  message: string;
  payload?: any;
  duration_ms?: number;
  ip_address?: string;
  user_agent?: string;
  error_stack?: string;
  tags?: string[];
}

export interface LogFilter {
  startDate?: string;
  endDate?: string;
  level?: LogLevel;
  route?: string;
  actor?: string;
  keywords?: string;
  limit?: number;
  offset?: number;
}

/**
 * Generate a unique ID for log entries
 */
function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Log an entry to the D1 database
 */
export async function logToD1(db: D1Database, entry: LogEntry): Promise<void> {
  const id = entry.id || generateId();
  const timestamp = entry.timestamp || new Date().toISOString();
  const tags = entry.tags ? entry.tags.join(',') : null;

  try {
    await db.prepare(`
      INSERT INTO logs (
        id, timestamp, level, route, method, status_code,
        request_id, actor, message, payload, duration_ms,
        ip_address, user_agent, error_stack, tags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      timestamp,
      entry.level,
      entry.route || null,
      entry.method || null,
      entry.status_code || null,
      entry.request_id || null,
      entry.actor || null,
      entry.message,
      entry.payload ? JSON.stringify(entry.payload) : null,
      entry.duration_ms || null,
      entry.ip_address || null,
      entry.user_agent || null,
      entry.error_stack || null,
      tags,
      timestamp
    ).run();
  } catch (error) {
    // Fallback to console if D1 logging fails
    console.error('Failed to log to D1:', error);
    console.log('Log entry:', entry);
  }
}

/**
 * Retrieve logs from D1 with filtering
 */
export async function getLogsFromD1(
  db: D1Database,
  filter: LogFilter = {}
): Promise<{ logs: any[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];

  // Date range filtering
  if (filter.startDate) {
    conditions.push('timestamp >= ?');
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    conditions.push('timestamp <= ?');
    params.push(filter.endDate);
  }

  // Level filtering
  if (filter.level) {
    conditions.push('level = ?');
    params.push(filter.level);
  }

  // Route filtering
  if (filter.route) {
    conditions.push('route LIKE ?');
    params.push(`%${filter.route}%`);
  }

  // Actor filtering
  if (filter.actor) {
    conditions.push('actor = ?');
    params.push(filter.actor);
  }

  // Keyword search in message and tags
  if (filter.keywords) {
    conditions.push('(message LIKE ? OR tags LIKE ?)');
    params.push(`%${filter.keywords}%`, `%${filter.keywords}%`);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM logs ${whereClause}`;
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;

  // Get paginated logs
  const limit = filter.limit || 100;
  const offset = filter.offset || 0;

  const logsQuery = `
    SELECT * FROM logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `;

  const logsResult = await db.prepare(logsQuery)
    .bind(...params, limit, offset)
    .all();

  const logs = logsResult.results.map((log: any) => ({
    ...log,
    payload: log.payload ? JSON.parse(log.payload) : null,
    tags: log.tags ? log.tags.split(',') : []
  }));

  return { logs, total };
}

/**
 * Create a logger instance with context
 */
export class Logger {
  constructor(
    private db: D1Database,
    private context: Partial<LogEntry> = {}
  ) {}

  private async log(level: LogLevel, message: string, extra: Partial<LogEntry> = {}) {
    await logToD1(this.db, {
      ...this.context,
      ...extra,
      level,
      message
    });
  }

  async debug(message: string, extra: Partial<LogEntry> = {}) {
    await this.log('DEBUG', message, extra);
  }

  async info(message: string, extra: Partial<LogEntry> = {}) {
    await this.log('INFO', message, extra);
  }

  async warn(message: string, extra: Partial<LogEntry> = {}) {
    await this.log('WARN', message, extra);
  }

  async error(message: string, extra: Partial<LogEntry> = {}) {
    await this.log('ERROR', message, extra);
  }

  async fatal(message: string, extra: Partial<LogEntry> = {}) {
    await this.log('FATAL', message, extra);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<LogEntry>): Logger {
    return new Logger(this.db, { ...this.context, ...context });
  }
}
