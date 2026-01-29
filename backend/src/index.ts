/**
 * Secret Chancellor Game Server
 * Standalone Socket.IO + Express backend for EC2 (or any Node host).
 * Frontend (Vercel) connects via NEXT_PUBLIC_SOCKET_URL.
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { attachSocketHandler } from './socketHandler';

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Health check for load balancers and monitoring
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', service: 'secret-chancellor-backend' });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: CORS_ORIGIN },
  path: '/socket.io',
  addTrailingSlash: false,
});

attachSocketHandler(io);

server.listen(PORT, () => {
  console.log(`Secret Chancellor backend listening on port ${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
