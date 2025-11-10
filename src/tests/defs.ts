import type { NewTestDef } from "../utils/db";

/**
 * Generates the default set of health checks. This function is used to seed the
 * 'test_defs' table in the database if it's found to be empty.
 */
export const getDefaultTestDefs = (): NewTestDef[] => [
    {
        id: crypto.randomUUID(),
        name: 'API Health Check',
        description: 'Verifies that the main GET / endpoint is responsive and returns a successful status.',
        category: 'core',
        severity: 'critical',
        is_active: 1,
        created_at: new Date().toISOString(),
        error_map: JSON.stringify({
            'NON_200_STATUS': {
                meaning: 'The health check endpoint returned a non-200 status code.',
                fix: 'Check the worker logs for errors. Ensure the Hono router is correctly configured and the root route "/" is registered.'
            }
        })
    },
    {
        id: crypto.randomUUID(),
        name: 'OpenAPI Spec Availability',
        description: 'Checks that the GET /openapi.json endpoint is available and returns a valid JSON object with an "openapi" version key.',
        category: 'core',
        severity: 'high',
        is_active: 1,
        created_at: new Date().toISOString(),
        error_map: JSON.stringify({
            'INVALID_JSON': {
                meaning: 'The /openapi.json endpoint did not return valid JSON.',
                fix: 'Verify that the `buildOpenAPIDocument` function is generating a correct object and that it is being properly stringified in the response.'
            },
            'MISSING_KEY': {
                meaning: 'The returned JSON from /openapi.json is missing the required "openapi" key.',
                fix: 'Ensure the `OpenApiGeneratorV31` is configured with the `openapi: "3.1.0"` property.'
            }
        })
    },
    {
        id: crypto.randomUUID(),
        name: 'External Service Check (Simulated Failure)',
        description: 'Attempts to connect to a non-existent external service to simulate a failure and test the AI analysis.',
        category: 'external',
        severity: 'medium',
        is_active: 1,
        created_at: new Date().toISOString(),
        error_map: JSON.stringify({
            'FETCH_FAILED': {
                meaning: 'The worker failed to fetch a resource from an external service.',
                fix: 'Check the outbound network connectivity of the worker. Verify the DNS and firewall rules for the target service `non-existent-service.dev`.'
            }
        })
    }
];
