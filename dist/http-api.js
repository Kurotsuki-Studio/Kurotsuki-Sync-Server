"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHttpRequest = handleHttpRequest;
const auth_js_1 = require("./auth.js");
const config_js_1 = require("./config.js");
function handleHttpRequest(req, res, roomManager, storage) {
    // CORS Headers
    if (config_js_1.config.corsEnabled) {
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
    // 1. Health check
    if (pathname === '/health' || pathname === '/api/v1/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            name: 'Kurotsuki Sync Relay Server',
            version: config_js_1.config.version,
            uptime: Math.floor(process.uptime()),
            timestamp: Date.now(),
        }));
        return;
    }
    // 2. Server stats
    if (pathname === '/api/v1/stats') {
        const token = (0, auth_js_1.extractTokenFromRequest)(req);
        if (!(0, auth_js_1.verifyToken)(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        const stats = roomManager.getStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            version: config_js_1.config.version,
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
            ...stats,
        }));
        return;
    }
    // 3. Attachments API: /api/v1/attachments/:vaultId/<path...>
    const attachmentMatch = pathname.match(/^\/api\/v1\/attachments\/([^\/]+)\/(.+)$/);
    if (attachmentMatch) {
        const token = (0, auth_js_1.extractTokenFromRequest)(req);
        if (!(0, auth_js_1.verifyToken)(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        const vaultId = decodeURIComponent(attachmentMatch[1]);
        const filePath = decodeURIComponent(attachmentMatch[2]);
        if (req.method === 'PUT') {
            const chunks = [];
            let totalBytes = 0;
            const maxBytes = config_js_1.config.maxPayloadMB * 1024 * 1024;
            req.on('data', (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes > maxBytes) {
                    res.writeHead(413, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Payload too large' }));
                    req.destroy();
                    return;
                }
                chunks.push(chunk);
            });
            req.on('end', () => {
                const buffer = Buffer.concat(chunks);
                storage.saveAttachment(vaultId, filePath, buffer);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: filePath, bytes: buffer.length }));
            });
            return;
        }
        if (req.method === 'GET') {
            const data = storage.getAttachment(vaultId, filePath);
            if (!data) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Attachment not found' }));
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
    // 4. Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
}
//# sourceMappingURL=http-api.js.map