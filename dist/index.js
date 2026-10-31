"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const http_1 = __importDefault(require("http"));
const config_js_1 = require("./config.js");
const http_api_js_1 = require("./http-api.js");
const room_manager_js_1 = require("./room-manager.js");
const storage_js_1 = require("./storage.js");
const ws_server_js_1 = require("./ws-server.js");
function createServer() {
    const storage = new storage_js_1.StorageEngine(config_js_1.config.storageDir);
    const roomManager = new room_manager_js_1.RoomManager(storage);
    const httpServer = http_1.default.createServer((req, res) => {
        (0, http_api_js_1.handleHttpRequest)(req, res, roomManager, storage);
    });
    const wss = (0, ws_server_js_1.setupWebSocketServer)(httpServer, roomManager);
    return { httpServer, wss, roomManager, storage };
}
// Start standalone if invoked directly
if (process.env.NODE_ENV !== 'test') {
    const { httpServer } = createServer();
    httpServer.listen(config_js_1.config.port, config_js_1.config.host, () => {
        console.log(`🌙 Kurotsuki Sync Relay Server v${config_js_1.config.version}`);
        console.log(`📡 Listening on http://${config_js_1.config.host}:${config_js_1.config.port}`);
        console.log(`📂 Storage directory: ${config_js_1.config.storageDir}`);
        console.log(`🔒 Authentication: ${config_js_1.config.authToken ? 'Enabled (Bearer token required)' : 'Disabled (Open access)'}`);
    });
    const shutdown = () => {
        console.log('\nShutting down Kurotsuki Relay Server...');
        httpServer.close(() => {
            console.log('Server stopped gracefully.');
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
//# sourceMappingURL=index.js.map