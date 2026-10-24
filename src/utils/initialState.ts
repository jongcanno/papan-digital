import { MatchState, Player } from '../types/scoreboard';

export const createDefaultSquad = (prefix: 'H' | 'A'): Player[] => {
  if (prefix === 'H') {
    return [
      { id: 'h1', number: 1, name: 'M. Nazil', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h4', number: 4, name: 'Iqbal Iskandar', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h7', number: 7, name: 'Syauqi Saud', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h10', number: 10, name: 'A. Runtuboy', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h9', number: 9, name: 'Holypaul S.', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h12', number: 12, name: 'Rizqky Hanna (GK)', role: 'sub', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h11', number: 11, name: 'Samuel Eko', role: 'sub', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h98', number: 98, name: 'Coach Hector', role: 'official', yellowCards: 0, redCard: false, goals: 0 },
      { id: 'h99', number: 99, name: 'Dr. Hendra (Medis)', role: 'official', yellowCards: 0, redCard: false, goals: 0 },
    ];
  }

  return [
    { id: 'a2', number: 2, name: 'M. Albagir', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a5', number: 5, name: 'Rio Pangestu', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a8', number: 8, name: 'Wendy Brian', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a17', number: 17, name: 'Diego Rodrigo', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a14', number: 14, name: 'Evan Soumilena', role: 'starter', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a20', number: 20, name: 'Alireza Rafiei', role: 'sub', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a18', number: 18, name: 'Pieter Junior', role: 'sub', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a96', number: 96, name: 'Coach Rakphol', role: 'official', yellowCards: 0, redCard: false, goals: 0 },
    { id: 'a97', number: 97, name: 'Coach Yosafat', role: 'official', yellowCards: 0, redCard: false, goals: 0 },
  ];
};

export const defaultMatchState: MatchState = {
  matchId: 'FUTSAL-2026',
  matchTitle: 'LIGA FUTSAL PROFESIONAL INDONESIA',
  timer: {
    minutes: 20,
    seconds: 0,
    isRunning: false,
    initialMinutes: 20,
  },
  period: 1, // 1: Babak 1, 2: Babak 2, 3: Extra Time, 4: Penalti
  isPenaltyMode: false,
  homeTeam: {
    id: 'home',
    name: 'BINTANG TIMUR',
    shortName: 'BTS',
    color: '#06b6d4', // Cyan neon
    logoUrl: '',
    score: 0,
    fouls: 0,
    players: createDefaultSquad('H'),
    penalties: [null, null, null, null, null, null, null],
  },
  awayTeam: {
    id: 'away',
    name: 'BLACK STEEL',
    shortName: 'BLS',
    color: '#f43f5e', // Rose/Crimson neon
    logoUrl: '',
    score: 0,
    fouls: 0,
    players: createDefaultSquad('A'),
    penalties: [null, null, null, null, null, null, null],
  },
  stats: {
    home: {
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      possession: 50,
    },
    away: {
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      possession: 50,
    },
  },
  activeOverlay: null,
  lastUpdated: Date.now(),
};
