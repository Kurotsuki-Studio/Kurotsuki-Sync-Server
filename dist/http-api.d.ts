import { IncomingMessage, ServerResponse } from 'http';
import { RoomManager } from './room-manager.js';
import { StorageEngine } from './storage.js';
export declare function handleHttpRequest(req: IncomingMessage, res: ServerResponse, roomManager: RoomManager, storage: StorageEngine): void;
