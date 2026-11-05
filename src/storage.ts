import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import * as Y from 'yjs';
import { config } from './config.js';

export interface VaultStats {
  vaultId: string;
  docCount: number;
  docsSizeBytes: number;
  attachmentCount: number;
  attachmentsSizeBytes: number;
  totalSizeBytes: number;
}

export class StorageEngine {
  private baseDir: string;

  constructor(baseDir: string = config.storageDir) {
    this.baseDir = baseDir;
    this.ensureDir(this.baseDir);
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  public getVaultDir(vaultId: string): string {
    const safeVaultId = vaultId.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const vaultDir = path.join(this.baseDir, 'vaults', safeVaultId);
    this.ensureDir(vaultDir);
    return vaultDir;
  }

  public cleanPath(docPath: string): string {
    if (!docPath) return '';
    return docPath.normalize('NFC').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  }

  private getDocFilePath(vaultId: string, docPath: string): string {
    const cleanDocPath = this.cleanPath(docPath);
    const vaultDir = this.getVaultDir(vaultId);
    const docsDir = path.join(vaultDir, 'docs');
    this.ensureDir(docsDir);

    // Hash or sanitize cleanDocPath to prevent filesystem traversal while keeping human readable prefix
    const hash = crypto.createHash('sha256').update(cleanDocPath).digest('hex').substring(0, 16);
    const safeName = cleanDocPath.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 40);
    return path.join(docsDir, `${safeName}_${hash}.ydoc`);
  }

