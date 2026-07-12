import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

/**
 * Initializes the WebSocket server and hooks into the HTTP server's upgrade event.
 */
export const initWebSocketServer = (server: Server) => {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0] || '';
    if (pathname === '/ws' || pathname === '/ws/') {
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket Server] Client connected');
    ws.on('close', () => {
      console.log('[WebSocket Server] Client disconnected');
    });
    ws.on('error', (err) => {
      console.error('[WebSocket Server] Socket error:', err);
    });
  });
};

/**
 * Broadcasts a payload to all open WebSocket connections.
 */
export const broadcast = (type: string, payload: any) => {
  if (!wss) {
    console.warn('[WebSocket Server] Cannot broadcast: server not initialized.');
    return;
  }
  const message = JSON.stringify({ type, payload });
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      count++;
    }
  });
  console.log(`[WebSocket Server] Broadcasted event "${type}" to ${count} clients.`);
};
