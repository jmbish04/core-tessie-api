import { z } from "zod";
import * as S from "./schemas/apiSchemas";
import type { Env } from "./types";

const createTask = async (params: unknown) => {
  const input = S.CreateTaskRequest.parse(params);
  const task = {
    id: crypto.randomUUID(),
    title: input.title,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  // In a real app, you would save this to a database (e.g., D1)
  return { success: true as const, task };
};

const listTasks = async () => {
  // In a real app, you would fetch this from a database
  return { success: true as const, tasks: [] };
};

const runAnalysis = async (params: unknown) => {
  const input = S.AnalysisRequest.parse(params);
  // In a real app, you would perform some analysis
  return {
    success: true as const,
    report: {
      taskId: input.taskId,
      score: Math.random(),
      notes: "Analysis complete."
    }
  };
};

export const rpcRegistry = {
  createTask,
  listTasks,
  runAnalysis,
};

export type RpcRegistry = typeof rpcRegistry;

export async function dispatchRPC<T extends keyof RpcRegistry>(
  method: T,
  params: Parameters<RpcRegistry[T]>[0],
  env: Env,
  ctx: ExecutionContext
): Promise<ReturnType<RpcRegistry[T]>> {
  if (!(method in rpcRegistry)) {
    throw new Error(`Unknown RPC method: ${method}`);
  }
  const handler = rpcRegistry[method];
  // @ts-expect-error We've already checked if the method exists
  return await handler(params, env, ctx);
}
