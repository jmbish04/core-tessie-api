/**
 * Cursor IDE telemetry WebSocket room Durable Object
 * Handles realtime event streaming and intervention delivery
 */
import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import { WSConnectionManager, frameMessage, parseMessage, wsError } from '../utils/ws';
import { DBHelpers, now } from '../utils/db';
import { checkPolicies } from '../cursor/policies';

export class CursorRoomDO extends DurableObject<Env> {
  private connections: WSConnectionManager;
  private sessionId: string;
  private db: DBHelpers;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.connections = new WSConnectionManager();
    this.sessionId = ctx.id.toString();
    this.db = new DBHelpers(env);
  }

  /**
   * Handle HTTP requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade for Cursor client
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);

      const clientId = crypto.randomUUID();
      const metadata = {
        sessionId: this.sessionId,
        connectedAt: new Date().toISOString()
      };

      this.connections.addClient(clientId, server, metadata);

      // Update session last_seen_at
      await this.db.updateSession(this.sessionId, {
        last_seen_at: now(),
        status: 'active'
      });

      server.send(frameMessage('connected', {
        sessionId: this.sessionId,
        clientId
      }));

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // Push intervention to connected clients
    if (url.pathname === '/push-intervention' && request.method === 'POST') {
      const body = await request.json() as any;
      this.connections.broadcast(frameMessage('intervention', body));
      return Response.json({ success: true, delivered: this.connections.size });
    }

    // Session stats
    if (url.pathname === '/stats') {
      const session = await this.db.getSession(this.sessionId);
      const events = await this.db.getEventsBySession(this.sessionId, 10);
      const interventions = await this.db.getInterventionsBySession(this.sessionId);

      return Response.json({
        session,
        recentEvents: events,
        interventions,
        activeConnections: this.connections.size
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
    const parsed = parseMessage(text);

    if (!parsed) {
      ws.send(wsError('INVALID_MESSAGE', 'Failed to parse message'));
      return;
    }

    try {
      switch (parsed.type) {
        case 'hello':
          await this.handleHello(ws, parsed.data);
          break;

        case 'event':
          await this.handleEvent(ws, parsed.data);
          break;

        case 'heartbeat':
          await this.handleHeartbeat(ws);
          break;

        case 'ack':
          await this.handleAck(ws, parsed.data);
          break;

        default:
          ws.send(frameMessage('unknown', { type: parsed.type }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(wsError('INTERNAL_ERROR', 'Failed to process message'));
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const clientId = this.getClientId(ws);
    if (clientId) {
      this.connections.removeClient(clientId);

      // Update session status if no more connections
      if (this.connections.size === 0) {
        await this.db.updateSession(this.sessionId, {
          last_seen_at: now(),
          status: 'idle'
        });
      }
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('Cursor WebSocket error:', error);
    const clientId = this.getClientId(ws);
    if (clientId) {
      this.connections.removeClient(clientId);
    }

    // Mark session as error if critical
    await this.db.updateSession(this.sessionId, {
      status: 'error',
      last_seen_at: now()
    });
  }

  /**
   * Handle hello message
   */
  private async handleHello(ws: WebSocket, data: any): Promise<void> {
    ws.send(frameMessage('welcome', {
      sessionId: this.sessionId,
      version: '1.0.0',
      features: ['events', 'interventions', 'policies']
    }));
  }

  /**
   * Handle event logging with policy checks
   */
  private async handleEvent(ws: WebSocket, data: any): Promise<void> {
    // Store event in D1
    const eventId = await this.db.createEvent({
      session_fk: this.sessionId,
      ts: now(),
      type: data.type || 'unknown',
      level: data.level || null,
      payload: JSON.stringify(data.payload || {}),
      tags: data.tags ? JSON.stringify(data.tags) : null
    });

    // Check policies
    const interventions = await checkPolicies(this.env, this.sessionId, data);

    // Send response with any triggered interventions
    ws.send(frameMessage('event_logged', {
      eventId,
      interventions: interventions.map(i => ({
        id: i.id,
        ruleId: i.rule_id,
        decision: i.decision,
        instruction: i.instruction,
        aiReasoning: i.ai_reasoning
      }))
    }));

    // Broadcast interventions to all clients
    if (interventions.length > 0) {
      for (const intervention of interventions) {
        this.connections.broadcast(frameMessage('intervention', {
          id: intervention.id,
          ruleId: intervention.rule_id,
          decision: intervention.decision,
          instruction: intervention.instruction,
          aiReasoning: intervention.ai_reasoning
        }));
      }
    }
  }

  /**
   * Handle heartbeat
   */
  private async handleHeartbeat(ws: WebSocket): Promise<void> {
    await this.db.updateSession(this.sessionId, {
      last_seen_at: now()
    });

    ws.send(frameMessage('heartbeat_ack', {
      timestamp: now()
    }));
  }

  /**
   * Handle intervention acknowledgement
   */
  private async handleAck(ws: WebSocket, data: any): Promise<void> {
    const { interventionId, status, result } = data;

    await this.db.updateIntervention(interventionId, {
      delivered: 1,
      result: result ? JSON.stringify(result) : null
    });

    ws.send(frameMessage('ack_received', {
      interventionId,
      status
    }));
  }

  /**
   * Get client ID from WebSocket
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
   * Alarm handler for session monitoring
   */
  async alarm(): Promise<void> {
    // Check for stale sessions (no activity for 1 hour)
    const session = await this.db.getSession(this.sessionId);

    if (session) {
      const lastSeen = new Date(session.last_seen_at);
      const hourAgo = Date.now() - 60 * 60 * 1000;

      if (lastSeen.getTime() < hourAgo && session.status === 'active') {
        await this.db.updateSession(this.sessionId, {
          status: 'idle',
          last_seen_at: now()
        });
      }
    }

    // Cleanup stale connections
    this.connections.cleanup();

    // Schedule next alarm
    await this.ctx.storage.setAlarm(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
}
