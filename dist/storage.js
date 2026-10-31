"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageEngine = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Y = __importStar(require("yjs"));
const config_js_1 = require("./config.js");
class StorageEngine {
    baseDir;
    constructor(baseDir = config_js_1.config.storageDir) {
        this.baseDir = baseDir;
        this.ensureDir(this.baseDir);
    }
    ensureDir(dirPath) {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
        }
    }
    getVaultDir(vaultId) {
        const safeVaultId = vaultId.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const vaultDir = path_1.default.join(this.baseDir, 'vaults', safeVaultId);
        this.ensureDir(vaultDir);
        return vaultDir;
    }
    getDocFilePath(vaultId, docPath) {
        const vaultDir = this.getVaultDir(vaultId);
        const docsDir = path_1.default.join(vaultDir, 'docs');
        this.ensureDir(docsDir);
        // Hash or sanitize docPath to prevent filesystem traversal while keeping human readable prefix
        const hash = crypto_1.default.createHash('sha256').update(docPath).digest('hex').substring(0, 16);
        const safeName = docPath.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 40);
        return path_1.default.join(docsDir, `${safeName}_${hash}.ydoc`);
    }
    loadDoc(vaultId, docPath, doc) {
        const filePath = this.getDocFilePath(vaultId, docPath);
        if (fs_1.default.existsSync(filePath)) {
            try {
                const data = fs_1.default.readFileSync(filePath);
                Y.applyUpdate(doc, new Uint8Array(data));
                return true;
            }
            catch (err) {
                console.error(`[Storage] Failed to read YDoc from ${filePath}:`, err);
            }
        }
        return false;
    }
    saveDoc(vaultId, docPath, doc) {
        const filePath = this.getDocFilePath(vaultId, docPath);
        try {
            const state = Y.encodeStateAsUpdate(doc);
            fs_1.default.writeFileSync(filePath, Buffer.from(state));
        }
        catch (err) {
            console.error(`[Storage] Failed to write YDoc to ${filePath}:`, err);
        }
    }
    deleteDoc(vaultId, docPath) {
        const filePath = this.getDocFilePath(vaultId, docPath);
        if (fs_1.default.existsSync(filePath)) {
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (err) {
                console.error(`[Storage] Failed to delete YDoc ${filePath}:`, err);
            }
        }
    }
    getAttachmentPath(vaultId, relativePath) {
        const vaultDir = this.getVaultDir(vaultId);
        const attachmentsDir = path_1.default.join(vaultDir, 'attachments');
        this.ensureDir(attachmentsDir);
        // Prevent directory traversal
        const safePath = path_1.default.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
        const fullPath = path_1.default.join(attachmentsDir, safePath);
        this.ensureDir(path_1.default.dirname(fullPath));
        return fullPath;
    }
    saveAttachment(vaultId, relativePath, data) {
        const targetPath = this.getAttachmentPath(vaultId, relativePath);
        fs_1.default.writeFileSync(targetPath, data);
    }
    getAttachment(vaultId, relativePath) {
        const targetPath = this.getAttachmentPath(vaultId, relativePath);
        if (fs_1.default.existsSync(targetPath)) {
            return fs_1.default.readFileSync(targetPath);
        }
        return null;
    }
    listFiles(vaultId) {
        const vaultDir = this.getVaultDir(vaultId);
        const docsDir = path_1.default.join(vaultDir, 'docs');
        const results = [];
        if (fs_1.default.existsSync(docsDir)) {
            const entries = fs_1.default.readdirSync(docsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.ydoc')) {
                    const stat = fs_1.default.statSync(path_1.default.join(docsDir, entry.name));
                    results.push({
                        path: entry.name,
                        mtime: stat.mtimeMs,
                    });
                }
            }
        }
        return results;
    }
}
exports.StorageEngine = StorageEngine;
//# sourceMappingURL=storage.js.map