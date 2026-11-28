/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RemotePlayerState } from '../types/game';

interface MultiplayerCallbacks {
  onInit: (selfId: string, remotePlayers: RemotePlayerState[], count: number) => void;
  onPlayerUpdate: (player: RemotePlayerState) => void;
  onPlayerLeft: (id: string, count: number) => void;
  onStatusChange: (connected: boolean, count: number) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private shouldStayConnected: boolean = false;
  private lastSentMs: number = 0;
  private callbacks: MultiplayerCallbacks;
  public selfId: string = '';
  public roomCode: string = 'UZB-01';

  constructor(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  public joinRoom(roomCode: string) {
    const clean = (roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)) || 'UZB-01';
    this.roomCode = clean;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: 'room:join', roomCode: clean }));
      } catch {
        // ignore
      }
    }
  }

  public connect() {
    this.shouldStayConnected = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.callbacks.onStatusChange(true, 1);
        if (this.roomCode && this.roomCode !== 'UZB-01') {
          this.joinRoom(this.roomCode);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg.type === 'players:init') {
            this.selfId = msg.selfId || '';
            this.callbacks.onInit(this.selfId, msg.players || [], msg.count || 1);
          } else if (msg.type === 'player:joined' || msg.type === 'player:state') {
            if (msg.player && msg.player.id !== this.selfId) {
              this.callbacks.onPlayerUpdate(msg.player);
            }
          } else if (msg.type === 'player:left') {
            this.callbacks.onPlayerLeft(msg.id, msg.count ?? 1);
          } else if (msg.type === 'room:count') {
            this.callbacks.onStatusChange(true, msg.count ?? 1);
          }
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onclose = () => {
        this.ws = null;
        this.callbacks.onStatusChange(false, 0);
        if (this.shouldStayConnected) {
          if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = window.setTimeout(() => {
            if (this.shouldStayConnected) this.connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        // Close handler handles cleanup & reconnect
      };
    } catch {
      this.callbacks.onStatusChange(false, 0);
    }
  }

  public sendState(state: Omit<RemotePlayerState, 'id'>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (now - this.lastSentMs < 65) return; // ~15 Hz smooth sync
    this.lastSentMs = now;
    try {
      this.ws.send(JSON.stringify({ type: 'player:update', state: { ...state, roomCode: this.roomCode } }));
    } catch {
      // ignore send errors
    }
  }

  public disconnect() {
    this.shouldStayConnected = false;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.callbacks.onStatusChange(false, 0);
  }
}
