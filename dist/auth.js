"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
exports.extractTokenFromRequest = extractTokenFromRequest;
const config_js_1 = require("./config.js");
function verifyToken(token) {
    // If no auth token is required on the server, allow all
    if (!config_js_1.config.authToken || config_js_1.config.authToken.trim() === '') {
        return true;
    }
    if (!token)
        return false;
    return token === config_js_1.config.authToken;
}
function extractTokenFromRequest(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7).trim();
        }
        return authHeader.trim();
    }
    // Check URL query parameters
    if (req.url) {
        try {
            const url = new URL(req.url, 'http://localhost');
            const token = url.searchParams.get('token');
            if (token)
                return token;
        }
        catch {
            // Ignore URL parse error
        }
    }
    return undefined;
}
//# sourceMappingURL=auth.js.map