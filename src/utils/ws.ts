/**
 * WebSocket utilities for Durable Objects
 */

export interface WSClient {
  ws: WebSocket;
  id: string;
  metadata?: any;
}

/**
 * Broadcast a message to all connected WebSocket clients
 */
export function broadcast(clients: WSClient[], message: any): void {
  const payload = typeof message === 'string' ? message : JSON.stringify(message);

  for (const client of clients) {
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    } catch (error) {
      console.error(`Failed to send to client ${client.id}:`, error);
    }
  }
}

/**
 * Send a message to a specific WebSocket client
 */
export function sendToClient(client: WSClient, message: any): boolean {
  try {
    if (client.ws.readyState === WebSocket.OPEN) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      client.ws.send(payload);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to send to client ${client.id}:`, error);
    return false;
  }
}

/**
 * Frame a WebSocket message with type and data
 */
export function frameMessage(type: string, data: any): string {
  return JSON.stringify({ type, data, timestamp: new Date().toISOString() });
}

/**
 * Parse incoming WebSocket message
 */
export function parseMessage(rawMessage: string): { type: string; data: any } | null {
  try {
    const parsed = JSON.parse(rawMessage);
    return {
      type: parsed.type || 'unknown',
      data: parsed.data || parsed
    };
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
}

/**
 * Exponential backoff retry logic
 */
export class RetryStrategy {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(maxAttempts = 5, baseDelay = 1000, maxDelay = 30000) {
    this.maxAttempts = maxAttempts;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  canRetry(): boolean {
    return this.attempt < this.maxAttempts;
  }

  getDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempt),
      this.maxDelay
    );
    this.attempt++;
    return delay;
  }

  reset(): void {
    this.attempt = 0;
  }
}

/**
 * WebSocket connection state manager
 */
export class WSConnectionManager {
  private clients: Map<string, WSClient> = new Map();

  addClient(id: string, ws: WebSocket, metadata?: any): void {
    this.clients.set(id, { id, ws, metadata });
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  getClient(id: string): WSClient | undefined {
    return this.clients.get(id);
  }

  getAllClients(): WSClient[] {
    return Array.from(this.clients.values());
  }

  getActiveClients(): WSClient[] {
    return Array.from(this.clients.values()).filter(
      client => client.ws.readyState === WebSocket.OPEN
    );
  }

  broadcast(message: any): void {
    broadcast(this.getActiveClients(), message);
  }

  cleanup(): void {
    const stale: string[] = [];
    for (const [id, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.CLOSED || client.ws.readyState === WebSocket.CLOSING) {
        stale.push(id);
      }
    }
    stale.forEach(id => this.clients.delete(id));
  }

  get size(): number {
    return this.clients.size;
  }
}

/**
 * Create error response for WebSocket
 */
export function wsError(code: string, message: string): string {
  return frameMessage('error', { code, message });
}

/**
 * Create success response for WebSocket
 */
export function wsSuccess(data: any): string {
  return frameMessage('success', data);
}
