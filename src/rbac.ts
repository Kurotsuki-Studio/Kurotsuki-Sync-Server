import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { ActivityLogEntry, AuthToken, UserRole, VaultConfig } from './types.js';

interface RbacData {
  vaults: Record<string, VaultConfig>;
  tokens: Record<string, AuthToken>;
  activityLogs: ActivityLogEntry[];
}

export class RbacManager {
  private filePath: string;
  private data: RbacData;

  constructor(storageDir: string = config.storageDir) {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.filePath = path.join(storageDir, 'rbac-data.json');
    this.data = this.loadData();
    this.ensureDefaults();
  }

  private loadData(): RbacData {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          vaults: parsed.vaults || {},
          tokens: parsed.tokens || {},
          activityLogs: parsed.activityLogs || [],
        };
      } catch (err) {
        console.error('[RBAC] Error loading rbac-data.json, initializing defaults:', err);
      }
    }
    return {
      vaults: {},
      tokens: {},
      activityLogs: [],
    };
  }

  private saveData(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[RBAC] Failed to write rbac-data.json:', err);
    }
  }

  private ensureDefaults(): void {
    let modified = false;

    // Ensure default vault
    if (!this.data.vaults['default-vault']) {
      this.data.vaults['default-vault'] = {
        id: 'default-vault',
        name: 'Default Vault',
        description: 'Primary shared workspace',
        createdAt: Date.now(),
        quotaMB: 500,
        defaultRole: 'editor',
      };
      modified = true;
    }

    // Ensure admin token if config.authToken is set
    if (config.authToken && config.authToken.trim() !== '') {
      const existing = Object.values(this.data.tokens).find((t) => t.token === config.authToken);
      if (!existing) {
        const adminId = 'tok_admin';
        this.data.tokens[adminId] = {
          id: adminId,
          token: config.authToken,
          name: 'Server Admin',
          role: 'admin',
          createdAt: Date.now(),
        };
        modified = true;
      }
    }

    if (modified) {
      this.saveData();
    }
  }

  public getVaults(): VaultConfig[] {
    return Object.values(this.data.vaults);
  }

  public getVault(id: string): VaultConfig | undefined {
    return this.data.vaults[id];
  }

  public createVault(opts: {
    id: string;
    name: string;
    description?: string;
    quotaMB?: number;
    defaultRole?: UserRole | 'forbidden';
  }): VaultConfig {
    const cleanId = opts.id.trim().toLowerCase().replace(/[^a-z0-9_\-\.]/g, '-');
    if (!cleanId) {
      throw new Error('Invalid vault ID');
    }
    if (this.data.vaults[cleanId]) {
      throw new Error(`Vault "${cleanId}" already exists`);
    }

    const vault: VaultConfig = {
      id: cleanId,
      name: opts.name.trim() || cleanId,
      description: opts.description || '',
      createdAt: Date.now(),
      quotaMB: opts.quotaMB && opts.quotaMB > 0 ? opts.quotaMB : 500,
      defaultRole: opts.defaultRole || 'editor',
      tokenRoles: {},
    };

    this.data.vaults[cleanId] = vault;
    this.addActivityLog({
      type: 'vault_create',
      vaultId: cleanId,
      details: `Created vault "${vault.name}" (quota: ${vault.quotaMB}MB, default role: ${vault.defaultRole})`,
    });
    this.saveData();
    return vault;
  }

  public updateVault(id: string, updates: Partial<VaultConfig>): VaultConfig {
    const vault = this.data.vaults[id];
    if (!vault) {
      throw new Error(`Vault "${id}" not found`);
    }

    if (updates.name !== undefined) vault.name = updates.name.trim() || vault.name;
    if (updates.description !== undefined) vault.description = updates.description;
    if (updates.quotaMB !== undefined && updates.quotaMB > 0) vault.quotaMB = updates.quotaMB;
    if (updates.defaultRole !== undefined) vault.defaultRole = updates.defaultRole;
    if (updates.tokenRoles !== undefined) vault.tokenRoles = updates.tokenRoles;

    this.addActivityLog({
      type: 'vault_update',
      vaultId: id,
      details: `Updated vault settings for "${vault.name}"`,
    });
    this.saveData();
    return vault;
  }

  public deleteVault(id: string): boolean {
    if (id === 'default-vault') {
      throw new Error('Cannot delete default-vault');
    }
    if (!this.data.vaults[id]) return false;

    delete this.data.vaults[id];
    this.addActivityLog({
      type: 'vault_delete',
      vaultId: id,
      details: `Deleted vault "${id}"`,
    });
    this.saveData();
    return true;
  }

  public getTokens(): AuthToken[] {
    return Object.values(this.data.tokens);
  }

  public getTokenById(id: string): AuthToken | undefined {
    return this.data.tokens[id];
  }

  public createToken(opts: {
    name: string;
    role: UserRole;
    token?: string;
    vaultAccess?: Record<string, UserRole | 'forbidden'>;
  }): AuthToken {
    const id = 'tok_' + crypto.randomBytes(4).toString('hex');
    const tokenSecret = opts.token?.trim() || 'kuro_' + crypto.randomBytes(16).toString('hex');

    const tokenObj: AuthToken = {
      id,
      token: tokenSecret,
      name: opts.name.trim() || 'Unnamed Token',
      role: opts.role,
      vaultAccess: opts.vaultAccess || {},
      createdAt: Date.now(),
    };

    this.data.tokens[id] = tokenObj;
    this.addActivityLog({
      type: 'token_create',
      details: `Created token "${tokenObj.name}" with global role ${tokenObj.role}`,
    });
    this.saveData();
    return tokenObj;
  }

  public updateToken(id: string, updates: Partial<AuthToken>): AuthToken {
    const tokenObj = this.data.tokens[id];
    if (!tokenObj) {
      throw new Error(`Token "${id}" not found`);
    }

    if (updates.name !== undefined) tokenObj.name = updates.name.trim() || tokenObj.name;
    if (updates.role !== undefined) tokenObj.role = updates.role;
    if (updates.vaultAccess !== undefined) tokenObj.vaultAccess = updates.vaultAccess;

    this.saveData();
    return tokenObj;
  }

  public deleteToken(id: string): boolean {
    if (!this.data.tokens[id]) return false;
    const name = this.data.tokens[id].name;
    delete this.data.tokens[id];
    this.addActivityLog({
      type: 'token_delete',
      details: `Revoked token "${name}"`,
    });
    this.saveData();
    return true;
  }

  public resolveRole(
    tokenStr: string | undefined | null,
    vaultId: string
  ): { role: UserRole | null; tokenObj?: AuthToken } {
    const cleanVaultId = vaultId || 'default-vault';
    const vault = this.data.vaults[cleanVaultId];

    // Master config authToken bypass as global admin
    if (config.authToken && tokenStr === config.authToken) {
      return { role: 'admin' };
    }

    // Find token object
    let tokenObj: AuthToken | undefined;
    if (tokenStr) {
      tokenObj = Object.values(this.data.tokens).find((t) => t.token === tokenStr);
    }

    if (tokenObj) {
      // Global admin has full access to all vaults
      if (tokenObj.role === 'admin') {
        return { role: 'admin', tokenObj };
      }

      // Check per-vault override on token
      if (tokenObj.vaultAccess && tokenObj.vaultAccess[cleanVaultId]) {
        const access = tokenObj.vaultAccess[cleanVaultId];
        if (access === 'forbidden') return { role: null, tokenObj };
        return { role: access, tokenObj };
      }

      // Check vault-specific token override
      if (vault && vault.tokenRoles && vault.tokenRoles[tokenObj.id]) {
        const access = vault.tokenRoles[tokenObj.id];
        if (access === 'forbidden') return { role: null, tokenObj };
        return { role: access, tokenObj };
      }

      // Fallback to token's base role if vault allows it
      if (vault) {
        if (vault.defaultRole === 'forbidden' && !tokenObj.vaultAccess?.[cleanVaultId]) {
          return { role: null, tokenObj };
        }
      }
      return { role: tokenObj.role, tokenObj };
    }

    // No token provided or unknown token:
    // If server has no authToken requirement configured, fall back to vault defaultRole
    if (!config.authToken || config.authToken.trim() === '') {
      if (vault) {
        if (vault.defaultRole === 'forbidden') return { role: null };
        return { role: vault.defaultRole };
      }
      return { role: 'editor' };
    }

    return { role: null };
  }

  public isAdmin(tokenStr: string | undefined | null): boolean {
    if (!tokenStr) return false;
    if (config.authToken && tokenStr === config.authToken) return true;
    const tokenObj = Object.values(this.data.tokens).find((t) => t.token === tokenStr);
    return tokenObj?.role === 'admin';
  }

  public addActivityLog(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
    const item: ActivityLogEntry = {
      id: 'log_' + crypto.randomBytes(4).toString('hex'),
      timestamp: Date.now(),
      ...entry,
    };
    this.data.activityLogs.unshift(item);
    if (this.data.activityLogs.length > 300) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 300);
    }
    // We don't need to synchronously write disk on every single log item to avoid disk churn
  }

  public getActivityLogs(limit = 100): ActivityLogEntry[] {
    return this.data.activityLogs.slice(0, limit);
  }
}
