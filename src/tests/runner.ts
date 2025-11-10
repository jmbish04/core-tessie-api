/**
 * Test orchestrator for health checks and diagnostics
 */
import type { Env, TestResult } from '../types';
import { DBHelpers, generateUUID, now } from '../utils/db';
import { analyzeTestFailure } from '../utils/ai';
import { getTestExecutor } from './defs';

export interface TestRunOptions {
  testIds?: string[];
  sessionId?: string;
}

export interface TestRunResult {
  sessionId: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

/**
 * Run health tests
 */
export async function runTests(env: Env, options: TestRunOptions = {}): Promise<TestRunResult> {
  const db = new DBHelpers(env);
  const sessionId = options.sessionId || generateUUID();
  const startTime = Date.now();

  // Get tests to run
  let testsToRun;
  if (options.testIds && options.testIds.length > 0) {
    testsToRun = await Promise.all(
      options.testIds.map(id => db.getTestDef(id))
    );
    testsToRun = testsToRun.filter(t => t !== undefined);
  } else {
    testsToRun = await db.getActiveTests();
  }

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  // Execute tests
  for (const testDef of testsToRun) {
    if (!testDef) continue;

    const testStart = Date.now();
    const executor = getTestExecutor(testDef.id);

    let status: 'pass' | 'fail' = 'fail';
    let errorCode: string | null = null;
    let rawError: string | null = null;
    let aiDescription: string | null = null;
    let aiFixPrompt: string | null = null;

    if (executor) {
      try {
        const result = await executor.execute(env);
        status = result.success ? 'pass' : 'fail';

        if (!result.success) {
          errorCode = 'TEST_FAILED';
          rawError = result.error || 'Test execution failed';

          // Get AI analysis
          const analysis = await analyzeTestFailure(
            env,
            testDef.name,
            errorCode,
            rawError
          );
          aiDescription = analysis.humanReadable;
          aiFixPrompt = analysis.fixPrompt;

          failed++;
        } else {
          passed++;
        }
      } catch (error) {
        status = 'fail';
        errorCode = 'EXCEPTION';
        rawError = String(error);
        failed++;

        // Get AI analysis
        const analysis = await analyzeTestFailure(
          env,
          testDef.name,
          errorCode,
          rawError
        );
        aiDescription = analysis.humanReadable;
        aiFixPrompt = analysis.fixPrompt;
      }
    } else {
      errorCode = 'NO_EXECUTOR';
      rawError = 'Test executor not found';
      failed++;
    }

    const testEnd = Date.now();
    const duration = testEnd - testStart;

    const testResult: TestResult = {
      id: generateUUID(),
      session_uuid: sessionId,
      test_fk: testDef.id,
      started_at: new Date(testStart).toISOString(),
      finished_at: new Date(testEnd).toISOString(),
      duration_ms: duration,
      status,
      error_code: errorCode,
      raw: rawError,
      ai_human_readable_error_description: aiDescription,
      ai_prompt_to_fix_error: aiFixPrompt,
      created_at: now()
    };

    // Save to D1
    await db.createTestResult(testResult);
    results.push(testResult);
  }

  const endTime = Date.now();

  return {
    sessionId,
    results,
    summary: {
      total: testsToRun.length,
      passed,
      failed,
      duration: endTime - startTime
    }
  };
}

/**
 * Get test session results
 */
export async function getTestSession(env: Env, sessionId: string): Promise<TestRunResult | null> {
  const db = new DBHelpers(env);
  const results = await db.getTestResultsBySession(sessionId);

  if (results.length === 0) {
    return null;
  }

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  const startTimes = results.map(r => new Date(r.started_at).getTime());
  const endTimes = results.map(r => r.finished_at ? new Date(r.finished_at).getTime() : Date.now());

  const duration = Math.max(...endTimes) - Math.min(...startTimes);

  return {
    sessionId,
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      duration
    }
  };
}

/**
 * Cron handler for scheduled health checks
 */
export async function cronHealthCheck(env: Env): Promise<void> {
  console.log('Running scheduled health check...');
  const result = await runTests(env);
  console.log('Health check complete:', result.summary);

  // TODO: Send alerts if critical tests fail
  const criticalFailures = result.results.filter(
    r => r.status === 'fail' && (r.error_code === 'CRITICAL' || r.test_fk.includes('critical'))
  );

  if (criticalFailures.length > 0) {
    console.error('ALERT: Critical health check failures:', criticalFailures);
  }
}
