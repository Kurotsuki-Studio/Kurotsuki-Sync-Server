# 🌙 Kurotsuki Sync Relay Server

<p align="center">
  <b>Enterprise-grade self-hosted real-time collaboration, RBAC governance, and vault synchronization relay server for Obsidian</b><br>
  <b>Serveur relais de synchronisation et de collaboration temps réel multi-vault avec gestion des permissions (RBAC) pour Obsidian</b>
</p>

<p align="center">
  <a href="https://github.com/Kurotsuki-Studio/Kurotsuki-Sync-Server/releases"><img src="https://img.shields.io/github/v/release/Kurotsuki-Studio/Kurotsuki-Sync-Server?color=7c3aed&style=flat-square" alt="GitHub release" /></a>
  <a href="https://github.com/Kurotsuki-Studio/Kurotsuki-Sync"><img src="https://img.shields.io/badge/Obsidian--Plugin-Kurotsuki--Sync-purple?style=flat-square" alt="Obsidian Plugin" /></a>
  <a href="https://github.com/Kurotsuki-Studio/Kurotsuki-Sync-Server/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Ready" />
</p>

<p align="center">
  <a href="#english">English</a> • <a href="#français">Français</a> • <a href="#vps-update">Mise à jour VPS / VPS Update</a>
</p>

---

<a name="english"></a>
## 🇬🇧 English

