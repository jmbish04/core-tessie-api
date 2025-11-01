/**
 * Dynamic OpenAPI specification generation
 */

import { Context } from 'hono';
import YAML from 'yaml';

export interface OpenAPIInfo {
  title: string;
  version: string;
  description: string;
}

export interface OpenAPIPath {
  [method: string]: {
    summary: string;
    description?: string;
    parameters?: any[];
    requestBody?: any;
    responses: any;
    security?: any[];
    tags?: string[];
  };
}

/**
 * Generate OpenAPI 3.0 specification
 */
export function generateOpenAPISpec(info: OpenAPIInfo): any {
  return {
    openapi: '3.0.0',
    info: {
      title: info.title,
      version: info.version,
      description: info.description,
      contact: {
        name: 'Tessie API Support',
        url: 'https://developer.tessie.com'
      }
    },
    servers: [
      {
        url: 'https://api.tessie.com',
        description: 'Production server'
      }
    ],
    security: [
      {
        apiKey: []
      }
    ],
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'API key in format: Bearer YOUR_API_KEY'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            status: {
              type: 'integer',
              description: 'HTTP status code'
            }
          }
        },
        Log: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            level: { type: 'string', enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] },
            route: { type: 'string' },
            method: { type: 'string' },
            status_code: { type: 'integer' },
            request_id: { type: 'string' },
            actor: { type: 'string' },
            message: { type: 'string' },
            payload: { type: 'object' },
            duration_ms: { type: 'integer' },
            ip_address: { type: 'string' },
            user_agent: { type: 'string' },
            error_stack: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        },
        WebSocketMessage: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['log', 'status', 'error'] },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: {
      '/': {
        get: {
          summary: 'Frontend UI',
          description: 'Serves the interactive frontend with WebSocket monitoring',
          responses: {
            '200': {
              description: 'HTML frontend',
              content: {
                'text/html': {}
              }
            }
          },
          tags: ['Frontend']
        }
      },
      '/api/health': {
        get: {
          summary: 'Health check',
          description: 'Check if the API is running',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          tags: ['System']
        }
      },
      '/api/logs': {
        get: {
          summary: 'Get logs',
          description: 'Retrieve logs with optional filtering by date, level, keywords',
          parameters: [
            {
              name: 'startDate',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'Start date for filtering (ISO 8601)'
            },
            {
              name: 'endDate',
              in: 'query',
              schema: { type: 'string', format: 'date-time' },
              description: 'End date for filtering (ISO 8601)'
            },
            {
              name: 'level',
              in: 'query',
              schema: { type: 'string', enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] },
              description: 'Filter by log level'
            },
            {
              name: 'route',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by route (supports partial match)'
            },
            {
              name: 'actor',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by actor (API key identifier)'
            },
            {
              name: 'keywords',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search keywords in message and tags'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100 },
              description: 'Number of logs to return'
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0 },
              description: 'Pagination offset'
            }
          ],
          security: [{ apiKey: [] }],
          responses: {
            '200': {
              description: 'List of logs',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      logs: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Log' }
                      },
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            }
          },
          tags: ['Logs']
        }
      },
      '/api/vehicle/{vin}/honk': {
        post: {
          summary: 'Honk horn',
          description: 'Trigger the vehicle horn',
          parameters: [
            {
              name: 'vin',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Vehicle VIN'
            }
          ],
          security: [{ apiKey: [] }],
          responses: {
            '200': {
              description: 'Horn honked successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      result: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          },
          tags: ['Vehicle']
        }
      },
      '/api/vehicle/{vin}/flash': {
        post: {
          summary: 'Flash lights',
          description: 'Flash the vehicle lights',
          parameters: [
            {
              name: 'vin',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Vehicle VIN'
            }
          ],
          security: [{ apiKey: [] }],
          responses: {
            '200': {
              description: 'Lights flashed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      result: { type: 'boolean' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          },
          tags: ['Vehicle']
        }
      },
      '/api/vehicle/{vin}/state': {
        get: {
          summary: 'Get vehicle state',
          description: 'Get current state of the vehicle',
          parameters: [
            {
              name: 'vin',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Vehicle VIN'
            },
            {
              name: 'use_cache',
              in: 'query',
              schema: { type: 'boolean', default: true },
              description: 'Use cached state'
            }
          ],
          security: [{ apiKey: [] }],
          responses: {
            '200': {
              description: 'Vehicle state',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    description: 'Complete vehicle state object'
                  }
                }
              }
            },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '500': { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          },
          tags: ['Vehicle']
        }
      },
      '/ws': {
        get: {
          summary: 'WebSocket connection',
          description: 'Establish WebSocket connection for realtime monitoring',
          parameters: [
            {
              name: 'Upgrade',
              in: 'header',
              required: true,
              schema: { type: 'string', enum: ['websocket'] }
            },
            {
              name: 'Authorization',
              in: 'header',
              required: true,
              schema: { type: 'string' },
              description: 'API key in format: Bearer YOUR_API_KEY'
            }
          ],
          responses: {
            '101': {
              description: 'Switching Protocols - WebSocket established'
            },
            '401': {
              description: 'Unauthorized - Invalid API key'
            }
          },
          tags: ['WebSocket']
        }
      },
      '/openapi.json': {
        get: {
          summary: 'OpenAPI JSON',
          description: 'Get the OpenAPI specification in JSON format',
          responses: {
            '200': {
              description: 'OpenAPI specification',
              content: {
                'application/json': {}
              }
            }
          },
          tags: ['Documentation']
        }
      },
      '/openapi.yaml': {
        get: {
          summary: 'OpenAPI YAML',
          description: 'Get the OpenAPI specification in YAML format',
          responses: {
            '200': {
              description: 'OpenAPI specification',
              content: {
                'application/yaml': {}
              }
            }
          },
          tags: ['Documentation']
        }
      }
    },
    tags: [
      { name: 'System', description: 'System health and status' },
      { name: 'Logs', description: 'Log management and retrieval' },
      { name: 'Vehicle', description: 'Vehicle operations' },
      { name: 'WebSocket', description: 'Realtime communication' },
      { name: 'Documentation', description: 'API documentation' },
      { name: 'Frontend', description: 'User interface' }
    ]
  };
}

/**
 * Convert OpenAPI spec to YAML
 */
export function convertToYAML(spec: any): string {
  // Simple YAML conversion (for production, use a proper YAML library)
  return JSON.stringify(spec, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");
}
