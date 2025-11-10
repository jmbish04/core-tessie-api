/**
 * General-purpose hibernatable WebSocket room Durable Object
 */
import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import { WSConnectionManager, frameMessage, parseMessage } from '../utils/ws';

export class RoomDO extends DurableObject<Env> {
  private connections: WSConnectionManager;
  private roomId: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.connections = new WSConnectionManager();
    this.roomId = ctx.id.toString();
  }

  /**
   * Handle HTTP requests to the Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // Use hibernatable API
      this.ctx.acceptWebSocket(server);

      const clientId = crypto.randomUUID();
      const metadata = {
        connectedAt: new Date().toISOString(),
        userAgent: request.headers.get('User-Agent')
      };

      this.connections.addClient(clientId, server, metadata);

      // Send welcome message
      server.send(frameMessage('connected', {
        clientId,
        roomId: this.roomId,
        activeClients: this.connections.size
      }));

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // REST endpoints for room management
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const body = await request.json() as any;
      this.connections.broadcast(frameMessage('broadcast', body));
      return Response.json({ success: true, clientCount: this.connections.size });
    }

    if (url.pathname === '/stats') {
      return Response.json({
        roomId: this.roomId,
        activeConnections: this.connections.size,
        clients: this.connections.getActiveClients().map(c => ({
          id: c.id,
          metadata: c.metadata
        }))
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle incoming WebSocket messages (hibernatable API)
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
    const parsed = parseMessage(text);

    if (!parsed) {
      ws.send(frameMessage('error', { code: 'INVALID_MESSAGE', message: 'Failed to parse message' }));
      return;
    }

    // Handle different message types
    switch (parsed.type) {
      case 'ping':
        ws.send(frameMessage('pong', { timestamp: new Date().toISOString() }));
        break;

      case 'broadcast':
        this.connections.broadcast(frameMessage('message', {
          from: this.getClientId(ws),
          data: parsed.data
        }));
        break;

      case 'echo':
        ws.send(frameMessage('echo', parsed.data));
        break;

      default:
        ws.send(frameMessage('unknown', { type: parsed.type }));
    }
  }

  /**
   * Handle WebSocket close events (hibernatable API)
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const clientId = this.getClientId(ws);
    if (clientId) {
      this.connections.removeClient(clientId);
      this.connections.broadcast(frameMessage('client_disconnected', {
        clientId,
        activeClients: this.connections.size
      }));
    }
  }

  /**
   * Handle WebSocket error events (hibernatable API)
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    const clientId = this.getClientId(ws);
    if (clientId) {
      this.connections.removeClient(clientId);
    }
  }

  /**
   * Get client ID from WebSocket instance
   */
  private getClientId(ws: WebSocket): string | null {
    for (const client of this.connections.getAllClients()) {
      if (client.ws === ws) {
        return client.id;
      }
    }
    return null;
  }

  /**
   * Alarm handler for periodic cleanup
   */
  async alarm(): Promise<void> {
    this.connections.cleanup();
    // Schedule next cleanup in 5 minutes
    await this.ctx.storage.setAlarm(Date.now() + 5 * 60 * 1000);
  }
}
