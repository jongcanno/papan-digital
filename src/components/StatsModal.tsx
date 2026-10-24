import React from 'react';
import { MatchState } from '../types/scoreboard';
import { X, Sparkles, Trophy, BarChart2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: MatchState;
  onUpdateStats?: (homeStats: any, awayStats: any) => void;
  onTriggerAiAnalysis?: (type: 'commentary' | 'press_release') => void;
  isAiLoading?: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  state,
  onTriggerAiAnalysis,
  isAiLoading,
}) => {
  if (!isOpen) return null;

  const { homeTeam, awayTeam, stats } = state;

  // Calculate cards from squad rosters
  const homeYellows = homeTeam.players.reduce((acc, p) => acc + p.yellowCards, 0);
  const homeReds = homeTeam.players.filter((p) => p.redCard).length;
  const awayYellows = awayTeam.players.reduce((acc, p) => acc + p.yellowCards, 0);
  const awayReds = awayTeam.players.filter((p) => p.redCard).length;

  const statItems = [
    {
      label: 'BALL POSSESSION',
      homeVal: `${stats.home.possession}%`,
      awayVal: `${stats.away.possession}%`,
      homeRaw: stats.home.possession,
      awayRaw: stats.away.possession,
      total: 100,
    },
    {
      label: 'TOTAL SHOTS',
      homeVal: stats.home.shots,
      awayVal: stats.away.shots,
      homeRaw: stats.home.shots,
      awayRaw: stats.away.shots,
      total: Math.max(1, stats.home.shots + stats.away.shots),
    },
    {
      label: 'SHOTS ON TARGET',
      homeVal: stats.home.shotsOnTarget,
      awayVal: stats.away.shotsOnTarget,
      homeRaw: stats.home.shotsOnTarget,
      awayRaw: stats.away.shotsOnTarget,
      total: Math.max(1, stats.home.shotsOnTarget + stats.away.shotsOnTarget),
    },
    {
      label: 'CORNERS',
      homeVal: stats.home.corners,
      awayVal: stats.away.corners,
      homeRaw: stats.home.corners,
      awayRaw: stats.away.corners,
      total: Math.max(1, stats.home.corners + stats.away.corners),
    },
    {
      label: 'FOULS',
      homeVal: homeTeam.fouls,
      awayVal: awayTeam.fouls,
      homeRaw: homeTeam.fouls,
      awayRaw: awayTeam.fouls,
      total: Math.max(1, homeTeam.fouls + awayTeam.fouls),
    },
    {
      label: 'YELLOW CARDS',
      homeVal: homeYellows,
      awayVal: awayYellows,
      homeRaw: homeYellows,
      awayRaw: awayYellows,
      total: Math.max(1, homeYellows + awayYellows),
    },
    {
      label: 'RED CARDS',
      homeVal: homeReds,
      awayVal: awayReds,
      homeRaw: homeReds,
      awayRaw: awayReds,
      total: Math.max(1, homeReds + awayReds),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit text-white tracking-wide uppercase">
                IN THE MATCH · STATISTIK RESMI
              </h2>
              <span className="text-xs text-slate-400">Perbandingan Performa Kedua Tim</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Modal Statistik"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scoreboard Summary Strip */}
        <div className="grid grid-cols-3 items-center px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-rose-950/40 border-b border-slate-800">
          {/* Home */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-cyan-400/60 flex items-center justify-center p-1 font-bold text-cyan-300 font-outfit">
              {homeTeam.logoUrl ? (
                <img src={homeTeam.logoUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                homeTeam.shortName || 'HOM'
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-cyan-400 font-outfit truncate">{homeTeam.name}</h3>
              <span className="text-xs text-slate-400">Home</span>
            </div>
          </div>

          {/* Score in Center */}
          <div className="text-center">
            <div className="text-3xl font-black font-digital text-amber-400 tracking-wider">
              {homeTeam.score} - {awayTeam.score}
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Babak {state.period}
            </span>
          </div>

          {/* Away */}
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <h3 className="font-bold text-sm text-rose-400 font-outfit truncate">{awayTeam.name}</h3>
              <span className="text-xs text-slate-400">Away</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-rose-400/60 flex items-center justify-center p-1 font-bold text-rose-300 font-outfit">
              {awayTeam.logoUrl ? (
                <img src={awayTeam.logoUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                awayTeam.shortName || 'AWY'
              )}
            </div>
          </div>
        </div>

        {/* Stats Bars List */}
        <div className="p-6 overflow-y-auto space-y-5">
          {statItems.map((item, index) => {
            const homePercent = (item.homeRaw / item.total) * 100;
            const awayPercent = (item.awayRaw / item.total) * 100;

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="text-sm font-digital font-bold text-cyan-400 w-12 text-left">
                    {item.homeVal}
                  </span>
                  <span className="text-xs tracking-wider uppercase text-slate-400 font-outfit">
                    {item.label}
                  </span>
                  <span className="text-sm font-digital font-bold text-rose-400 w-12 text-right">
                    {item.awayVal}
                  </span>
                </div>

                {/* Comparative Dual Progress Bar */}
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex items-stretch">
                  <div
                    className="bg-cyan-500 transition-all duration-500 rounded-l-full"
                    style={{ width: `${homePercent}%` }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-500 rounded-r-full"
                    style={{ width: `${awayPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Tactical Generator Action Footer */}
        {onTriggerAiAnalysis && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Analisis Otomatis AI Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onTriggerAiAnalysis('commentary')}
                disabled={isAiLoading}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold font-outfit transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAiLoading ? 'Menganalisis...' : 'Komentator TV'}
              </button>
              <button
                onClick={() => onTriggerAiAnalysis('press_release')}
                disabled={isAiLoading}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold font-outfit border border-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Rilis Berita Laga
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
