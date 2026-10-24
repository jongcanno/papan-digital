import { MatchState } from '../types/scoreboard';
import { defaultMatchState } from './initialState';

const STORAGE_KEY_PREFIX = 'futsal_scoreboard_state_';
const CHANNEL_NAME = 'futsal_scoreboard_sync_channel';

export class SyncManager {
  private channel: BroadcastChannel | null = null;
  private currentMatchId: string = 'FUTSAL-2026';
  private listeners: Set<(state: MatchState) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
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

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.getStorageKey()) {
          try {
            const incomingState = JSON.parse(event.newValue || '{}');
            if (incomingState && incomingState.matchId === this.currentMatchId) {
              this.notifyListeners(incomingState);
            }
          } catch (e) {
            console.error('Storage parse error:', e);
          }
        }
      });
    }
  }

  public setMatchId(matchId: string): void {
    this.currentMatchId = matchId.trim().toUpperCase() || 'FUTSAL-2026';
  }

  public getMatchId(): string {
    return this.currentMatchId;
  }

  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.currentMatchId}`;
  }

  public loadState(): MatchState {
    if (typeof window === 'undefined') return defaultMatchState;
    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.homeTeam && parsed.awayTeam) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return defaultMatchState;
  }

  public saveAndBroadcast(state: MatchState): void {
    const updatedState: MatchState = {
      ...state,
      lastUpdated: Date.now(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(updatedState));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }

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
  }

  public subscribe(callback: (state: MatchState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
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
}

export const syncManager = new SyncManager();
