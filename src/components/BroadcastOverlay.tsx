import React from 'react';
import { ActiveOverlay, Team } from '../types/scoreboard';
import { ArrowDownLeft, ArrowUpRight, Flame, ShieldAlert, X } from 'lucide-react';

interface BroadcastOverlayProps {
  overlay: ActiveOverlay | null;
  homeTeam: Team;
  awayTeam: Team;
  onDismiss: () => void;
}

export const BroadcastOverlay: React.FC<BroadcastOverlayProps> = ({
  overlay,
  homeTeam,
  awayTeam,
  onDismiss,
}) => {
  if (!overlay) return null;

  const team = overlay.teamId === 'away' ? awayTeam : homeTeam;
  const isGoal = overlay.type === 'goal';
  const isCard = overlay.type === 'card';
  const isSub = overlay.type === 'sub';
  const isTimeUp = overlay.type === 'timeup';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md">
      {/* Animated Banner from Left to Right */}
      <div className="relative w-full max-w-5xl mx-4 pointer-events-auto animate-slide-left-right">
        {/* Glowing backdrop container */}
        <div
          className={`relative overflow-hidden rounded-3xl border-2 p-8 md:p-12 shadow-2xl transition-all ${
            isGoal
              ? 'border-cyan-400 bg-gradient-to-r from-cyan-950/95 via-slate-900/95 to-slate-950/95 shadow-cyan-500/40'
              : isCard && overlay.cardType === 'red'
              ? 'border-rose-500 bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-slate-950/95 shadow-rose-500/40'
              : isCard && overlay.cardType === 'yellow'
              ? 'border-yellow-400 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-slate-950/95 shadow-amber-500/40'
              : isSub
              ? 'border-emerald-400 bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-slate-950/95 shadow-emerald-500/40'
              : 'border-amber-400 bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-slate-950/95 shadow-amber-500/40'
          }`}
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            aria-label="Tutup Overlay"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Decorative neon ambient lines */}
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl" />

          {/* 1. GOAL POPUP */}
          {isGoal && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                {/* Team Badge / Avatar */}
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-slate-800/90 border-2 border-cyan-400/80 flex items-center justify-center p-3 shadow-lg neon-box-cyan overflow-hidden">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-outfit text-3xl font-black text-cyan-300">
                      {team.shortName || team.name.slice(0, 3)}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 px-3 py-1 bg-cyan-500 text-slate-950 font-black text-xs font-digital rounded-tl-lg">
                    #{overlay.playerNumber || 10}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3 text-cyan-400 text-sm md:text-base font-semibold tracking-widest uppercase">
                    <Flame className="w-5 h-5 animate-bounce text-amber-400" />
                    <span>{team.name} GOAL SCORER</span>
                  </div>
                  <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-400 font-outfit uppercase neon-glow-cyan">
                    GOAL!!!!!
                  </h1>
                  <p className="text-2xl md:text-4xl font-bold text-slate-100 font-outfit tracking-wide mt-1">
                    {overlay.playerName || 'Pemain'}
                  </p>
                </div>
              </div>

              {/* Huge Jersey Number */}
              <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-cyan-500/40 rounded-2xl px-8 py-4">
                <span className="text-xs uppercase tracking-widest text-slate-400">Nomor Punggung</span>
                <span className="text-6xl md:text-8xl font-black font-digital text-cyan-300 neon-glow-cyan">
                  {overlay.playerNumber ?? 10}
                </span>
              </div>
            </div>
          )}

          {/* 2. CARD POPUP (YELLOW / RED) */}
          {isCard && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                {/* Visual Card Symbol */}
                <div
                  className={`w-24 h-36 rounded-xl flex items-center justify-center shadow-2xl border-2 transform -rotate-6 ${
                    overlay.cardType === 'red'
                      ? 'bg-rose-600 border-rose-300 shadow-rose-600/60'
                      : 'bg-amber-400 border-amber-200 shadow-amber-400/60'
                  }`}
                >
                  <ShieldAlert className="w-12 h-12 text-slate-950/80" />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm md:text-base font-semibold tracking-widest text-slate-300 uppercase">
                    <span>{team.name}</span>
                    <span>·</span>
                    <span className="font-digital font-bold text-white">#{overlay.playerNumber}</span>
                  </div>
                  <h1
                    className={`text-4xl md:text-7xl font-black tracking-tight font-outfit uppercase ${
                      overlay.cardType === 'red'
                        ? 'text-rose-400 neon-glow-rose'
                        : 'text-amber-300 neon-glow-amber'
                    }`}
                  >
                    {overlay.cardType === 'red' ? 'KARTU MERAH' : 'KARTU KUNING'}
                  </h1>
                  <p className="text-2xl md:text-4xl font-bold text-white font-outfit mt-1">
                    {overlay.playerName || 'Pemain'}
                  </p>
                </div>
              </div>

              <div className="text-center bg-slate-950/60 border border-slate-700/60 rounded-2xl px-8 py-5">
                <span className="text-xs uppercase tracking-widest text-slate-400">Peringatan Disiplin</span>
                <p className="text-sm md:text-base font-medium text-slate-200 mt-1 max-w-xs">
                  {overlay.cardType === 'red'
                    ? 'Pemain dikeluarkan dari lapangan pertandingan.'
                    : 'Peringatan resmi dari wasit pertandingan.'}
                </p>
              </div>
            </div>
          )}

          {/* 3. SUBSTITUTION POPUP */}
          {isSub && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-sm md:text-base font-bold tracking-widest text-emerald-400 font-outfit uppercase">
                    PERGANTIAN PEMAIN (SUBSTITUTION)
                  </span>
                </div>
                <span className="font-outfit text-lg font-bold text-slate-200">{team.name}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Out Player */}
                <div className="flex items-center gap-5 p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40">
                  <div className="w-14 h-14 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 shadow-lg">
                    <ArrowDownLeft className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">KELUAR (OUT)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-digital text-rose-300">
                        #{overlay.subOutPlayer?.number ?? '-'}
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-white font-outfit truncate">
                        {overlay.subOutPlayer?.name ?? 'Pemain Keluar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* In Player */}
                <div className="flex items-center gap-5 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                  <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                    <ArrowUpRight className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">MASUK (IN)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-digital text-emerald-300">
                        #{overlay.subInPlayer?.number ?? '-'}
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-white font-outfit truncate">
                        {overlay.subInPlayer?.name ?? 'Pemain Masuk'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TIME UP POPUP */}
          {isTimeUp && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-xs md:text-sm font-black tracking-widest uppercase mb-4 animate-pulse">
                BUZZER PERTANDINGAN BERBUNYI
              </div>
              <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-amber-400 font-outfit uppercase neon-glow-amber">
                WAKTU HABIS
              </h1>
              <p className="text-xl md:text-3xl font-semibold text-slate-200 font-outfit mt-3">
                Babak Resmi Selesai · Scoreboard Dihentikan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
