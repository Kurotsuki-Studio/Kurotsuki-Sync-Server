import http from 'http';
import { RoomManager } from './room-manager.js';
import { StorageEngine } from './storage.js';
export declare function createServer(): {
    httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    wss: import("ws").WebSocketServer;
    roomManager: RoomManager;
    storage: StorageEngine;
};