The **Kurotsuki Sync Relay Server** is the self-hostable cloud relay and synchronization engine powering the [**Kurotsuki Sync Obsidian Plugin**](https://github.com/Kurotsuki-Studio/Kurotsuki-Sync). It provides real-time WebSockets synchronization, persistent disk storage for [Yjs](https://yjs.dev/) CRDT document states, an integrated **Web Admin Panel**, multi-vault governance, Role-Based Access Control (**RBAC**), and authenticated binary storage for vault attachments (images, PDFs, media).

### ⚡ Key Features

- 🚀 **Centralized Relay & Persistent Storage:** The server is the single source of truth. Offline collaborators can edit freely; changes merge automatically with conflict-free CRDT resolution when reconnected.
- 🗂️ **Multi-Vault & Multi-Room Governance:** Host unlimited distinct vaults or shared team workspaces on one server instance with isolated namespaces and configurable storage quotas.
- 🛡️ **Role-Based Access Control (RBAC):**
  - **Admin:** Full control over vaults, user tokens, backups, and live sessions.
  - **Editor:** Read and write permissions for real-time document collaboration and attachments.
  - **Viewer (Read-Only):** Locked in read-only mode. Both server and client actively block unauthorized edits.
- 💻 **Integrated Web Admin Panel (`/admin`):** Modern responsive dark UI to monitor server health, inspect active peer sessions, generate scoped API tokens, export full vault archives, and terminate connections.
- 🔄 **Full File System Reconciliation:** Synchronizes changes made from file explorers (Windows Explorer, Finder, terminal) both in real-time and upon launching Obsidian.
- 📎 **Binary Attachments API:** HTTP REST endpoints for uploading, streaming, and caching binary media files up to configurable limits.
- 🐳 **Docker & Docker Compose Ready:** Production-ready multi-stage Docker build with health check and zero-config volume persistence.

---

### ⚙️ Configuration Variables (`.env`)

Create a `.env` file in the root directory (or copy from `.env.example`):

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `3050` | Network port the HTTP & WebSocket server listens on |
| `HOST` | String | `0.0.0.0` | IP address / host interface to bind to |
| `STORAGE_DIR` | Path | `./data` | Root directory path on disk for persisting Y.Docs, vaults, and tokens |
| `AUTH_TOKEN` | String | *(required)* | Master admin secret token for initial Web Admin Panel access and API authentication |
| `MAX_PAYLOAD_MB` | Number | `50` | Maximum allowed file size for attachment uploads (in Megabytes) |
| `CORS_ENABLED` | Boolean | `true` | Enable CORS headers for browser and web-based clients (`true` / `false`) |

---

### 🚀 Initial Docker Deployment

```bash
# 1. Clone the repository
git clone https://github.com/Kurotsuki-Studio/Kurotsuki-Sync-Server.git
cd Kurotsuki-Sync-Server

# 2. Configure environment
cp .env.example .env
nano .env
# Set your desired PORT (e.g. 3050) and your secret AUTH_TOKEN (e.g. AUTH_TOKEN=my_secure_secret)

# 3. Build and launch with Docker Compose
docker compose up -d --build

# 4. View real-time logs
docker compose logs -f
```

---

<a name="vps-update"></a>
### 🔄 How to Update the Server on your VPS / Tutoriel de mise à jour VPS

When a new version or patch is released, update your VPS with these commands:

```bash
# 1. Navigate to your server folder on the VPS
cd /root/Kurotsuki-Sync-Server # or wherever you cloned the repo

# 2. Pull the latest updates from GitHub
git pull origin main

# 3. (Optional) Check or adjust your .env settings if needed
nano .env

# 4. Stop the old container and rebuild the image with the new code
docker compose down
docker compose up -d --build

# 5. Check container logs to verify clean startup
docker compose logs -f
```

> [!IMPORTANT]
> **Why not just `docker compose restart`?**
> A simple `restart` only reboots the container in memory without rebuilding the code or re-reading `.env` variable changes. Running `docker compose down && docker compose up -d --build` guarantees that all code updates and `.env` credentials are built into the container.

---

### 🌐 Reverse Proxy & Cloudflare Tunnel

For secure remote synchronization (`wss://`), place the server behind Cloudflare Tunnel, Caddy, or Nginx:

#### Cloudflare Tunnel (Zero Trust)
- Service Type: `HTTP`
- URL: `localhost:3050` (or `http://127.0.0.1:3050`)
- Public hostname: `relay.yourdomain.com`

#### Caddy Example (`Caddyfile`)
```caddy
relay.yourdomain.com {
    reverse_proxy localhost:3050
}
```

---

<a name="français"></a>
## 🇫🇷 Français

Le **Serveur Relais Kurotsuki Sync** est la solution cloud auto-hébergeable propulsant le [**Plugin Obsidian Kurotsuki Sync**](https://github.com/Kurotsuki-Studio/Kurotsuki-Sync). Il combine la synchronisation temps réel par WebSockets, la persistance locale des états CRDT [Yjs](https://yjs.dev/), un **Panel Web d'administration (`/admin`)**, la gouvernance multi-coffres et le contrôle des accès par rôle (**RBAC**).

### ⚡ Fonctionnalités Clés

- 🚀 **Relais Centralisé & Stockage Permanent :** Le serveur héberge l'intégralité du coffre. Si un utilisateur se déconnecte, les autres continuent d'écrire sans coupure. À la reconnexion, les modifications fusionnent automatiquement sans conflit.
- 🗂️ **Gestion Multi-Coffres & Salons :** Hébergez plusieurs coffres indépendants sur un même serveur avec quotas et restrictions d'accès par salon.
- 🛡️ **Système de Permissions (RBAC) :**
  - **Admin :** Accès total au panel d'administration, création/révocation de tokens, gestion des coffres et des sauvegardes.
  - **Editor :** Lecture et écriture temps réel sur les notes et pièces jointes.
  - **Viewer (Lecture Seule) :** Blocage strict en lecture seule côté serveur et côté client (CodeMirror 6 verrouillé).
- 💻 **Panel d'Administration Web (`/admin`) :** Interface moderne pour surveiller les utilisateurs connectés, créer des tokens avec rôles personnalisés, déconnecter des sessions et exporter des sauvegardes.
- 🔄 **Prise en charge de l'Explorateur de Fichiers :** Créer ou supprimer des fichiers directement depuis l'explorateur Windows / Linux est synchronisé automatiquement en direct et au lancement d'Obsidian.
