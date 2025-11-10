import { z } from "zod";
import { dispatchRPC, rpcRegistry, RpcRegistry } from "./rpc";
import type { Env } from "./types";

const ExecuteBody = z.object({
  tool: z.string(),
  params: z.any(),
});

export function mcpRoutes() {
  return {
    tools: async () => {
      const tools = Object.keys(rpcRegistry).map((name) => ({
        name,
        description: `A tool for the ${name} operation.`,
      }));
      return { tools };
    },

    execute: async (env: Env, ctx: ExecutionContext, body: unknown) => {
      const { tool, params } = ExecuteBody.parse(body);

      if (!(tool in rpcRegistry)) {
        throw new z.ZodError([{
            path: ["tool"],
            code: "custom",
            message: `Unknown tool: ${tool}`
        }]);
      }

      const result = await dispatchRPC(tool as keyof RpcRegistry, params, env, ctx);
      return { success: true, result };
    },
  };
}
