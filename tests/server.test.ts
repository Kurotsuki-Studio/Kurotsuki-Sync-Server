import assert from 'node:assert';
import http from 'node:http';
import test, { after, before, describe } from 'node:test';
import { WebSocket } from 'ws';
import * as Y from 'yjs';
import { verifyToken } from '../src/auth.js';
import { config } from '../src/config.js';
import { handleHttpRequest } from '../src/http-api.js';
import { RbacManager } from '../src/rbac.js';
import { RoomManager } from '../src/room-manager.js';
import { StorageEngine } from '../src/storage.js';
import { setupWebSocketServer } from '../src/ws-server.js';

describe('Kurotsuki Sync Relay Server', () => {
  let server: http.Server;
  let roomManager: RoomManager;
  let storage: StorageEngine;
  let rbac: RbacManager;
  let testPort = 3199;
  let baseUrl: string;
  let wsUrl: string;

  before(async () => {
    config.authToken = 'test-secret-token';
    storage = new StorageEngine('./test-data');
    rbac = new RbacManager('./test-data');
    roomManager = new RoomManager(storage);

    server = http.createServer((req, res) => {
      handleHttpRequest(req, res, roomManager, storage, rbac);
    });
    setupWebSocketServer(server, roomManager, rbac);

    await new Promise<void>((resolve) => {
      server.listen(testPort, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${testPort}`;
        wsUrl = `ws://127.0.0.1:${testPort}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const fs = await import('node:fs');
    fs.rmSync('./test-data', { recursive: true, force: true });
  });

  test('Health check endpoint returns status ok and server info', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.name, 'Kurotsuki Sync Relay Server');
  });

  test('Web Admin Panel endpoint returns HTML page', async () => {
    const res = await fetch(`${baseUrl}/admin`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Kurotsuki Sync'));
    assert.ok(html.includes('Web Admin Panel'));
    assert.ok(html.includes('Multi-Vault &amp; Room Management'));
  });

  test('Authentication: verifyToken validates correct and incorrect tokens', () => {
    assert.strictEqual(verifyToken('test-secret-token'), true);
    assert.strictEqual(verifyToken('wrong-token'), false);
    assert.strictEqual(verifyToken(''), false);
    assert.strictEqual(verifyToken(null), false);
  });

  test('Protected endpoint /api/v1/stats requires authentication', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/v1/stats`);
    assert.strictEqual(unauthRes.status, 401);

    const authRes = await fetch(`${baseUrl}/api/v1/stats`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(authRes.status, 200);
    const stats = await authRes.json();
    assert.strictEqual(stats.status, 'ok');
    assert.ok(typeof stats.totalConnections === 'number');
  });

  test('Multi-Vault Management APIs: Create, List, Update, Export, and Delete', async () => {
    // 1. Create a new vault
    const createRes = await fetch(`${baseUrl}/api/v1/vaults`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'team-finance',
        name: 'Finance & Invoices',
        description: 'Sensitive accounting notes',
        quotaMB: 250,
        defaultRole: 'viewer',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createdVault = await createRes.json();
    assert.strictEqual(createdVault.id, 'team-finance');
    assert.strictEqual(createdVault.quotaMB, 250);
    assert.strictEqual(createdVault.defaultRole, 'viewer');

    // 2. List vaults
    const listRes = await fetch(`${baseUrl}/api/v1/vaults`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(listRes.status, 200);
    const vaults = await listRes.json();
    assert.ok(vaults.some((v: any) => v.id === 'team-finance'));

    // 3. Update vault
    const updateRes = await fetch(`${baseUrl}/api/v1/vaults/team-finance`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Finance & Billing',
        quotaMB: 300,
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updatedVault = await updateRes.json();
    assert.strictEqual(updatedVault.name, 'Finance & Billing');
    assert.strictEqual(updatedVault.quotaMB, 300);

    // 4. Export vault backup
    const exportRes = await fetch(`${baseUrl}/api/v1/vaults/team-finance/export`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(exportRes.status, 200);
    const bundle = await exportRes.json();
    assert.strictEqual(bundle.vaultId, 'team-finance');
    assert.ok(Array.isArray(bundle.docs));
  });

  test('RBAC Token Management: Create, List, and Delete tokens', async () => {
    // Create editor token
    const createRes = await fetch(`${baseUrl}/api/v1/tokens`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Bob the Editor',
        role: 'editor',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const bobToken = await createRes.json();
    assert.strictEqual(bobToken.name, 'Bob the Editor');
    assert.strictEqual(bobToken.role, 'editor');
    assert.ok(bobToken.token.startsWith('kuro_'));

    // List tokens
    const listRes = await fetch(`${baseUrl}/api/v1/tokens`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(listRes.status, 200);
    const tokens = await listRes.json();
    assert.ok(tokens.some((t: any) => t.id === bobToken.id));

    // Update token with per-vault override: global viewer, but editor in team-finance
    const updateRes = await fetch(`${baseUrl}/api/v1/tokens/${bobToken.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Bob the Finance Editor',
        role: 'viewer',
        vaultAccess: { 'team-finance': 'editor', 'restricted-vault': 'forbidden' },
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updatedBob = await updateRes.json();
    assert.strictEqual(updatedBob.name, 'Bob the Finance Editor');
    assert.strictEqual(updatedBob.role, 'viewer');
    assert.strictEqual(updatedBob.vaultAccess['team-finance'], 'editor');
    assert.strictEqual(updatedBob.vaultAccess['restricted-vault'], 'forbidden');

    // Test resolveRole honors per-vault override
    const resolvedInFinance = rbac.resolveRole(updatedBob.token, 'team-finance');
    assert.strictEqual(resolvedInFinance.role, 'editor');

    const resolvedInDefault = rbac.resolveRole(updatedBob.token, 'default-vault');
    assert.strictEqual(resolvedInDefault.role, 'viewer');

    const resolvedInRestricted = rbac.resolveRole(updatedBob.token, 'restricted-vault');
    assert.strictEqual(resolvedInRestricted.role, null);

    // Delete token
    const deleteRes = await fetch(`${baseUrl}/api/v1/tokens/${bobToken.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(deleteRes.status, 200);
  });

  test('Attachment upload and retrieval via HTTP API with RBAC enforcement', async () => {
    const testContent = Buffer.from('Hello Kurotsuki attachment data');
    const uploadRes = await fetch(`${baseUrl}/api/v1/attachments/test-vault/images/sample.png`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/octet-stream',
      },
      body: testContent,
    });
    assert.strictEqual(uploadRes.status, 200);

    const downloadRes = await fetch(`${baseUrl}/api/v1/attachments/test-vault/images/sample.png`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(downloadRes.status, 200);
    const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());
    assert.deepStrictEqual(downloadedBuf, testContent);

    // Create a viewer-only token
    const viewerToken = rbac.createToken({
      name: 'ReadOnly Viewer',
      role: 'viewer',
    });

    // Viewer attempting to upload attachment must receive 403 Forbidden
    const viewerUploadRes = await fetch(`${baseUrl}/api/v1/attachments/test-vault/images/viewer.png`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${viewerToken.token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from('Should be rejected'),
    });
    assert.strictEqual(viewerUploadRes.status, 403);
  });

  test('WebSocket: rejects connection with invalid auth token', async () => {
    const ws = new WebSocket(`${wsUrl}?token=invalid-token`);
    const code = await new Promise<number>((resolve) => {
      ws.on('close', (closeCode) => resolve(closeCode));
    });
    assert.strictEqual(code, 4001);
  });

  test('WebSocket: connects and syncs Yjs updates between two clients', async () => {
    const wsA = new WebSocket(`${wsUrl}?token=test-secret-token&vaultId=test-room`);
    const wsB = new WebSocket(`${wsUrl}?token=test-secret-token&vaultId=test-room`);

    await Promise.all([
      new Promise((resolve) => wsA.on('open', resolve)),
      new Promise((resolve) => wsB.on('open', resolve)),
    ]);

    // Send auth messages
    wsA.send(
      JSON.stringify({
        type: 'auth',
        token: 'test-secret-token',
        vaultId: 'test-room',
        clientInfo: { id: 'userA', name: 'Alice', color: '#ff0000' },
      })
    );

    wsB.send(
      JSON.stringify({
        type: 'auth',
        token: 'test-secret-token',
        vaultId: 'test-room',
        clientInfo: { id: 'userB', name: 'Bob', color: '#00ff00' },
      })
    );

    // Setup local Ydocs
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    const yTextA = docA.getText('content');

    // Wait for B to receive Yjs sync message from A
    const bReceivedPromise = new Promise<string>((resolve) => {
      wsB.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'yjs_sync' && msg.path === 'notes/collab.md') {
          const update = Buffer.from(msg.update, 'base64');
          Y.applyUpdate(docB, new Uint8Array(update));
          resolve(docB.getText('content').toString());
        }
      });
    });

    // Client A makes an edit
    docA.on('update', (update) => {
      wsA.send(
        JSON.stringify({
          type: 'yjs_sync',
          path: 'notes/collab.md',
          update: Buffer.from(update).toString('base64'),
        })
      );
    });

    yTextA.insert(0, 'Hello from Alice in Kurotsuki Sync!');

    const textInB = await bReceivedPromise;
    assert.strictEqual(textInB, 'Hello from Alice in Kurotsuki Sync!');

    // Send awareness update from Alice with activeFile
    wsA.send(
      JSON.stringify({
        type: 'awareness_update',
        states: [
          {
            clientId: 12345,
            user: { id: 'userA', name: 'Alice', color: '#ff0000' },
            activeFile: 'notes/collab.md',
            cursor: { anchor: 5, head: 5 },
            lastActive: Date.now(),
          },
        ],
      })
    );

    // Give server tick to update session
    await new Promise((r) => setTimeout(r, 50));

    // Verify /api/v1/peers reflects Alice's activeFile
    const peersRes = await fetch(`${baseUrl}/api/v1/peers`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(peersRes.status, 200);
    const peersList = await peersRes.json();
    const alicePeer = peersList.find((p: any) => p.user.name === 'Alice');
    assert.ok(alicePeer, 'Alice should be found in peers list');
    assert.strictEqual(alicePeer.activeFile, 'notes/collab.md');

    wsA.close();
    wsB.close();
  });

  test('WebSocket: enforces read-only (viewer) mode, blocking writes', async () => {
    const viewerToken = rbac.createToken({
      name: 'Charlie ReadOnly',
      role: 'viewer',
    });

    const wsViewer = new WebSocket(`${wsUrl}?token=${viewerToken.token}&vaultId=default-vault`);
    await new Promise((resolve) => wsViewer.on('open', resolve));

    // Authenticate as viewer
    const authAckPromise = new Promise<any>((resolve) => {
      wsViewer.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'auth_ack') resolve(msg);
      });
    });

    wsViewer.send(
      JSON.stringify({
        type: 'auth',
        token: viewerToken.token,
        vaultId: 'default-vault',
        clientInfo: { id: 'userC', name: 'Charlie', color: '#333333' },
      })
    );

    const authAck = await authAckPromise;
    assert.strictEqual(authAck.success, true);
    assert.strictEqual(authAck.role, 'viewer');

    // Now viewer attempts to send a yjs_sync update
    const errorPromise = new Promise<any>((resolve) => {
      wsViewer.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'error') resolve(msg);
      });
    });

    const dummyDoc = new Y.Doc();
    dummyDoc.getText('content').insert(0, 'Unauthorized edit');
    const update = Y.encodeStateAsUpdate(dummyDoc);

    wsViewer.send(
      JSON.stringify({
        type: 'yjs_sync',
        path: 'notes/readonly.md',
        update: Buffer.from(update).toString('base64'),
      })
    );

    const errorMsg = await errorPromise;
    assert.strictEqual(errorMsg.type, 'error');
    assert.strictEqual(errorMsg.code, 'ERR_READONLY');

    wsViewer.close();
  });

  test('Second users: per-vault access sync, live role update, and token revocation disconnect', async () => {
    // Verify /api/v1/auth/verify
    const unauthVerify = await fetch(`${baseUrl}/api/v1/auth/verify`);
    assert.strictEqual(unauthVerify.status, 200);
    const unauthData = await unauthVerify.json();
    assert.strictEqual(unauthData.authRequired, true);
    assert.strictEqual(unauthData.authenticated, false);

    const authVerify = await fetch(`${baseUrl}/api/v1/auth/verify`, {
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    const authData = await authVerify.json();
    assert.strictEqual(authData.authenticated, true);

    // Create a second user token
    const createRes = await fetch(`${baseUrl}/api/v1/tokens`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Friend Alex',
        role: 'editor',
        vaultAccess: { 'default-vault': 'editor' },
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const friendToken = await createRes.json();

    // Connect Alex via WebSocket
    const wsFriend = new WebSocket(wsUrl);
    await new Promise<void>((resolve) => wsFriend.on('open', resolve));

    const firstAck = new Promise<any>((resolve) => {
      wsFriend.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    });
    wsFriend.send(
      JSON.stringify({
        type: 'auth',
        token: friendToken.token,
        vaultId: 'default-vault',
        clientInfo: { id: 'alex1', name: 'Alex', color: '#10b981' },
      })
    );
    const ack1 = await firstAck;
    assert.strictEqual(ack1.success, true);
    assert.strictEqual(ack1.role, 'editor');

    // Admin downgrades Alex to viewer on default-vault via /api/v1/vaults/:vaultId/access
    const roleUpdatePromise = new Promise<any>((resolve) => {
      wsFriend.once('message', (raw) => resolve(JSON.parse(raw.toString())));
    });
    const accessRes = await fetch(`${baseUrl}/api/v1/vaults/default-vault/access`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokenId: friendToken.id, access: 'viewer' }),
    });
    assert.strictEqual(accessRes.status, 200);
    const ack2 = await roleUpdatePromise;
    assert.strictEqual(ack2.type, 'auth_ack');
    assert.strictEqual(ack2.role, 'viewer');

    // Admin revokes Alex's token -> active WS should close immediately with 4001
    const closePromise = new Promise<number>((resolve) => {
      wsFriend.once('close', (code) => resolve(code));
    });
    const delRes = await fetch(`${baseUrl}/api/v1/tokens/${friendToken.id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.strictEqual(delRes.status, 200);
    const delBody = await delRes.json();
    assert.strictEqual(delBody.disconnectedSessions, 1);
    const closeCode = await closePromise;
    assert.strictEqual(closeCode, 4001);
  });

  test('WebSocket: blocks unauthenticated yjs_sync when AUTH_TOKEN is set', async () => {
    const wsAnon = new WebSocket(wsUrl);
    await new Promise<void>((resolve) => wsAnon.on('open', resolve));

    const closePromise = new Promise<number>((resolve) => {
      wsAnon.once('close', (code) => resolve(code));
    });
    wsAnon.send(
      JSON.stringify({
        type: 'yjs_sync',
        path: 'notes/hack.md',
        update: 'AQID',
      })
    );
    const closeCode = await closePromise;
    assert.strictEqual(closeCode, 4001);
  });
});
