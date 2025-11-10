import { z } from "zod";
import * as S from "./schemas/apiSchemas";
import { getKyselyClient } from "./utils/db";
import type { Env } from "./types";
import type { NewTask } from "./utils/db";

const createTask = async (params: unknown, env: Env) => {
  const input = S.CreateTaskRequest.parse(params);
  const db = getKyselyClient(env);

  const newTask: NewTask = {
    id: crypto.randomUUID(),
    title: input.title,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const task = await db
    .insertInto('tasks')
    .values(newTask)
    .returningAll()
    .executeTakeFirstOrThrow();

  return { success: true as const, task };
};

const listTasks = async (params: unknown, env: Env) => {
  const db = getKyselyClient(env);
  const tasks = await db
    .selectFrom('tasks')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();

  return { success: true as const, tasks };
};

const runAnalysis = async (params: unknown) => {
  const input = S.AnalysisRequest.parse(params);
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
