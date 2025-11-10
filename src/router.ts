import { Hono } from "hono";
import { cors } from "hono/cors";
import * as S from "./schemas/apiSchemas";
import { dispatchRPC, RpcRegistry } from "./rpc";
import { runAllTests } from "./tests/runner";
import { getLatestSession, getSessionById, listActiveTests } from "./utils/db";
import type { Env } from "../types";
import { z } from "zod";

export function buildRouter() {
  const app = new Hono<{ Bindings: Env }>();

  // ============== MIDDLEWARE ==============
  app.use("/api/*", cors());

  app.onError((err, c) => {
    console.error(`${c.req.method} ${c.req.url}`, err);
    if (err instanceof z.ZodError) {
      return c.json(S.ErrorResponse.parse({ success: false, error: "Validation failed", details: err.issues }), 400);
    }
    return c.json(S.ErrorResponse.parse({ success: false, error: "Internal Server Error", details: err.message }), 500);
  });

  // ============== CORE BUSINESS API ==============
  app.get("/", (c) => c.json({ ok: true, ts: new Date().toISOString(), version: "1.0.0" }));

  app.post("/api/tasks", async (c) => {
    const body = await c.req.json();
    const res = await dispatchRPC("createTask", body, c.env, c.executionCtx);
    return c.json(res);
  });

  app.get("/api/tasks", async (c) => {
    const res = await dispatchRPC("listTasks", undefined, c.env, c.executionCtx);
    return c.json(res);
  });

  app.post("/api/analyze", async (c) => {
    const body = await c.req.json();
    const res = await dispatchRPC("runAnalysis", body, c.env, c.executionCtx);
    return c.json(res);
  });

  // ============== HEALTH & TESTING API ==============
  app.get("/api/health", async (c) => {
    const latestSession = await getLatestSession(c.env);
    const isHealthy = latestSession.results.length > 0 && latestSession.results.every(r => r.status === 'pass');
    return c.json({
        healthy: isHealthy,
        last_test_session: latestSession.session_uuid,
        timestamp: new Date().toISOString()
    });
  });

  app.post("/api/tests/run", async (c) => {
    const sessionId = crypto.randomUUID();
    // Run tests in the background without blocking the request
    c.executionCtx.waitUntil(runAllTests(c.env, sessionId));
    return c.json({
        message: "Test session started.",
        session_uuid: sessionId
    }, 202);
  });

  app.get("/api/tests/session/:id", async (c) => {
    const { id } = c.req.param();
    if (!id) return c.json({ error: "Session ID is required" }, 400);

    const session = await getSessionById(c.env, id);
    return c.json(session);
  });

  app.get("/api/tests/defs", async (c) => {
    const defs = await listActiveTests(c.env);
    return c.json({ defs });
  });

  app.get("/api/tests/latest", async (c) => {
    const latestSession = await getLatestSession(c.env);
    return c.json(latestSession);
  });

  // ============== CONVENIENCE ENDPOINTS ==============
  app.post("/rpc", async (c) => {
    const { method, params } = await c.req.json() as { method: keyof RpcRegistry, params: any };
    if (!method) {
      return c.json({ success: false, error: "Missing 'method' in request body" }, 400);
    }
    try {
      const result = await dispatchRPC(method, params, c.env, c.executionCtx);
      return c.json({ success: true, result });
    } catch (e: any) {
      return c.json({ success: false, error: e?.message ?? "RPC error" }, 400);
    }
  });

  return app;
}
