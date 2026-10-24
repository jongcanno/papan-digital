export type PlayerRole = 'starter' | 'sub' | 'official';

export interface Player {
  id: string;
  number: number;
  name: string;
  role: PlayerRole;
  yellowCards: number;
  redCard: boolean;
  goals: number;
}

export interface Team {
  id: 'home' | 'away';
  name: string;
  shortName: string;
  color: string;
  logoUrl: string;
  score: number;
  fouls: number;
  players: Player[];
  penalties: (boolean | null)[]; // up to 7 shootout kicks
}

export interface TeamStats {
  shots: number;
  shotsOnTarget: number;
  corners: number;
  possession: number; // percentage (0 - 100)
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
}

export interface ActiveOverlay {
  id: number;
  type: 'goal' | 'card' | 'sub' | 'timeup';
  teamId?: 'home' | 'away';
  title: string;
  subtitle?: string;
  playerName?: string;
  playerNumber?: number;
  subInPlayer?: { number: number; name: string };
  subOutPlayer?: { number: number; name: string };
  cardType?: 'yellow' | 'red';
  logoUrl?: string;
}

export interface MatchState {
  matchId: string;
  matchTitle: string;
  timer: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    initialMinutes: number;
  };
  period: number; // 1: Babak 1, 2: Babak 2, 3: Extra Time 1, 4: Extra Time 2, 5: Adu Penalti
  isPenaltyMode: boolean;
  homeTeam: Team;
  awayTeam: Team;
  stats: MatchStats;
  activeOverlay: ActiveOverlay | null;
  lastUpdated: number;
}
