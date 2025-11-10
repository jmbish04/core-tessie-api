/**
 * MCP (Model Context Protocol) router
 */
import { Hono } from 'hono';
import type { Env, MCPTool } from './types';
import { RPCRegistry } from './rpc';

export const mcpRouter = new Hono<{ Bindings: Env }>();

/**
 * Convert RPC methods to MCP tools
 */
function createMCPTools(): MCPTool[] {
  const registry = new RPCRegistry();
  const rpcMethods = registry.list();

  return rpcMethods.map(method => ({
    name: method.name,
    description: method.description || `Execute ${method.name}`,
    inputSchema: method.schema || {
      type: 'object',
      properties: {},
      required: []
    },
    handler: method.handler
  }));
}

/**
 * GET /mcp/tools
 * List available MCP tools
 */
mcpRouter.get('/tools', async (c) => {
  const tools = createMCPTools();

  return c.json({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  });
});

/**
 * POST /mcp/execute
 * Execute an MCP tool
 */
mcpRouter.post('/execute', async (c) => {
  try {
    const body = await c.req.json();
    const { tool, params } = body as any;

    if (!tool) {
      return c.json({ error: 'Missing tool parameter' }, 400);
    }

    const tools = createMCPTools();
    const mcpTool = tools.find(t => t.name === tool);

    if (!mcpTool) {
      return c.json({ error: `Tool not found: ${tool}` }, 404);
    }

    const result = await mcpTool.handler(params || {}, c.env);

    return c.json({
      tool,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Execution failed', details: String(error) }, 500);
  }
});
