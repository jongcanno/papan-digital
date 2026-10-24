import { MatchState } from '../types/scoreboard';
import { createInitialRoomState, defaultMatchState } from './initialState';

const STORAGE_KEY_PREFIX = 'futsal_scoreboard_state_';
const CHANNEL_NAME = 'futsal_scoreboard_sync_channel';

export interface ConnectionStatusInfo {
  status: 'connected' | 'connecting' | 'offline';
  connectedDevices: number;
  roomId: string;
}

export class SyncManager {
  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentMatchId: string = 'JONG26';
  private clientId: string = `client_${Math.random().toString(36).slice(2, 10)}`;
  private connectionStatus: 'connected' | 'connecting' | 'offline' = 'connecting';
  private connectedDevicesCount: number = 1;

  private listeners: Set<(state: MatchState) => void> = new Set();
  private statusListeners: Set<(info: ConnectionStatusInfo) => void> = new Set();
  private buzzerListeners: Set<(duration: number) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Read initial room code from URL (?room=XXXXXX) if present
      const params = new URLSearchParams(window.location.search);
      const roomFromUrl = params.get('room');
      const savedRoom = localStorage.getItem('futsal_active_room_id');
      if (roomFromUrl) {
        this.currentMatchId = this.normalizeCode(roomFromUrl);
      } else if (savedRoom) {
        this.currentMatchId = this.normalizeCode(savedRoom);
      } else {
        this.currentMatchId = 'JONG26';
      }
      localStorage.setItem('futsal_active_room_id', this.currentMatchId);

      // Local BroadcastChannel for same-device instant tab sync
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'MATCH_STATE_SYNC') {
              const incomingState = event.data.state as MatchState;
              if (incomingState && incomingState.matchId === this.currentMatchId) {
                this.notifyListeners(incomingState);
              }
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel error:', e);
        }
      }

      // Connect to Server-Sent Events stream for cross-device sync
      this.connectToServerStream(this.currentMatchId);
    }
  }

  private normalizeCode(raw: string): string {
    const cleaned = (raw || '')
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 6);
    if (!cleaned || cleaned === 'FUTSAL') return 'JONG26';
    return cleaned;
  }

  public getMatchId(): string {
    return this.currentMatchId;
  }

  public getConnectionInfo(): ConnectionStatusInfo {
    return {
      status: this.connectionStatus,
      connectedDevices: this.connectedDevicesCount,
      roomId: this.currentMatchId,
    };
  }

  public generateRandomRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'JC';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public async joinRoom(newRoomId: string): Promise<MatchState> {
    const normalized = this.normalizeCode(newRoomId);
    this.currentMatchId = normalized;

    if (typeof window !== 'undefined') {
      localStorage.setItem('futsal_active_room_id', normalized);
      // Update URL parameter ?room=XXXXXX without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('room', normalized);
      window.history.replaceState({}, '', url.toString());
    }

    this.connectToServerStream(normalized);

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.state) {
          this.connectedDevicesCount = data.connectedDevices || 1;
          this.updateStatus('connected');
          this.saveLocalOnly(data.state);
          this.notifyListeners(data.state);
          return data.state;
        }
      }
    } catch (e) {
      console.warn('Join room fetch fallback:', e);
    }

    const fallback = createInitialRoomState(normalized);
    this.notifyListeners(fallback);
    return fallback;
  }

  private connectToServerStream(roomId: string): void {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.updateStatus('connecting');

    try {
      const es = new EventSource(`/api/rooms/${encodeURIComponent(roomId)}/events`);
      this.eventSource = es;

      es.onopen = () => {
        this.updateStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (typeof payload.connectedDevices === 'number') {
            this.connectedDevicesCount = Math.max(1, payload.connectedDevices);
            this.updateStatus('connected');
          }

          if (payload.type === 'INIT' || payload.type === 'STATE_UPDATE') {
            // Skip echoing back our own immediate mutation if already applied, unless from server timer
            if (payload.senderId && payload.senderId === this.clientId) {
              return;
            }
            const incomingState = payload.state as MatchState;
            if (incomingState && incomingState.homeTeam && incomingState.awayTeam) {
              this.saveLocalOnly(incomingState);
              this.notifyListeners(incomingState);
            }
          } else if (payload.type === 'BUZZER') {
            if (payload.senderId !== this.clientId) {
              this.notifyBuzzer(payload.duration || 1.6);
            }
          } else if (payload.type === 'PRESENCE') {
            this.updateStatus('connected');
          }
        } catch (err) {
          console.warn('SSE message parse error:', err);
        }
      };

      es.onerror = () => {
        this.updateStatus('offline');
        es.close();
        this.eventSource = null;
        this.reconnectTimer = setTimeout(() => {
          this.connectToServerStream(this.currentMatchId);
        }, 3000);
      };
    } catch (err) {
      console.warn('SSE connection error:', err);
      this.updateStatus('offline');
    }
  }

  private updateStatus(status: 'connected' | 'connecting' | 'offline'): void {
    this.connectionStatus = status;
    const info = this.getConnectionInfo();
    this.statusListeners.forEach((cb) => {
      try {
        cb(info);
      } catch (e) {
        console.error(e);
      }
    });
  }

  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.currentMatchId}`;
  }

  private saveLocalOnly(state: MatchState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  }

  public loadState(): MatchState {
    if (typeof window === 'undefined') return defaultMatchState;
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.homeTeam && parsed.awayTeam) {
          if (!parsed.matchTitle || parsed.matchTitle === 'LIGA FUTSAL PROFESIONAL INDONESIA') {
            parsed.matchTitle = 'GAWANG MINI JONG CANO';
          }
          parsed.matchId = this.currentMatchId;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return createInitialRoomState(this.currentMatchId);
  }

  public saveAndBroadcast(state: MatchState): void {
    const updatedState: MatchState = {
      ...state,
      matchId: this.currentMatchId,
      lastUpdated: Date.now(),
    };

    this.saveLocalOnly(updatedState);

    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'MATCH_STATE_SYNC',
          state: updatedState,
        });
      } catch (e) {
        console.warn('Broadcast channel post message error:', e);
      }
    }

    this.notifyListeners(updatedState);

    // Push state mutation to server so all other physical devices update in real-time
    if (typeof window !== 'undefined') {
      fetch(`/api/rooms/${encodeURIComponent(this.currentMatchId)}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: updatedState,
          senderId: this.clientId,
        }),
      }).catch((err) => {
        console.warn('Server sync failed (working offline):', err);
      });
    }
  }

  public triggerRemoteBuzzer(duration = 1.6): void {
    if (typeof window === 'undefined') return;
    fetch(`/api/rooms/${encodeURIComponent(this.currentMatchId)}/buzzer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration,
        senderId: this.clientId,
      }),
    }).catch(() => {});
  }

  public subscribe(callback: (state: MatchState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeStatus(callback: (info: ConnectionStatusInfo) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.getConnectionInfo());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public subscribeBuzzer(callback: (duration: number) => void): () => void {
    this.buzzerListeners.add(callback);
    return () => {
      this.buzzerListeners.delete(callback);
    };
  }

  private notifyListeners(state: MatchState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  }

  private notifyBuzzer(duration: number): void {
    this.buzzerListeners.forEach((listener) => {
      try {
        listener(duration);
      } catch (err) {
        console.error('Buzzer listener error:', err);
      }
    });
  }
}

export const syncManager = new SyncManager();
