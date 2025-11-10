import { listActiveTests, insertTestResult, getKyselyClient } from '../utils/db';
import { analyzeTestFailure } from '../utils/ai';
import { getDefaultTestDefs } from './defs';
import type { Env } from '../types';
import type { TestDef } from '../utils/db';

type TestOutcome = {
    status: 'pass' | 'fail';
    raw: string; // JSON string of raw output/error
    error_code?: string;
};

// =================================================================
// Test Execution Logic
// =================================================================

// Simulates running a single, specific test.
async function executeTest(test: TestDef, env: Env): Promise<TestOutcome> {
    const url = env.SELF_URL; // You will need to add SELF_URL to your wrangler.toml and the Env type

    try {
        switch (test.name) {
            case 'API Health Check': {
                const response = await fetch(`${url}/`);
                if (response.status !== 200) {
                    throw new Error(`Health check failed with status: ${response.status}`);
                }
                const data = await response.json();
                return { status: 'pass', raw: JSON.stringify(data) };
            }
            case 'OpenAPI Spec Availability': {
                const response = await fetch(`${url}/openapi.json`);
                if (response.status !== 200) {
                    throw new Error(`OpenAPI spec fetch failed with status: ${response.status}`);
                }
                const data = await response.json();
                if (!data || typeof data.openapi !== 'string') {
                    return { status: 'fail', raw: JSON.stringify({ error: "Invalid or missing 'openapi' key" }), error_code: 'MISSING_KEY' };
                }
                return { status: 'pass', raw: JSON.stringify({ openapiVersion: data.openapi }) };
            }
            case 'External Service Check (Simulated Failure)': {
                 // This is designed to always fail to test the AI analysis.
                await fetch('https://non-existent-service.dev');
                // Should not be reached
                return { status: 'pass', raw: '{}' };
            }
            default:
                return { status: 'fail', raw: JSON.stringify({ error: "Unknown test definition" }), error_code: 'UNKNOWN_TEST' };
        }
    } catch (e: any) {
        return { status: 'fail', raw: JSON.stringify({ error: e.message, stack: e.stack }), error_code: 'FETCH_FAILED' };
    }
}


// =================================================================
// Test Orchestration
// =================================================================

/**
 * Ensures that the default test definitions are present in the database.
 * If the table is empty, it seeds it with the defaults.
 */
async function ensureTestDefs(env: Env) {
    const db = getKyselyClient(env);

    const countResult = await db.selectFrom('test_defs').select(eb => eb.fn.countAll().as('count')).executeTakeFirst();
    const count = Number(countResult?.count ?? 0);

    if (count === 0) {
        console.log("Seeding database with default test definitions...");
        await db.insertInto('test_defs').values(getDefaultTestDefs()).execute();
    }
}

/**
 * Runs all active tests, records their results, and triggers AI analysis for failures.
 * This is the main function called by the cron trigger and the on-demand API.
 */
export async function runAllTests(env: Env, session_uuid?: string) {
    const sessionId = session_uuid || crypto.randomUUID();

    // Ensure tests are seeded before running
    await ensureTestDefs(env);

    const activeTests = await listActiveTests(env);

    const testPromises = activeTests.map(async (test) => {
        const started_at = new Date().toISOString();
        const startTime = Date.now();

        const outcome = await executeTest(test, env);

        const finished_at = new Date().toISOString();
        const duration_ms = Date.now() - startTime;

        let resultToInsert = {
            id: crypto.randomUUID(),
            session_uuid: sessionId,
            test_fk: test.id,
            started_at,
            finished_at,
            duration_ms,
            status: outcome.status,
            error_code: outcome.error_code,
            raw: outcome.raw,
            created_at: new Date().toISOString()
        };

        // If the test failed, run AI analysis
        if (outcome.status === 'fail') {
            const { humanReadableError, fixSuggestion } = await analyzeTestFailure(env, test, resultToInsert);
            // @ts-ignore
            resultToInsert.ai_human_readable_error_description = humanReadableError;
            // @ts-ignore
            resultToInsert.ai_prompt_to_fix_error = fixSuggestion;
        }

        await insertTestResult(env, resultToInsert);
    });

    // We use `allSettled` to ensure all tests complete, even if some fail.
    await Promise.allSettled(testPromises);

    console.log(`Test session ${sessionId} completed.`);
    return sessionId;
}
