/**
 * Zod schemas for API validation and OpenAPI generation
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Health Check Schemas
export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']).openapi({
    description: 'Overall system health status',
    example: 'healthy'
  }),
  timestamp: z.string().openapi({
    description: 'ISO 8601 timestamp of health check',
    example: '2025-03-07T12:00:00.000Z'
  }),
  checks: z.object({
    database: z.boolean(),
    ai: z.boolean(),
    durableObjects: z.boolean()
  }).openapi({
    description: 'Individual component health checks'
  }),
  metrics: z.object({
    activeTests: z.number(),
    lastTestRun: z.string().nullable(),
    passRate: z.number()
  }).optional()
}).openapi('HealthCheckResponse');

// Test Execution Schemas
export const RunTestsRequestSchema = z.object({
  testIds: z.array(z.string()).optional().openapi({
    description: 'Specific test IDs to run. If omitted, all active tests run.',
    example: ['health-db-check', 'health-ai-check']
  }),
  async: z.boolean().optional().default(false).openapi({
    description: 'Run tests asynchronously and return session ID',
    example: false
  })
}).openapi('RunTestsRequest');

export const RunTestsResponseSchema = z.object({
  sessionId: z.string().openapi({
    description: 'Unique session UUID for this test run',
    example: '550e8400-e29b-41d4-a716-446655440000'
  }),
  status: z.enum(['running', 'completed']),
  testsScheduled: z.number()
}).openapi('RunTestsResponse');

export const TestResultSchema = z.object({
  id: z.string(),
  testName: z.string(),
  status: z.enum(['pass', 'fail']),
  duration: z.number().nullable(),
  errorCode: z.string().nullable(),
  aiSuggestion: z.string().nullable()
}).openapi('TestResult');

export const TestSessionResponseSchema = z.object({
  sessionId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  results: z.array(TestResultSchema)
}).openapi('TestSessionResponse');

// Task/Business API Schemas (example)
export const TaskSchema = z.object({
  id: z.string().openapi({ example: 'task-123' }),
  title: z.string().openapi({ example: 'Review pull request' }),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  createdAt: z.string(),
  updatedAt: z.string()
}).openapi('Task');

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1).openapi({ example: 'Review pull request' }),
  description: z.string().optional()
}).openapi('CreateTaskRequest');

export const AnalyzeRequestSchema = z.object({
  text: z.string().min(1).openapi({
    description: 'Text to analyze with Workers AI',
    example: 'This is a sample text for sentiment analysis'
  }),
  model: z.string().optional().openapi({
    example: '@cf/meta/llama-3-8b-instruct'
  })
}).openapi('AnalyzeRequest');

export const AnalyzeResponseSchema = z.object({
  result: z.any(),
  model: z.string(),
  timestamp: z.string()
}).openapi('AnalyzeResponse');

// Error Schema
export const ErrorResponseSchema = z.object({
  error: z.string().openapi({ example: 'Resource not found' }),
  code: z.string().optional().openapi({ example: 'NOT_FOUND' }),
  details: z.any().optional()
}).openapi('ErrorResponse');
