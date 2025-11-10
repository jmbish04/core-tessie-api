import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const Task = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(["pending", "running", "done"]).default("pending"),
  createdAt: z.string(),
}).openapi({
  description: "A task object",
  example: {
    id: "a3f4b4e8-2616-4a67-8a6a-3f4b4e82616a",
    title: "My first task",
    status: "pending",
    createdAt: "2025-03-07T10:00:00Z",
  },
});

export const CreateTaskRequest = z.object({
  title: z.string().min(1),
}).openapi({
  example: {
    title: "My new task",
  },
});

export const CreateTaskResponse = z.object({
  success: z.literal(true),
  task: Task,
});

export const ListTasksResponse = z.object({
  success: z.literal(true),
  tasks: z.array(Task),
});

export const AnalysisRequest = z.object({
  taskId: z.string().uuid(),
  depth: z.number().int().min(1).max(5).default(1),
}).openapi({
  example: {
    taskId: "a3f4b4e8-2616-4a67-8a6a-3f4b4e82616a",
    depth: 3,
  },
});

export const AnalysisResponse = z.object({
  success: z.literal(true),
  report: z.object({
    taskId: z.string().uuid(),
    score: z.number(),
    notes: z.string(),
  }),
});

export const ErrorResponse = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
}).openapi({
  example: {
    success: false,
    error: "Invalid input",
    details: {
      field: "title",
      message: "Title must be at least 1 character long",
    },
  },
});

export type TCreateTaskRequest = z.infer<typeof CreateTaskRequest>;
