import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { RoomManager } from './room-manager.js';
export declare function setupWebSocketServer(httpServer: Server, roomManager: RoomManager): WebSocketServer;
