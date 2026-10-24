import React from 'react';
import { MatchState } from '../types/scoreboard';
import {
  Trophy,
  BarChart3,
  SlidersHorizontal,
  Volume2,
  Keyboard,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Circle,
  Radio,
  Flame,
} from 'lucide-react';

interface BroadcastDisplayProps {
  state: MatchState;
  onOpenStats: () => void;
  onOpenRemote: () => void;
  onOpenKeyboardHelp: () => void;
  onPlayBuzzer: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSelectPenaltyKick: (teamId: 'home' | 'away', index: number, value: boolean | null) => void;
}

export const BroadcastDisplay: React.FC<BroadcastDisplayProps> = ({
  state,
  onOpenStats,
  onOpenRemote,
  onOpenKeyboardHelp,
  onPlayBuzzer,
  isFullscreen,
  onToggleFullscreen,
  onSelectPenaltyKick,
}) => {
  const { homeTeam, awayTeam, timer, period, isPenaltyMode, matchTitle } = state;

  const formattedMinutes = String(timer.minutes).padStart(2, '0');
  const formattedSeconds = String(timer.seconds).padStart(2, '0');

  const getPeriodLabel = (p: number) => {
    switch (p) {
      case 1:
        return 'BABAK 1';
      case 2:
        return 'BABAK 2';
      case 3:
        return 'EXTRA TIME 1';
      case 4:
        return 'EXTRA TIME 2';
      case 5:
        return 'ADU PENALTI';
      default:
        return `BABAK ${p}`;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 bg-slate-950 select-none overflow-hidden">
      {/* 4:3 Hi-Res Frame Container (1600x1200 proportioned) */}
      <div className="relative w-full max-w-[1540px] aspect-[4/3] rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#0a0f1d] via-[#080b12] to-[#04060a] shadow-2xl flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden neon-box-cyan">
        {/* Subtle Background Arena Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* 1. MINIMAL HEADER */}
        <header className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4">
          {/* Match Title & Brand Pill */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-widest font-outfit uppercase">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              LIVE MATCH
            </span>
            <h2 className="hidden sm:inline-block text-xs md:text-sm font-semibold tracking-wider text-slate-400 font-outfit uppercase truncate max-w-xs md:max-w-md">
              {matchTitle || 'LIGA FUTSAL PROFESIONAL'}
            </h2>
          </div>

          {/* Golden Trophy Icon in the Exact Center */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="text-xs font-bold tracking-widest text-amber-300 font-outfit uppercase">
              FUTSAL ARENA
            </span>
          </div>

          {/* Quick Utility Icon Buttons (Top Right) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStats}
              title="Statistik Pertandingan (In The Match)"
              aria-label="Statistik Pertandingan"
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/60 shadow-sm transition-all"
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={onOpenRemote}
              title="Buka Remote Controller (M)"
              aria-label="Buka Remote Controller"
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/60 shadow-sm transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={onPlayBuzzer}
              title="Uji / Bunyikan Suara Buzzer"
              aria-label="Bunyikan Buzzer"
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 hover:border-amber-500/60 shadow-sm transition-all"
            >
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={onOpenKeyboardHelp}
              title="Bantuan Shortcut Keyboard"
              aria-label="Bantuan Shortcut Keyboard"
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/60 shadow-sm transition-all"
            >
              <Keyboard className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Fullscreen)'}
              aria-label="Toggle Fullscreen"
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition-all"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
        </header>

        {/* 2. MAIN BROADCAST STAGE */}
        <main className="relative z-10 my-auto grid grid-cols-12 items-center gap-4 lg:gap-8">
          {/* HOME TEAM (Left Side) */}
          <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center p-4 sm:p-6 rounded-3xl bg-slate-900/40 border border-cyan-500/20 shadow-xl backdrop-blur-sm">
            {/* Logo Badge */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 border-2 border-cyan-400/60 shadow-2xl flex items-center justify-center neon-box-cyan group">
              {homeTeam.logoUrl ? (
                <img
                  src={homeTeam.logoUrl}
                  alt={homeTeam.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-800/80 border border-cyan-500/40 flex flex-col items-center justify-center text-cyan-300 font-black font-outfit text-3xl sm:text-4xl tracking-wider">
                  <span>{homeTeam.shortName || 'HOM'}</span>
                  <span className="text-[10px] text-cyan-400 font-sans tracking-widest font-normal">HOME</span>
                </div>
              )}
            </div>

            {/* Team Name */}
            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black font-outfit tracking-wide text-white uppercase truncate max-w-full">
              {homeTeam.name}
            </h1>

            {/* Massive Glowing Neon Score */}
            <div className="mt-2 text-7xl sm:text-8xl md:text-9xl font-black font-digital text-cyan-400 neon-glow-cyan leading-none select-none">
              {homeTeam.score}
            </div>

            {/* Fouls Pill */}
            <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-700">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">FOULS:</span>
              <span
                className={`text-base font-digital font-bold ${
                  homeTeam.fouls >= 5 ? 'text-rose-400 animate-pulse font-black' : 'text-cyan-300'
                }`}
              >
                {homeTeam.fouls}
              </span>
              {homeTeam.fouls >= 5 && (
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">
                  (PENALTI TITIK 2)
                </span>
              )}
            </div>

            {/* 7 Penalty Shootout Dots */}
            {isPenaltyMode && (
              <div className="mt-5 w-full bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-2 font-bold">
                  PENALTI TIM HOME
                </span>
                <div className="flex items-center justify-center gap-2">
                  {homeTeam.penalties.map((val, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const next = val === null ? true : val === true ? false : null;
                        onSelectPenaltyKick('home', idx, next);
                      }}
                      title={`Penendang #${idx + 1}: ${val === true ? 'Gol' : val === false ? 'Gagal' : 'Belum'}`}
                      className="transition-transform hover:scale-125 focus:outline-none"
                    >
                      {val === true ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : val === false ? (
                        <XCircle className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTER HUB: TIMER & PERIOD */}
          <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center my-4 md:my-0">
            {/* Timer Neon Digital Box */}
            <div className="relative w-full max-w-sm rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-2 border-amber-400/50 shadow-2xl text-center neon-box-amber">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-bold font-outfit">
                  COUNTDOWN MATCH TIMER
                </span>
                {timer.isRunning ? (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                )}
              </div>

              {/* Glowing Digit */}
              <div className="text-6xl sm:text-7xl md:text-8xl font-black font-digital text-amber-400 neon-glow-amber tracking-wider py-1">
                {formattedMinutes}:{formattedSeconds}
              </div>

              <div className="text-[11px] uppercase tracking-widest text-slate-400 font-medium mt-1">
                {timer.isRunning ? 'WAKTU BERJALAN' : 'TIMER DIJEDA (PAUSE)'}
              </div>
            </div>

            {/* Period Indicator Box */}
            <div className="mt-5 flex flex-col items-center">
              <div className="px-6 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-lg">
                <span className="text-sm sm:text-base md:text-lg font-black font-outfit text-white tracking-widest uppercase">
                  {getPeriodLabel(period)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-medium">
                BABAK PERTANDINGAN
              </span>
            </div>
          </div>

          {/* AWAY TEAM (Right Side) */}
          <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center p-4 sm:p-6 rounded-3xl bg-slate-900/40 border border-rose-500/20 shadow-xl backdrop-blur-sm">
            {/* Logo Badge */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 border-2 border-rose-400/60 shadow-2xl flex items-center justify-center neon-box-rose group">
              {awayTeam.logoUrl ? (
                <img
                  src={awayTeam.logoUrl}
                  alt={awayTeam.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-800/80 border border-rose-500/40 flex flex-col items-center justify-center text-rose-300 font-black font-outfit text-3xl sm:text-4xl tracking-wider">
                  <span>{awayTeam.shortName || 'AWY'}</span>
                  <span className="text-[10px] text-rose-400 font-sans tracking-widest font-normal">AWAY</span>
                </div>
              )}
            </div>

            {/* Team Name */}
            <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black font-outfit tracking-wide text-white uppercase truncate max-w-full">
              {awayTeam.name}
            </h1>

            {/* Massive Glowing Neon Score */}
            <div className="mt-2 text-7xl sm:text-8xl md:text-9xl font-black font-digital text-rose-400 neon-glow-rose leading-none select-none">
              {awayTeam.score}
            </div>

            {/* Fouls Pill */}
            <div className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-700">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">FOULS:</span>
              <span
                className={`text-base font-digital font-bold ${
                  awayTeam.fouls >= 5 ? 'text-rose-400 animate-pulse font-black' : 'text-rose-300'
                }`}
              >
                {awayTeam.fouls}
              </span>
              {awayTeam.fouls >= 5 && (
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">
                  (PENALTI TITIK 2)
                </span>
              )}
            </div>

            {/* 7 Penalty Shootout Dots */}
            {isPenaltyMode && (
              <div className="mt-5 w-full bg-slate-950/70 border border-rose-500/30 rounded-2xl p-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 block mb-2 font-bold">
                  PENALTI TIM AWAY
                </span>
                <div className="flex items-center justify-center gap-2">
                  {awayTeam.penalties.map((val, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const next = val === null ? true : val === true ? false : null;
                        onSelectPenaltyKick('away', idx, next);
                      }}
                      title={`Penendang #${idx + 1}: ${val === true ? 'Gol' : val === false ? 'Gagal' : 'Belum'}`}
                      className="transition-transform hover:scale-125 focus:outline-none"
                    >
                      {val === true ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : val === false ? (
                        <XCircle className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* 3. BROADCAST FOOTER BAR */}
        <footer className="relative z-10 flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="text-slate-300 font-bold font-outfit">KODE MATCH: {state.matchId}</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">Spasi</kbd> untuk Start/Pause Timer</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-[11px]">Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">M</kbd> untuk Remote Operator</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
