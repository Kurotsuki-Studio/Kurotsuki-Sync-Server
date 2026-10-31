import * as Y from 'yjs';
import { StorageEngine } from './storage.js';
import { ClientSession, PeerAwarenessState, WSMessage } from './types.js';
interface Room {
    vaultId: string;
    sessions: Set<ClientSession>;
    docs: Map<string, Y.Doc>;
    awareness: Map<number, PeerAwarenessState>;
    saveDebounceTimers: Map<string, NodeJS.Timeout>;
}
export declare class RoomManager {
    private rooms;
    private storage;
    constructor(storage: StorageEngine);
    getOrCreateRoom(vaultId: string): Room;
    joinRoom(vaultId: string, session: ClientSession): void;
    leaveRoom(session: ClientSession): void;
    getOrCreateDoc(vaultId: string, docPath: string): Y.Doc;
    applyUpdate(vaultId: string, docPath: string, update: Uint8Array, senderSession?: ClientSession): void;
    updateAwareness(vaultId: string, states: PeerAwarenessState[], senderSession?: ClientSession): void;
    broadcastFileEvent(vaultId: string, msg: WSMessage, senderSession?: ClientSession): void;
    broadcastToRoom(vaultId: string, msg: WSMessage, excludeSession?: ClientSession): void;
    sendToSession(session: ClientSession, msg: WSMessage): void;
    private scheduleDocSave;
    getStats(): {
        activeRooms: number;
        totalConnections: number;
        rooms: {
            vaultId: string;
            peers: number;
            activeDocs: number;
        }[];
    };
}
export {};