  public loadDoc(vaultId: string, docPath: string, doc: Y.Doc): boolean {
    const cleanDocPath = this.cleanPath(docPath);
    const filePath = this.getDocFilePath(vaultId, cleanDocPath);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath);
        Y.applyUpdate(doc, new Uint8Array(data));
        return true;
      } catch (err) {
        console.error(`[Storage] Failed to read YDoc from ${filePath}:`, err);
      }
    }
    return false;
  }

  private getDocIndexPath(vaultId: string): string {
    const vaultDir = this.getVaultDir(vaultId);
    return path.join(vaultDir, 'doc-index.json');
  }

  public getDocIndex(vaultId: string): Record<string, { path: string; mtime: number }> {
    const indexPath = this.getDocIndexPath(vaultId);
    if (fs.existsSync(indexPath)) {
      try {
        return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  private saveDocIndex(vaultId: string, index: Record<string, { path: string; mtime: number }>): void {
    const indexPath = this.getDocIndexPath(vaultId);
    try {
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    } catch (e) {
      console.error(`[Storage] Failed to save doc index for ${vaultId}:`, e);
    }
  }

  public saveDoc(vaultId: string, docPath: string, doc: Y.Doc): void {
    const cleanDocPath = this.cleanPath(docPath);
    const filePath = this.getDocFilePath(vaultId, cleanDocPath);
    try {
      const state = Y.encodeStateAsUpdate(doc);
      fs.writeFileSync(filePath, Buffer.from(state));

      const index = this.getDocIndex(vaultId);
      index[cleanDocPath] = { path: cleanDocPath, mtime: Date.now() };
      this.saveDocIndex(vaultId, index);
    } catch (err) {
      console.error(`[Storage] Failed to write YDoc to ${filePath}:`, err);
    }
  }

  public compactVault(vaultId: string): { beforeBytes: number; afterBytes: number; compactedCount: number } {
    const vaultDir = this.getVaultDir(vaultId);
    const docsDir = path.join(vaultDir, 'docs');
    let beforeBytes = 0;
    let afterBytes = 0;
    let compactedCount = 0;

    if (fs.existsSync(docsDir)) {
      const entries = fs.readdirSync(docsDir);
      for (const entry of entries) {
        if (!entry.endsWith('.ydoc')) continue;
        const filePath = path.join(docsDir, entry);
        try {
          const stat = fs.statSync(filePath);
          beforeBytes += stat.size;

          const data = fs.readFileSync(filePath);
          const doc = new Y.Doc();
          Y.applyUpdate(doc, new Uint8Array(data));

          const compacted = Y.encodeStateAsUpdate(doc);
          fs.writeFileSync(filePath, Buffer.from(compacted));
          afterBytes += compacted.length;
          compactedCount++;

          doc.destroy();
        } catch (e) {
          console.error(`[Storage] Failed to compact ${filePath}:`, e);
        }
      }
    }
    return { beforeBytes, afterBytes, compactedCount };
  }

  public deleteDoc(vaultId: string, docPath: string): void {
    const cleanDocPath = this.cleanPath(docPath);
    const filePath = this.getDocFilePath(vaultId, cleanDocPath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error(`[Storage] Failed to delete doc file ${filePath}:`, e);
      }
    }
    const index = this.getDocIndex(vaultId);
    if (index[cleanDocPath]) {
      delete index[cleanDocPath];
      this.saveDocIndex(vaultId, index);
    }
  }

  public renameDoc(vaultId: string, oldDocPath: string, newDocPath: string): void {
    const cleanOld = this.cleanPath(oldDocPath);
    const cleanNew = this.cleanPath(newDocPath);
    if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

    const oldFilePath = this.getDocFilePath(vaultId, cleanOld);
    const newFilePath = this.getDocFilePath(vaultId, cleanNew);

    if (fs.existsSync(oldFilePath)) {
      try {
        fs.renameSync(oldFilePath, newFilePath);
      } catch (e) {
        try {
          fs.copyFileSync(oldFilePath, newFilePath);
          fs.unlinkSync(oldFilePath);
        } catch (err2) {
          console.error(`[Storage] Failed to rename doc file ${oldFilePath} to ${newFilePath}:`, err2);
        }
      }
    }

    const index = this.getDocIndex(vaultId);
    if (index[cleanOld]) {
      delete index[cleanOld];
      index[cleanNew] = { path: cleanNew, mtime: Date.now() };
      this.saveDocIndex(vaultId, index);
    }
  }

  public listAllFiles(vaultId: string): Array<{ path: string; mtime: number; isAttachment: boolean }> {
    const docIndex = this.getDocIndex(vaultId);
    const docs = Object.values(docIndex).map((d) => ({
      path: d.path,
      mtime: d.mtime,
      isAttachment: false,
    }));
    const attachments = this.listAttachments(vaultId).map((a) => ({
      path: a.path,
      mtime: a.mtime,
      isAttachment: true,
    }));
    return [...docs, ...attachments];
  }

  public getAttachmentPath(vaultId: string, relativePath: string): string {
    const vaultDir = this.getVaultDir(vaultId);
    const attachmentsDir = path.join(vaultDir, 'attachments');
    this.ensureDir(attachmentsDir);

    // Prevent directory traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(attachmentsDir, safePath);
    this.ensureDir(path.dirname(fullPath));
    return fullPath;
  }

  public saveAttachment(vaultId: string, relativePath: string, data: Buffer): void {
    const targetPath = this.getAttachmentPath(vaultId, relativePath);
    fs.writeFileSync(targetPath, data);
  }

  public getAttachment(vaultId: string, relativePath: string): Buffer | null {
    const targetPath = this.getAttachmentPath(vaultId, relativePath);
    if (fs.existsSync(targetPath)) {
      return fs.readFileSync(targetPath);
    }
    return null;
  }

  public deleteAttachment(vaultId: string, relativePath: string): boolean {
    const targetPath = this.getAttachmentPath(vaultId, relativePath);
    if (fs.existsSync(targetPath)) {
      try {
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(targetPath);
        }
        return true;
      } catch (err) {
        console.error(`[Storage] Failed to delete attachment ${targetPath}:`, err);
      }
    }
    return false;
  }

  public renameAttachment(vaultId: string, oldPath: string, newPath: string): boolean {
    const oldTarget = this.getAttachmentPath(vaultId, oldPath);
    const newTarget = this.getAttachmentPath(vaultId, newPath);

    if (fs.existsSync(oldTarget)) {
      try {
        this.ensureDir(path.dirname(newTarget));
        fs.renameSync(oldTarget, newTarget);
        return true;
      } catch (e) {
        console.error(`[Storage] Failed to rename attachment ${oldTarget} to ${newTarget}:`, e);
      }
    }
    return false;
  }

  public listDocs(vaultId: string): Array<{ fileName: string; size: number; mtime: number }> {
    const vaultDir = this.getVaultDir(vaultId);
    const docsDir = path.join(vaultDir, 'docs');
    const results: Array<{ fileName: string; size: number; mtime: number }> = [];

    if (fs.existsSync(docsDir)) {
      const entries = fs.readdirSync(docsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.ydoc')) {
          const stat = fs.statSync(path.join(docsDir, entry.name));
          results.push({
            fileName: entry.name,
            size: stat.size,
            mtime: stat.mtimeMs,
          });
        }
      }
    }
    return results;
  }

  public listAttachments(vaultId: string): Array<{ path: string; size: number; mtime: number }> {
    const vaultDir = this.getVaultDir(vaultId);
    const attachmentsDir = path.join(vaultDir, 'attachments');
    const results: Array<{ path: string; size: number; mtime: number }> = [];

    if (!fs.existsSync(attachmentsDir)) return results;

    const walk = (currentDir: string, relativePrefix: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(currentDir, entry.name);
        const rel = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(full, rel);
        } else if (entry.isFile()) {
          const stat = fs.statSync(full);
          results.push({
            path: rel,
            size: stat.size,
            mtime: stat.mtimeMs,
          });
        }
      }
    };

    walk(attachmentsDir, '');
    return results;
  }

  public getVaultStats(vaultId: string): VaultStats {
    const docs = this.listDocs(vaultId);
    const attachments = this.listAttachments(vaultId);

    const docsSizeBytes = docs.reduce((acc, d) => acc + d.size, 0);
    const attachmentsSizeBytes = attachments.reduce((acc, a) => acc + a.size, 0);

    return {
      vaultId,
      docCount: docs.length,
      docsSizeBytes,
      attachmentCount: attachments.length,
      attachmentsSizeBytes,
      totalSizeBytes: docsSizeBytes + attachmentsSizeBytes,
    };
  }

  public exportVault(vaultId: string): {
    vaultId: string;
    exportedAt: number;
    docs: Array<{ fileName: string; updateBase64: string; previewText?: string }>;
    attachments: Array<{ path: string; size: number; base64: string }>;
  } {
    const vaultDir = this.getVaultDir(vaultId);
    const docsDir = path.join(vaultDir, 'docs');
    const exportedDocs: Array<{ fileName: string; updateBase64: string; previewText?: string }> = [];

    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir);
      for (const file of files) {
        if (file.endsWith('.ydoc')) {
          const raw = fs.readFileSync(path.join(docsDir, file));
          const doc = new Y.Doc();
          try {
            Y.applyUpdate(doc, new Uint8Array(raw));
            const text = doc.getText('content').toString();
            exportedDocs.push({
              fileName: file,
              updateBase64: raw.toString('base64'),
              previewText: text.substring(0, 300),
            });
          } catch {
            exportedDocs.push({
              fileName: file,
              updateBase64: raw.toString('base64'),
            });
          } finally {
            doc.destroy();
          }
        }
      }
    }

    const attachmentsList = this.listAttachments(vaultId);
    const exportedAttachments: Array<{ path: string; size: number; base64: string }> = [];
    for (const att of attachmentsList) {
      const buf = this.getAttachment(vaultId, att.path);
      if (buf) {
        exportedAttachments.push({
          path: att.path,
          size: att.size,
          base64: buf.toString('base64'),
        });
      }
    }

    return {
      vaultId,
      exportedAt: Date.now(),
      docs: exportedDocs,
      attachments: exportedAttachments,
    };
  }

  public deleteVault(vaultId: string): boolean {
    const vaultDir = this.getVaultDir(vaultId);
    if (fs.existsSync(vaultDir)) {
      try {
        fs.rmSync(vaultDir, { recursive: true, force: true });
        return true;
      } catch (err) {
        console.error(`[Storage] Failed to delete vault folder ${vaultDir}:`, err);
      }
    }
    return false;
  }
}
