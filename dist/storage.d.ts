import * as Y from 'yjs';
export declare class StorageEngine {
    private baseDir;
    constructor(baseDir?: string);
    private ensureDir;
    private getVaultDir;
    private getDocFilePath;
    loadDoc(vaultId: string, docPath: string, doc: Y.Doc): boolean;
    saveDoc(vaultId: string, docPath: string, doc: Y.Doc): void;
    deleteDoc(vaultId: string, docPath: string): void;
    getAttachmentPath(vaultId: string, relativePath: string): string;
    saveAttachment(vaultId: string, relativePath: string, data: Buffer): void;
    getAttachment(vaultId: string, relativePath: string): Buffer | null;
    listFiles(vaultId: string): Array<{
        path: string;
        mtime: number;
    }>;
}
