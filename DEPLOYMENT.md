# Deploying Secret Chancellor: Vercel (Frontend) + EC2 (Backend)

This guide walks you through deploying the game with:

- **Frontend**: Next.js on Vercel (static + SSR, global CDN)
- **Backend**: Node.js Socket.IO server on AWS EC2 (persistent WebSocket connections, better real-time performance)

## Architecture

```
┌─────────────────┐         WebSocket (wss://)          ┌─────────────────┐
│  Vercel         │  ─────────────────────────────────► │  EC2            │
│  (Next.js app)  │  NEXT_PUBLIC_SOCKET_URL             │  (Socket.IO)    │
│  your-app.vercel.app                                   │  api.your.com   │
└─────────────────┘                                     └─────────────────┘
```

Users load the app from Vercel; the browser connects to your EC2 backend for all game and chat events.

---

## Part 1: Deploy the Backend to EC2

### 1.1 Prerequisites

- AWS account
- Domain (optional but recommended for HTTPS; you can use the EC2 public IP and HTTP for testing)

### 1.2 Launch an EC2 Instance

1. In **AWS Console** → **EC2** → **Launch instance**:
   - **Name**: `secret-chancellor-backend`
   - **AMI**: Amazon Linux 2023 (or Ubuntu 22.04)
   - **Instance type**: `t3.micro` (free tier) or `t3.small` for more headroom
   - **Key pair**: Create or select an existing key pair (e.g. `secret-chancellor.pem`) and download it
   - **Security group**: Create a new one and add:
     - **SSH** (22) from your IP (or 0.0.0.0/0 only for testing)
     - **Custom TCP** port **4000** (or your chosen port) from **0.0.0.0/0** so the frontend can connect
     - If you put Nginx in front later, open **80** and **443** instead and keep 4000 only from localhost
   - **Storage**: 8 GB is enough

2. Launch the instance and note the **Public IPv4 address** (e.g. `3.123.45.67`).

### 1.3 Connect and Install Node.js

```bash
# From your machine (fix path and host)
chmod 400 ~/Downloads/secret-chancellor.pem
ssh -i ~/Downloads/secret-chancellor.pem ec2-user@3.123.45.67
```

On **Amazon Linux 2023**:

```bash
sudo dnf install -y nodejs npm git
node -v   # v18+ recommended
```

On **Ubuntu**:

```bash
sudo apt update && sudo apt install -y nodejs npm git
# If Node is too old:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 1.4 Deploy the Backend Code

**Option A: Clone from Git (recommended)**

```bash
cd ~
git clone https://github.com/kenL4/SecretChancellor.git
cd SecretChancellor/backend
npm install
npm run build
```

**Option B: Copy files with SCP**

From your laptop (in the project root):

```bash
scp -i ~/Downloads/secret-chancellor.pem -r backend ec2-user@3.123.45.67:~/secret-chancellor/
ssh -i ~/Downloads/secret-chancellor.pem ec2-user@3.123.45.67 "cd secret-chancellor/backend && npm install && npm run build"
```

### 1.5 Run the Backend

Set your frontend origin for CORS (use your Vercel URL when you have it):

```bash
cd ~/secret-chancellor/backend
export PORT=4000
export CORS_ORIGIN=https://secret-chancellor.vercel.app
npm start
```

Test from another terminal:

```bash
curl http://3.123.45.67:4000/health
# Should return: {"status":"ok","service":"secret-chancellor-backend"}
```

To run in the background and survive logout, use **systemd**.

### 1.6 Run as a Service (systemd)

Create a service file:

```bash
sudo nano /etc/systemd/system/SecretChancellor.service
```

Paste (adjust paths and `CORS_ORIGIN`):

```ini
[Unit]
Description=Secret Chancellor Game Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/SecretChancellor/backend
Environment="PORT=4000"
Environment="CORS_ORIGIN=https://secret-chancellor.vercel.app"
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable SecretChancellor
sudo systemctl start SecretChancellor
sudo systemctl status SecretChancellor
```

Logs: `sudo journalctl -u secret-chancellor -f`

### 1.7 (Optional) HTTPS with Nginx and a Domain

If you have a domain (e.g. `api.yourdomain.com`):

1. Point **api.yourdomain.com** to your EC2 public IP (A record).
2. Install Nginx and Certbot:

```bash
sudo dnf install -y nginx   # Amazon Linux
# or: sudo apt install -y nginx certbot python3-certbot-nginx   # Ubuntu
```

3. Create Nginx config:

```bash
sudo nano /etc/nginx/conf.d/secret-chancellor.conf
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Get certificate (Ubuntu example):

```bash
sudo certbot --nginx -d api.yourdomain.com
```

5. Set **CORS_ORIGIN** and **NEXT_PUBLIC_SOCKET_URL** to `https://api.yourdomain.com` (no trailing slash).

---

## Part 2: Deploy the Frontend to Vercel

### 2.1 Push Code and Import Project

1. Push your repo to GitHub (if not already).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → Import your repo.
3. **Root Directory**: leave as repo root (frontend is the root app).
4. **Build Command**: `npm run build` (default).
5. **Environment variables** (in Vercel project → Settings → Environment Variables):

   | Name                         | Value                        |
   |-----------------------------|------------------------------|
   | `NEXT_PUBLIC_SOCKET_URL`    | `https://api.yourdomain.com` or `http://3.123.45.67:4000` |

   Use your EC2 URL: with HTTPS (Nginx + domain) or `http://<EC2-IP>:4000` for testing.

6. Deploy. Vercel will build and host the frontend.

### 2.2 Verify

1. Open the Vercel app URL (e.g. `https://your-app.vercel.app`).
2. Create a game; open DevTools → Network → WS. You should see a WebSocket to your backend URL.
3. If you see CORS or connection errors, double-check:
   - **CORS_ORIGIN** on EC2 matches the Vercel URL exactly (including `https://`, no trailing slash).
   - **NEXT_PUBLIC_SOCKET_URL** matches the backend URL the browser should use (same as above, no trailing slash).

---

## Part 3: Summary Checklist

| Step | Where | What |
|------|--------|------|
| 1 | EC2 | Security group: port 4000 (or 80/443 if using Nginx) open to 0.0.0.0/0 |
| 2 | EC2 | Install Node 18+, clone repo, `cd backend && npm install && npm run build` |
| 3 | EC2 | Set `CORS_ORIGIN` to your Vercel URL (e.g. `https://your-app.vercel.app`) |
| 4 | EC2 | Run backend: `npm start` or systemd service |
| 5 | Vercel | Set `NEXT_PUBLIC_SOCKET_URL` to backend URL (e.g. `https://api.yourdomain.com` or `http://<EC2-IP>:4000`) |
| 6 | Browser | Test: create game, check WebSocket in DevTools |

### Local Development

- **Frontend only (Next.js socket)**: don’t set `NEXT_PUBLIC_SOCKET_URL`; the app uses the embedded Next.js API route.
- **Frontend + EC2-style backend**: run backend locally with `cd backend && npm run dev` (port 4000), set `NEXT_PUBLIC_SOCKET_URL=http://localhost:4000` in `.env.local`, then run `npm run dev` in the repo root.

### Backend env vars (EC2)

| Variable      | Description                          | Example                          |
|---------------|--------------------------------------|----------------------------------|
| `PORT`        | HTTP port                            | `4000`                           |
| `CORS_ORIGIN` | Allowed origin for API and Socket.IO| `https://your-app.vercel.app`    |

Using this setup, the Vercel frontend serves the UI and the EC2 backend handles all real-time game and chat traffic.
