import { IncomingMessage, ServerResponse } from 'http';
import { getAdminPanelHtml } from './admin-panel.js';
import { extractTokenFromRequest, verifyToken } from './auth.js';
import { config } from './config.js';
import { RbacManager } from './rbac.js';
import { RoomManager } from './room-manager.js';
import { StorageEngine } from './storage.js';

function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const str = Buffer.concat(chunks).toString('utf-8');
        const parsed = str ? JSON.parse(str) : {};
        resolve(parsed as T);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function handleHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  roomManager: RoomManager,
  storage: StorageEngine,
  rbac: RbacManager
): void {
  // CORS Headers
  if (config.corsEnabled) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Web Admin Panel HTML
  if (pathname === '/admin' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getAdminPanelHtml());
    return;
  }

  // 2. Health check
  if (pathname === '/health' || pathname === '/api/v1/health') {
    sendJson(res, 200, {
      status: 'ok',
      name: 'Kurotsuki Sync Relay Server',
      version: config.version,
      uptime: Math.floor(process.uptime()),
      timestamp: Date.now(),
    });
    return;
  }

  // Helper to verify admin permissions
  const checkAdminAuth = (): boolean => {
    const token = extractTokenFromRequest(req);
    // If no authToken set on server, allow open access
    if (!config.authToken || config.authToken.trim() === '') return true;
    return rbac.isAdmin(token);
  };

  // 2b. Verify auth status cleanly (no 401 spam)
  if (pathname === '/api/v1/auth/verify' && req.method === 'GET') {
    const authRequired = !!(config.authToken && config.authToken.trim() !== '');
    const isAdmin = checkAdminAuth();
    sendJson(res, 200, {
      authRequired,
      authenticated: isAdmin,
      isAdmin,
      version: config.version,
    });
    return;
  }

  // 3. Server stats
  if (pathname === '/api/v1/stats') {
    const token = extractTokenFromRequest(req);
    if (!verifyToken(token) && !rbac.isAdmin(token)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    const stats = roomManager.getStats();
    sendJson(res, 200, {
      status: 'ok',
      version: config.version,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      ...stats,
    });
    return;
  }

  // 4. Multi-Vault Management API
  // GET /api/v1/vaults
  if (pathname === '/api/v1/vaults' && req.method === 'GET') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaults = rbac.getVaults().map((v) => {
      const stats = storage.getVaultStats(v.id);
      const activePeers = roomManager.getSessionsForVault(v.id).length;
      return {
        ...v,
        stats,
        activePeers,
      };
    });

    sendJson(res, 200, vaults);
    return;
  }

  // POST /api/v1/vaults
  if (pathname === '/api/v1/vaults' && req.method === 'POST') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    readJsonBody<any>(req)
      .then((body) => {
        const vault = rbac.createVault({
          id: body.id,
          name: body.name,
          description: body.description,
          quotaMB: body.quotaMB,
          defaultRole: body.defaultRole,
        });
        sendJson(res, 201, vault);
      })
      .catch((err: any) => {
        sendJson(res, 400, { error: err.message || 'Invalid vault payload' });
      });
    return;
  }

  // PUT /api/v1/vaults/:vaultId
  const vaultMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)$/);
  if (vaultMatch && req.method === 'PUT') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultMatch[1]);
    readJsonBody<any>(req)
      .then((body) => {
        const updated = rbac.updateVault(vaultId, body);
        sendJson(res, 200, updated);
      })
      .catch((err: any) => {
        sendJson(res, 400, { error: err.message || 'Failed to update vault' });
      });
    return;
  }

  // DELETE /api/v1/vaults/:vaultId
  if (vaultMatch && req.method === 'DELETE') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultMatch[1]);
    try {
      rbac.deleteVault(vaultId);
      storage.deleteVault(vaultId);
      sendJson(res, 200, { success: true, message: `Vault ${vaultId} deleted` });
    } catch (err: any) {
      sendJson(res, 400, { error: err.message || 'Failed to delete vault' });
    }
    return;
  }

  // PUT /api/v1/vaults/:vaultId/access
  const vaultAccessMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)\/access$/);
  if (vaultAccessMatch && req.method === 'PUT') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultAccessMatch[1]);
    readJsonBody<{ tokenId?: string; access?: 'admin' | 'editor' | 'viewer' | 'forbidden' | 'inherit' }>(req)
      .then((body) => {
        if (!body.tokenId || !body.access) {
          sendJson(res, 400, { error: 'tokenId and access are required' });
          return;
        }
        const updatedToken = rbac.setVaultAccessForToken(vaultId, body.tokenId, body.access);
        roomManager.refreshSessionsForToken(body.tokenId, rbac, config.version);
        sendJson(res, 200, { success: true, token: updatedToken });
      })
      .catch((err: any) => {
        sendJson(res, 400, { error: err.message || 'Failed to update vault access' });
      });
    return;
  }

  // POST /api/v1/vaults/:vaultId/compact
  const vaultCompactMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)\/compact$/);
  if (vaultCompactMatch && req.method === 'POST') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultCompactMatch[1]);
    try {
      const result = storage.compactVault(vaultId);
      sendJson(res, 200, { success: true, ...result });
    } catch (err: any) {
      sendJson(res, 400, { error: err.message || 'Failed to compact vault' });
    }
    return;
  }

  // GET /api/v1/vaults/:vaultId/docs
  const vaultDocsMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)\/docs$/);
  if (vaultDocsMatch && req.method === 'GET') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultDocsMatch[1]);
    const docs = storage.listDocs(vaultId);
    sendJson(res, 200, docs);
    return;
  }

  // GET /api/v1/vaults/:vaultId/attachments
  const vaultAttMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)\/attachments$/);
  if (vaultAttMatch && req.method === 'GET') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultAttMatch[1]);
    const attachments = storage.listAttachments(vaultId);
    sendJson(res, 200, attachments);
    return;
  }

  // DELETE /api/v1/vaults/:vaultId/attachments/:filePath
  const vaultDeleteAttMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)\/attachments\/(.+)$/);
  if (vaultDeleteAttMatch && req.method === 'DELETE') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const vaultId = decodeURIComponent(vaultDeleteAttMatch[1]);
    const filePath = decodeURIComponent(vaultDeleteAttMatch[2]);
    const deleted = storage.deleteAttachment(vaultId, filePath);
    sendJson(res, 200, { success: deleted });
    return;
  }

  // GET /api/v1/vaults/:vaultId/export (Vault Backup & Export)
  const vaultExportMatch = pathname.match(/^\/api\/v1\/vaults\/([^\/]+)\/export$/);
  if (vaultExportMatch && req.method === 'GET') {
    const token = extractTokenFromRequest(req);
    if (!verifyToken(token) && !rbac.isAdmin(token)) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    const vaultId = decodeURIComponent(vaultExportMatch[1]);
    const bundle = storage.exportVault(vaultId);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${vaultId}-backup-${Date.now()}.json"`,
    });
    res.end(JSON.stringify(bundle, null, 2));
    return;
  }

  // 5. Token & RBAC Management APIs
  // GET /api/v1/tokens
  if (pathname === '/api/v1/tokens' && req.method === 'GET') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }
    const tokens = rbac.getTokens();
    sendJson(res, 200, tokens);
    return;
  }

  // POST /api/v1/tokens
  if (pathname === '/api/v1/tokens' && req.method === 'POST') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    readJsonBody<any>(req)
      .then((body) => {
        const token = rbac.createToken({
          name: body.name,
          role: body.role || 'editor',
          token: body.token,
          vaultAccess: body.vaultAccess,
        });
        sendJson(res, 201, token);
      })
      .catch((err: any) => {
        sendJson(res, 400, { error: err.message || 'Failed to create token' });
      });
    return;
  }

  // DELETE /api/v1/tokens/:tokenId
  const tokenDeleteMatch = pathname.match(/^\/api\/v1\/tokens\/([^\/]+)$/);
  if (tokenDeleteMatch && req.method === 'DELETE') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const tokenId = decodeURIComponent(tokenDeleteMatch[1]);
    const deleted = rbac.deleteToken(tokenId);
    const disconnectedSessions = deleted ? roomManager.disconnectByTokenId(tokenId) : 0;
    sendJson(res, 200, { success: deleted, disconnectedSessions });
    return;
  }

  // 6. Peers & Sockets Monitor
  // GET /api/v1/peers
  if (pathname === '/api/v1/peers' && req.method === 'GET') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const peers = roomManager.getAllSessions().map((s) => ({
      id: s.id,
      user: s.user,
      role: s.role,
      tokenId: s.tokenId || null,
      tokenName: s.tokenName || null,
      vaultId: s.vaultId,
      activeFile: s.activeFile || null,
      ip: s.ip,
      connectedAt: s.connectedAt,
      lastPing: s.lastPing,
    }));
    sendJson(res, 200, peers);
    return;
  }

  // PUT /api/v1/tokens/:tokenId
  const tokenUpdateMatch = pathname.match(/^\/api\/v1\/tokens\/([^\/]+)$/);
  if (tokenUpdateMatch && req.method === 'PUT') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const tokenId = decodeURIComponent(tokenUpdateMatch[1]);
    readJsonBody<any>(req)
      .then((body) => {
        const updated = rbac.updateToken(tokenId, {
          name: body.name,
          role: body.role,
          token: body.token,
          regenerate: body.regenerate,
          vaultAccess: body.vaultAccess,
        });
        if (body.regenerate || body.token) {
          roomManager.disconnectByTokenId(tokenId);
        } else {
          roomManager.refreshSessionsForToken(tokenId, rbac, config.version);
        }
        sendJson(res, 200, updated);
      })
      .catch((err: any) => {
        sendJson(res, 400, { error: err.message || 'Failed to update token' });
      });
    return;
  }

  // POST /api/v1/peers/:sessionId/disconnect
  const peerDisconnectMatch = pathname.match(/^\/api\/v1\/peers\/([^\/]+)\/disconnect$/);
  if (peerDisconnectMatch && req.method === 'POST') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const sessionId = decodeURIComponent(peerDisconnectMatch[1]);
    const ok = roomManager.disconnectSession(sessionId);
    sendJson(res, 200, { success: ok });
    return;
  }

  // 7. Activity Logs
  if (pathname === '/api/v1/activity' && req.method === 'GET') {
    if (!checkAdminAuth()) {
      sendJson(res, 401, { error: 'Unauthorized: Admin role required' });
      return;
    }

    const logs = rbac.getActivityLogs();
    sendJson(res, 200, logs);
    return;
  }

  // 8. Attachments API: /api/v1/attachments/:vaultId/<path...>
  const attachmentMatch = pathname.match(/^\/api\/v1\/attachments\/([^\/]+)\/(.+)$/);
  if (attachmentMatch) {
    const vaultId = decodeURIComponent(attachmentMatch[1]);
    const filePath = decodeURIComponent(attachmentMatch[2]);
    const token = extractTokenFromRequest(req);

    // RBAC: Verify access to this vault
    const { role } = rbac.resolveRole(token, vaultId);
    if (!role) {
      sendJson(res, 401, { error: 'Unauthorized: Access denied to vault ' + vaultId });
      return;
    }

    if (req.method === 'PUT') {
      // RBAC: Block viewers from uploading attachments!
      if (role === 'viewer') {
        sendJson(res, 403, { error: 'Forbidden: Read-only accounts cannot upload attachments' });
        return;
      }

      // Check vault storage quota
      const vaultConfig = rbac.getVault(vaultId);
      const quotaMB = vaultConfig?.quotaMB || 500;
      const currentStats = storage.getVaultStats(vaultId);
      const maxQuotaBytes = quotaMB * 1024 * 1024;

      const chunks: Buffer[] = [];
      let totalBytes = 0;
      let aborted = false;
      const maxBytes = config.maxPayloadMB * 1024 * 1024;

      req.on('data', (chunk) => {
        if (aborted) return;
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          aborted = true;
          sendJson(res, 413, { error: 'Payload too large (exceeds maxPayloadMB)' });
          req.destroy();
          return;
        }

        if (currentStats.totalSizeBytes + totalBytes > maxQuotaBytes) {
          aborted = true;
          sendJson(res, 413, { error: `Storage quota exceeded for vault "${vaultId}" (${quotaMB}MB limit)` });
          req.destroy();
          return;
        }

        chunks.push(chunk);
      });

      req.on('end', () => {
        if (aborted) return;
        const buffer = Buffer.concat(chunks);
        storage.saveAttachment(vaultId, filePath, buffer);
        sendJson(res, 200, { success: true, path: filePath, bytes: buffer.length });
      });
      return;
    }

    if (req.method === 'GET') {
      const data = storage.getAttachment(vaultId, filePath);
      if (!data) {
        sendJson(res, 404, { error: 'Attachment not found' });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length,
      });
      res.end(data);
      return;
    }
  }

  // 9. Default 404
  sendJson(res, 404, { error: 'Not found' });
}
