"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const Y = __importStar(require("yjs"));
class RoomManager {
    rooms = new Map();
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    getOrCreateRoom(vaultId) {
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
    joinRoom(vaultId, session) {
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
    leaveRoom(session) {
        const room = this.rooms.get(session.vaultId);
        if (!room)
            return;
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
    getOrCreateDoc(vaultId, docPath) {
        const room = this.getOrCreateRoom(vaultId);
        let doc = room.docs.get(docPath);
        if (!doc) {
            doc = new Y.Doc();
            this.storage.loadDoc(vaultId, docPath, doc);
            room.docs.set(docPath, doc);
        }
        return doc;
    }
    applyUpdate(vaultId, docPath, update, senderSession) {
        const doc = this.getOrCreateDoc(vaultId, docPath);
        Y.applyUpdate(doc, update);
        // Schedule debounced save to storage
        this.scheduleDocSave(vaultId, docPath, doc);
        // Broadcast to other peers in room
        const b64 = Buffer.from(update).toString('base64');
        this.broadcastToRoom(vaultId, {
            type: 'yjs_sync',
            path: docPath,
            update: b64,
        }, senderSession);
    }
    updateAwareness(vaultId, states, senderSession) {
        const room = this.getOrCreateRoom(vaultId);
        for (const state of states) {
            room.awareness.set(state.clientId, state);
        }
        this.broadcastToRoom(vaultId, {
            type: 'awareness_update',
            states: Array.from(room.awareness.values()),
        }, senderSession);
    }
    broadcastFileEvent(vaultId, msg, senderSession) {
        if (msg.type === 'file_event' && msg.action === 'delete') {
            // Remove doc from memory and storage if deleted
            const room = this.rooms.get(vaultId);
            if (room) {
                room.docs.delete(msg.path);
            }
            this.storage.deleteDoc(vaultId, msg.path);
        }
        this.broadcastToRoom(vaultId, msg, senderSession);
    }
    broadcastToRoom(vaultId, msg, excludeSession) {
        const room = this.rooms.get(vaultId);
        if (!room)
            return;
        const payload = JSON.stringify(msg);
        for (const session of room.sessions) {
            if (excludeSession && session === excludeSession)
                continue;
            if (session.ws.readyState === session.ws.OPEN) {
                try {
                    session.ws.send(payload);
                }
                catch (err) {
                    console.error(`[RoomManager] Failed to send message to session ${session.id}:`, err);
                }
            }
        }
    }
    sendToSession(session, msg) {
        if (session.ws.readyState === session.ws.OPEN) {
            try {
                session.ws.send(JSON.stringify(msg));
            }
            catch (err) {
                console.error(`[RoomManager] Failed to send message to session ${session.id}:`, err);
            }
        }
    }
    scheduleDocSave(vaultId, docPath, doc) {
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
    getStats() {
        let totalConnections = 0;
        const roomStats = [];
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
exports.RoomManager = RoomManager;
//# sourceMappingURL=room-manager.js.map