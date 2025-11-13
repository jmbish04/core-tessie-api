/**
 * RPC registry and dispatcher
 */
import type { Env, RPCMethod } from './types';
import { cursorRPCMethods } from './cursor/rpc';
import { runTests } from './tests/runner';
import { DBHelpers } from './utils/db';

// Combine all RPC methods
const allRPCMethods: RPCMethod[] = [
  ...cursorRPCMethods,
  {
    name: 'health.runTests',
    description: 'Run health tests via RPC',
    async handler(params: { testIds?: string[] }, env: Env) {
      const result = await runTests(env, { testIds: params.testIds });
      return {
        sessionId: result.sessionId,
        summary: result.summary
      };
    }
  },
  {
    name: 'health.getStatus',
    description: 'Get system health status',
    async handler(params: {}, env: Env) {
      const db = new DBHelpers(env);
      const tests = await db.getActiveTests();

      return {
        status: 'healthy',
        activeTests: tests.length,
        timestamp: new Date().toISOString()
      };
    }
  }
];

/**
 * RPC method registry
 */
export class RPCRegistry {
  private methods: Map<string, RPCMethod> = new Map();

  constructor() {
    for (const method of allRPCMethods) {
      this.methods.set(method.name, method);
    }
  }

  get(name: string): RPCMethod | undefined {
    return this.methods.get(name);
  }

  list(): RPCMethod[] {
    return Array.from(this.methods.values());
  }

  async execute(name: string, params: any, env: Env): Promise<any> {
    const method = this.methods.get(name);

    if (!method) {
      throw new Error(`RPC method not found: ${name}`);
    }

    return await method.handler(params, env);
  }
}

/**
 * Handle RPC request
 */
export async function handleRPC(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;

    if (!body.method) {
      return Response.json({ error: 'Missing method parameter' }, 400);
    }

    const registry = new RPCRegistry();
    const result = await registry.execute(body.method, body.params || {}, env);

    return Response.json({
      jsonrpc: '2.0',
      id: body.id || null,
      result
    });
  } catch (error) {
    return Response.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: String(error)
      }
    }, 500);
  }
}
