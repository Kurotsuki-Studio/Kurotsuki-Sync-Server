"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const path_1 = __importDefault(require("path"));
exports.config = {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    storageDir: process.env.STORAGE_DIR ? path_1.default.resolve(process.env.STORAGE_DIR) : path_1.default.resolve(process.cwd(), 'data'),
    authToken: process.env.AUTH_TOKEN || '',
    maxPayloadMB: parseInt(process.env.MAX_PAYLOAD_MB || '50', 10),
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    version: '1.0.0',
};
//# sourceMappingURL=config.js.map