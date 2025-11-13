/**
 * D1 Database utilities with Kysely query builder
 */
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import type { Env, TestDef, TestResult, CursorSession, CursorEvent, CursorIntervention, CursorPolicy } from '../types';

// Database schema interface for Kysely
export interface Database {
  test_defs: TestDef;
  test_results: TestResult;
  cursor_sessions: CursorSession;
  cursor_events: CursorEvent;
  cursor_interventions: CursorIntervention;
  cursor_policies: CursorPolicy;
}

/**
 * Create a Kysely instance for D1
 */
export function createDB(d1: D1Database): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 })
  });
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Query builder helpers
 */
export class DBHelpers {
  private db: Kysely<Database>;

  constructor(env: Env) {
    this.db = createDB(env.DB);
  }

  // Test Definitions
  async getActiveTests(): Promise<TestDef[]> {
    return await this.db
      .selectFrom('test_defs')
      .selectAll()
      .where('is_active', '=', 1)
      .execute();
  }

  async getTestDef(id: string): Promise<TestDef | undefined> {
    return await this.db
      .selectFrom('test_defs')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  // Test Results
  async createTestResult(result: Omit<TestResult, 'created_at'>): Promise<void> {
    await this.db
      .insertInto('test_results')
      .values({ ...result, created_at: now() })
      .execute();
  }

  async getTestResultsBySession(sessionUUID: string): Promise<TestResult[]> {
    return await this.db
      .selectFrom('test_results')
      .selectAll()
      .where('session_uuid', '=', sessionUUID)
      .orderBy('started_at', 'asc')
      .execute();
  }

  async updateTestResult(id: string, updates: Partial<TestResult>): Promise<void> {
    await this.db
      .updateTable('test_results')
      .set(updates)
      .where('id', '=', id)
      .execute();
  }

  // Cursor Sessions
  async createSession(session: Omit<CursorSession, 'id'>): Promise<string> {
    const id = generateUUID();
    await this.db
      .insertInto('cursor_sessions')
      .values({ id, ...session })
      .execute();
    return id;
  }

  async getSession(id: string): Promise<CursorSession | undefined> {
    return await this.db
      .selectFrom('cursor_sessions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async updateSession(id: string, updates: Partial<CursorSession>): Promise<void> {
    await this.db
      .updateTable('cursor_sessions')
      .set(updates)
      .where('id', '=', id)
      .execute();
  }

  async listSessions(filters: {
    status?: string;
    project?: string;
    limit?: number;
    offset?: number;
  }): Promise<CursorSession[]> {
    let query = this.db.selectFrom('cursor_sessions').selectAll();

    if (filters.status) {
      query = query.where('status', '=', filters.status as any);
    }
    if (filters.project) {
      query = query.where('project', '=', filters.project);
    }

    query = query
      .orderBy('last_seen_at', 'desc')
      .limit(filters.limit ?? 50)
      .offset(filters.offset ?? 0);

    return await query.execute();
  }

  // Cursor Events
  async createEvent(event: Omit<CursorEvent, 'id'>): Promise<string> {
    const id = generateUUID();
    await this.db
      .insertInto('cursor_events')
      .values({ id, ...event })
      .execute();
    return id;
  }

  async getEventsBySession(sessionId: string, limit = 100): Promise<CursorEvent[]> {
    return await this.db
      .selectFrom('cursor_events')
      .selectAll()
      .where('session_fk', '=', sessionId)
      .orderBy('ts', 'desc')
      .limit(limit)
      .execute();
  }

  // Cursor Interventions
  async createIntervention(intervention: Omit<CursorIntervention, 'id'>): Promise<string> {
    const id = generateUUID();
    await this.db
      .insertInto('cursor_interventions')
      .values({ id, ...intervention })
      .execute();
    return id;
  }

  async getInterventionsBySession(sessionId: string): Promise<CursorIntervention[]> {
    return await this.db
      .selectFrom('cursor_interventions')
      .selectAll()
      .where('session_fk', '=', sessionId)
      .orderBy('fired_at', 'desc')
      .execute();
  }

  async updateIntervention(id: string, updates: Partial<CursorIntervention>): Promise<void> {
    await this.db
      .updateTable('cursor_interventions')
      .set(updates)
      .where('id', '=', id)
      .execute();
  }

  // Cursor Policies
  async getActivePolicies(): Promise<CursorPolicy[]> {
    return await this.db
      .selectFrom('cursor_policies')
      .selectAll()
      .where('is_active', '=', 1)
      .execute();
  }

  async getPolicy(id: string): Promise<CursorPolicy | undefined> {
    return await this.db
      .selectFrom('cursor_policies')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
