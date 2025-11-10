/**
 * Zod schemas for Cursor IDE telemetry and interventions
 */
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// Session Management
export const StartSessionRequestSchema = z.object({
  sessionId: z.string().optional().openapi({
    description: 'Optional session ID. If omitted, one will be generated.',
    example: 'cursor-session-abc123'
  }),
  project: z.string().optional().openapi({
    description: 'Project or workspace path',
    example: '/Users/dev/my-project'
  }),
  user: z.string().optional().openapi({
    description: 'User identifier (can be hashed for privacy)',
    example: 'user-hash-xyz'
  }),
  agentProfile: z.any().optional().openapi({
    description: 'Current Cursor agent configuration/settings (JSON)',
    example: { model: 'claude-3-opus', temperature: 0.7 }
  }),
  meta: z.any().optional().openapi({
    description: 'Additional metadata (branch, environment, etc.)',
    example: { branch: 'main', nodeVersion: 'v20.0.0' }
  })
}).openapi('StartSessionRequest');

export const StartSessionResponseSchema = z.object({
  sessionId: z.string(),
  status: z.string(),
  wsUrl: z.string().openapi({
    description: 'WebSocket URL for realtime telemetry streaming',
    example: 'wss://worker.dev/cursor/ws?sessionId=abc123'
  })
}).openapi('StartSessionResponse');

export const HeartbeatRequestSchema = z.object({
  sessionId: z.string(),
  meta: z.any().optional()
}).openapi('HeartbeatRequest');

// Event Logging
export const LogEventRequestSchema = z.object({
  sessionId: z.string(),
  type: z.string().openapi({
    description: 'Event type: command, diff, run, error, warning, log',
    example: 'command'
  }),
  level: z.enum(['info', 'warn', 'error', 'debug']).optional(),
  payload: z.any().openapi({
    description: 'Event payload (summaries, code diff, stdout, etc.)',
    example: { command: 'npm install', exitCode: 0 }
  }),
  tags: z.array(z.string()).optional().openapi({
    example: ['npm', 'install']
  })
}).openapi('LogEventRequest');

export const LogEventResponseSchema = z.object({
  eventId: z.string(),
  interventions: z.array(z.object({
    id: z.string(),
    ruleId: z.string(),
    decision: z.enum(['advise', 'warn', 'block', 'auto-fix']),
    instruction: z.string(),
    aiReasoning: z.string().nullable()
  })).optional().openapi({
    description: 'Any policy interventions triggered by this event'
  })
}).openapi('LogEventResponse');

// Intervention Acknowledgement
export const AckInterventionRequestSchema = z.object({
  interventionId: z.string(),
  status: z.enum(['acknowledged', 'applied', 'ignored', 'failed']),
  result: z.any().optional().openapi({
    description: 'Result of applying the intervention (if applicable)'
  })
}).openapi('AckInterventionRequest');

export const AckInterventionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
}).openapi('AckInterventionResponse');

// Session Queries
export const ListSessionsQuerySchema = z.object({
  status: z.enum(['active', 'idle', 'ended', 'error']).optional(),
  project: z.string().optional(),
  limit: z.coerce.number().optional().default(50),
  offset: z.coerce.number().optional().default(0)
}).openapi('ListSessionsQuery');

export const SessionSchema = z.object({
  id: z.string(),
  user: z.string().nullable(),
  project: z.string().nullable(),
  startedAt: z.string(),
  lastSeenAt: z.string(),
  status: z.enum(['active', 'idle', 'ended', 'error']),
  agentProfile: z.any().nullable(),
  meta: z.any().nullable(),
  eventCount: z.number().optional(),
  interventionCount: z.number().optional()
}).openapi('Session');

export const ListSessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
}).openapi('ListSessionsResponse');

export const SessionDetailResponseSchema = z.object({
  session: SessionSchema,
  recentEvents: z.array(z.object({
    id: z.string(),
    ts: z.string(),
    type: z.string(),
    level: z.string().nullable(),
    payload: z.any()
  })),
  interventions: z.array(z.object({
    id: z.string(),
    ruleId: z.string(),
    firedAt: z.string(),
    decision: z.string(),
    instruction: z.string().nullable(),
    delivered: z.boolean()
  }))
}).openapi('SessionDetailResponse');

// WebSocket Message Schemas (for type validation, not OpenAPI)
export const WSMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hello'),
    meta: z.any().optional()
  }),
  z.object({
    type: z.literal('event'),
    data: LogEventRequestSchema
  }),
  z.object({
    type: z.literal('heartbeat'),
    sessionId: z.string()
  }),
  z.object({
    type: z.literal('ack'),
    interventionId: z.string(),
    status: z.string()
  })
]);

export const WSInterventionMessageSchema = z.object({
  type: z.literal('intervention'),
  id: z.string(),
  ruleId: z.string(),
  decision: z.enum(['advise', 'warn', 'block', 'auto-fix']),
  instruction: z.string(),
  aiReasoning: z.string().nullable()
});
