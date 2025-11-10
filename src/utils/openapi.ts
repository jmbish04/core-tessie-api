/**
 * OpenAPI 3.1.0 document generation utilities
 */
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { stringify } from 'yaml';
import type { Env } from '../types';

// Import schemas
import {
  HealthCheckResponseSchema,
  RunTestsRequestSchema,
  RunTestsResponseSchema,
  TestSessionResponseSchema,
  TaskSchema,
  CreateTaskRequestSchema,
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  ErrorResponseSchema
} from '../schemas/apiSchemas';

import {
  StartSessionRequestSchema,
  StartSessionResponseSchema,
  HeartbeatRequestSchema,
  LogEventRequestSchema,
  LogEventResponseSchema,
  AckInterventionRequestSchema,
  AckInterventionResponseSchema,
  ListSessionsQuerySchema,
  ListSessionsResponseSchema,
  SessionDetailResponseSchema
} from '../schemas/cursorSchemas';

/**
 * Create OpenAPI registry and register all endpoints
 */
export function createOpenAPIRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  // Health Check
  registry.registerPath({
    method: 'get',
    path: '/api/health',
    tags: ['Health'],
    operationId: 'getHealth',
    summary: 'System health check',
    description: 'Get overall system health status and metrics',
    responses: {
      200: {
        description: 'Health check successful',
        content: {
          'application/json': {
            schema: HealthCheckResponseSchema
          }
        }
      }
    }
  });

  // Test Execution
  registry.registerPath({
    method: 'post',
    path: '/api/tests/run',
    tags: ['Testing'],
    operationId: 'runTests',
    summary: 'Execute health tests',
    description: 'Run all active health tests or specific tests by ID',
    request: {
      body: {
        content: {
          'application/json': {
            schema: RunTestsRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Tests initiated successfully',
        content: {
          'application/json': {
            schema: RunTestsResponseSchema
          }
        }
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'get',
    path: '/api/tests/session/{sessionId}',
    tags: ['Testing'],
    operationId: 'getTestSession',
    summary: 'Get test session results',
    description: 'Retrieve test results for a specific session',
    request: {
      params: registry.registerParameter(
        'SessionIdParam',
        {
          in: 'path',
          name: 'sessionId',
          required: true,
          schema: { type: 'string' }
        }
      )
    },
    responses: {
      200: {
        description: 'Test session retrieved',
        content: {
          'application/json': {
            schema: TestSessionResponseSchema
          }
        }
      },
      404: {
        description: 'Session not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      }
    }
  });

  // Business API Examples
  registry.registerPath({
    method: 'post',
    path: '/api/tasks',
    tags: ['Tasks'],
    operationId: 'createTask',
    summary: 'Create a new task',
    description: 'Create a new task item',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateTaskRequestSchema
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Task created',
        content: {
          'application/json': {
            schema: TaskSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'post',
    path: '/api/analyze',
    tags: ['AI'],
    operationId: 'analyzeText',
    summary: 'Analyze text with Workers AI',
    description: 'Use Workers AI to analyze and process text',
    request: {
      body: {
        content: {
          'application/json': {
            schema: AnalyzeRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Analysis complete',
        content: {
          'application/json': {
            schema: AnalyzeResponseSchema
          }
        }
      }
    }
  });

  // Cursor API Endpoints
  registry.registerPath({
    method: 'post',
    path: '/api/cursor/session/start',
    tags: ['Cursor'],
    operationId: 'startCursorSession',
    summary: 'Start Cursor telemetry session',
    description: 'Initialize a new Cursor IDE telemetry session',
    request: {
      body: {
        content: {
          'application/json': {
            schema: StartSessionRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Session started',
        content: {
          'application/json': {
            schema: StartSessionResponseSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'post',
    path: '/api/cursor/session/heartbeat',
    tags: ['Cursor'],
    operationId: 'cursorSessionHeartbeat',
    summary: 'Send session heartbeat',
    description: 'Update session last-seen timestamp',
    request: {
      body: {
        content: {
          'application/json': {
            schema: HeartbeatRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Heartbeat acknowledged'
      }
    }
  });

  registry.registerPath({
    method: 'post',
    path: '/api/cursor/event',
    tags: ['Cursor'],
    operationId: 'logCursorEvent',
    summary: 'Log Cursor event',
    description: 'Log a Cursor IDE event and trigger policy checks',
    request: {
      body: {
        content: {
          'application/json': {
            schema: LogEventRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Event logged',
        content: {
          'application/json': {
            schema: LogEventResponseSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'post',
    path: '/api/cursor/intervention/ack',
    tags: ['Cursor'],
    operationId: 'ackIntervention',
    summary: 'Acknowledge intervention',
    description: 'Acknowledge receipt and application of a policy intervention',
    request: {
      body: {
        content: {
          'application/json': {
            schema: AckInterventionRequestSchema
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Acknowledgement recorded',
        content: {
          'application/json': {
            schema: AckInterventionResponseSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'get',
    path: '/api/cursor/sessions',
    tags: ['Cursor'],
    operationId: 'listCursorSessions',
    summary: 'List Cursor sessions',
    description: 'Query and filter Cursor IDE sessions',
    request: {
      query: ListSessionsQuerySchema
    },
    responses: {
      200: {
        description: 'Sessions retrieved',
        content: {
          'application/json': {
            schema: ListSessionsResponseSchema
          }
        }
      }
    }
  });

  registry.registerPath({
    method: 'get',
    path: '/api/cursor/session/{id}',
    tags: ['Cursor'],
    operationId: 'getCursorSession',
    summary: 'Get Cursor session details',
    description: 'Get detailed information about a specific Cursor session',
    request: {
      params: registry.registerParameter(
        'CursorSessionIdParam',
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' }
        }
      )
    },
    responses: {
      200: {
        description: 'Session details retrieved',
        content: {
          'application/json': {
            schema: SessionDetailResponseSchema
          }
        }
      },
      404: {
        description: 'Session not found',
        content: {
          'application/json': {
            schema: ErrorResponseSchema
          }
        }
      }
    }
  });

  return registry;
}

/**
 * Generate OpenAPI 3.1.0 JSON document
 */
export function generateOpenAPIJSON(env: Env): any {
  const registry = createOpenAPIRegistry();

  const generator = new OpenApiGeneratorV31(registry.definitions);

  const document = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Core Cursor API',
      version: '1.0.0',
      description: 'Multi-protocol Cloudflare Worker with Cursor IDE telemetry, health monitoring, and AI-powered interventions',
      contact: {
        name: 'API Support',
        url: 'https://github.com/your-org/core-cursor-api'
      }
    },
    servers: [
      {
        url: 'https://your-worker.workers.dev',
        description: 'Production'
      },
      {
        url: 'http://localhost:8787',
        description: 'Development'
      }
    ],
    tags: [
      { name: 'Health', description: 'System health and monitoring' },
      { name: 'Testing', description: 'Test execution and results' },
      { name: 'Tasks', description: 'Task management (example)' },
      { name: 'AI', description: 'Workers AI integration' },
      { name: 'Cursor', description: 'Cursor IDE telemetry and interventions' }
    ],
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema'
  });

  return document;
}

/**
 * Generate OpenAPI 3.1.0 YAML document
 */
export function generateOpenAPIYAML(env: Env): string {
  const json = generateOpenAPIJSON(env);
  return stringify(json);
}
