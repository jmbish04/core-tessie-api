import { buildRouter } from "./router";
import { RoomDO } from "./do/RoomDO";
import { buildOpenAPIDocument } from "./utils/openapi";
import { mcpRoutes } from "./mcp";
import { runAllTests } from "./tests/runner";
import type { Env } from "./types";
import { z } from "zod";

// A simple placeholder for YAML conversion to avoid adding a new dependency.
function toYAML(json: object): string {
    const replacer = (key: string, value: any) => value === null ? "" : value;
    const yamlString = JSON.stringify(json, replacer, 2);
    return yamlString.replace(/"([^"]+)":/g, '$1:').replace(/ "([^"]+)"/g, ' $1');
}

const app = buildRouter();

export default {
  // Main fetch handler for incoming HTTP requests
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // API and special routes
    if (path.startsWith("/api/") || path.startsWith("/mcp/") || path === "/rpc" || path === "/ws" || path === "/openapi.json" || path === "/openapi.yaml") {

        // OpenAPI Specification Endpoints
        if (path === "/openapi.json") {
            const doc = buildOpenAPIDocument(url.origin);
            return new Response(JSON.stringify(doc, null, 2), { headers: { "Content-Type": "application/json;charset=UTF-8" } });
        }
        if (path === "/openapi.yaml") {
            const doc = buildOpenAPIDocument(url.origin);
            const yaml = toYAML(doc);
            return new Response(yaml, { headers: { "Content-Type": "application/yaml;charset=UTF-8" } });
        }

        // WebSocket Endpoint
        if (path === "/ws") {
            if (request.headers.get("Upgrade") !== "websocket") {
                return new Response("Expected WebSocket", { status: 426 });
            }
            const projectId = url.searchParams.get("projectId") ?? "default";
            const id = env.ROOM_DO.idFromName(projectId);
            const stub = env.ROOM_DO.get(id);
            return stub.fetch(request);
        }

        // MCP Endpoints
        if (path.startsWith("/mcp/")) {
            const routes = mcpRoutes();
            if (path === "/mcp/tools" && request.method === "GET") {
                return Response.json(await routes.tools());
            }
            if (path === "/mcp/execute" && request.method === "POST") {
                try {
                    const body = await request.json();
                    const res = await routes.execute(env, ctx, body);
                    return Response.json(res);
                } catch (e: any) {
                    const errorPayload = { success: false, error: "MCP execution failed" };
                    if (e instanceof z.ZodError) {
                        return Response.json({ ...errorPayload, details: e.issues }, { status: 400 });
                    }
                    return Response.json({ ...errorPayload, details: e.message }, { status: 400 });
                }
            }
        }

        // REST and RPC routing via Hono
        return app.fetch(request, env, ctx);
    }

    // Serve static assets from the "public" directory
    try {
        const url = new URL(request.url);
        if (url.pathname === "/health") {
            url.pathname = "/health.html";
        }
        const newRequest = new Request(url.toString(), request);
        return await env.ASSETS.fetch(newRequest);
    } catch (e) {
        console.error("Failed to fetch static asset:", e);
        return new Response("Not Found", { status: 404 });
    }
  },

  // Scheduled event handler for cron triggers
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger received: ${event.cron}`);
    ctx.waitUntil(runAllTests(env));
  },

} satisfies ExportedHandler<Env>;

// Export the Durable Object class
export { RoomDO };
