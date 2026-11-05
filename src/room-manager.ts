import * as Y from 'yjs';
import { StorageEngine } from './storage.js';
import { ClientSession, PeerAwarenessState, WSMessage } from './types.js';

export function normalizeDocPath(path: string | null | undefined): string {
  if (!path) return '';
  return path.normalize('NFC').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

interface Room {
  vaultId: string;
  sessions: Set<ClientSession>;
  docs: Map<string, Y.Doc>;
  awareness: Map<number, PeerAwarenessState>;
  saveDebounceTimers: Map<string, NodeJS.Timeout>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private storage: StorageEngine;

  constructor(storage: StorageEngine) {
    this.storage = storage;
  }

  public getStorage(): StorageEngine {
    return this.storage;
  }

  public getOrCreateRoom(vaultId: string): Room {
    let room = this.rooms.get(vaultId);
    if (!room) {
      room = {
        vaultId,
        sessions: new Set(),
        docs: new Map(),
        awareness: new Map(),
        saveDebounceTimers: new Map(),
      };
      this.rooms.set(vaultId, room);
    }
    return room;
  }

  public joinRoom(vaultId: string, session: ClientSession): void {
    const room = this.getOrCreateRoom(vaultId);
    room.sessions.add(session);

    // Send current awareness states to new client
    const allAwareness = Array.from(room.awareness.values());
    if (allAwareness.length > 0) {
      this.sendToSession(session, {
        type: 'awareness_update',
        states: allAwareness,
      });
    }
  }

  public leaveRoom(session: ClientSession): void {
    const room = this.rooms.get(session.vaultId);
    if (!room) return;

    room.sessions.delete(session);
    room.awareness.delete(session.clientId);

    // Broadcast updated awareness to remaining clients
    this.broadcastToRoom(session.vaultId, {
      type: 'awareness_update',
      states: Array.from(room.awareness.values()),
    });

    // Cleanup empty room docs from memory after inactivity if no sessions
    if (room.sessions.size === 0) {
      // Flush any pending saves
      for (const [docPath, timer] of room.saveDebounceTimers.entries()) {
        clearTimeout(timer);
        const doc = room.docs.get(docPath);
        if (doc) {
          this.storage.saveDoc(room.vaultId, docPath, doc);
        }
      }
      room.saveDebounceTimers.clear();
      room.docs.clear();
      this.rooms.delete(session.vaultId);
    }
  }

  public getOrCreateDoc(vaultId: string, docPath: string): Y.Doc {
    const cleanPath = normalizeDocPath(docPath);
    const room = this.getOrCreateRoom(vaultId);
    let doc = room.docs.get(cleanPath);
    if (!doc) {
      doc = new Y.Doc();
      this.storage.loadDoc(vaultId, cleanPath, doc);
      room.docs.set(cleanPath, doc);
    }
    return doc;
  }

  public applyUpdate(
    vaultId: string,
    docPath: string,
    update: Uint8Array,
    senderSession?: ClientSession,
    b64Update?: string
  ): boolean {
    const cleanPath = normalizeDocPath(docPath);
    // RBAC: Block viewers from modifying CRDT documents
    if (senderSession && senderSession.role === 'viewer') {
      this.sendToSession(senderSession, {
        type: 'error',
        message: 'Permission denied: This vault is read-only for your account.',
        code: 'ERR_READONLY',
      });
      return false;
    }

    const doc = this.getOrCreateDoc(vaultId, cleanPath);
    Y.applyUpdate(doc, update);

    // Schedule debounced save to storage
    this.scheduleDocSave(vaultId, cleanPath, doc);

    // Broadcast to other peers in room (use existing b64 without re-encoding if available)
    const b64 = b64Update || Buffer.from(update).toString('base64');
    this.broadcastToRoom(
      vaultId,
      {
        type: 'yjs_sync',
        path: cleanPath,
        update: b64,
      },
      senderSession
    );
    return true;
  }

  public updateAwareness(
    vaultId: string,
    states: PeerAwarenessState[],
    senderSession?: ClientSession
  ): void {
    const room = this.getOrCreateRoom(vaultId);
    for (const state of states) {
      if (state.activeFile) {
        state.activeFile = normalizeDocPath(state.activeFile);
      }
      room.awareness.set(state.clientId, state);
    }

    this.broadcastToRoom(
      vaultId,
      {
        type: 'awareness_update',
        states: Array.from(room.awareness.values()),
      },
      senderSession
    );
  }

  public broadcastFileEvent(vaultId: string, msg: WSMessage, senderSession?: ClientSession): boolean {
    if (senderSession && senderSession.role === 'viewer') {
      this.sendToSession(senderSession, {
        type: 'error',
        message: 'Permission denied: Read-only accounts cannot modify files.',
        code: 'ERR_READONLY',
      });
      return false;
    }

    if (msg.type === 'file_event') {
      const cleanPath = normalizeDocPath(msg.path);
      const cleanOldPath = msg.oldPath ? normalizeDocPath(msg.oldPath) : undefined;
      const room = this.rooms.get(vaultId);

      if (msg.action === 'delete') {
        if (room) {
          room.docs.delete(cleanPath);
        }
        this.storage.deleteDoc(vaultId, cleanPath);
        this.storage.deleteAttachment(vaultId, cleanPath);
      } else if (msg.action === 'rename' && cleanOldPath) {
        if (room) {
          const doc = room.docs.get(cleanOldPath);
          if (doc) {
            room.docs.delete(cleanOldPath);
            room.docs.set(cleanPath, doc);
          }
        }
        this.storage.renameDoc(vaultId, cleanOldPath, cleanPath);
        this.storage.renameAttachment(vaultId, cleanOldPath, cleanPath);
      }

      msg.path = cleanPath;
      if (cleanOldPath) {
        msg.oldPath = cleanOldPath;
      }
    }
    this.broadcastToRoom(vaultId, msg, senderSession);
    return true;
  }

  public broadcastToRoom(
    vaultId: string,
    msg: WSMessage,
    excludeSession?: ClientSession
  ): void {
    const room = this.rooms.get(vaultId);
    if (!room) return;

    const payload = JSON.stringify(msg);
    for (const session of room.sessions) {
      if (excludeSession && session === excludeSession) continue;
      if (session.ws.readyState === session.ws.OPEN) {
        try {
          session.ws.send(payload);
        } catch (err) {
          console.error(`[RoomManager] Failed to send message to session ${session.id}:`, err);
        }
      }
    }
  }

  public sendToSession(session: ClientSession, msg: WSMessage): void {
    if (session.ws.readyState === session.ws.OPEN) {
      try {
        session.ws.send(JSON.stringify(msg));
      } catch (err) {
        console.error(`[RoomManager] Failed to send message to session ${session.id}:`, err);
      }
    }
  }

  private scheduleDocSave(vaultId: string, docPath: string, doc: Y.Doc): void {
    const room = this.getOrCreateRoom(vaultId);
    const existing = room.saveDebounceTimers.get(docPath);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      room.saveDebounceTimers.delete(docPath);
      this.storage.saveDoc(vaultId, docPath, doc);
    }, 1000);

    room.saveDebounceTimers.set(docPath, timer);
  }

  public getAllSessions(): ClientSession[] {
    const sessions: ClientSession[] = [];
    for (const room of this.rooms.values()) {
      for (const s of room.sessions) {
        sessions.push(s);
      }
    }
    return sessions;
  }

  public getSessionsForVault(vaultId: string): ClientSession[] {
    const room = this.rooms.get(vaultId);
    return room ? Array.from(room.sessions) : [];
  }

  public disconnectSession(sessionId: string): boolean {
    for (const room of this.rooms.values()) {
      for (const session of room.sessions) {
        if (session.id === sessionId) {
          try {
            session.ws.close(4003, 'Disconnected by Admin');
          } catch {}
          return true;
        }
      }
    }
    return false;
  }

  public getStats() {
    let totalConnections = 0;
    const roomStats: Array<{ vaultId: string; peers: number; activeDocs: number }> = [];

    for (const [vaultId, room] of this.rooms.entries()) {
      totalConnections += room.sessions.size;
      roomStats.push({
        vaultId,
        peers: room.sessions.size,
        activeDocs: room.docs.size,
      });
    }

    return {
      activeRooms: this.rooms.size,
      totalConnections,
      rooms: roomStats,
    };
  }
}
