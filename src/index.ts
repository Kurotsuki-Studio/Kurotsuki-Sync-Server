import http from 'http';
import { config } from './config.js';
import { handleHttpRequest } from './http-api.js';
import { RbacManager } from './rbac.js';
import { RoomManager } from './room-manager.js';
import { StorageEngine } from './storage.js';
import { setupWebSocketServer } from './ws-server.js';

export function createServer() {
  const storage = new StorageEngine(config.storageDir);
  const rbac = new RbacManager(config.storageDir);
  const roomManager = new RoomManager(storage);

  const httpServer = http.createServer((req, res) => {
    handleHttpRequest(req, res, roomManager, storage, rbac);
  });

  const wss = setupWebSocketServer(httpServer, roomManager, rbac);

  return { httpServer, wss, roomManager, storage, rbac };
}

// Start standalone if invoked directly
if (process.env.NODE_ENV !== 'test') {
  const { httpServer } = createServer();

  httpServer.listen(config.port, config.host, () => {
    console.log(`🌙 Kurotsuki Sync Relay Server v${config.version}`);
    console.log(`📡 Listening on http://${config.host}:${config.port}`);
    console.log(`🌐 Admin Panel: http://${config.host}:${config.port}/admin`);
    console.log(`📂 Storage directory: ${config.storageDir}`);
    console.log(`🔒 Authentication: ${config.authToken ? 'Enabled (Admin token active)' : 'Disabled (Open access)'}`);
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
