import { drizzle } from 'drizzle-orm/d1';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import type { Env } from '../types';
import type { Insertable, Selectable } from 'kysely';

// ======= DRIZZLE SCHEMA (for migrations and type generation) =======
export const test_defs = sqliteTable('test_defs', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category'),
    severity: text('severity'),
    is_active: integer('is_active').notNull().default(1),
    error_map: text('error_map'), // JSON string
    created_at: text('created_at').notNull(),
});

export const test_results = sqliteTable('test_results', {
    id: text('id').primaryKey(),
    session_uuid: text('session_uuid').notNull(),
    test_fk: text('test_fk').notNull().references(() => test_defs.id),
    started_at: text('started_at').notNull(),
    finished_at: text('finished_at'),
    duration_ms: integer('duration_ms'),
    status: text('status', { enum: ['pass', 'fail'] }).notNull(),
    error_code: text('error_code'),
    raw: text('raw'), // JSON
    ai_human_readable_error_description: text('ai_human_readable_error_description'),
    ai_prompt_to_fix_error: text('ai_prompt_to_fix_error'),
    created_at: text('created_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    status: text('status', { enum: ['pending', 'running', 'done'] }).notNull().default('pending'),
    created_at: text('created_at').notNull(),
});


// ======= KYSELY TYPES (for query builder ergonomics) =======
export type TestDef = Selectable<Database['test_defs']>;
export type NewTestDef = Insertable<Database['test_defs']>;

export type TestResult = Selectable<Database['test_results']>;
export type NewTestResult = Insertable<Database['test_results']>;

export type Task = Selectable<Database['tasks']>;
export type NewTask = Insertable<Database['tasks']>;


interface Database {
    test_defs: TestDef;
    test_results: TestResult;
    tasks: Task;
}

// ======= CLIENT INSTANTIATION =======
/**
 * Provides a Drizzle ORM client for interacting with the D1 database.
 * Recommended for schema-related operations and simple queries.
 */
export const getDrizzleClient = (env: Env) => drizzle(env.DB, { schema: { test_defs, test_results, tasks } });

/**
 * Provides a Kysely query builder client for interacting with the D1 database.
 * Recommended for complex queries and ergonomic data access.
 */
export const getKyselyClient = (env: Env) => new Kysely<Database>({ dialect: new D1Dialect({ database: env.DB }) });


// ======= HELPER FUNCTIONS (using Kysely) =======

/**
 * Lists all active test definitions from the database.
 */
export const listActiveTests = async (env: Env): Promise<TestDef[]> => {
    const db = getKyselyClient(env);
    return await db
        .selectFrom('test_defs')
        .selectAll()
        .where('is_active', '=', 1)
        .orderBy('name', 'asc')
        .execute();
};

/**
 * Inserts a new test result into the database.
 */
export const insertTestResult = async (env: Env, result: NewTestResult): Promise<TestResult> => {
    const db = getKyselyClient(env);
    return await db
        .insertInto('test_results')
        .values(result)
        .returningAll()
        .executeTakeFirstOrThrow();
};

/**
 * Retrieves all test results for a given session UUID.
 */
export const getSessionById = async (env: Env, sessionId: string) => {
    const db = getKyselyClient(env);
    const results = await db
        .selectFrom('test_results')
        .where('session_uuid', '=', sessionId)
        .innerJoin('test_defs', 'test_results.test_fk', 'test_defs.id')
        .select([
            'test_results.id', 'test_results.session_uuid', 'test_results.test_fk',
            'test_results.started_at', 'test_results.finished_at', 'test_results.duration_ms',
            'test_results.status', 'test_results.error_code', 'test_results.raw',
            'test_results.ai_human_readable_error_description', 'test_results.ai_prompt_to_fix_error',
            'test_defs.name', 'test_defs.description'
        ])
        .orderBy('test_results.started_at', 'asc')
        .execute();

    // Shape the data to nest test_def info for easier frontend consumption
    const shapedResults = results.map(r => ({
        id: r.id,
        session_uuid: r.session_uuid,
        test_fk: r.test_fk,
        started_at: r.started_at,
        finished_at: r.finished_at,
        duration_ms: r.duration_ms,
        status: r.status,
        error_code: r.error_code,
        raw: r.raw,
        ai_human_readable_error_description: r.ai_human_readable_error_description,
        ai_prompt_to_fix_error: r.ai_prompt_to_fix_error,
        test_def: {
            name: r.name,
            description: r.description
        }
    }));

    return { session_uuid: sessionId, results: shapedResults };
};

/**
 * Retrieves the most recent test session from the database.
 */
export const getLatestSession = async (env: Env) => {
    const db = getKyselyClient(env);

    const latestSessionInfo = await db
        .selectFrom('test_results')
        .select('session_uuid')
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst();

    if (!latestSessionInfo) {
        return { session_uuid: null, results: [] };
    }

    return getSessionById(env, latestSessionInfo.session_uuid);
};
