import React, { useState } from 'react';
import { MatchState, Player, Team, PlayerRole } from '../types/scoreboard';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Plus,
  Minus,
  Sparkles,
  Trophy,
  Users,
  Shield,
  Clock,
  BarChart3,
  Flame,
  ArrowRightLeft,
  ShieldAlert,
  Upload,
  Check,
  X,
  Radio,
  QrCode,
} from 'lucide-react';

interface RemoteControllerProps {
  state: MatchState;
  onUpdateState: (newState: Partial<MatchState>) => void;
  onTriggerOverlay: (overlay: any) => void;
  onPlayBuzzer: () => void;
  onTriggerAiAnalysis: (type: 'commentary' | 'press_release') => void;
  isAiLoading: boolean;
  onClose?: () => void;
  onOpenConnectModal?: () => void;
  connectedDevices?: number;
}

export const RemoteController: React.FC<RemoteControllerProps> = ({
  state,
  onUpdateState,
  onTriggerOverlay,
  onPlayBuzzer,
  onTriggerAiAnalysis,
  isAiLoading,
  onClose,
  onOpenConnectModal,
  connectedDevices = 1,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'squad' | 'stats' | 'teams' | 'ai'>('match');

  // Modal sub-states
  const [goalDialogTeam, setGoalDialogTeam] = useState<'home' | 'away' | null>(null);
  const [cardDialogTeam, setCardDialogTeam] = useState<'home' | 'away' | null>(null);
  const [cardTypeSelected, setCardTypeSelected] = useState<'yellow' | 'red'>('yellow');
  const [subDialogTeam, setSubDialogTeam] = useState<'home' | 'away' | null>(null);
  const [selectedSubOut, setSelectedSubOut] = useState<string>('');
  const [selectedSubIn, setSelectedSubIn] = useState<string>('');

  // Manual timer state
  const [manualMinutes, setManualMinutes] = useState(String(state.timer.minutes));
  const [manualSeconds, setManualSeconds] = useState(String(state.timer.seconds));

  // Timer controls
  const handleToggleTimer = () => {
    onUpdateState({
      timer: {
        ...state.timer,
        isRunning: !state.timer.isRunning,
      },
    });
  };

  const handleResetTimer = (minutes: number = 20) => {
    onUpdateState({
      timer: {
        minutes,
        seconds: 0,
        isRunning: false,
        initialMinutes: minutes,
      },
    });
    setManualMinutes(String(minutes));
    setManualSeconds('0');
  };

  const handleAdjustTimerMinutes = (delta: number) => {
    const newMins = Math.max(0, state.timer.minutes + delta);
    onUpdateState({
      timer: {
        ...state.timer,
        minutes: newMins,
      },
    });
    setManualMinutes(String(newMins));
  };

  const handleAdjustTimerSeconds = (delta: number) => {
    let totalSecs = state.timer.minutes * 60 + state.timer.seconds + delta;
    if (totalSecs < 0) totalSecs = 0;
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    onUpdateState({
      timer: {
        ...state.timer,
        minutes: m,
        seconds: s,
      },
    });
    setManualMinutes(String(m));
    setManualSeconds(String(s));
  };

  const handleApplyManualTimer = (e: React.FormEvent) => {
    e.preventDefault();
    const m = Math.max(0, parseInt(manualMinutes, 10) || 0);
    const s = Math.min(59, Math.max(0, parseInt(manualSeconds, 10) || 0));
    onUpdateState({
      timer: {
        ...state.timer,
        minutes: m,
        seconds: s,
      },
    });
  };

  // Score & Fouls
  const handleScoreChange = (teamId: 'home' | 'away', delta: number) => {
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const currentTeam = state[teamKey];
    const newScore = Math.max(0, currentTeam.score + delta);
    onUpdateState({
      [teamKey]: {
        ...currentTeam,
        score: newScore,
      },
    });
  };

  const handleFoulChange = (teamId: 'home' | 'away', delta: number) => {
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const currentTeam = state[teamKey];
    const newFouls = Math.max(0, currentTeam.fouls + delta);
    onUpdateState({
      [teamKey]: {
        ...currentTeam,
        fouls: newFouls,
      },
    });
  };

  // Goal trigger with player selection
  const handleRecordGoal = (teamId: 'home' | 'away', player: Player) => {
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const team = state[teamKey];
    const updatedPlayers = team.players.map((p) =>
      p.id === player.id ? { ...p, goals: p.goals + 1 } : p
    );

    // Update match state
    onUpdateState({
      [teamKey]: {
        ...team,
        score: team.score + 1,
        players: updatedPlayers,
      },
    });

    // Trigger overlay animation
    onTriggerOverlay({
      id: Date.now(),
      type: 'goal',
      teamId,
      title: 'GOAL!!!!!',
      playerName: player.name,
      playerNumber: player.number,
      logoUrl: team.logoUrl,
    });

    setGoalDialogTeam(null);
  };

  // Card trigger with player selection
  const handleRecordCard = (teamId: 'home' | 'away', player: Player, cardType: 'yellow' | 'red') => {
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const team = state[teamKey];

    const updatedPlayers = team.players.map((p) => {
      if (p.id === player.id) {
        if (cardType === 'yellow') {
          const newYellows = p.yellowCards + 1;
          const isRed = newYellows >= 2;
          return { ...p, yellowCards: newYellows, redCard: isRed || p.redCard };
        } else {
          return { ...p, redCard: true };
        }
      }
      return p;
    });

    onUpdateState({
      [teamKey]: {
        ...team,
        players: updatedPlayers,
      },
    });

    onTriggerOverlay({
      id: Date.now(),
      type: 'card',
      teamId,
      title: cardType === 'red' ? 'KARTU MERAH' : 'KARTU KUNING',
      playerName: player.name,
      playerNumber: player.number,
      cardType,
      logoUrl: team.logoUrl,
    });

    setCardDialogTeam(null);
  };

  // Substitution execution
  const handleExecuteSubstitution = (teamId: 'home' | 'away') => {
    if (!selectedSubOut || !selectedSubIn) return;
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const team = state[teamKey];

    const outPlayer = team.players.find((p) => p.id === selectedSubOut);
    const inPlayer = team.players.find((p) => p.id === selectedSubIn);

    if (!outPlayer || !inPlayer) return;

    const updatedPlayers = team.players.map((p) => {
      if (p.id === outPlayer.id) return { ...p, role: 'sub' as PlayerRole };
      if (p.id === inPlayer.id) return { ...p, role: 'starter' as PlayerRole };
      return p;
    });

    onUpdateState({
      [teamKey]: {
        ...team,
        players: updatedPlayers,
      },
    });

    onTriggerOverlay({
      id: Date.now(),
      type: 'sub',
      teamId,
      title: 'PERGANTIAN PEMAIN',
      subOutPlayer: { number: outPlayer.number, name: outPlayer.name },
      subInPlayer: { number: inPlayer.number, name: inPlayer.name },
    });

    setSubDialogTeam(null);
    setSelectedSubOut('');
    setSelectedSubIn('');
  };

  // Logo file upload handler (converts PNG to base64 Data URL)
  const handleLogoUpload = (teamId: 'home' | 'away', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
      onUpdateState({
        [teamKey]: {
          ...state[teamKey],
          logoUrl: result,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  // Player roster field edit
  const handleUpdatePlayer = (
    teamId: 'home' | 'away',
    playerId: string,
    field: keyof Player,
    value: any
  ) => {
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const team = state[teamKey];
    const updated = team.players.map((p) => (p.id === playerId ? { ...p, [field]: value } : p));
    onUpdateState({
      [teamKey]: {
        ...team,
        players: updated,
      },
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Controller Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-base sm:text-xl font-black font-outfit text-white tracking-wide uppercase">
            REMOTE OPERATOR
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onOpenConnectModal && (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-xs font-bold font-outfit text-cyan-300 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>ROOM: {state.matchId}</span>
              <span className="text-emerald-400">({connectedDevices} Aktif)</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Tutup Remote"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('match')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-outfit uppercase whitespace-nowrap transition-colors ${
            activeTab === 'match'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Kontrol Cepat Match
        </button>
        <button
          onClick={() => setActiveTab('squad')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-outfit uppercase whitespace-nowrap transition-colors ${
            activeTab === 'squad'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Skuad & Aksi Lapangan
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-outfit uppercase whitespace-nowrap transition-colors ${
            activeTab === 'stats'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistik Laga
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-outfit uppercase whitespace-nowrap transition-colors ${
            activeTab === 'teams'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Kelola Tim & Logo
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-outfit uppercase whitespace-nowrap transition-colors ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Analisis AI Gemini
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="p-6 overflow-y-auto max-h-[75vh]">
        {/* TAB 1: KONTROL CEPAT MATCH */}
        {activeTab === 'match' && (
          <div className="space-y-6">
            {/* 1. Timer Control Card */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    PENGATURAN WAKTU PERTANDINGAN
                  </span>
                  <div className="text-4xl font-black font-digital text-amber-400">
                    {String(state.timer.minutes).padStart(2, '0')}:
                    {String(state.timer.seconds).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleTimer}
                    className={`px-5 py-3 rounded-xl font-bold font-outfit text-sm uppercase flex items-center gap-2 shadow-lg transition-transform active:scale-95 ${
                      state.timer.isRunning
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {state.timer.isRunning ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        Jeda (Pause)
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Mulai (Start)
                      </>
                    )}
                  </button>

                  <button
                    onClick={onPlayBuzzer}
                    className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition active:scale-95"
                    title="Bunyikan Suara Klakson / Buzzer Stadion"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Timer Quick Steppers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-850">
                <button
                  onClick={() => handleAdjustTimerMinutes(1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  +1 Menit (↑)
                </button>
                <button
                  onClick={() => handleAdjustTimerMinutes(-1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  -1 Menit (↓)
                </button>
                <button
                  onClick={() => handleAdjustTimerSeconds(10)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  +10 Detik (→)
                </button>
                <button
                  onClick={() => handleAdjustTimerSeconds(-10)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  -10 Detik (←)
                </button>
              </div>

              {/* Reset to Preset Buttons & Manual Input */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Reset ke:</span>
                  <button
                    onClick={() => handleResetTimer(20)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    20 Menit
                  </button>
                  <button
                    onClick={() => handleResetTimer(10)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    10 Menit
                  </button>
                  <button
                    onClick={() => handleResetTimer(5)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    5 Menit
                  </button>
                </div>

                <form onSubmit={handleApplyManualTimer} className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="w-14 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-digital text-sm text-white"
                    placeholder="Min"
                  />
                  <span className="text-slate-400">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualSeconds}
                    onChange={(e) => setManualSeconds(e.target.value)}
                    className="w-14 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-digital text-sm text-white"
                    placeholder="Sec"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                  >
                    Set
                  </button>
                </form>
              </div>
            </div>

            {/* 2. Score & Fouls Dual Controllers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Team Stepper */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-cyan-400 font-outfit uppercase truncate">
                    {state.homeTeam.name} (HOME)
                  </h3>
                  <button
                    onClick={() => setGoalDialogTeam('home')}
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-outfit flex items-center gap-1 shadow-md shadow-cyan-600/30"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Pilih Gol Pemain
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">SKOR PERTANDINGAN</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleScoreChange('home', -1)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-4xl font-black font-digital text-cyan-400 w-12 text-center">
                      {state.homeTeam.score}
                    </span>
                    <button
                      onClick={() => handleScoreChange('home', 1)}
                      className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                  <span className="text-xs text-slate-400 font-semibold uppercase">PELANGGARAN (FOULS)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleFoulChange('home', -1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-2xl font-black font-digital text-cyan-300 w-8 text-center">
                      {state.homeTeam.fouls}
                    </span>
                    <button
                      onClick={() => handleFoulChange('home', 1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Away Team Stepper */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-rose-400 font-outfit uppercase truncate">
                    {state.awayTeam.name} (AWAY)
                  </h3>
                  <button
                    onClick={() => setGoalDialogTeam('away')}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-outfit flex items-center gap-1 shadow-md shadow-rose-600/30"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Pilih Gol Pemain
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">SKOR PERTANDINGAN</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleScoreChange('away', -1)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-4xl font-black font-digital text-rose-400 w-12 text-center">
                      {state.awayTeam.score}
                    </span>
                    <button
                      onClick={() => handleScoreChange('away', 1)}
                      className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                  <span className="text-xs text-slate-400 font-semibold uppercase">PELANGGARAN (FOULS)</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleFoulChange('away', -1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-2xl font-black font-digital text-rose-300 w-8 text-center">
                      {state.awayTeam.fouls}
                    </span>
                    <button
                      onClick={() => handleFoulChange('away', 1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Period Selector & Penalty Mode Toggle */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  PILIH BABAK PERTANDINGAN (PERIOD)
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdateState({ period: p })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-outfit uppercase transition ${
                        state.period === p
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {p === 1
                        ? 'Babak 1'
                        : p === 2
                        ? 'Babak 2'
                        : p === 3
                        ? 'ET 1'
                        : p === 4
                        ? 'ET 2'
                        : 'Adu Penalti'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  MODE ADU PENALTI (7 PENENDANG)
                </span>
                <button
                  onClick={() => onUpdateState({ isPenaltyMode: !state.isPenaltyMode })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-outfit uppercase transition ${
                    state.isPenaltyMode
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {state.isPenaltyMode ? '✓ Mode Penalti Aktif' : 'Aktifkan Mode Penalti'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SKUAD & AKSI LAPANGAN (KARTU, GOL, SUBSTITUSI) */}
        {activeTab === 'squad' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Squad */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-cyan-400 font-outfit uppercase">
                    SKUAD {state.homeTeam.name}
                  </h3>
                  <button
                    onClick={() => {
                      setSubDialogTeam('home');
                      setSelectedSubOut('');
                      setSelectedSubIn('');
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold font-outfit flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Substitusi Pemain
                  </button>
                </div>

                <div className="space-y-2">
                  {state.homeTeam.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-digital font-bold text-xs flex items-center justify-center">
                          #{player.number}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white font-outfit">{player.name}</div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {player.role === 'starter'
                              ? 'Utama (Starter)'
                              : player.role === 'sub'
                              ? 'Cadangan (Sub)'
                              : 'Official / Pelatih'}
                          </span>
                        </div>
                      </div>

                      {/* Action triggers for this player */}
                      <div className="flex items-center gap-1.5">
                        {player.yellowCards > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold">
                            🟨 {player.yellowCards}
                          </span>
                        )}
                        {player.redCard && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                            🟥
                          </span>
                        )}
                        {player.goals > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                            ⚽ {player.goals}
                          </span>
                        )}

                        <button
                          onClick={() => handleRecordGoal('home', player)}
                          title="Catat Gol untuk pemain ini"
                          className="p-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white"
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRecordCard('home', player, 'yellow')}
                          title="Beri Kartu Kuning"
                          className="px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold"
                        >
                          K
                        </button>
                        <button
                          onClick={() => handleRecordCard('home', player, 'red')}
                          title="Beri Kartu Merah Langsung"
                          className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold"
                        >
                          M
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Squad */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-rose-400 font-outfit uppercase">
                    SKUAD {state.awayTeam.name}
                  </h3>
                  <button
                    onClick={() => {
                      setSubDialogTeam('away');
                      setSelectedSubOut('');
                      setSelectedSubIn('');
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold font-outfit flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Substitusi Pemain
                  </button>
                </div>

                <div className="space-y-2">
                  {state.awayTeam.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-300 font-digital font-bold text-xs flex items-center justify-center">
                          #{player.number}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white font-outfit">{player.name}</div>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {player.role === 'starter'
                              ? 'Utama (Starter)'
                              : player.role === 'sub'
                              ? 'Cadangan (Sub)'
                              : 'Official / Pelatih'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {player.yellowCards > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-bold">
                            🟨 {player.yellowCards}
                          </span>
                        )}
                        {player.redCard && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                            🟥
                          </span>
                        )}
                        {player.goals > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                            ⚽ {player.goals}
                          </span>
                        )}

                        <button
                          onClick={() => handleRecordGoal('away', player)}
                          title="Catat Gol untuk pemain ini"
                          className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white"
                        >
                          <Flame className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRecordCard('away', player, 'yellow')}
                          title="Beri Kartu Kuning"
                          className="px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 text-xs font-bold"
                        >
                          K
                        </button>
                        <button
                          onClick={() => handleRecordCard('away', player, 'red')}
                          title="Beri Kartu Merah Langsung"
                          className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold"
                        >
                          M
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STATISTIK LAGA */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6">
              {/* Possession Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-300">
                  <span className="text-cyan-400">{state.homeTeam.name}: {state.stats.home.possession}%</span>
                  <span>BALL POSSESSION (%)</span>
                  <span className="text-rose-400">{state.awayTeam.name}: {100 - state.stats.home.possession}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={state.stats.home.possession}
                  onChange={(e) => {
                    const homePos = parseInt(e.target.value, 10);
                    onUpdateState({
                      stats: {
                        ...state.stats,
                        home: { ...state.stats.home, possession: homePos },
                        away: { ...state.stats.away, possession: 100 - homePos },
                      },
                    });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Shots, Shots on Target, Corners Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-850">
                {/* Shots */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <span className="text-xs uppercase text-slate-400 font-bold">TOTAL SHOTS</span>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              home: {
                                ...state.stats.home,
                                shots: Math.max(0, state.stats.home.shots - 1),
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-digital text-lg text-cyan-400 w-6">
                        {state.stats.home.shots}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              home: { ...state.stats.home, shots: state.stats.home.shots + 1 },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-slate-600">vs</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              away: {
                                ...state.stats.away,
                                shots: Math.max(0, state.stats.away.shots - 1),
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-digital text-lg text-rose-400 w-6">
                        {state.stats.away.shots}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              away: { ...state.stats.away, shots: state.stats.away.shots + 1 },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shots on Target */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <span className="text-xs uppercase text-slate-400 font-bold">ON TARGET</span>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              home: {
                                ...state.stats.home,
                                shotsOnTarget: Math.max(0, state.stats.home.shotsOnTarget - 1),
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-digital text-lg text-cyan-400 w-6">
                        {state.stats.home.shotsOnTarget}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              home: {
                                ...state.stats.home,
                                shotsOnTarget: state.stats.home.shotsOnTarget + 1,
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-slate-600">vs</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              away: {
                                ...state.stats.away,
                                shotsOnTarget: Math.max(0, state.stats.away.shotsOnTarget - 1),
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-digital text-lg text-rose-400 w-6">
                        {state.stats.away.shotsOnTarget}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              away: {
                                ...state.stats.away,
                                shotsOnTarget: state.stats.away.shotsOnTarget + 1,
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Corners */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <span className="text-xs uppercase text-slate-400 font-bold">CORNERS</span>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              home: {
                                ...state.stats.home,
                                corners: Math.max(0, state.stats.home.corners - 1),
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-digital text-lg text-cyan-400 w-6">
                        {state.stats.home.corners}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              home: { ...state.stats.home, corners: state.stats.home.corners + 1 },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-cyan-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-slate-600">vs</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              away: {
                                ...state.stats.away,
                                corners: Math.max(0, state.stats.away.corners - 1),
                              },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold"
                      >
                        -
                      </button>
                      <span className="font-digital text-lg text-rose-400 w-6">
                        {state.stats.away.corners}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateState({
                            stats: {
                              ...state.stats,
                              away: { ...state.stats.away, corners: state.stats.away.corners + 1 },
                            },
                          })
                        }
                        className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KELOLA TIM & LOGO (9 PEMAIN PER TIM) */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* Tournament / League Title Card */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2">
              <label className="text-xs text-amber-300 font-bold uppercase tracking-wider block">
                NAMA TURNAMEN / LIGA PERTANDINGAN
              </label>
              <input
                type="text"
                value={state.matchTitle || 'GAWANG MINI JONG CANO'}
                onChange={(e) => onUpdateState({ matchTitle: e.target.value })}
                placeholder="Contoh: GAWANG MINI JONG CANO"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-base font-black text-amber-400 font-outfit uppercase tracking-wide focus:border-amber-400 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">
                Nama ini tampil di pojok kiri atas layar display scoreboard.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Home Team Profile */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-4">
                <h3 className="font-bold text-base text-cyan-400 font-outfit uppercase">
                  PENGATURAN TIM HOME
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                      Nama Tim
                    </label>
                    <input
                      type="text"
                      value={state.homeTeam.name}
                      onChange={(e) =>
                        onUpdateState({
                          homeTeam: { ...state.homeTeam, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white font-outfit focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                      Singkatan (3 Huruf)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={state.homeTeam.shortName}
                      onChange={(e) =>
                        onUpdateState({
                          homeTeam: { ...state.homeTeam, shortName: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white uppercase focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Logo Upload PNG */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                      Unggah Logo Tim (PNG Transparan)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shrink-0">
                        {state.homeTeam.logoUrl ? (
                          <img
                            src={state.homeTeam.logoUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Shield className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span>Pilih File PNG...</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={(e) => handleLogoUpload('home', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 9 Roster Player Slots Editor */}
                  <div className="pt-3 border-t border-slate-850 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase block">
                      Edit 9 Pemain (5 Starter, 2 Cadangan, 2 Ofisial):
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {state.homeTeam.players.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <input
                            type="number"
                            value={p.number}
                            onChange={(e) =>
                              handleUpdatePlayer(
                                'home',
                                p.id,
                                'number',
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-12 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-digital text-center text-cyan-300"
                          />
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) =>
                              handleUpdatePlayer('home', p.id, 'name', e.target.value)
                            }
                            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <select
                            value={p.role}
                            onChange={(e) =>
                              handleUpdatePlayer('home', p.id, 'role', e.target.value)
                            }
                            className="text-[10px] bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-300"
                          >
                            <option value="starter">Starter</option>
                            <option value="sub">Cadangan</option>
                            <option value="official">Ofisial</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Away Team Profile */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-4">
                <h3 className="font-bold text-base text-rose-400 font-outfit uppercase">
                  PENGATURAN TIM AWAY
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                      Nama Tim
                    </label>
                    <input
                      type="text"
                      value={state.awayTeam.name}
                      onChange={(e) =>
                        onUpdateState({
                          awayTeam: { ...state.awayTeam, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white font-outfit focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                      Singkatan (3 Huruf)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={state.awayTeam.shortName}
                      onChange={(e) =>
                        onUpdateState({
                          awayTeam: { ...state.awayTeam, shortName: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white uppercase focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  {/* Logo Upload PNG */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">
                      Unggah Logo Tim (PNG Transparan)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shrink-0">
                        {state.awayTeam.logoUrl ? (
                          <img
                            src={state.awayTeam.logoUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Shield className="w-6 h-6 text-slate-600" />
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4 text-rose-400" />
                        <span>Pilih File PNG...</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={(e) => handleLogoUpload('away', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 9 Roster Player Slots Editor */}
                  <div className="pt-3 border-t border-slate-850 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase block">
                      Edit 9 Pemain (5 Starter, 2 Cadangan, 2 Ofisial):
                    </span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {state.awayTeam.players.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <input
                            type="number"
                            value={p.number}
                            onChange={(e) =>
                              handleUpdatePlayer(
                                'away',
                                p.id,
                                'number',
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-12 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-digital text-center text-rose-300"
                          />
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) =>
                              handleUpdatePlayer('away', p.id, 'name', e.target.value)
                            }
                            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <select
                            value={p.role}
                            onChange={(e) =>
                              handleUpdatePlayer('away', p.id, 'role', e.target.value)
                            }
                            className="text-[10px] bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-300"
                          >
                            <option value="starter">Starter</option>
                            <option value="sub">Cadangan</option>
                            <option value="official">Ofisial</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ANALISIS AI GEMINI */}
        {activeTab === 'ai' && (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-xl font-bold font-outfit text-white uppercase">
                ANALISIS & LAPORAN PERTANDINGAN AI
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilih format ulasan yang Anda inginkan. Google Gemini 3.8 Flash akan menganalisis data
                skor, penguasaan bola, pelanggaran, dan tembakan secara langsung.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2">
              <button
                onClick={() => onTriggerAiAnalysis('commentary')}
                disabled={isAiLoading}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-left space-y-2 transition shadow-lg group disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold font-outfit text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Komentator TV</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ulasan taktis ala komentator siaran langsung televisi dengan gaya enerjik & tajam.
                </p>
              </button>

              <button
                onClick={() => onTriggerAiAnalysis('press_release')}
                disabled={isAiLoading}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-left space-y-2 transition shadow-lg group disabled:opacity-50"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold font-outfit text-sm">
                  <Trophy className="w-4 h-4" />
                  <span>Rilis Berita Pers</span>
                </div>
                <p className="text-xs text-slate-400">
                  Rilis berita olahraga formal 5W1H pasca-laga untuk konsumsi media massa & panitia.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG: SELECT GOAL SCORER */}
      {goalDialogTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold font-outfit text-white text-base uppercase">
                Pencetak Gol ({goalDialogTeam === 'home' ? state.homeTeam.name : state.awayTeam.name})
              </h4>
              <button
                onClick={() => setGoalDialogTeam(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(goalDialogTeam === 'home' ? state.homeTeam : state.awayTeam).players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleRecordGoal(goalDialogTeam, p)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-cyan-600/30 border border-slate-700 text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-950 font-digital font-bold text-cyan-300 flex items-center justify-center text-sm">
                      #{p.number}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white font-outfit">{p.name}</div>
                      <span className="text-[10px] text-slate-400 capitalize">{p.role}</span>
                    </div>
                  </div>
                  <Flame className="w-4 h-4 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: SUBSTITUTION PICKER */}
      {subDialogTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold font-outfit text-white text-base uppercase">
                Pergantian Pemain ({subDialogTeam === 'home' ? state.homeTeam.name : state.awayTeam.name})
              </h4>
              <button
                onClick={() => setSubDialogTeam(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Out Selection */}
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase block mb-1.5">
                  Pemain Keluar (Starter)
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {(subDialogTeam === 'home' ? state.homeTeam : state.awayTeam).players
                    .filter((p) => p.role === 'starter')
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedSubOut(p.id)}
                        className={`w-full text-left p-2 rounded-xl text-xs font-medium border transition ${
                          selectedSubOut === p.id
                            ? 'bg-rose-950/80 border-rose-500 text-white font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        #{p.number} {p.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* In Selection */}
              <div>
                <label className="text-xs font-bold text-emerald-400 uppercase block mb-1.5">
                  Pemain Masuk (Cadangan)
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {(subDialogTeam === 'home' ? state.homeTeam : state.awayTeam).players
                    .filter((p) => p.role === 'sub')
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedSubIn(p.id)}
                        className={`w-full text-left p-2 rounded-xl text-xs font-medium border transition ${
                          selectedSubIn === p.id
                            ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        #{p.number} {p.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSubDialogTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                disabled={!selectedSubOut || !selectedSubIn}
                onClick={() => handleExecuteSubstitution(subDialogTeam)}
                className="px-5 py-2 rounded-xl bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold font-outfit shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Lakukan Substitusi & Tampilkan Overlay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
