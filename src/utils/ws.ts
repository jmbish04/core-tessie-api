export function broadcast(ctx: DurableObjectState, originWs: WebSocket, message: string | ArrayBuffer) {
  const sockets = ctx.getWebSockets();
  for (const ws of sockets) {
    if (ws !== originWs) {
      ws.send(message);
    }
  }
}

export function safeClose(ws: WebSocket, code: number, reason: string) {
  try {
    ws.close(code, reason);
  } catch (e) {
    console.error("Error closing WebSocket:", e);
  }
}

export async function afr<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
    try {
        const result = await promise;
        return [result, null];
    } catch (err: any) {
        return [null, err];
    }
}
