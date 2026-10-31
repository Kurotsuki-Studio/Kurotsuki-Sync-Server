export function getAdminPanelHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌙 Kurotsuki Sync — Web Admin Panel</title>
  <style>
    :root {
      --bg-base: #0f1117;
      --bg-surface: #181b24;
      --bg-surface-elevated: #222634;
      --bg-surface-hover: #2c3245;
      --border: #2e354b;
      --border-focus: #7c3aed;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #8b5cf6;
      --primary-hover: #7c3aed;
      --primary-light: rgba(139, 92, 246, 0.15);
      --success: #10b981;
      --success-light: rgba(16, 185, 129, 0.15);
      --warning: #f59e0b;
      --warning-light: rgba(245, 158, 11, 0.15);
      --danger: #ef4444;
      --danger-light: rgba(239, 68, 68, 0.15);
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: var(--font-family);
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      font-size: 24px;
      line-height: 1;
    }

    .brand-title {
      font-weight: 700;
      font-size: 18px;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #a78bfa, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-badge {
      font-size: 11px;
      padding: 2px 8px;
      background: var(--primary-light);
      color: var(--primary);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 9999px;
      font-family: var(--font-mono);
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .server-status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      background: var(--bg-surface-elevated);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--success);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    /* Navigation Tabs */
    .nav-bar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      display: flex;
      gap: 8px;
    }

    .nav-tab {
      padding: 12px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-tab:hover {
      color: var(--text-main);
    }

    .nav-tab.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    /* Layout & Container */
    main {
      flex: 1;
      padding: 24px;
      max-width: 1300px;
      width: 100%;
      margin: 0 auto;
    }

    .view-section {
      display: none;
    }

    .view-section.active {
      display: block;
    }

    /* Cards & Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .card-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 6px;
    }

    .card-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
    }

    .card-subtext {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Tables */
    .table-container {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .table-header h3 {
      font-size: 16px;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background: var(--bg-surface-elevated);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text-main);
      font-size: 13px;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background-color: var(--bg-surface-hover);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
      text-transform: uppercase;
    }

    .badge-admin { background: var(--danger-light); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-editor { background: var(--success-light); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-viewer { background: var(--warning-light); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-forbidden { background: var(--bg-surface-elevated); color: var(--text-dim); border: 1px solid var(--border); }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s ease;
      background: var(--bg-surface-elevated);
      color: var(--text-main);
      border-color: var(--border);
    }

    .btn:hover {
      background: var(--bg-surface-hover);
      border-color: var(--text-dim);
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    .btn-danger {
      background: var(--danger-light);
      color: var(--danger);
      border-color: rgba(239, 68, 68, 0.4);
    }

    .btn-danger:hover {
      background: var(--danger);
      color: white;
    }

    .btn-sm {
      padding: 3px 8px;
      font-size: 12px;
    }

    /* Form Inputs */
    .form-group {
      margin-bottom: 14px;
    }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-main);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .form-control:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
      backdrop-filter: blur(4px);
    }

    .modal-backdrop.open {
      display: flex;
    }

    .modal {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
      animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 600;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 18px;
      cursor: pointer;
    }

    .modal-close:hover {
      color: var(--text-main);
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--bg-surface-elevated);
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    .progress-bar-bg {
      background: var(--bg-surface-elevated);
      border-radius: 4px;
      height: 6px;
      width: 100%;
      overflow: hidden;
      margin-top: 4px;
    }

    .progress-bar-fill {
      background: var(--primary);
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .code-snippet {
      font-family: var(--font-mono);
      font-size: 12px;
      background: var(--bg-surface-elevated);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-dim);
    }

    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    }

    .toast {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn 0.2s ease;
    }

    @keyframes toastIn {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand">
      <span class="brand-logo">🌙</span>
      <span class="brand-title">Kurotsuki Sync</span>
      <span class="brand-badge">CONTROL CENTER</span>
    </div>
    <div class="header-actions">
      <div class="server-status-pill">
        <div class="status-dot"></div>
        <span id="server-status-text">Relay Online</span>
      </div>
      <button class="btn btn-sm" id="btn-auth-config" onclick="openAuthModal()">🔑 Admin Token</button>
      <button class="btn btn-sm btn-primary" onclick="refreshCurrentView()">🔄 Refresh</button>
    </div>
  </header>

  <!-- Navigation -->
  <nav class="nav-bar">
    <button class="nav-tab active" data-view="dashboard" onclick="switchView('dashboard')">📊 Dashboard</button>
    <button class="nav-tab" data-view="vaults" onclick="switchView('vaults')">📂 Vaults & Rooms</button>
    <button class="nav-tab" data-view="tokens" onclick="switchView('tokens')">🔐 Access & RBAC</button>
    <button class="nav-tab" data-view="activity" onclick="switchView('activity')">📜 Activity Audit</button>
  </nav>

  <!-- Main Viewports -->
  <main>

    <!-- 1. DASHBOARD VIEW -->
    <div id="view-dashboard" class="view-section active">
      <div class="metrics-grid">
        <div class="card">
          <div class="card-title">Live Connections</div>
          <div class="card-value" id="stat-active-peers">0</div>
          <div class="card-subtext">Active collaborative sessions</div>
        </div>
        <div class="card">
          <div class="card-title">Managed Vaults</div>
          <div class="card-value" id="stat-vaults-count">0</div>
          <div class="card-subtext">Multi-room workspaces</div>
        </div>
        <div class="card">
          <div class="card-title">Total Documents</div>
          <div class="card-value" id="stat-docs-count">0</div>
          <div class="card-subtext">Active CRDT Y.Docs</div>
        </div>
        <div class="card">
          <div class="card-title">Server Storage</div>
          <div class="card-value" id="stat-storage-size">0 MB</div>
          <div class="card-subtext">Docs & attachments</div>
        </div>
        <div class="card">
          <div class="card-title">Process Uptime</div>
          <div class="card-value" id="stat-uptime">0s</div>
          <div class="card-subtext">Node.js Memory: <span id="stat-memory">0 MB</span></div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>⚡ Live Connected Collaborators</h3>
          <span class="card-subtext">Real-time active peer awareness & cursor states</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Collaborator</th>
              <th>Role</th>
              <th>Vault</th>
              <th>Active Note</th>
              <th>IP Address</th>
              <th>Connected For</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="peers-table-body">
            <tr><td colspan="7" class="empty-state">No connected peers right now</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. MULTI-VAULT VIEW -->
    <div id="view-vaults" class="view-section">
      <div class="table-container">
        <div class="table-header">
          <div>
            <h3>📂 Multi-Vault & Room Management</h3>
            <span class="card-subtext">Configure permissions, storage quotas, and inspect documents per vault</span>
          </div>
          <button class="btn btn-primary" onclick="openCreateVaultModal()">➕ Create Vault</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Vault Name & ID</th>
              <th>Default Role</th>
              <th>Active Peers</th>
              <th>Documents</th>
              <th>Storage / Quota</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="vaults-table-body">
            <tr><td colspan="6" class="empty-state">Loading vaults...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 3. ACCESS & RBAC TOKENS VIEW -->
    <div id="view-tokens" class="view-section">
      <div class="table-container">
        <div class="table-header">
          <div>
            <h3>🔐 User & Token Access Control (RBAC)</h3>
            <span class="card-subtext">Issue role-based credentials (Admin, Editor, Viewer/Read-Only)</span>
          </div>
          <button class="btn btn-primary" onclick="openCreateTokenModal()">➕ Generate Token</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>User / Token Name</th>
              <th>Global Role</th>
              <th>Token Secret</th>
              <th>Vault Access Overrides</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tokens-table-body">
            <tr><td colspan="6" class="empty-state">Loading tokens...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. ACTIVITY LOG VIEW -->
    <div id="view-activity" class="view-section">
      <div class="table-container">
        <div class="table-header">
          <h3>📜 Relay Activity & Audit Trail</h3>
          <button class="btn btn-sm" onclick="loadActivityLogs()">🔄 Refresh Logs</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Vault</th>
              <th>User</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="activity-table-body">
            <tr><td colspan="5" class="empty-state">No activity logs yet</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </main>

  <!-- MODAL: Admin Token Config -->
  <div class="modal-backdrop" id="modal-auth">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🔑 Relay Admin Authentication</div>
        <button class="modal-close" onclick="closeModal('modal-auth')">&times;</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom: 12px; color: var(--text-muted);">
          Enter your Kurotsuki Admin Secret Token to unlock full multi-vault and token management controls:
        </p>
        <div class="form-group">
          <label class="form-label">Admin Bearer Token</label>
          <input type="password" id="input-admin-token" class="form-control" placeholder="Enter secret token">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('modal-auth')">Cancel</button>
        <button class="btn btn-primary" onclick="saveAdminToken()">Save & Authenticate</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Create Vault -->
  <div class="modal-backdrop" id="modal-create-vault">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">➕ Create New Vault</div>
        <button class="modal-close" onclick="closeModal('modal-create-vault')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Vault ID (slug)</label>
          <input type="text" id="input-vault-id" class="form-control" placeholder="e.g. project-apollo">
        </div>
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="input-vault-name" class="form-control" placeholder="e.g. Project Apollo Notes">
        </div>
        <div class="form-group">
          <label class="form-label">Description (Optional)</label>
          <input type="text" id="input-vault-desc" class="form-control" placeholder="e.g. Shared workspace for engineering team">
        </div>
        <div class="form-group">
          <label class="form-label">Default Role for Non-Assigned Users</label>
          <select id="select-vault-default-role" class="form-control">
            <option value="editor">Editor (Read & Write)</option>
            <option value="viewer">Viewer (Read-Only / Client Blocked)</option>
            <option value="forbidden">Forbidden (Access Denied unless explicitly granted)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Storage Quota (MB)</label>
          <input type="number" id="input-vault-quota" class="form-control" value="500" min="10" max="100000">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('modal-create-vault')">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateVault()">Create Vault</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Edit Vault -->
  <div class="modal-backdrop" id="modal-edit-vault">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">⚙️ Configure Vault</div>
        <button class="modal-close" onclick="closeModal('modal-edit-vault')">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="edit-vault-id">
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="edit-vault-name" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" id="edit-vault-desc" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Default Access Role</label>
          <select id="edit-vault-default-role" class="form-control">
            <option value="editor">Editor (Read & Write)</option>
            <option value="viewer">Viewer (Read-Only)</option>
            <option value="forbidden">Forbidden (Must be explicitly granted)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Storage Quota (MB)</label>
          <input type="number" id="edit-vault-quota" class="form-control" min="10" max="100000">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('modal-edit-vault')">Cancel</button>
        <button class="btn btn-primary" onclick="submitUpdateVault()">Save Settings</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Create Token -->
  <div class="modal-backdrop" id="modal-create-token">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">➕ Issue Access Token / User</div>
        <button class="modal-close" onclick="closeModal('modal-create-token')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">User / Device Label</label>
          <input type="text" id="input-token-name" class="form-control" placeholder="e.g. Alice's iPad or Bob (Viewer)">
        </div>
        <div class="form-group">
          <label class="form-label">Global Default Role</label>
          <select id="select-token-role" class="form-control">
            <option value="editor">Editor (Can read and sync note changes)</option>
            <option value="viewer">Viewer (Read-Only: blocked from editing client-side & server)</option>
            <option value="admin">Admin (Full relay and multi-vault permissions)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Custom Secret Token (Optional - leave empty to auto-generate)</label>
          <input type="text" id="input-token-secret" class="form-control" placeholder="kuro_...">
        </div>
        <div class="form-group">
          <label class="form-label">Per-Vault Permissions (Assign to Specific Vaults)</label>
          <div id="create-token-vault-access" style="background:var(--bg-surface-elevated); padding:10px; border-radius:6px; border:1px solid var(--border); max-height:160px; overflow-y:auto;">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('modal-create-token')">Cancel</button>
        <button class="btn btn-primary" onclick="submitCreateToken()">Generate Token</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Edit Token & Vault Overrides -->
  <div class="modal-backdrop" id="modal-edit-token">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">⚙️ Edit Token & Vault Access</div>
        <button class="modal-close" onclick="closeModal('modal-edit-token')">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="edit-token-id">
        <div class="form-group">
          <label class="form-label">User / Device Label</label>
          <input type="text" id="edit-token-name" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Global Role</label>
          <select id="edit-token-role" class="form-control">
            <option value="editor">Editor (Can read and sync note changes)</option>
            <option value="viewer">Viewer (Read-Only)</option>
            <option value="admin">Admin (Full permissions)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Per-Vault Permissions (Assign / Override)</label>
          <div id="edit-token-vault-access" style="background:var(--bg-surface-elevated); padding:10px; border-radius:6px; border:1px solid var(--border); max-height:160px; overflow-y:auto;">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('modal-edit-token')">Cancel</button>
        <button class="btn btn-primary" onclick="submitUpdateToken()">Save Permissions</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Inspect Vault Docs & Attachments -->
  <div class="modal-backdrop" id="modal-inspect-vault">
    <div class="modal" style="max-width: 800px;">
      <div class="modal-header">
        <div class="modal-title" id="inspect-vault-title">📄 Vault Document Inspector</div>
        <button class="modal-close" onclick="closeModal('modal-inspect-vault')">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <button class="btn btn-sm btn-primary" id="btn-inspect-docs" onclick="switchInspectTab('docs')">Y.Docs</button>
          <button class="btn btn-sm" id="btn-inspect-attachments" onclick="switchInspectTab('attachments')">Attachments</button>
        </div>
        <div id="inspect-content">
          <div class="empty-state">Loading contents...</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('modal-inspect-vault')">Close</button>
      </div>
    </div>
  </div>

  <div class="toast-container" id="toast-container"></div>

  <script>
    // State
    let adminToken = localStorage.getItem('kurotsuki_admin_token') || '';
    let currentView = 'dashboard';
    let cachedVaults = [];
    let cachedTokens = [];
    let currentInspectVaultId = '';
    let currentInspectTab = 'docs';

    // Headers with Auth
    function getAuthHeaders() {
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) {
        headers['Authorization'] = 'Bearer ' + adminToken;
      }
      return headers;
    }

    // Toast Notice
    function showToast(message, type = 'info') {
      const c = document.getElementById('toast-container');
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = '<span>' + (type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️') + '</span> ' + message;
      c.appendChild(el);
      setTimeout(() => { el.remove(); }, 3500);
    }

    // Modal helpers
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    function openAuthModal() {
      document.getElementById('input-admin-token').value = adminToken;
      openModal('modal-auth');
    }

    function saveAdminToken() {
      adminToken = document.getElementById('input-admin-token').value.trim();
      localStorage.setItem('kurotsuki_admin_token', adminToken);
      closeModal('modal-auth');
      showToast('Admin token saved', 'success');
      refreshCurrentView();
    }

    // View Switching
    function switchView(viewName) {
      currentView = viewName;
      document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-view') === viewName);
      });
      document.querySelectorAll('.view-section').forEach(s => {
        s.classList.toggle('active', s.id === 'view-' + viewName);
      });
      refreshCurrentView();
    }

    function refreshCurrentView() {
      if (currentView === 'dashboard') {
        loadDashboardStats();
        loadConnectedPeers();
      } else if (currentView === 'vaults') {
        loadVaults();
      } else if (currentView === 'tokens') {
        loadTokens();
      } else if (currentView === 'activity') {
        loadActivityLogs();
      }
    }

    // Dashboard Data
    async function loadDashboardStats() {
      try {
        const res = await fetch('/api/v1/stats', { headers: getAuthHeaders() });
        if (res.status === 401) {
          showToast('Authentication required. Click "Admin Token" to login.', 'error');
          return;
        }
        const data = await res.json();
        document.getElementById('stat-active-peers').textContent = data.totalConnections || 0;
        document.getElementById('stat-vaults-count').textContent = data.activeRooms || 0;

        let totalDocs = 0;
        if (Array.isArray(data.rooms)) {
          totalDocs = data.rooms.reduce((acc, r) => acc + (r.activeDocs || 0), 0);
        }
        document.getElementById('stat-docs-count').textContent = totalDocs;

        // Memory & Uptime
        const memMB = data.memory ? Math.round(data.memory.heapUsed / 1024 / 1024) : 0;
        document.getElementById('stat-memory').textContent = memMB + ' MB';

        const uptime = data.uptime || 0;
        const hours = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        document.getElementById('stat-uptime').textContent = hours > 0 ? (hours + 'h ' + mins + 'm') : (mins + 'm ' + (uptime % 60) + 's');
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    }

    async function loadConnectedPeers() {
      try {
        const res = await fetch('/api/v1/peers', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const peers = await res.json();
        const tbody = document.getElementById('peers-table-body');
        if (!peers || peers.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No active collaborator connections</td></tr>';
          return;
        }

        tbody.innerHTML = peers.map(p => {
          const duration = Math.round((Date.now() - p.connectedAt) / 1000);
          const durationStr = duration > 60 ? Math.floor(duration/60) + 'm ago' : duration + 's ago';
          const roleClass = 'badge-' + (p.role || 'editor');
          return \`<tr>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:\${p.user.color || '#3b82f6'};"></span>
                <strong>\${escapeHtml(p.user.name)}</strong>
              </div>
            </td>
            <td><span class="badge \${roleClass}">\${p.role}</span></td>
            <td><span class="code-snippet">\${escapeHtml(p.vaultId)}</span></td>
            <td>\${p.activeFile ? '<span class="code-snippet">' + escapeHtml(p.activeFile) + '</span>' : '<span style="color:var(--text-dim)">idle</span>'}</td>
            <td><span class="code-snippet">\${escapeHtml(p.ip)}</span></td>
            <td>\${durationStr}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="disconnectPeer('\${p.id}')">Disconnect</button>
            </td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error('Failed to load peers:', err);
      }
    }

    async function disconnectPeer(sessionId) {
      if (!confirm('Are you sure you want to disconnect this peer?')) return;
      try {
        const res = await fetch('/api/v1/peers/' + encodeURIComponent(sessionId) + '/disconnect', {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          showToast('Peer disconnected', 'success');
          loadConnectedPeers();
        } else {
          showToast('Failed to disconnect peer', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    // Vaults Data
    async function loadVaults() {
      try {
        const res = await fetch('/api/v1/vaults', { headers: getAuthHeaders() });
        if (res.status === 401) {
          showToast('Authentication required to view vaults', 'error');
          return;
        }
        cachedVaults = await res.json();
        const tbody = document.getElementById('vaults-table-body');
        if (!cachedVaults || cachedVaults.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No vaults configured yet. Click "Create Vault" to add one.</td></tr>';
          return;
        }

        let totalVaultsBytes = 0;

        tbody.innerHTML = cachedVaults.map(v => {
          const stats = v.stats || { docCount: 0, totalSizeBytes: 0, attachmentCount: 0 };
          totalVaultsBytes += (stats.totalSizeBytes || 0);

          const totalMB = ((stats.totalSizeBytes || 0) / (1024 * 1024)).toFixed(2);
          const quotaMB = v.quotaMB || 500;
          const percent = Math.min(100, Math.round((totalMB / quotaMB) * 100));

          const roleClass = 'badge-' + (v.defaultRole || 'editor');

          return \`<tr>
            <td>
              <strong>\${escapeHtml(v.name)}</strong>
              <div style="font-size:12px; color:var(--text-dim); font-family:var(--font-mono);">\${escapeHtml(v.id)}</div>
              \${v.description ? '<div style="font-size:12px; color:var(--text-muted);">' + escapeHtml(v.description) + '</div>' : ''}
            </td>
            <td><span class="badge \${roleClass}">\${v.defaultRole}</span></td>
            <td>\${v.activePeers || 0}</td>
            <td>\${stats.docCount} docs (\${stats.attachmentCount} attachments)</td>
            <td style="min-width: 140px;">
              <div>\${totalMB} MB / \${quotaMB} MB (\${percent}%)</div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: \${percent}%; \${percent > 90 ? 'background:var(--danger)' : ''}"></div>
              </div>
            </td>
            <td>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="btn btn-sm" onclick="inspectVault('\${v.id}')">🔍 Inspect</button>
                <button class="btn btn-sm" onclick="openEditVaultModal('\${v.id}')">⚙️ Edit</button>
                <button class="btn btn-sm" onclick="exportVault('\${v.id}')">💾 Export</button>
                \${v.id !== 'default-vault' ? '<button class="btn btn-sm btn-danger" onclick="deleteVault(\\'' + v.id + '\\')">🗑️</button>' : ''}
              </div>
            </td>
          </tr>\`;
        }).join('');

        // Update dashboard storage size
        document.getElementById('stat-storage-size').textContent = (totalVaultsBytes / (1024 * 1024)).toFixed(1) + ' MB';
      } catch (err) {
        console.error('Failed to load vaults:', err);
      }
    }

    function openCreateVaultModal() {
      document.getElementById('input-vault-id').value = '';
      document.getElementById('input-vault-name').value = '';
      document.getElementById('input-vault-desc').value = '';
      document.getElementById('input-vault-quota').value = '500';
      document.getElementById('select-vault-default-role').value = 'editor';
      openModal('modal-create-vault');
    }

    async function submitCreateVault() {
      const id = document.getElementById('input-vault-id').value.trim();
      const name = document.getElementById('input-vault-name').value.trim();
      const description = document.getElementById('input-vault-desc').value.trim();
      const quotaMB = parseInt(document.getElementById('input-vault-quota').value, 10);
      const defaultRole = document.getElementById('select-vault-default-role').value;

      if (!id || !name) {
        showToast('Vault ID and Name are required', 'error');
        return;
      }

      try {
        const res = await fetch('/api/v1/vaults', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id, name, description, quotaMB, defaultRole }),
        });
        if (res.ok) {
          showToast('Vault created successfully', 'success');
          closeModal('modal-create-vault');
          loadVaults();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to create vault', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    function openEditVaultModal(vaultId) {
      const vault = cachedVaults.find(v => v.id === vaultId);
      if (!vault) return;

      document.getElementById('edit-vault-id').value = vault.id;
      document.getElementById('edit-vault-name').value = vault.name;
      document.getElementById('edit-vault-desc').value = vault.description || '';
      document.getElementById('edit-vault-quota').value = vault.quotaMB || 500;
      document.getElementById('edit-vault-default-role').value = vault.defaultRole || 'editor';

      openModal('modal-edit-vault');
    }

    async function submitUpdateVault() {
      const id = document.getElementById('edit-vault-id').value;
      const name = document.getElementById('edit-vault-name').value.trim();
      const description = document.getElementById('edit-vault-desc').value.trim();
      const quotaMB = parseInt(document.getElementById('edit-vault-quota').value, 10);
      const defaultRole = document.getElementById('edit-vault-default-role').value;

      try {
        const res = await fetch('/api/v1/vaults/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, description, quotaMB, defaultRole }),
        });
        if (res.ok) {
          showToast('Vault settings updated', 'success');
          closeModal('modal-edit-vault');
          loadVaults();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to update vault', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    async function deleteVault(vaultId) {
      if (!confirm('Are you sure you want to permanently delete vault "' + vaultId + '" and all its data? This cannot be undone.')) {
        return;
      }

      try {
        const res = await fetch('/api/v1/vaults/' + encodeURIComponent(vaultId), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          showToast('Vault deleted', 'success');
          loadVaults();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to delete vault', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    function exportVault(vaultId) {
      const url = '/api/v1/vaults/' + encodeURIComponent(vaultId) + '/export?token=' + encodeURIComponent(adminToken);
      window.open(url, '_blank');
      showToast('Export initiated for ' + vaultId, 'info');
    }

    // Inspect Vault Docs & Attachments
    async function inspectVault(vaultId) {
      currentInspectVaultId = vaultId;
      document.getElementById('inspect-vault-title').textContent = '🔍 Inspecting Vault: ' + vaultId;
      openModal('modal-inspect-vault');
      switchInspectTab('docs');
    }

    async function switchInspectTab(tab) {
      currentInspectTab = tab;
      document.getElementById('btn-inspect-docs').className = tab === 'docs' ? 'btn btn-sm btn-primary' : 'btn btn-sm';
      document.getElementById('btn-inspect-attachments').className = tab === 'attachments' ? 'btn btn-sm btn-primary' : 'btn btn-sm';

      const content = document.getElementById('inspect-content');
      content.innerHTML = '<div class="empty-state">Loading ' + tab + '...</div>';

      try {
        const endpoint = tab === 'docs' ? '/api/v1/vaults/' + encodeURIComponent(currentInspectVaultId) + '/docs'
                                        : '/api/v1/vaults/' + encodeURIComponent(currentInspectVaultId) + '/attachments';
        const res = await fetch(endpoint, { headers: getAuthHeaders() });
        if (!res.ok) {
          content.innerHTML = '<div class="empty-state">Failed to load ' + tab + '</div>';
          return;
        }
        const items = await res.json();
        if (!items || items.length === 0) {
          content.innerHTML = '<div class="empty-state">No ' + tab + ' found in this vault.</div>';
          return;
        }

        if (tab === 'docs') {
          content.innerHTML = '<table style="width:100%;"><thead><tr><th>File Name</th><th>Size</th><th>Last Modified</th><th>Preview</th></tr></thead><tbody>' +
            items.map(d => {
              const sizeKB = (d.size / 1024).toFixed(1) + ' KB';
              const date = new Date(d.mtime).toLocaleString();
              return \`<tr>
                <td><span class="code-snippet">\${escapeHtml(d.fileName)}</span></td>
                <td>\${sizeKB}</td>
                <td style="font-size:12px; color:var(--text-muted);">\${date}</td>
                <td>\${d.preview ? '<span style="font-size:11px; color:var(--text-muted);">' + escapeHtml(d.preview.substring(0, 60)) + '...</span>' : '<span style="color:var(--text-dim)">-</span>'}</td>
              </tr>\`;
            }).join('') + '</tbody></table>';
        } else {
          content.innerHTML = '<table style="width:100%;"><thead><tr><th>Attachment Path</th><th>Size</th><th>Last Modified</th><th>Action</th></tr></thead><tbody>' +
            items.map(a => {
              const sizeKB = (a.size / 1024).toFixed(1) + ' KB';
              const date = new Date(a.mtime).toLocaleString();
              const downloadUrl = '/api/v1/attachments/' + encodeURIComponent(currentInspectVaultId) + '/' + encodeURIComponent(a.path) + '?token=' + encodeURIComponent(adminToken);
              return \`<tr>
                <td><span class="code-snippet">\${escapeHtml(a.path)}</span></td>
                <td>\${sizeKB}</td>
                <td style="font-size:12px; color:var(--text-muted);">\${date}</td>
                <td>
                  <a href="\${downloadUrl}" target="_blank" class="btn btn-sm">Download</a>
                  <button class="btn btn-sm btn-danger" onclick="deleteAttachment('\${escapeHtml(a.path)}')">Delete</button>
                </td>
              </tr>\`;
            }).join('') + '</tbody></table>';
        }
      } catch (err) {
        content.innerHTML = '<div class="empty-state">Error: ' + err.message + '</div>';
      }
    }

    async function deleteAttachment(filePath) {
      if (!confirm('Delete attachment ' + filePath + '?')) return;
      try {
        const res = await fetch('/api/v1/vaults/' + encodeURIComponent(currentInspectVaultId) + '/attachments/' + encodeURIComponent(filePath), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          showToast('Attachment deleted', 'success');
          switchInspectTab('attachments');
        } else {
          showToast('Failed to delete attachment', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    // Access & Tokens (RBAC) Data
    async function loadTokens() {
      try {
        const res = await fetch('/api/v1/tokens', { headers: getAuthHeaders() });
        if (res.status === 401) {
          showToast('Authentication required for RBAC management', 'error');
          return;
        }
        cachedTokens = await res.json();
        const tbody = document.getElementById('tokens-table-body');
        if (!cachedTokens || cachedTokens.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No tokens issued. Generate one to allow Obsidian clients to connect.</td></tr>';
          return;
        }

        tbody.innerHTML = cachedTokens.map(t => {
          const roleClass = 'badge-' + t.role;
          const overrides = t.vaultAccess ? Object.entries(t.vaultAccess).map(([v, r]) => v + ': ' + r).join(', ') : 'None';
          const createdStr = new Date(t.createdAt).toLocaleDateString();

          return \`<tr>
            <td>
              <strong>\${escapeHtml(t.name)}</strong>
              <div style="font-size:11px; color:var(--text-dim); font-family:var(--font-mono);">\${t.id}</div>
            </td>
            <td><span class="badge \${roleClass}">\${t.role}</span></td>
            <td>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="code-snippet">\${escapeHtml(t.token.substring(0, 10))}••••••</span>
                <button class="btn btn-sm" onclick="navigator.clipboard.writeText('\${t.token}'); showToast('Token copied!', 'success');">📋</button>
              </div>
            </td>
            <td><span style="font-size:12px; color:var(--text-muted);">\${escapeHtml(overrides)}</span></td>
            <td style="font-size:12px; color:var(--text-muted);">\${createdStr}</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm" onclick="openEditTokenModal('\${t.id}')">⚙️ Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteToken('\${t.id}')">Revoke</button>
              </div>
            </td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error('Failed to load tokens:', err);
      }
    }

    function renderVaultAccessList(containerId, currentOverrides) {
      const container = document.getElementById(containerId);
      if (!cachedVaults || cachedVaults.length === 0) {
        container.innerHTML = '<span style="color:var(--text-dim); font-size:12px;">No vaults configured yet</span>';
        return;
      }
      container.innerHTML = cachedVaults.map(v => {
        const current = (currentOverrides && currentOverrides[v.id]) || 'inherit';
        return \`<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-size:12px;">
          <div>
            <strong>\${escapeHtml(v.name)}</strong>
            <span style="font-size:11px; color:var(--text-dim); margin-left:4px;">(\${escapeHtml(v.id)})</span>
          </div>
          <select class="vault-override-select" data-vault="\${escapeHtml(v.id)}" style="background:var(--bg-surface); color:var(--text-main); border:1px solid var(--border); border-radius:4px; padding:3px 6px; font-size:12px;">
            <option value="inherit" \${current === 'inherit' ? 'selected' : ''}>Inherit Global Role</option>
            <option value="editor" \${current === 'editor' ? 'selected' : ''}>Editor (Read & Write)</option>
            <option value="viewer" \${current === 'viewer' ? 'selected' : ''}>Viewer (Read-Only)</option>
            <option value="forbidden" \${current === 'forbidden' ? 'selected' : ''}>Forbidden (Denied)</option>
          </select>
        </div>\`;
      }).join('');
    }

    function getSelectedVaultOverrides(containerId) {
      const overrides = {};
      document.querySelectorAll('#' + containerId + ' .vault-override-select').forEach(sel => {
        const vId = sel.getAttribute('data-vault');
        const role = sel.value;
        if (role && role !== 'inherit') {
          overrides[vId] = role;
        }
      });
      return overrides;
    }

    async function openCreateTokenModal() {
      document.getElementById('input-token-name').value = '';
      document.getElementById('input-token-secret').value = '';
      document.getElementById('select-token-role').value = 'editor';

      if (!cachedVaults || cachedVaults.length === 0) {
        await loadVaults();
      }
      renderVaultAccessList('create-token-vault-access', {});
      openModal('modal-create-token');
    }

    async function submitCreateToken() {
      const name = document.getElementById('input-token-name').value.trim();
      const role = document.getElementById('select-token-role').value;
      const token = document.getElementById('input-token-secret').value.trim();
      const vaultAccess = getSelectedVaultOverrides('create-token-vault-access');

      if (!name) {
        showToast('Token label is required', 'error');
        return;
      }

      try {
        const res = await fetch('/api/v1/tokens', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, role, token: token || undefined, vaultAccess }),
        });
        if (res.ok) {
          showToast('Token created successfully', 'success');
          closeModal('modal-create-token');
          loadTokens();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to create token', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    function openEditTokenModal(tokenId) {
      const token = cachedTokens.find(t => t.id === tokenId);
      if (!token) return;

      document.getElementById('edit-token-id').value = token.id;
      document.getElementById('edit-token-name').value = token.name;
      document.getElementById('edit-token-role').value = token.role;
      renderVaultAccessList('edit-token-vault-access', token.vaultAccess || {});
      openModal('modal-edit-token');
    }

    async function submitUpdateToken() {
      const id = document.getElementById('edit-token-id').value;
      const name = document.getElementById('edit-token-name').value.trim();
      const role = document.getElementById('edit-token-role').value;
      const vaultAccess = getSelectedVaultOverrides('edit-token-vault-access');

      try {
        const res = await fetch('/api/v1/tokens/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, role, vaultAccess }),
        });
        if (res.ok) {
          showToast('Token permissions updated', 'success');
          closeModal('modal-edit-token');
          loadTokens();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to update token', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    async function deleteToken(id) {
      if (!confirm('Revoke and delete this token? Clients using this token will be disconnected immediately.')) return;
      try {
        const res = await fetch('/api/v1/tokens/' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          showToast('Token revoked', 'success');
          loadTokens();
        } else {
          showToast('Failed to revoke token', 'error');
        }
      } catch {
        showToast('Network error', 'error');
      }
    }

    // Activity Logs
    async function loadActivityLogs() {
      try {
        const res = await fetch('/api/v1/activity', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const logs = await res.json();
        const tbody = document.getElementById('activity-table-body');
        if (!logs || logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No activity logs recorded yet</td></tr>';
          return;
        }

        tbody.innerHTML = logs.map(l => {
          const date = new Date(l.timestamp).toLocaleTimeString();
          return \`<tr>
            <td style="font-size:12px; color:var(--text-dim); font-family:var(--font-mono);">\${date}</td>
            <td><span class="badge badge-editor">\${escapeHtml(l.type)}</span></td>
            <td>\${l.vaultId ? '<span class="code-snippet">' + escapeHtml(l.vaultId) + '</span>' : '-'}</td>
            <td>\${l.userName ? '<strong>' + escapeHtml(l.userName) + '</strong>' : '-'}</td>
            <td style="color:var(--text-muted);">\${escapeHtml(l.details)}</td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
      });
    }

    // Periodic auto-refresh every 10 seconds for active view
    setInterval(() => {
      refreshCurrentView();
    }, 10000);

    // Initial load
    window.onload = () => {
      refreshCurrentView();
    };
  </script>
</body>
</html>`;
}
