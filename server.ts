/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

interface PlayerNetState {
  id: string;
  name: string;
  model: string;
  color: string;
  plateNumber: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  migalkaActive: boolean;
  headlightsOn: boolean;
  turnSignal: 'none' | 'left' | 'right';
  roomCode: string;
  subwooferLevel: number;
  updatedAt: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  const players = new Map<string, PlayerNetState>();
  const socketToPlayerId = new Map<WebSocket, string>();

  // Shared Online Instagram Posts Store (in-memory room feed)
  interface ServerInstaComment {
    id: string;
    username: string;
    text: string;
    createdAt: number;
  }
  interface ServerInstaPost {
    id: string;
    username: string;
    displayName: string;
    avatarEmoji: string;
    imageDataUrl: string;
    caption: string;
    location: string;
    likes: number;
    comments: ServerInstaComment[];
    createdAt: number;
    realInstaUrl?: string;
  }
  const instaPosts: ServerInstaPost[] = [];

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, onlinePlayers: players.size });
  });

  app.get('/api/online-count', (_req, res) => {
    res.json({ count: players.size });
  });

  // Real Live YouTube Search API for Uzbek music & video playback inside PhoneModal
  app.get('/api/youtube/search', async (req, res) => {
    const rawQ = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const q = rawQ || 'Konsta Uzbek music';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      const response = await fetch(ytUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept-Language': 'uz,ru;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timeoutId);
      const html = await response.text();
      const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
      const tracks: { videoId: string; title: string; channel: string; thumbnail: string }[] = [];
      if (match) {
        const data = JSON.parse(match[1]) as Record<string, any>;
        const sections =
          data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
            ?.contents || [];
        for (const sec of sections) {
          const items = sec?.itemSectionRenderer?.contents || [];
          for (const item of items) {
            const vr = item?.videoRenderer;
            if (!vr?.videoId) continue;
            const title =
              vr?.title?.runs?.map((r: any) => r.text).join('') ||
              vr?.title?.simpleText ||
              'YouTube Video';
            const channel =
              vr?.ownerText?.runs?.[0]?.text ||
              vr?.longBylineText?.runs?.[0]?.text ||
              'YouTube';
            const thumbnail =
              vr?.thumbnail?.thumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;
            tracks.push({
              videoId: vr.videoId,
              title,
              channel,
              thumbnail,
            });
            if (tracks.length >= 8) break;
          }
          if (tracks.length >= 8) break;
        }
      }
      res.json({ ok: true, query: q, tracks });
    } catch {
      res.json({ ok: false, query: q, tracks: [] });
    }
  });

  // Shared Online Instagram Feed Endpoints
  app.get('/api/insta/posts', (_req, res) => {
    res.json({ posts: instaPosts.slice(0, 40) });
  });

  app.post('/api/insta/posts', (req, res) => {
    const body = req.body as Partial<ServerInstaPost>;
    if (!body || typeof body.username !== 'string' || !body.username.trim()) {
      res.status(400).json({ error: 'Username required' });
      return;
    }
    const post: ServerInstaPost = {
      id: `ig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      username: body.username.trim().replace(/^@+/, '').slice(0, 24),
      displayName: (body.displayName || body.username).toString().slice(0, 32),
      avatarEmoji: (body.avatarEmoji || '🚗').toString().slice(0, 4),
      imageDataUrl: typeof body.imageDataUrl === 'string' ? body.imageDataUrl.slice(0, 1_500_000) : '',
      caption: (body.caption || '').toString().slice(0, 280),
      location: (body.location || 'Toshkent, O‘zbekiston').toString().slice(0, 60),
      likes: 1,
      comments: [],
      createdAt: Date.now(),
      realInstaUrl: typeof body.realInstaUrl === 'string' ? body.realInstaUrl.slice(0, 200) : undefined,
    };
    instaPosts.unshift(post);
    if (instaPosts.length > 60) instaPosts.length = 60;
    res.json({ post });
  });

  app.post('/api/insta/posts/:id/like', (req, res) => {
    const target = instaPosts.find((p) => p.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    target.likes += 1;
    res.json({ post: target });
  });

  app.post('/api/insta/posts/:id/comment', (req, res) => {
    const target = instaPosts.find((p) => p.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const body = req.body as { username?: string; text?: string };
    const text = (body?.text || '').trim().slice(0, 180);
    if (!text) {
      res.status(400).json({ error: 'Comment text required' });
      return;
    }
    const comment: ServerInstaComment = {
      id: `cm_${Date.now()}`,
      username: (body?.username || 'haydovchi').toString().replace(/^@+/, '').slice(0, 24),
      text,
      createdAt: Date.now(),
    };
    target.comments.push(comment);
    res.json({ post: target });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const broadcastRoom = (roomCode: string, payload: unknown, exclude?: WebSocket) => {
    const raw = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client === exclude || client.readyState !== WebSocket.OPEN) continue;
      const cid = socketToPlayerId.get(client);
      const cp = cid ? players.get(cid) : undefined;
      if (cp && cp.roomCode === roomCode) {
        client.send(raw);
      }
    }
  };

  const getRoomPlayers = (roomCode: string) =>
    Array.from(players.values()).filter((p) => p.roomCode === roomCode);

  const broadcastCount = (roomCode: string) => {
    const count = getRoomPlayers(roomCode).length;
    broadcastRoom(roomCode, { type: 'room:count', count, roomCode });
  };

  wss.on('connection', (ws) => {
    const playerId = `uz_${Math.random().toString(36).slice(2, 9)}`;
    socketToPlayerId.set(ws, playerId);

    const initialPlayer: PlayerNetState = {
      id: playerId,
      name: `Haydovchi-${playerId.slice(-4).toUpperCase()}`,
      model: 'damas',
      color: 'white',
      plateNumber: '01 Z 777 ZZ',
      x: 4.5,
      y: 0.02,
      z: 12,
      heading: 0,
      speed: 0,
      migalkaActive: false,
      headlightsOn: true,
      turnSignal: 'none',
      roomCode: 'UZB-01',
      subwooferLevel: 1,
      updatedAt: Date.now(),
    };
    players.set(playerId, initialPlayer);

    const roomPeers = getRoomPlayers(initialPlayer.roomCode).filter((p) => p.id !== playerId);
    ws.send(
      JSON.stringify({
        type: 'players:init',
        selfId: playerId,
        roomCode: initialPlayer.roomCode,
        count: roomPeers.length + 1,
        players: roomPeers,
      })
    );

    broadcastRoom(initialPlayer.roomCode, { type: 'player:joined', player: initialPlayer }, ws);
    broadcastCount(initialPlayer.roomCode);

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString()) as {
          type?: string;
          roomCode?: string;
          state?: Partial<PlayerNetState>;
        };
        if (msg.type === 'room:join' && typeof msg.roomCode === 'string') {
          const cur = players.get(playerId);
          if (!cur) return;
          const cleanRoom = (msg.roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)) || 'UZB-01';
          if (cleanRoom === cur.roomCode) return;
          const oldRoom = cur.roomCode;
          cur.roomCode = cleanRoom;
          cur.updatedAt = Date.now();
          players.set(playerId, cur);

          broadcastRoom(oldRoom, { type: 'player:left', id: playerId, count: getRoomPlayers(oldRoom).length });
          broadcastCount(oldRoom);

          const peers = getRoomPlayers(cleanRoom).filter((p) => p.id !== playerId);
          ws.send(
            JSON.stringify({
              type: 'players:init',
              selfId: playerId,
              roomCode: cleanRoom,
              count: peers.length + 1,
              players: peers,
            })
          );
          broadcastRoom(cleanRoom, { type: 'player:joined', player: cur }, ws);
          broadcastCount(cleanRoom);
        } else if (msg.type === 'player:update' && msg.state) {
          const cur = players.get(playerId);
          if (!cur) return;
          const targetRoom =
            typeof msg.state.roomCode === 'string' && msg.state.roomCode.trim().length > 0
              ? msg.state.roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12) || cur.roomCode
              : cur.roomCode;

          const next: PlayerNetState = {
            id: playerId,
            name: typeof msg.state.name === 'string' ? msg.state.name.slice(0, 24) : cur.name,
            model: typeof msg.state.model === 'string' ? msg.state.model : cur.model,
            color: typeof msg.state.color === 'string' ? msg.state.color : cur.color,
            plateNumber:
              typeof msg.state.plateNumber === 'string'
                ? msg.state.plateNumber.slice(0, 16)
                : cur.plateNumber,
            x: Number.isFinite(msg.state.x) ? Number(msg.state.x) : cur.x,
            y: Number.isFinite(msg.state.y) ? Number(msg.state.y) : cur.y,
            z: Number.isFinite(msg.state.z) ? Number(msg.state.z) : cur.z,
            heading: Number.isFinite(msg.state.heading) ? Number(msg.state.heading) : cur.heading,
            speed: Number.isFinite(msg.state.speed) ? Number(msg.state.speed) : cur.speed,
            migalkaActive: Boolean(msg.state.migalkaActive),
            headlightsOn: msg.state.headlightsOn !== undefined ? Boolean(msg.state.headlightsOn) : cur.headlightsOn,
            turnSignal:
              msg.state.turnSignal === 'left' || msg.state.turnSignal === 'right'
                ? msg.state.turnSignal
                : 'none',
            roomCode: targetRoom,
            subwooferLevel: Number.isFinite(msg.state.subwooferLevel) ? Number(msg.state.subwooferLevel) : cur.subwooferLevel,
            updatedAt: Date.now(),
          };
          players.set(playerId, next);
          broadcastRoom(next.roomCode, { type: 'player:state', player: next }, ws);
        } else if (msg.type === 'ping') {
          const cur = players.get(playerId);
          const room = cur?.roomCode || 'UZB-01';
          ws.send(JSON.stringify({ type: 'pong', count: getRoomPlayers(room).length }));
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      const id = socketToPlayerId.get(ws);
      socketToPlayerId.delete(ws);
      if (id) {
        const cur = players.get(id);
        const room = cur?.roomCode || 'UZB-01';
        players.delete(id);
        broadcastRoom(room, { type: 'player:left', id, count: getRoomPlayers(room).length });
        broadcastCount(room);
      }
    });
  });

  // Periodic stale socket sweep
  setInterval(() => {
    const cutoff = Date.now() - 30000;
    const affectedRooms = new Set<string>();
    for (const [id, p] of players.entries()) {
      if (p.updatedAt < cutoff) {
        players.delete(id);
        affectedRooms.add(p.roomCode);
        broadcastRoom(p.roomCode, { type: 'player:left', id, count: getRoomPlayers(p.roomCode).length });
      }
    }
    for (const room of affectedRooms) {
      broadcastCount(room);
    }
  }, 15000);

  if (IS_PROD) {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Toshkent & Xorazm Poygasi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
