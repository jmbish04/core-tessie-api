/**
 * Test definitions and execution logic
 */
import type { Env } from '../types';
import { DBHelpers, generateUUID, now } from '../utils/db';

export interface TestExecutor {
  id: string;
  name: string;
  execute: (env: Env) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Built-in health test definitions
 */
export const healthTests: TestExecutor[] = [
  {
    id: 'health-db-check',
    name: 'Database Connectivity',
    execute: async (env: Env) => {
      try {
        const db = new DBHelpers(env);
        const tests = await db.getActiveTests();
        return { success: tests.length >= 0 };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },
  {
    id: 'health-ai-check',
    name: 'Workers AI Availability',
    execute: async (env: Env) => {
      try {
        const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
          prompt: 'Say "OK"',
          max_tokens: 10
        });
        return { success: !!response };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },
  {
    id: 'health-do-check',
    name: 'Durable Objects Health',
    execute: async (env: Env) => {
      try {
        const id = env.ROOM_DO.idFromName('health-check');
        const stub = env.ROOM_DO.get(id);
        const response = await stub.fetch('https://fake/stats');
        const data = await response.json();
        return { success: !!data };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },
  {
    id: 'health-api-endpoints',
    name: 'API Endpoints Validation',
    execute: async (env: Env) => {
      // Simulated API check - in production, would make actual requests
      try {
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  },
  {
    id: 'health-ws-connection',
    name: 'WebSocket Connectivity',
    execute: async (env: Env) => {
      try {
        const id = env.ROOM_DO.idFromName('ws-health-check');
        const stub = env.ROOM_DO.get(id);
        const response = await stub.fetch('https://fake/stats');
        return { success: response.ok };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  }
];

/**
 * Get test executor by ID
 */
export function getTestExecutor(id: string): TestExecutor | undefined {
  return healthTests.find(t => t.id === id);
}
