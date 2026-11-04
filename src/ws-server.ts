import { IncomingMessage, Server } from 'http';
import * as Y from 'yjs';
import { RawData, WebSocket, WebSocketServer } from 'ws';
import { extractTokenFromRequest } from './auth.js';
import { config } from './config.js';
import { RbacManager } from './rbac.js';
import { RoomManager } from './room-manager.js';
import { ClientSession, WSMessage } from './types.js';

export function setupWebSocketServer(
  httpServer: Server,
  roomManager: RoomManager,
  rbac: RbacManager
): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress || 'unknown';
    const initialToken = extractTokenFromRequest(req);

    // Initial session placeholder
    const session: ClientSession = {
      id: 'sess_' + Math.random().toString(36).substring(2, 10),
      ws,
      vaultId: 'default-vault',
      user: {
        id: 'usr_' + Math.random().toString(36).substring(2, 8),
        name: 'Anonymous',
        color: '#3b82f6',
      },
      role: 'editor',
      clientId: 0,
      ip,
      connectedAt: Date.now(),
      lastPing: Date.now(),
    };

    // If token in URL query is provided and server requires auth, pre-validate
    if (initialToken !== undefined) {
      const parsedUrl = req.url ? new URL(req.url, 'http://localhost') : null;
      const requestedVault = parsedUrl?.searchParams.get('vaultId') || 'default-vault';
      const { role } = rbac.resolveRole(initialToken, requestedVault);

      if (!role) {
        ws.send(
          JSON.stringify({
            type: 'auth_ack',
            success: false,
            message: 'Invalid authentication token or forbidden vault',
            serverVersion: config.version,
          })
        );
        ws.close(4001, 'Unauthorized');
        return;
      }
      session.role = role;
      session.vaultId = requestedVault;
    }

    // Ping interval to verify socket liveness
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('message', (raw: RawData) => {
      try {
        const text = raw.toString();
        const msg = JSON.parse(text) as WSMessage;

        switch (msg.type) {
          case 'auth': {
            const vaultId = msg.vaultId || session.vaultId || 'default-vault';
            const { role, tokenObj } = rbac.resolveRole(msg.token, vaultId);

            if (!role) {
              ws.send(
                JSON.stringify({
                  type: 'auth_ack',
                  success: false,
                  message: 'Invalid authentication token or forbidden vault access',
                  serverVersion: config.version,
                })
              );
              ws.close(4001, 'Unauthorized');
              return;
            }

            session.vaultId = vaultId;
            session.role = role;
            if (msg.clientInfo) {
              session.user = msg.clientInfo;
            }

            roomManager.joinRoom(session.vaultId, session);

            rbac.addActivityLog({
              type: 'join',
              vaultId: session.vaultId,
              userName: session.user.name,
              details: `User "${session.user.name}" connected with role [${session.role}]`,
            });

            ws.send(
              JSON.stringify({
                type: 'auth_ack',
                success: true,
                role: session.role,
                vaultId: session.vaultId,
                serverVersion: config.version,
              })
            );
            break;
          }

          case 'yjs_sync': {
            if (!msg.path || !msg.update) return;

            // RBAC check
            if (session.role === 'viewer') {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Vault is read-only for your account. Changes not applied.',
                  code: 'ERR_READONLY',
                })
              );
              return;
            }

            const updateBuf = Buffer.from(msg.update, 'base64');
            roomManager.applyUpdate(session.vaultId, msg.path, new Uint8Array(updateBuf), session, msg.update);
            break;
          }

          case 'awareness_update': {
            if (Array.isArray(msg.states)) {
              for (const state of msg.states) {
                session.clientId = state.clientId;
                if (state.activeFile !== undefined) {
                  session.activeFile = state.activeFile;
                }
              }
              roomManager.updateAwareness(session.vaultId, msg.states, session);
            }
            break;
          }

          case 'file_event': {
            // RBAC check
            if (session.role === 'viewer') {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Vault is read-only: File modification events are blocked.',
                  code: 'ERR_READONLY',
                })
              );
              return;
            }

            roomManager.broadcastFileEvent(session.vaultId, msg, session);
            break;
          }

          case 'file_list_request': {
            const files = roomManager.getStorage().listAllFiles(session.vaultId);
            ws.send(
              JSON.stringify({
                type: 'file_list_response',
                files,
              })
            );
            break;
          }

          case 'doc_request': {
            if (!msg.path) return;
            const doc = roomManager.getOrCreateDoc(session.vaultId, msg.path);
            const state = Y.encodeStateAsUpdate(doc);
            ws.send(
              JSON.stringify({
                type: 'doc_response',
                path: msg.path,
                update: Buffer.from(state).toString('base64'),
              })
            );
            break;
          }

          case 'ping': {
            session.lastPing = Date.now();
            ws.send(
              JSON.stringify({
                type: 'pong',
                timestamp: msg.timestamp || Date.now(),
              })
            );
            break;
          }

          case 'pong': {
            session.lastPing = Date.now();
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[WebSocket] Error processing message:', err);
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      roomManager.leaveRoom(session);
      rbac.addActivityLog({
        type: 'leave',
        vaultId: session.vaultId,
        userName: session.user.name,
        details: `User "${session.user.name}" disconnected`,
      });
    });

    ws.on('error', (err) => {
      console.warn(`[WebSocket] Client error (${session.id}):`, err);
    });
  });

  return wss;
}
