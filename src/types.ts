import { WebSocket } from 'ws';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  color: string;
}

export interface RemoteCursor {
  anchor: number;
  head: number;
}

export interface PeerAwarenessState {
  clientId: number;
  user: UserProfile;
  activeFile: string | null;
  cursor: RemoteCursor | null;
  lastActive: number;
}

export interface VaultConfig {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  quotaMB: number;
  defaultRole: UserRole | 'forbidden';
  tokenRoles?: Record<string, UserRole | 'forbidden'>;
}

export interface AuthToken {
  id: string;
  token: string;
  name: string;
  role: UserRole;
  vaultAccess?: Record<string, UserRole | 'forbidden'>;
  createdAt: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  type: 'join' | 'leave' | 'sync' | 'file_event' | 'role_change' | 'vault_create' | 'vault_update' | 'vault_delete' | 'token_create' | 'token_delete';
  vaultId?: string;
  userName?: string;
  details: string;
}

export type WSMessage =
  | { type: 'auth'; token: string; vaultId: string; clientInfo: UserProfile }
  | { type: 'auth_ack'; success: boolean; message?: string; serverVersion: string; role?: UserRole; vaultId?: string }
  | { type: 'yjs_sync'; path: string; update: string }
  | { type: 'awareness_update'; states: PeerAwarenessState[] }
  | { type: 'file_event'; action: 'create' | 'modify' | 'delete' | 'rename'; path: string; oldPath?: string; hash?: string; mtime?: number }
  | { type: 'file_list_request' }
  | { type: 'file_list_response'; files: Array<{ path: string; hash?: string; mtime: number; isAttachment?: boolean }> }
  | { type: 'doc_request'; path: string }
  | { type: 'doc_response'; path: string; update: string }
  | { type: 'ping'; timestamp?: number }
  | { type: 'pong'; timestamp?: number }
  | { type: 'error'; message: string; code?: string };

export interface ClientSession {
  id: string;
  ws: WebSocket;
  vaultId: string;
  user: UserProfile;
  role: UserRole;
  clientId: number;
  activeFile?: string | null;
  ip: string;
  connectedAt: number;
  lastPing: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  storageDir: string;
  authToken: string;
  maxPayloadMB: number;
  corsEnabled: boolean;
  version: string;
}
