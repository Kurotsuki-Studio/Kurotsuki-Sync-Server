export function getAdminPanelHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kurotsuki Sync — Web Admin Panel</title>
  <style>
    :root {
      --bg-base: #0b0d14;
      --bg-surface: #131622;
      --bg-elevated: #1b2032;
      --bg-hover: #242a40;
      --border: #272e45;
      --border-strong: #374160;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #8b5cf6;
      --primary-hover: #7c3aed;
      --primary-soft: rgba(139, 92, 246, 0.16);
      --success: #10b981;
      --success-soft: rgba(16, 185, 129, 0.16);
      --warning: #f59e0b;
      --warning-soft: rgba(245, 158, 11, 0.16);
      --danger: #ef4444;
      --danger-soft: rgba(239, 68, 68, 0.16);
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --radius: 10px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-base);
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    header {
      background: rgba(19, 22, 34, 0.92);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 40;
    }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { font-size: 22px; line-height: 1; }
    .brand-title {
      font-weight: 700;
      font-size: 17px;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #c4b5fd, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-sub { font-size: 12px; color: var(--text-dim); }
    .version-pill {
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: #c4b5fd;
      border: 1px solid rgba(139, 92, 246, 0.35);
    }

    .header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 11px;
      border-radius: 999px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 8px rgba(16,185,129,0.7); }
    .dot.offline { background: var(--danger); box-shadow: 0 0 8px rgba(239,68,68,0.7); }

    /* Nav */
    .nav-bar {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
      display: flex;
      gap: 4px;
      overflow-x: auto;
    }
    .nav-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .nav-tab:hover { color: var(--text); }
    .nav-tab.active { color: #c4b5fd; border-bottom-color: var(--primary); font-weight: 600; }
    .nav-count {
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--bg-elevated);
      color: var(--text-muted);
    }

    /* Main */
    main {
      flex: 1;
      width: 100%;
      max-width: 1360px;
      margin: 0 auto;
      padding: 24px;
    }
    .view-section { display: none; }
    .view-section.active { display: block; }

    /* Auth Gate */
    .auth-gate {
      max-width: 440px;
      margin: 60px auto;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 28px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    }
    .auth-gate h2 { font-size: 19px; margin-bottom: 6px; }
    .auth-gate p { color: var(--text-muted); font-size: 13px; margin-bottom: 18px; }

    /* Cards & Metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
      margin-bottom: 22px;
    }
    .metric-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 18px;
    }
    .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-dim); font-weight: 600; }
    .metric-value { font-size: 26px; font-weight: 700; margin-top: 6px; letter-spacing: -0.02em; }
    .metric-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* Panel / Table */
    .panel {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 22px;
    }
    .panel-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .panel-title { font-size: 15px; font-weight: 600; }
    .panel-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .panel-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      background: var(--bg-elevated);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      vertical-align: middle;
    }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: rgba(36, 42, 64, 0.5); }

    .empty-state {
      text-align: center;
      padding: 36px 20px;
      color: var(--text-dim);
      font-size: 13px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text);
      text-decoration: none;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .btn:hover { background: var(--bg-hover); border-color: var(--border-strong); }
    .btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); border-color: var(--primary-hover); }
    .btn-danger { background: var(--danger-soft); color: #fca5a5; border-color: rgba(239,68,68,0.35); }
    .btn-danger:hover { background: var(--danger); color: #fff; border-color: var(--danger); }
    .btn-sm { padding: 4px 9px; font-size: 12px; border-radius: 6px; }
    .btn-icon { padding: 4px 8px; font-size: 12px; }

    /* Badges & Code */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
      text-transform: uppercase;
      white-space: nowrap;
    }
    .badge-admin { background: var(--danger-soft); color: #fca5a5; border: 1px solid rgba(239,68,68,0.35); }
    .badge-editor { background: var(--success-soft); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.35); }
    .badge-viewer { background: var(--warning-soft); color: #fcd34d; border: 1px solid rgba(245,158,11,0.35); }
    .badge-forbidden { background: var(--bg-elevated); color: var(--text-dim); border: 1px solid var(--border); }
    .badge-info { background: var(--primary-soft); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.35); }

    .mono {
      font-family: var(--font-mono);
      font-size: 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      padding: 2px 6px;
      border-radius: 5px;
      color: #cbd5e1;
    }

    .pill-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .access-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 5px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
    }

    /* Progress */
    .progress-track {
      width: 100%;
      height: 6px;
      background: var(--bg-elevated);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress-fill { height: 100%; background: var(--primary); border-radius: 999px; transition: width 0.3s; }
    .progress-fill.warn { background: var(--warning); }
    .progress-fill.danger { background: var(--danger); }

    /* Forms */
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .form-hint { font-size: 11px; color: var(--text-dim); margin-top: 4px; }
    .form-control, .form-select {
      width: 100%;
      padding: 8px 11px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 7px;
      color: var(--text);
      font-size: 13px;
      outline: none;
    }
    .form-control:focus, .form-select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(139,92,246,0.2); }
    .form-select-sm {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 6px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text);
      outline: none;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 7, 12, 0.76);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
    }
    .modal-backdrop.open { display: flex; }
    .modal {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .modal.modal-lg { max-width: 780px; }
    .modal-header {
      padding: 15px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title { font-size: 16px; font-weight: 600; }
    .modal-close { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; line-height: 1; }
    .modal-close:hover { color: var(--text); }
    .modal-body { padding: 18px 20px; overflow-y: auto; }
    .modal-footer {
      padding: 13px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .vault-perm-list {
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-base);
      padding: 10px 12px;
      max-height: 240px;
      overflow-y: auto;
    }
    .vault-perm-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 7px 0;
      border-bottom: 1px solid rgba(39, 46, 69, 0.5);
    }
    .vault-perm-row:last-child { border-bottom: none; }

    .invite-box {
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
      color: #e2e8f0;
    }

    /* Toast */
    .toast-stack {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
    }
    .toast {
      background: var(--bg-elevated);
      border: 1px solid var(--border-strong);
      border-left: 4px solid var(--primary);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.45);
    }
    .toast.success { border-left-color: var(--success); }
    .toast.error { border-left-color: var(--danger); }

    @media (max-width: 720px) {
      main { padding: 14px; }
      header { padding: 10px 14px; }
      .form-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">🌙</div>
      <div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="brand-title">Kurotsuki Sync</span>
          <span class="version-pill" id="header-version">v1.2.0</span>
        </div>
        <div class="brand-sub">Web Admin Panel</div>
      </div>
    </div>
    <div class="header-right">
      <div class="status-pill">
        <span class="dot" id="server-dot"></span>
        <span id="server-status-text">Checking...</span>
      </div>
      <button class="btn btn-sm" id="btn-refresh-now">🔄 Refresh</button>
      <button class="btn btn-sm" id="btn-open-auth">🔑 Admin Token</button>
    </div>
  </header>

  <nav class="nav-bar" id="nav-bar">
    <button class="nav-tab active" data-view="overview">📊 Overview</button>
    <button class="nav-tab" data-view="vaults">🗂️ Vaults <span class="nav-count" id="nav-count-vaults">0</span></button>
    <button class="nav-tab" data-view="users">👥 Users &amp; Tokens <span class="nav-count" id="nav-count-users">0</span></button>
    <button class="nav-tab" data-view="activity">📜 Activity Logs</button>
  </nav>

  <main>
    <!-- Auth Gate -->
    <div id="auth-gate" class="auth-gate" style="display:none;">
      <h2>🔒 Admin Authentication Required</h2>
      <p>Enter your server <span class="mono">AUTH_TOKEN</span> to manage vaults, second users, and live connections.</p>
      <div class="form-group">
        <label class="form-label" for="gate-token-input">Admin Token</label>
        <input type="password" id="gate-token-input" class="form-control" placeholder="Paste server AUTH_TOKEN...">
      </div>
      <button class="btn btn-primary" style="width:100%;" id="btn-gate-login">Unlock Admin Panel</button>
    </div>

    <div id="app-content" style="display:none;">
      <!-- OVERVIEW -->
      <section id="view-overview" class="view-section active">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Connected Peers</div>
            <div class="metric-value" id="stat-peers">0</div>
            <div class="metric-sub" id="stat-rooms">0 active rooms</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Vaults &amp; Storage</div>
            <div class="metric-value" id="stat-storage">0 MB</div>
            <div class="metric-sub" id="stat-vaults-total">0 configured vaults</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Second Users</div>
            <div class="metric-value" id="stat-users">0</div>
            <div class="metric-sub">Issued access tokens</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Server Health</div>
            <div class="metric-value" id="stat-uptime">0m</div>
            <div class="metric-sub" id="stat-memory">Heap: 0 MB</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Live Connected Peers</div>
              <div class="panel-sub">Real-time WebSocket sessions across all vaults</div>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Collaborator</th>
                  <th>Account / Token</th>
                  <th>Role</th>
                  <th>Vault</th>
                  <th>Active File</th>
                  <th>IP</th>
                  <th>Connected</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="peers-tbody">
                <tr><td colspan="8" class="empty-state">No active connections</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- VAULTS -->
      <section id="view-vaults" class="view-section">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Multi-Vault &amp; Room Management</div>
              <div class="panel-sub">Configure vaults, storage quotas, and per-vault user permissions</div>
            </div>
            <div class="panel-actions">
              <button class="btn btn-primary" id="btn-new-vault">+ Create Vault</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vault</th>
                  <th>Default Role</th>
                  <th>Members</th>
                  <th>Peers</th>
                  <th>Content</th>
                  <th>Quota</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="vaults-tbody">
                <tr><td colspan="7" class="empty-state">Loading vaults...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- USERS & TOKENS -->
      <section id="view-users" class="view-section">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Users &amp; Access Tokens</div>
              <div class="panel-sub">Create tokens for friends or devices, restrict them to specific vaults, and share connection details</div>
            </div>
            <div class="panel-actions">
              <button class="btn btn-primary" id="btn-new-user">+ Add User / Token</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User / Label</th>
                  <th>Global Role</th>
                  <th>Token Secret</th>
                  <th>Vault Permissions</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="users-tbody">
                <tr><td colspan="6" class="empty-state">No secondary user tokens yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Vault × User Access Matrix</div>
              <div class="panel-sub">Click any cell to immediately update a user's effective role on that vault</div>
            </div>
          </div>
          <div class="table-wrap" id="matrix-wrap">
            <div class="empty-state">Create at least one user token to view the access matrix</div>
          </div>
        </div>
      </section>

      <!-- ACTIVITY -->
      <section id="view-activity" class="view-section">
        <div class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">Activity &amp; Audit Logs</div>
              <div class="panel-sub">Recent joins, leaves, role changes, and vault events</div>
            </div>
            <div class="panel-actions">
              <select id="activity-filter-type" class="form-select-sm">
                <option value="">All Events</option>
                <option value="join">Joins</option>
                <option value="leave">Leaves</option>
                <option value="role_change">Role Changes</option>
                <option value="token">Token Events</option>
                <option value="vault">Vault Events</option>
              </select>
              <input type="text" id="activity-search" class="form-select-sm" placeholder="Filter by user or vault..." style="width:200px;">
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Vault</th>
                  <th>User</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody id="activity-tbody">
                <tr><td colspan="5" class="empty-state">No activity recorded yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </main>

  <!-- MODAL: Auth Token -->
  <div class="modal-backdrop" id="modal-auth">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🔑 Admin Authentication</div>
        <button class="modal-close" data-close-modal="modal-auth">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="modal-auth-input">Server AUTH_TOKEN</label>
          <input type="password" id="modal-auth-input" class="form-control" placeholder="Leave blank if server has no AUTH_TOKEN">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="btn-auth-logout">Clear Token</button>
        <button class="btn btn-primary" id="btn-auth-save">Save &amp; Connect</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Create / Edit Vault -->
  <div class="modal-backdrop" id="modal-vault">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="modal-vault-title">Create Vault</div>
        <button class="modal-close" data-close-modal="modal-vault">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="vault-mode" value="create">
        <div class="form-group">
          <label class="form-label" for="vault-id">Vault ID</label>
          <input type="text" id="vault-id" class="form-control" placeholder="e.g. shared-notes">
          <div class="form-hint">Lowercase letters, numbers, and hyphens only. Must match Obsidian plugin settings.</div>
        </div>
        <div class="form-group">
          <label class="form-label" for="vault-name">Display Name</label>
          <input type="text" id="vault-name" class="form-control" placeholder="e.g. Shared Team Notes">
        </div>
        <div class="form-group">
          <label class="form-label" for="vault-desc">Description</label>
          <input type="text" id="vault-desc" class="form-control" placeholder="Optional description">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="vault-quota">Storage Quota (MB)</label>
            <input type="number" id="vault-quota" class="form-control" value="500" min="10">
          </div>
          <div class="form-group">
            <label class="form-label" for="vault-default-role">Default Role (Open Mode)</label>
            <select id="vault-default-role" class="form-select">
              <option value="editor">Editor (Read &amp; Write)</option>
              <option value="viewer">Viewer (Read-Only)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" data-close-modal="modal-vault">Cancel</button>
        <button class="btn btn-primary" id="btn-save-vault">Save Vault</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Vault Members -->
  <div class="modal-backdrop" id="modal-vault-members">
    <div class="modal modal-lg">
      <div class="modal-header">
        <div class="modal-title" id="vault-members-title">👥 Vault Members</div>
        <button class="modal-close" data-close-modal="modal-vault-members">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          Manage which users can access <span class="mono" id="vault-members-id"></span>. Changes apply immediately to connected sessions.
        </p>
        <div id="vault-members-list"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-close-modal="modal-vault-members">Done</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Inspect Vault -->
  <div class="modal-backdrop" id="modal-inspect">
    <div class="modal modal-lg">
      <div class="modal-header">
        <div class="modal-title" id="inspect-title">🔍 Inspect Vault</div>
        <button class="modal-close" data-close-modal="modal-inspect">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-primary" id="btn-inspect-docs">📄 Notes</button>
            <button class="btn btn-sm" id="btn-inspect-att">📎 Attachments</button>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="text" id="inspect-search" class="form-select-sm" placeholder="Search files..." style="width:180px;">
            <button class="btn btn-sm" id="btn-inspect-compact">🗜️ Compact CRDT</button>
            <button class="btn btn-sm" id="btn-inspect-export">💾 Export</button>
          </div>
        </div>
        <div id="inspect-body" style="max-height:420px; overflow-y:auto;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn" data-close-modal="modal-inspect">Close</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Create / Edit User Token -->
  <div class="modal-backdrop" id="modal-user">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="modal-user-title">Add User / Token</div>
        <button class="modal-close" data-close-modal="modal-user">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="user-mode" value="create">
        <input type="hidden" id="user-id" value="">
        <div class="form-group">
          <label class="form-label" for="user-name">User Name / Label</label>
          <input type="text" id="user-name" class="form-control" placeholder="e.g. Alex (Friend) or Laptop">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="user-role">Global Fallback Role</label>
            <select id="user-role" class="form-select">
              <option value="editor">Editor (Read &amp; Write)</option>
              <option value="viewer">Viewer (Read-Only)</option>
              <option value="admin">Admin (Full Server Access)</option>
            </select>
            <div class="form-hint">Used for any vault set to "Inherit".</div>
          </div>
          <div class="form-group" id="user-preset-group">
            <label class="form-label" for="user-preset">Quick Access Preset</label>
            <select id="user-preset" class="form-select">
              <option value="restricted">Selected Vaults Only (Forbidden elsewhere)</option>
              <option value="global">Use Global Role Everywhere</option>
            </select>
          </div>
        </div>
        <div class="form-group" id="user-secret-group">
          <label class="form-label" for="user-secret">Token Secret (Optional)</label>
          <input type="text" id="user-secret" class="form-control" placeholder="Leave blank to auto-generate kuro_...">
        </div>
        <div class="form-group">
          <label class="form-label">Per-Vault Permissions</label>
          <div class="vault-perm-list" id="user-vault-perms"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" data-close-modal="modal-user">Cancel</button>
        <button class="btn btn-primary" id="btn-save-user">Save User</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Obsidian Invite / Connection Config -->
  <div class="modal-backdrop" id="modal-invite">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🔗 Obsidian Connection Details</div>
        <button class="modal-close" data-close-modal="modal-invite">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="invite-vault-select">Target Vault</label>
          <select id="invite-vault-select" class="form-select"></select>
        </div>
        <div class="form-group">
          <label class="form-label">Shareable Setup Instructions</label>
          <div class="invite-box" id="invite-preview"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" data-close-modal="modal-invite">Close</button>
        <button class="btn btn-primary" id="btn-copy-invite">📋 Copy Connection Info</button>
      </div>
    </div>
  </div>

  <div class="toast-stack" id="toast-stack"></div>

  <script>
    const state = {
      adminToken: localStorage.getItem('kurotsuki_admin_token') || '',
      authenticated: false,
      authRequired: true,
      currentView: 'overview',
      vaults: [],
      tokens: [],
      peers: [],
      activity: [],
      revealedTokens: new Set(),
      inspectVaultId: null,
      inspectTab: 'docs',
      inspectItems: [],
      inviteTokenId: null,
      membersVaultId: null
    };

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function showToast(msg, type) {
      const stack = document.getElementById('toast-stack');
      const el = document.createElement('div');
      el.className = 'toast ' + (type || '');
      el.textContent = msg;
      stack.appendChild(el);
      setTimeout(() => { el.remove(); }, 3400);
    }

    async function copyText(text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          showToast('Copied to clipboard!', 'success');
          return true;
        }
      } catch {}
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('Copied to clipboard!', 'success');
        return true;
      } catch {
        showToast('Copy failed — please copy manually', 'error');
        return false;
      }
    }

    function authHeaders(json) {
      const h = {};
      if (json) h['Content-Type'] = 'application/json';
      if (state.adminToken) h['Authorization'] = 'Bearer ' + state.adminToken;
      return h;
    }

    async function apiFetch(url, opts) {
      const res = await fetch(url, opts);
      if (res.status === 401) {
        state.authenticated = false;
        renderAuthGate();
        throw new Error('Unauthorized');
      }
      return res;
    }

    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    function renderAuthGate() {
      const gate = document.getElementById('auth-gate');
      const app = document.getElementById('app-content');
      if (state.authRequired && !state.authenticated) {
        gate.style.display = 'block';
        app.style.display = 'none';
      } else {
        gate.style.display = 'none';
        app.style.display = 'block';
      }
    }

    async function verifyAuth() {
      try {
        const res = await fetch('/api/v1/auth/verify', { headers: authHeaders(false) });
        const data = await res.json();
        state.authRequired = !!data.authRequired;
        state.authenticated = !!data.authenticated;
        if (data.version) {
          document.getElementById('header-version').textContent = 'v' + data.version;
        }
        document.getElementById('server-dot').classList.remove('offline');
        document.getElementById('server-status-text').textContent = state.authenticated ? 'Online · Authenticated' : 'Online · Locked';
        renderAuthGate();
        if (state.authenticated || !state.authRequired) {
          await refreshAll();
        }
      } catch {
        document.getElementById('server-dot').classList.add('offline');
        document.getElementById('server-status-text').textContent = 'Offline';
      }
    }

    async function refreshAll() {
      if (state.authRequired && !state.authenticated) return;
      try {
        const [statsRes, peersRes, vaultsRes, tokensRes] = await Promise.all([
          apiFetch('/api/v1/stats', { headers: authHeaders(false) }),
          apiFetch('/api/v1/peers', { headers: authHeaders(false) }),
          apiFetch('/api/v1/vaults', { headers: authHeaders(false) }),
          apiFetch('/api/v1/tokens', { headers: authHeaders(false) })
        ]);
        const stats = await statsRes.json();
        state.peers = await peersRes.json();
        state.vaults = await vaultsRes.json();
        state.tokens = await tokensRes.json();

        renderOverview(stats);
        renderVaults();
        renderUsers();
        renderMatrix();

        if (state.currentView === 'activity') {
          await loadActivity();
        }
      } catch (err) {
        if (err.message !== 'Unauthorized') console.error(err);
      }
    }

    function formatUptime(sec) {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      const m = Math.floor((sec % 3600) / 60);
      if (d > 0) return d + 'd ' + h + 'h';
      if (h > 0) return h + 'h ' + m + 'm';
      return m + 'm ' + (sec % 60) + 's';
    }

    function renderOverview(stats) {
      document.getElementById('stat-peers').textContent = stats.totalConnections || 0;
      document.getElementById('stat-rooms').textContent = (stats.activeRooms || 0) + ' active rooms';
      const totalBytes = state.vaults.reduce((sum, v) => sum + ((v.stats && v.stats.totalSizeBytes) || 0), 0);
      document.getElementById('stat-storage').textContent = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
      document.getElementById('stat-vaults-total').textContent = state.vaults.length + ' configured vaults';
      document.getElementById('stat-users').textContent = state.tokens.length;
      document.getElementById('stat-uptime').textContent = formatUptime(stats.uptime || 0);
      const heapMB = stats.memory ? Math.round(stats.memory.heapUsed / 1024 / 1024) : 0;
      document.getElementById('stat-memory').textContent = 'Heap: ' + heapMB + ' MB';

      document.getElementById('nav-count-vaults').textContent = state.vaults.length;
      document.getElementById('nav-count-users').textContent = state.tokens.length;

      const tbody = document.getElementById('peers-tbody');
      if (!state.peers.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No active collaborator connections</td></tr>';
        return;
      }
      tbody.innerHTML = state.peers.map(p => {
        const ago = Math.max(0, Math.round((Date.now() - p.connectedAt) / 1000));
        const agoStr = ago >= 60 ? Math.floor(ago / 60) + 'm ago' : ago + 's ago';
        return '<tr>' +
          '<td><div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:' + escapeHtml((p.user && p.user.color) || '#3b82f6') + '"></span><strong>' + escapeHtml((p.user && p.user.name) || 'Anonymous') + '</strong></div></td>' +
          '<td>' + (p.tokenName ? '<span class="mono">' + escapeHtml(p.tokenName) + '</span>' : '<span style="color:var(--text-dim)">Open / Guest</span>') + '</td>' +
          '<td><span class="badge badge-' + escapeHtml(p.role) + '">' + escapeHtml(p.role) + '</span></td>' +
          '<td><span class="mono">' + escapeHtml(p.vaultId) + '</span></td>' +
          '<td>' + (p.activeFile ? '<span class="mono">' + escapeHtml(p.activeFile) + '</span>' : '<span style="color:var(--text-dim)">idle</span>') + '</td>' +
          '<td><span class="mono">' + escapeHtml(p.ip) + '</span></td>' +
          '<td>' + agoStr + '</td>' +
          '<td><button class="btn btn-sm btn-danger" data-action="kick-peer" data-id="' + escapeHtml(p.id) + '">Kick</button></td>' +
        '</tr>';
      }).join('');
    }

    function getEffectiveRole(tokenObj, vaultId) {
      if (tokenObj.vaultAccess && tokenObj.vaultAccess[vaultId]) {
        return { role: tokenObj.vaultAccess[vaultId], explicit: true };
      }
      const v = state.vaults.find(x => x.id === vaultId);
      if (v && v.tokenRoles && v.tokenRoles[tokenObj.id]) {
        return { role: v.tokenRoles[tokenObj.id], explicit: true };
      }
      return { role: tokenObj.role, explicit: false };
    }

    function renderVaults() {
      const tbody = document.getElementById('vaults-tbody');
      if (!state.vaults.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No vaults configured</td></tr>';
        return;
      }
      tbody.innerHTML = state.vaults.map(v => {
        const stats = v.stats || { docCount: 0, attachmentCount: 0, totalSizeBytes: 0 };
        const usedMB = (stats.totalSizeBytes || 0) / (1024 * 1024);
        const quotaMB = v.quotaMB || 500;
        const pct = Math.min(100, Math.round((usedMB / quotaMB) * 100));
        const fillCls = pct > 90 ? 'danger' : (pct > 75 ? 'warn' : '');

        let allowedCount = 0;
        let blockedCount = 0;
        state.tokens.forEach(t => {
          const eff = getEffectiveRole(t, v.id);
          if (eff.role === 'forbidden') blockedCount++;
          else allowedCount++;
        });

        return '<tr>' +
          '<td><strong>' + escapeHtml(v.name) + '</strong><div class="mono" style="margin-top:3px;display:inline-block;">' + escapeHtml(v.id) + '</div>' +
            (v.description ? '<div style="font-size:12px;color:var(--text-muted);margin-top:3px;">' + escapeHtml(v.description) + '</div>' : '') + '</td>' +
          '<td><span class="badge badge-' + escapeHtml(v.defaultRole) + '">' + escapeHtml(v.defaultRole) + '</span></td>' +
          '<td><span style="font-size:12px;">' + allowedCount + ' allowed' + (blockedCount ? ' · <span style="color:var(--text-dim)">' + blockedCount + ' blocked</span>' : '') + '</span></td>' +
          '<td>' + (v.activePeers || 0) + '</td>' +
          '<td>' + stats.docCount + ' docs · ' + stats.attachmentCount + ' files</td>' +
          '<td style="min-width:150px;"><div style="font-size:12px;">' + usedMB.toFixed(2) + ' / ' + quotaMB + ' MB (' + pct + '%)</div><div class="progress-track"><div class="progress-fill ' + fillCls + '" style="width:' + pct + '%"></div></div></td>' +
          '<td><div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn btn-sm btn-primary" data-action="vault-members" data-id="' + escapeHtml(v.id) + '">👥 Members</button>' +
            '<button class="btn btn-sm" data-action="inspect-vault" data-id="' + escapeHtml(v.id) + '">🔍 Inspect</button>' +
            '<button class="btn btn-sm" data-action="edit-vault" data-id="' + escapeHtml(v.id) + '">⚙️</button>' +
            (v.id !== 'default-vault' ? '<button class="btn btn-sm btn-danger" data-action="delete-vault" data-id="' + escapeHtml(v.id) + '">🗑️</button>' : '') +
          '</div></td>' +
        '</tr>';
      }).join('');
    }

    function renderUsers() {
      const tbody = document.getElementById('users-tbody');
      if (!state.tokens.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No second users or tokens yet. Click "+ Add User / Token" to invite someone.</td></tr>';
        return;
      }
      tbody.innerHTML = state.tokens.map(t => {
        const revealed = state.revealedTokens.has(t.id);
        const secretDisplay = revealed ? t.token : (t.token.slice(0, 10) + '••••••••');
        const permsHtml = state.vaults.map(v => {
          const eff = getEffectiveRole(t, v.id);
          return '<span class="access-pill">' + escapeHtml(v.id) + ': <span class="badge badge-' + escapeHtml(eff.role) + '">' + escapeHtml(eff.role) + '</span></span>';
        }).join('');

        return '<tr>' +
          '<td><strong>' + escapeHtml(t.name) + '</strong><div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);">' + escapeHtml(t.id) + '</div></td>' +
          '<td><span class="badge badge-' + escapeHtml(t.role) + '">' + escapeHtml(t.role) + '</span></td>' +
          '<td><div style="display:flex;align-items:center;gap:6px;">' +
            '<span class="mono">' + escapeHtml(secretDisplay) + '</span>' +
            '<button class="btn btn-icon" title="Show/Hide" data-action="toggle-secret" data-id="' + escapeHtml(t.id) + '">' + (revealed ? '🙈' : '👁️') + '</button>' +
            '<button class="btn btn-icon" title="Copy Token" data-action="copy-token" data-id="' + escapeHtml(t.id) + '">📋</button>' +
          '</div></td>' +
          '<td><div class="pill-list">' + permsHtml + '</div></td>' +
          '<td style="font-size:12px;color:var(--text-muted);">' + new Date(t.createdAt).toLocaleDateString() + '</td>' +
          '<td><div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn btn-sm btn-primary" data-action="invite-user" data-id="' + escapeHtml(t.id) + '">🔗 Invite</button>' +
            '<button class="btn btn-sm" data-action="edit-user" data-id="' + escapeHtml(t.id) + '">⚙️ Edit</button>' +
            '<button class="btn btn-sm" title="Regenerate Secret" data-action="regen-user" data-id="' + escapeHtml(t.id) + '">🔄</button>' +
            '<button class="btn btn-sm btn-danger" data-action="delete-user" data-id="' + escapeHtml(t.id) + '">Revoke</button>' +
          '</div></td>' +
        '</tr>';
      }).join('');
    }

    function renderMatrix() {
      const wrap = document.getElementById('matrix-wrap');
      if (!state.tokens.length || !state.vaults.length) {
        wrap.innerHTML = '<div class="empty-state">Create at least one user token to view the access matrix</div>';
        return;
      }
      const head = '<tr><th>User</th>' + state.vaults.map(v => '<th>' + escapeHtml(v.name) + '<div style="font-weight:400;text-transform:none;font-family:var(--font-mono);font-size:10px;">' + escapeHtml(v.id) + '</div></th>').join('') + '</tr>';
      const rows = state.tokens.map(t => {
        const cells = state.vaults.map(v => {
          const override = t.vaultAccess && t.vaultAccess[v.id];
          const val = override || 'inherit';
          return '<td><select class="form-select-sm matrix-select" data-vault="' + escapeHtml(v.id) + '" data-token="' + escapeHtml(t.id) + '">' +
            '<option value="inherit"' + (val === 'inherit' ? ' selected' : '') + '>Inherit (' + escapeHtml(t.role) + ')</option>' +
            '<option value="editor"' + (val === 'editor' ? ' selected' : '') + '>Editor</option>' +
            '<option value="viewer"' + (val === 'viewer' ? ' selected' : '') + '>Viewer</option>' +
            '<option value="admin"' + (val === 'admin' ? ' selected' : '') + '>Admin</option>' +
            '<option value="forbidden"' + (val === 'forbidden' ? ' selected' : '') + '>Forbidden</option>' +
          '</select></td>';
        }).join('');
        return '<tr><td><strong>' + escapeHtml(t.name) + '</strong> <span class="badge badge-' + escapeHtml(t.role) + '">' + escapeHtml(t.role) + '</span></td>' + cells + '</tr>';
      }).join('');
      wrap.innerHTML = '<table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
    }

    async function loadActivity() {
      try {
        const res = await apiFetch('/api/v1/activity', { headers: authHeaders(false) });
        state.activity = await res.json();
        renderActivity();
      } catch {}
    }

    function renderActivity() {
      const typeFilter = document.getElementById('activity-filter-type').value;
      const query = document.getElementById('activity-search').value.trim().toLowerCase();
      const filtered = state.activity.filter(l => {
        if (typeFilter && !l.type.startsWith(typeFilter)) return false;
        if (query) {
          const hay = ((l.vaultId || '') + ' ' + (l.userName || '') + ' ' + (l.details || '')).toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      });
      const tbody = document.getElementById('activity-tbody');
      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No matching activity logs</td></tr>';
        return;
      }
      tbody.innerHTML = filtered.map(l => {
        const badgeCls = l.type === 'leave' || l.type.includes('delete') ? 'badge-admin' : (l.type === 'role_change' ? 'badge-viewer' : 'badge-info');
        return '<tr>' +
          '<td style="font-size:12px;color:var(--text-dim);font-family:var(--font-mono);white-space:nowrap;">' + new Date(l.timestamp).toLocaleString() + '</td>' +
          '<td><span class="badge ' + badgeCls + '">' + escapeHtml(l.type) + '</span></td>' +
          '<td>' + (l.vaultId ? '<span class="mono">' + escapeHtml(l.vaultId) + '</span>' : '-') + '</td>' +
          '<td>' + (l.userName ? '<strong>' + escapeHtml(l.userName) + '</strong>' : '-') + '</td>' +
          '<td style="color:var(--text-muted);">' + escapeHtml(l.details) + '</td>' +
        '</tr>';
      }).join('');
    }

    // Vault Modal
    function openVaultModal(vault) {
      document.getElementById('vault-mode').value = vault ? 'edit' : 'create';
      document.getElementById('modal-vault-title').textContent = vault ? '⚙️ Edit Vault: ' + vault.id : 'Create New Vault';
      const idInput = document.getElementById('vault-id');
      idInput.value = vault ? vault.id : '';
      idInput.disabled = !!vault;
      document.getElementById('vault-name').value = vault ? vault.name : '';
      document.getElementById('vault-desc').value = vault ? (vault.description || '') : '';
      document.getElementById('vault-quota').value = vault ? (vault.quotaMB || 500) : 500;
      document.getElementById('vault-default-role').value = vault ? (vault.defaultRole || 'editor') : 'editor';
      openModal('modal-vault');
    }

    async function saveVault() {
      const mode = document.getElementById('vault-mode').value;
      const id = document.getElementById('vault-id').value.trim();
      const name = document.getElementById('vault-name').value.trim();
      const description = document.getElementById('vault-desc').value.trim();
      const quotaMB = parseInt(document.getElementById('vault-quota').value, 10) || 500;
      const defaultRole = document.getElementById('vault-default-role').value;
      if (!id || !name) { showToast('Vault ID and Name are required', 'error'); return; }

      const url = mode === 'edit' ? '/api/v1/vaults/' + encodeURIComponent(id) : '/api/v1/vaults';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: authHeaders(true),
        body: JSON.stringify({ id, name, description, quotaMB, defaultRole })
      });
      if (res.ok) {
        showToast(mode === 'edit' ? 'Vault updated' : 'Vault created', 'success');
        closeModal('modal-vault');
        await refreshAll();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save vault', 'error');
      }
    }

    // Vault Members Modal
    function openVaultMembers(vaultId) {
      state.membersVaultId = vaultId;
      const vault = state.vaults.find(v => v.id === vaultId);
      document.getElementById('vault-members-title').textContent = '👥 Members — ' + (vault ? vault.name : vaultId);
      document.getElementById('vault-members-id').textContent = vaultId;
      const list = document.getElementById('vault-members-list');
      if (!state.tokens.length) {
        list.innerHTML = '<div class="empty-state">No secondary users yet. Add one in the Users &amp; Tokens tab.</div>';
      } else {
        list.innerHTML = '<div class="vault-perm-list">' + state.tokens.map(t => {
          const override = (t.vaultAccess && t.vaultAccess[vaultId]) || 'inherit';
          return '<div class="vault-perm-row">' +
            '<div><strong>' + escapeHtml(t.name) + '</strong> <span class="badge badge-' + escapeHtml(t.role) + '">' + escapeHtml(t.role) + '</span></div>' +
            '<select class="form-select-sm vault-member-select" data-token="' + escapeHtml(t.id) + '">' +
              '<option value="inherit"' + (override === 'inherit' ? ' selected' : '') + '>Inherit Global (' + escapeHtml(t.role) + ')</option>' +
              '<option value="editor"' + (override === 'editor' ? ' selected' : '') + '>Editor (Read &amp; Write)</option>' +
              '<option value="viewer"' + (override === 'viewer' ? ' selected' : '') + '>Viewer (Read-Only)</option>' +
              '<option value="admin"' + (override === 'admin' ? ' selected' : '') + '>Admin</option>' +
              '<option value="forbidden"' + (override === 'forbidden' ? ' selected' : '') + '>Forbidden (Blocked)</option>' +
            '</select>' +
          '</div>';
        }).join('') + '</div>';
      }
      openModal('modal-vault-members');
    }

    async function updateVaultAccess(vaultId, tokenId, access) {
      const res = await apiFetch('/api/v1/vaults/' + encodeURIComponent(vaultId) + '/access', {
        method: 'PUT',
        headers: authHeaders(true),
        body: JSON.stringify({ tokenId, access })
      });
      if (res.ok) {
        showToast('Access updated', 'success');
        await refreshAll();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update access', 'error');
      }
    }

    // User Modal
    function renderUserVaultPerms(overrides, preset) {
      const wrap = document.getElementById('user-vault-perms');
      if (!state.vaults.length) {
        wrap.innerHTML = '<div style="color:var(--text-dim);font-size:12px;">No vaults available</div>';
        return;
      }
      wrap.innerHTML = state.vaults.map((v, idx) => {
        let val = overrides && overrides[v.id];
        if (!val) {
          val = preset === 'restricted' ? (idx === 0 ? 'editor' : 'forbidden') : 'inherit';
        }
        return '<div class="vault-perm-row">' +
          '<div><strong>' + escapeHtml(v.name) + '</strong> <span class="mono">' + escapeHtml(v.id) + '</span></div>' +
          '<select class="form-select-sm user-vault-select" data-vault="' + escapeHtml(v.id) + '">' +
            '<option value="inherit"' + (val === 'inherit' ? ' selected' : '') + '>Inherit Global</option>' +
            '<option value="editor"' + (val === 'editor' ? ' selected' : '') + '>Editor (Read &amp; Write)</option>' +
            '<option value="viewer"' + (val === 'viewer' ? ' selected' : '') + '>Viewer (Read-Only)</option>' +
            '<option value="admin"' + (val === 'admin' ? ' selected' : '') + '>Admin</option>' +
            '<option value="forbidden"' + (val === 'forbidden' ? ' selected' : '') + '>Forbidden (Blocked)</option>' +
          '</select>' +
        '</div>';
      }).join('');
    }

    function openUserModal(tokenObj) {
      const isEdit = !!tokenObj;
      document.getElementById('user-mode').value = isEdit ? 'edit' : 'create';
      document.getElementById('user-id').value = isEdit ? tokenObj.id : '';
      document.getElementById('modal-user-title').textContent = isEdit ? '⚙️ Edit User: ' + tokenObj.name : '+ Add User / Token';
      document.getElementById('user-name').value = isEdit ? tokenObj.name : '';
      document.getElementById('user-role').value = isEdit ? tokenObj.role : 'editor';
      document.getElementById('user-secret').value = '';
      document.getElementById('user-preset-group').style.display = isEdit ? 'none' : 'block';
      document.getElementById('user-secret-group').style.display = isEdit ? 'none' : 'block';
      document.getElementById('user-preset').value = 'restricted';
      renderUserVaultPerms(isEdit ? (tokenObj.vaultAccess || {}) : {}, isEdit ? 'global' : 'restricted');
      openModal('modal-user');
    }

    async function saveUser() {
      const mode = document.getElementById('user-mode').value;
      const id = document.getElementById('user-id').value;
      const name = document.getElementById('user-name').value.trim();
      const role = document.getElementById('user-role').value;
      const token = document.getElementById('user-secret').value.trim();
      if (!name) { showToast('User name is required', 'error'); return; }

      const vaultAccess = {};
      document.querySelectorAll('#user-vault-perms .user-vault-select').forEach(sel => {
        if (sel.value !== 'inherit') {
          vaultAccess[sel.getAttribute('data-vault')] = sel.value;
        }
      });

      const url = mode === 'edit' ? '/api/v1/tokens/' + encodeURIComponent(id) : '/api/v1/tokens';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const payload = mode === 'edit' ? { name, role, vaultAccess } : { name, role, token: token || undefined, vaultAccess };

      const res = await apiFetch(url, {
        method,
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(mode === 'edit' ? 'User permissions updated' : 'User token created', 'success');
        closeModal('modal-user');
        await refreshAll();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save user', 'error');
      }
    }

    // Invite Modal
    function openInviteModal(tokenId) {
      state.inviteTokenId = tokenId;
      const sel = document.getElementById('invite-vault-select');
      const tokenObj = state.tokens.find(t => t.id === tokenId);
      const allowedVaults = state.vaults.filter(v => !tokenObj || getEffectiveRole(tokenObj, v.id).role !== 'forbidden');
      const list = allowedVaults.length ? allowedVaults : state.vaults;
      sel.innerHTML = list.map(v => '<option value="' + escapeHtml(v.id) + '">' + escapeHtml(v.name) + ' (' + escapeHtml(v.id) + ')</option>').join('');
      updateInvitePreview();
      openModal('modal-invite');
    }

    function updateInvitePreview() {
      const tokenObj = state.tokens.find(t => t.id === state.inviteTokenId);
      const vaultId = document.getElementById('invite-vault-select').value;
      if (!tokenObj) return;
      const wsProto = location.protocol === 'https:' ? 'wss://' : 'ws://';
      const wsUrl = wsProto + location.host;
      const eff = getEffectiveRole(tokenObj, vaultId);
      const text =
        'Kurotsuki Sync — Connection Setup\\n' +
        'User: ' + tokenObj.name + ' (' + eff.role + ')\\n' +
        'Server URL: ' + wsUrl + '\\n' +
        'Vault ID: ' + vaultId + '\\n' +
        'Auth Token: ' + tokenObj.token;
      document.getElementById('invite-preview').textContent = text;
    }

    // Inspect Modal
    async function openInspectModal(vaultId) {
      state.inspectVaultId = vaultId;
      document.getElementById('inspect-title').textContent = '🔍 Inspect Vault: ' + vaultId;
      document.getElementById('inspect-search').value = '';
      openModal('modal-inspect');
      await loadInspectTab('docs');
    }

    async function loadInspectTab(tab) {
      state.inspectTab = tab;
      document.getElementById('btn-inspect-docs').className = tab === 'docs' ? 'btn btn-sm btn-primary' : 'btn btn-sm';
      document.getElementById('btn-inspect-att').className = tab === 'attachments' ? 'btn btn-sm btn-primary' : 'btn btn-sm';
      const body = document.getElementById('inspect-body');
      body.innerHTML = '<div class="empty-state">Loading...</div>';
      const endpoint = '/api/v1/vaults/' + encodeURIComponent(state.inspectVaultId) + '/' + tab;
      const res = await apiFetch(endpoint, { headers: authHeaders(false) });
      state.inspectItems = await res.json();
      renderInspectItems();
    }

    function renderInspectItems() {
      const body = document.getElementById('inspect-body');
      const q = document.getElementById('inspect-search').value.trim().toLowerCase();
      const items = (state.inspectItems || []).filter(item => {
        const name = (item.fileName || item.path || '').toLowerCase();
        return !q || name.includes(q);
      });
      if (!items.length) {
        body.innerHTML = '<div class="empty-state">No ' + state.inspectTab + ' found</div>';
        return;
      }
      if (state.inspectTab === 'docs') {
        body.innerHTML = '<table><thead><tr><th>Document</th><th>Size</th><th>Modified</th><th>Preview</th></tr></thead><tbody>' +
          items.map(d => '<tr>' +
            '<td><span class="mono">' + escapeHtml(d.fileName) + '</span></td>' +
            '<td>' + (d.size / 1024).toFixed(1) + ' KB</td>' +
            '<td style="font-size:12px;color:var(--text-muted);">' + new Date(d.mtime).toLocaleString() + '</td>' +
            '<td style="font-size:11px;color:var(--text-dim);">' + escapeHtml((d.preview || '').slice(0, 60)) + '</td>' +
          '</tr>').join('') + '</tbody></table>';
      } else {
        body.innerHTML = '<table><thead><tr><th>Attachment</th><th>Size</th><th>Modified</th><th>Actions</th></tr></thead><tbody>' +
          items.map(a => {
            const dlUrl = '/api/v1/attachments/' + encodeURIComponent(state.inspectVaultId) + '/' + encodeURIComponent(a.path) + '?token=' + encodeURIComponent(state.adminToken);
            return '<tr>' +
              '<td><span class="mono">' + escapeHtml(a.path) + '</span></td>' +
              '<td>' + (a.size / 1024).toFixed(1) + ' KB</td>' +
              '<td style="font-size:12px;color:var(--text-muted);">' + new Date(a.mtime).toLocaleString() + '</td>' +
              '<td><div style="display:flex;gap:6px;">' +
                '<a href="' + dlUrl + '" target="_blank" class="btn btn-sm">Download</a>' +
                '<button class="btn btn-sm btn-danger" data-action="delete-att" data-path="' + escapeHtml(a.path) + '">Delete</button>' +
              '</div></td>' +
            '</tr>';
          }).join('') + '</tbody></table>';
      }
    }

    // Event Wiring
    document.getElementById('nav-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-tab');
      if (!btn) return;
      const view = btn.getAttribute('data-view');
      state.currentView = view;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t === btn));
      document.querySelectorAll('.view-section').forEach(s => s.classList.toggle('active', s.id === 'view-' + view));
      if (view === 'activity') loadActivity();
    });

    document.addEventListener('click', async (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        closeModal(closeBtn.getAttribute('data-close-modal'));
        return;
      }
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');

      if (action === 'kick-peer') {
        if (!confirm('Disconnect this peer?')) return;
        const res = await apiFetch('/api/v1/peers/' + encodeURIComponent(id) + '/disconnect', { method: 'POST', headers: authHeaders(false) });
        if (res.ok) { showToast('Peer disconnected', 'success'); refreshAll(); }
      } else if (action === 'vault-members') {
        openVaultMembers(id);
      } else if (action === 'inspect-vault') {
        openInspectModal(id);
      } else if (action === 'edit-vault') {
        openVaultModal(state.vaults.find(v => v.id === id));
      } else if (action === 'delete-vault') {
        if (!confirm('Permanently delete vault "' + id + '" and all its data?')) return;
        const res = await apiFetch('/api/v1/vaults/' + encodeURIComponent(id), { method: 'DELETE', headers: authHeaders(false) });
        if (res.ok) { showToast('Vault deleted', 'success'); refreshAll(); }
      } else if (action === 'toggle-secret') {
        if (state.revealedTokens.has(id)) state.revealedTokens.delete(id);
        else state.revealedTokens.add(id);
        renderUsers();
      } else if (action === 'copy-token') {
        const t = state.tokens.find(x => x.id === id);
        if (t) copyText(t.token);
      } else if (action === 'invite-user') {
        openInviteModal(id);
      } else if (action === 'edit-user') {
        openUserModal(state.tokens.find(x => x.id === id));
      } else if (action === 'regen-user') {
        if (!confirm('Regenerate secret for this user? Their old token will stop working immediately.')) return;
        const res = await apiFetch('/api/v1/tokens/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: authHeaders(true),
          body: JSON.stringify({ regenerate: true })
        });
        if (res.ok) {
          state.revealedTokens.add(id);
          showToast('Token secret regenerated', 'success');
          refreshAll();
        }
      } else if (action === 'delete-user') {
        if (!confirm('Revoke this token? Active sessions using it will be disconnected immediately.')) return;
        const res = await apiFetch('/api/v1/tokens/' + encodeURIComponent(id), { method: 'DELETE', headers: authHeaders(false) });
        if (res.ok) { showToast('Token revoked', 'success'); refreshAll(); }
      } else if (action === 'delete-att') {
        const filePath = actionEl.getAttribute('data-path');
        if (!confirm('Delete attachment "' + filePath + '"?')) return;
        const res = await apiFetch('/api/v1/vaults/' + encodeURIComponent(state.inspectVaultId) + '/attachments/' + encodeURIComponent(filePath), {
          method: 'DELETE',
          headers: authHeaders(false)
        });
        if (res.ok) { showToast('Attachment deleted', 'success'); loadInspectTab('attachments'); }
      }
    });

    document.addEventListener('change', async (e) => {
      if (e.target.classList.contains('matrix-select')) {
        const vaultId = e.target.getAttribute('data-vault');
        const tokenId = e.target.getAttribute('data-token');
        await updateVaultAccess(vaultId, tokenId, e.target.value);
      } else if (e.target.classList.contains('vault-member-select')) {
        const tokenId = e.target.getAttribute('data-token');
        await updateVaultAccess(state.membersVaultId, tokenId, e.target.value);
      }
    });

    document.getElementById('user-preset').addEventListener('change', (e) => {
      renderUserVaultPerms({}, e.target.value);
    });

    document.getElementById('invite-vault-select').addEventListener('change', updateInvitePreview);
    document.getElementById('btn-copy-invite').addEventListener('click', () => {
      copyText(document.getElementById('invite-preview').textContent);
    });

    document.getElementById('btn-open-auth').addEventListener('click', () => {
      document.getElementById('modal-auth-input').value = state.adminToken;
      openModal('modal-auth');
    });
    document.getElementById('btn-auth-save').addEventListener('click', () => {
      state.adminToken = document.getElementById('modal-auth-input').value.trim();
      localStorage.setItem('kurotsuki_admin_token', state.adminToken);
      closeModal('modal-auth');
      verifyAuth();
    });
    document.getElementById('btn-auth-logout').addEventListener('click', () => {
      state.adminToken = '';
      localStorage.removeItem('kurotsuki_admin_token');
      closeModal('modal-auth');
      verifyAuth();
    });
    document.getElementById('btn-gate-login').addEventListener('click', () => {
      state.adminToken = document.getElementById('gate-token-input').value.trim();
      localStorage.setItem('kurotsuki_admin_token', state.adminToken);
      verifyAuth().then(() => {
        if (state.authRequired && !state.authenticated) showToast('Invalid Admin Token', 'error');
      });
    });

    document.getElementById('btn-refresh-now').addEventListener('click', refreshAll);
    document.getElementById('btn-new-vault').addEventListener('click', () => openVaultModal(null));
    document.getElementById('btn-save-vault').addEventListener('click', saveVault);
    document.getElementById('btn-new-user').addEventListener('click', () => openUserModal(null));
    document.getElementById('btn-save-user').addEventListener('click', saveUser);

    document.getElementById('btn-inspect-docs').addEventListener('click', () => loadInspectTab('docs'));
    document.getElementById('btn-inspect-att').addEventListener('click', () => loadInspectTab('attachments'));
    document.getElementById('inspect-search').addEventListener('input', renderInspectItems);
    document.getElementById('btn-inspect-export').addEventListener('click', () => {
      window.open('/api/v1/vaults/' + encodeURIComponent(state.inspectVaultId) + '/export?token=' + encodeURIComponent(state.adminToken), '_blank');
    });
    document.getElementById('btn-inspect-compact').addEventListener('click', async () => {
      const res = await apiFetch('/api/v1/vaults/' + encodeURIComponent(state.inspectVaultId) + '/compact', {
        method: 'POST',
        headers: authHeaders(false)
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Compacted ' + (data.compactedCount || 0) + ' docs', 'success');
        await refreshAll();
      }
    });

    document.getElementById('activity-filter-type').addEventListener('change', renderActivity);
    document.getElementById('activity-search').addEventListener('input', renderActivity);

    setInterval(() => {
      if (!state.authRequired || state.authenticated) refreshAll();
    }, 10000);

    window.addEventListener('DOMContentLoaded', verifyAuth);
  </script>
</body>
</html>`;
}
