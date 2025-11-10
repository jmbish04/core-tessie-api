import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import * as S from "../schemas/apiSchemas";

export function buildOpenAPIDocument(baseUrl: string) {
  const registry = new OpenAPIRegistry();

  // Register schemas
  registry.register("Task", S.Task);
  registry.register("CreateTaskRequest", S.CreateTaskRequest);
  registry.register("CreateTaskResponse", S.CreateTaskResponse);
  registry.register("ListTasksResponse", S.ListTasksResponse);
  registry.register("AnalysisRequest", S.AnalysisRequest);
  registry.register("AnalysisResponse", S.AnalysisResponse);
  registry.register("ErrorResponse", S.ErrorResponse);

  // Register paths
  registry.registerPath({
    method: "post",
    path: "/api/tasks",
    summary: "Create a new task",
    description: "Creates a new task with a given title.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: S.CreateTaskRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Task created successfully",
        content: {
          "application/json": {
            schema: S.CreateTaskResponse,
          },
        },
      },
      "400": {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: S.ErrorResponse,
          },
        },
      },
    },
    tags: ["Tasks"],
  });

  registry.registerPath({
    method: "get",
    path: "/api/tasks",
    summary: "List all tasks",
    description: "Returns a list of all tasks.",
    responses: {
      "200": {
        description: "A list of tasks",
        content: {
          "application/json": {
            schema: S.ListTasksResponse,
          },
        },
      },
    },
    tags: ["Tasks"],
  });

  registry.registerPath({
    method: "post",
    path: "/api/analyze",
    summary: "Run analysis on a task",
    description: "Performs an analysis on a specified task.",
    request: {
      body: {
        content: {
          "application/json": {
            schema: S.AnalysisRequest,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Analysis complete",
        content: {
          "application/json": {
            schema: S.AnalysisResponse,
          },
        },
      },
      "400": {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: S.ErrorResponse,
          },
        },
      },
    },
    tags: ["Analysis"],
  });

  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Multi-Protocol Cloudflare Worker",
      version: "1.0.0",
      description: "A Cloudflare Worker exposing REST, WebSocket, RPC, and MCP protocols.",
    },
    servers: [{ url: baseUrl }],
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    tags: [
        { name: "Tasks", description: "Operations related to tasks" },
        { name: "Analysis", description: "Operations related to analysis" }
    ],
  });
}
