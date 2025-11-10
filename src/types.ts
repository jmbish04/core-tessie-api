/**
 * TypeScript type definitions for Cloudflare Worker environment
 */

export interface Env {
  // Assets binding for static files
  ASSETS: Fetcher;

  // Durable Object bindings
  ROOM_DO: DurableObjectNamespace;
  CURSOR_ROOM_DO: DurableObjectNamespace;

  // D1 Database
  DB: D1Database;

  // Workers AI
  AI: any; // Ai type from @cloudflare/workers-types

  // Environment variables
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
  TESSIE_API_KEY?: string;
}

export interface TestDef {
  id: string;
  name: string;
  description: string;
  category: string | null;
  severity: string | null;
  is_active: number;
  error_map: string | null;
  created_at: string;
}

export interface TestResult {
  id: string;
  session_uuid: string;
  test_fk: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: 'pass' | 'fail';
  error_code: string | null;
  raw: string | null;
  ai_human_readable_error_description: string | null;
  ai_prompt_to_fix_error: string | null;
  created_at: string;
}

export interface CursorSession {
  id: string;
  user: string | null;
  project: string | null;
  started_at: string;
  last_seen_at: string;
  status: 'active' | 'idle' | 'ended' | 'error';
  agent_profile: string | null;
  meta: string | null;
}

export interface CursorEvent {
  id: string;
  session_fk: string;
  ts: string;
  type: string;
  level: string | null;
  payload: string;
  tags: string | null;
}

export interface CursorIntervention {
  id: string;
  session_fk: string;
  rule_id: string;
  fired_at: string;
  decision: 'advise' | 'warn' | 'block' | 'auto-fix';
  ai_reasoning: string | null;
  instruction: string | null;
  delivered: number;
  result: string | null;
}

export interface CursorPolicy {
  id: string;
  name: string;
  description: string;
  is_active: number;
  condition: string;
  action: 'advise' | 'warn' | 'block' | 'auto-fix';
  ai_prompt: string | null;
  created_at: string;
}

export interface RPCMethod {
  name: string;
  handler: (params: any, env: Env) => Promise<any>;
  description?: string;
  schema?: any;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any, env: Env) => Promise<any>;
}
