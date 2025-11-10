import type { DurableObject } from "cloudflare:workers";
import { broadcast, afr, safeClose } from "../utils/ws";

export class RoomDO implements DurableObject {
  ctx: DurableObjectState;

  constructor(ctx: DurableObjectState) {
    this.ctx = ctx;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket upgrade request", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const [err] = await afr(broadcast(
      this.ctx,
      ws,
      message,
    ));

    if (err) {
      console.error("Failed to broadcast message", err);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(`WebSocket closed: code=${code}, reason=${reason}, wasClean=${wasClean}`);
    safeClose(ws, code, "WebSocket is closing");
  }

  async webSocketError(ws: WebSocket, error: any) {
    console.error("WebSocket error:", error);
    safeClose(ws, 1011, "An error occurred");
  }
}
