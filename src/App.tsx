/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MatchState, ActiveOverlay } from './types/scoreboard';
import { defaultMatchState } from './utils/initialState';
import { syncManager } from './utils/syncManager';
import { audioBuzzer } from './utils/audio';
import { BroadcastDisplay } from './components/BroadcastDisplay';
import { BroadcastOverlay } from './components/BroadcastOverlay';
import { RemoteController } from './components/RemoteController';
import { StatsModal } from './components/StatsModal';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { SlidersHorizontal, Monitor, Radio } from 'lucide-react';

export default function App() {
  const [matchState, setMatchState] = useState<MatchState>(() => syncManager.loadState());
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // URL query mode (e.g. ?mode=remote or ?mode=display)
  const [viewMode, setViewMode] = useState<'display' | 'remote'>('display');

  // AI Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysisType, setAiAnalysisType] = useState<'commentary' | 'press_release'>('commentary');
  const [aiContent, setAiContent] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Active overlay timer reference
  const overlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State ref for interval and event listeners to avoid stale closures
  const stateRef = useRef(matchState);
  stateRef.current = matchState;

  // Check URL parameter for standalone remote view on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'remote') {
        setViewMode('remote');
      }
    }
  }, []);

  // Subscribe to external sync updates (BroadcastChannel / LocalStorage)
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((incomingState) => {
      setMatchState(incomingState);
    });
    return () => unsubscribe();
  }, []);

  // Update match state and broadcast
  const updateMatchState = useCallback((partialState: Partial<MatchState>) => {
    setMatchState((prev) => {
      const next: MatchState = {
        ...prev,
        ...partialState,
      };
      syncManager.saveAndBroadcast(next);
      return next;
    });
  }, []);

  // Dismiss active overlay
  const handleDismissOverlay = useCallback(() => {
    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
      overlayTimeoutRef.current = null;
    }
    updateMatchState({ activeOverlay: null });
  }, [updateMatchState]);

  // Trigger temporary overlay animation (auto-dismiss after 3.8s)
  const triggerOverlay = useCallback(
    (overlay: ActiveOverlay) => {
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
      updateMatchState({ activeOverlay: overlay });

      overlayTimeoutRef.current = setTimeout(() => {
        handleDismissOverlay();
      }, 4000);
    },
    [updateMatchState, handleDismissOverlay]
  );

  // Manual buzzer trigger
  const handlePlayBuzzer = useCallback(() => {
    audioBuzzer.playBuzzer();
  }, []);

  // High precision countdown timer tick
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const current = stateRef.current;
      if (!current.timer.isRunning) return;

      const { minutes, seconds } = current.timer;

      // When timer hits 00:00
      if (minutes === 0 && seconds <= 1) {
        audioBuzzer.playBuzzer(2.2);

        const updated: MatchState = {
          ...current,
          timer: {
            ...current.timer,
            minutes: 0,
            seconds: 0,
            isRunning: false,
          },
          activeOverlay: {
            id: Date.now(),
            type: 'timeup',
            title: 'WAKTU HABIS',
            subtitle: 'Babak Selesai',
          },
        };

        setMatchState(updated);
        syncManager.saveAndBroadcast(updated);

        // Auto dismiss timeup overlay after 5s
        if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
        overlayTimeoutRef.current = setTimeout(() => {
          handleDismissOverlay();
        }, 5000);
        return;
      }

      // Decrement second
      let newMins = minutes;
      let newSecs = seconds - 1;
      if (newSecs < 0) {
        newMins = Math.max(0, minutes - 1);
        newSecs = 59;
      }

      const nextState: MatchState = {
        ...current,
        timer: {
          ...current.timer,
          minutes: newMins,
          seconds: newSecs,
        },
      };
      setMatchState(nextState);
      syncManager.saveAndBroadcast(nextState);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [handleDismissOverlay]);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Penalty kick change
  const handleSelectPenaltyKick = (
    teamId: 'home' | 'away',
    index: number,
    value: boolean | null
  ) => {
    const teamKey = teamId === 'home' ? 'homeTeam' : 'awayTeam';
    const currentTeam = matchState[teamKey];
    const newPenalties = [...currentTeam.penalties];
    newPenalties[index] = value;

    updateMatchState({
      [teamKey]: {
        ...currentTeam,
        penalties: newPenalties,
      },
    });
  };

  // AI Tactical Commentary and Press Release trigger
  const handleTriggerAiAnalysis = async (type: 'commentary' | 'press_release') => {
    setAiAnalysisType(type);
    setAiModalOpen(true);
    setIsAiLoading(true);
    setAiContent('');

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          matchData: stateRef.current,
        }),
      });

      const data = await res.json();
      if (data.success && data.text) {
        setAiContent(data.text);
      } else {
        setAiContent(data.error || 'Gagal menghasilkan ulasan kecerdasan buatan.');
      }
    } catch (err: any) {
      setAiContent('Terjadi kendala saat menghubungi server AI: ' + (err.message || 'Error'));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Keyboard Shortcuts (No conflict, ignores inputs/textareas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';
      if (isInput) return;

      const current = stateRef.current;
      const key = e.key;

      switch (key) {
        // Space: Start / Pause Timer
        case ' ':
          e.preventDefault();
          updateMatchState({
            timer: {
              ...current.timer,
              isRunning: !current.timer.isRunning,
            },
          });
          break;

        // Arrow Up: +1 Menit
        case 'ArrowUp':
          e.preventDefault();
          updateMatchState({
            timer: {
              ...current.timer,
              minutes: current.timer.minutes + 1,
            },
          });
          break;

        // Arrow Down: -1 Menit
        case 'ArrowDown':
          e.preventDefault();
          updateMatchState({
            timer: {
              ...current.timer,
              minutes: Math.max(0, current.timer.minutes - 1),
            },
          });
          break;

        // Arrow Right: +1 Detik
        case 'ArrowRight':
          e.preventDefault();
          let nextSecsPlus = current.timer.seconds + 1;
          let nextMinsPlus = current.timer.minutes;
          if (nextSecsPlus >= 60) {
            nextSecsPlus = 0;
            nextMinsPlus += 1;
          }
          updateMatchState({
            timer: {
              ...current.timer,
              minutes: nextMinsPlus,
              seconds: nextSecsPlus,
            },
          });
          break;

        // Arrow Left: -1 Detik
        case 'ArrowLeft':
          e.preventDefault();
          let nextSecsMin = current.timer.seconds - 1;
          let nextMinsMin = current.timer.minutes;
          if (nextSecsMin < 0) {
            if (nextMinsMin > 0) {
              nextMinsMin -= 1;
              nextSecsMin = 59;
            } else {
              nextSecsMin = 0;
            }
          }
          updateMatchState({
            timer: {
              ...current.timer,
              minutes: nextMinsMin,
              seconds: nextSecsMin,
            },
          });
          break;

        // Q: + Skor Home
        case 'q':
        case 'Q':
          e.preventDefault();
          updateMatchState({
            homeTeam: {
              ...current.homeTeam,
              score: current.homeTeam.score + 1,
            },
          });
          break;

        // A: - Skor Home
        case 'a':
        case 'A':
          e.preventDefault();
          updateMatchState({
            homeTeam: {
              ...current.homeTeam,
              score: Math.max(0, current.homeTeam.score - 1),
            },
          });
          break;

        // P: + Skor Away
        case 'p':
        case 'P':
          e.preventDefault();
          updateMatchState({
            awayTeam: {
              ...current.awayTeam,
              score: current.awayTeam.score + 1,
            },
          });
          break;

        // L: - Skor Away
        case 'l':
        case 'L':
          e.preventDefault();
          updateMatchState({
            awayTeam: {
              ...current.awayTeam,
              score: Math.max(0, current.awayTeam.score - 1),
            },
          });
          break;

        // K: + Babak
        case 'k':
        case 'K':
          e.preventDefault();
          updateMatchState({
            period: Math.min(5, current.period + 1),
          });
          break;

        // J: - Babak
        case 'j':
        case 'J':
          e.preventDefault();
          updateMatchState({
            period: Math.max(1, current.period - 1),
          });
          break;

        // T: Gol Penalti Home (Next empty slot)
        case 't':
        case 'T':
          e.preventDefault();
          const firstHomeEmpty = current.homeTeam.penalties.findIndex((p) => p === null);
          if (firstHomeEmpty !== -1) {
            handleSelectPenaltyKick('home', firstHomeEmpty, true);
          }
          break;

        // G: Gagal Penalti Home
        case 'g':
        case 'G':
          e.preventDefault();
          const firstHomeFail = current.homeTeam.penalties.findIndex((p) => p === null);
          if (firstHomeFail !== -1) {
            handleSelectPenaltyKick('home', firstHomeFail, false);
          }
          break;

        // Y: Gol Penalti Away
        case 'y':
        case 'Y':
          e.preventDefault();
          const firstAwayEmpty = current.awayTeam.penalties.findIndex((p) => p === null);
          if (firstAwayEmpty !== -1) {
            handleSelectPenaltyKick('away', firstAwayEmpty, true);
          }
          break;

        // H: Gagal Penalti Away (Or Toggle Remote if Shift/Combo or H)
        case 'h':
        case 'H':
          e.preventDefault();
          const firstAwayFail = current.awayTeam.penalties.findIndex((p) => p === null);
          if (firstAwayFail !== -1) {
            handleSelectPenaltyKick('away', firstAwayFail, false);
          }
          break;

        // Z: Kartu Kuning Home Cepat
        case 'z':
        case 'Z':
          e.preventDefault();
          const firstHomeStarter = current.homeTeam.players.find((p) => p.role === 'starter');
          if (firstHomeStarter) {
            triggerOverlay({
              id: Date.now(),
              type: 'card',
              teamId: 'home',
              title: 'KARTU KUNING',
              playerName: firstHomeStarter.name,
              playerNumber: firstHomeStarter.number,
              cardType: 'yellow',
            });
          }
          break;

        // X: Kartu Kuning Away Cepat
        case 'x':
        case 'X':
          e.preventDefault();
          const firstAwayStarter = current.awayTeam.players.find((p) => p.role === 'starter');
          if (firstAwayStarter) {
            triggerOverlay({
              id: Date.now(),
              type: 'card',
              teamId: 'away',
              title: 'KARTU KUNING',
              playerName: firstAwayStarter.name,
              playerNumber: firstAwayStarter.number,
              cardType: 'yellow',
            });
          }
          break;

        // C: Kartu Merah Home Cepat
        case 'c':
        case 'C':
          e.preventDefault();
          const homeRedPlayer = current.homeTeam.players.find((p) => p.role === 'starter');
          if (homeRedPlayer) {
            triggerOverlay({
              id: Date.now(),
              type: 'card',
              teamId: 'home',
              title: 'KARTU MERAH',
              playerName: homeRedPlayer.name,
              playerNumber: homeRedPlayer.number,
              cardType: 'red',
            });
          }
          break;

        // V: Kartu Merah Away Cepat
        case 'v':
        case 'V':
          e.preventDefault();
          const awayRedPlayer = current.awayTeam.players.find((p) => p.role === 'starter');
          if (awayRedPlayer) {
            triggerOverlay({
              id: Date.now(),
              type: 'card',
              teamId: 'away',
              title: 'KARTU MERAH',
              playerName: awayRedPlayer.name,
              playerNumber: awayRedPlayer.number,
              cardType: 'red',
            });
          }
          break;

        // PageUp: Pergantian Home Cepat
        case 'PageUp':
          e.preventDefault();
          setIsRemoteOpen(true);
          break;

        // PageDown: Pergantian Away Cepat
        case 'PageDown':
          e.preventDefault();
          setIsRemoteOpen(true);
          break;

        // M: Buka / Tutup Panel Remote
        case 'm':
        case 'M':
          e.preventDefault();
          setIsRemoteOpen((prev) => !prev);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateMatchState, triggerOverlay]);

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Top Floating Mode Bar (Switch between Display & Mobile Remote view) */}
      <div className="absolute top-2 left-4 z-40 flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md">
          <button
            onClick={() => setViewMode('display')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit uppercase transition ${
              viewMode === 'display'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Layar Display
          </button>
          <button
            onClick={() => setViewMode('remote')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-outfit uppercase transition ${
              viewMode === 'remote'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Remote Operator
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: BROADCAST DISPLAY (1600x1200 4:3 Hi-Res Scale) */}
      {viewMode === 'display' && (
        <main className="w-full h-screen flex items-center justify-center">
          <BroadcastDisplay
            state={matchState}
            onOpenStats={() => setIsStatsOpen(true)}
            onOpenRemote={() => setIsRemoteOpen(true)}
            onOpenKeyboardHelp={() => setIsKeyboardHelpOpen(true)}
            onPlayBuzzer={handlePlayBuzzer}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onSelectPenaltyKick={handleSelectPenaltyKick}
          />
        </main>
      )}

      {/* VIEW MODE 2: DEDICATED FULL REMOTE CONTROLLER VIEW */}
      {viewMode === 'remote' && (
        <main className="w-full max-w-4xl p-4 sm:p-6 my-auto pt-16">
          <RemoteController
            state={matchState}
            onUpdateState={updateMatchState}
            onTriggerOverlay={triggerOverlay}
            onPlayBuzzer={handlePlayBuzzer}
            onTriggerAiAnalysis={handleTriggerAiAnalysis}
            isAiLoading={isAiLoading}
          />
        </main>
      )}

      {/* FLOATING MODAL REMOTE CONTROLLER (Accessible via 'M' key or top button) */}
      {viewMode === 'display' && isRemoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <RemoteController
            state={matchState}
            onUpdateState={updateMatchState}
            onTriggerOverlay={triggerOverlay}
            onPlayBuzzer={handlePlayBuzzer}
            onTriggerAiAnalysis={handleTriggerAiAnalysis}
            isAiLoading={isAiLoading}
            onClose={() => setIsRemoteOpen(false)}
          />
        </div>
      )}

      {/* OVERLAY ANIMATIONS (GOAL, CARDS, SUBSTITUTIONS, TIME UP) */}
      <BroadcastOverlay
        overlay={matchState.activeOverlay}
        homeTeam={matchState.homeTeam}
        awayTeam={matchState.awayTeam}
        onDismiss={handleDismissOverlay}
      />

      {/* STATS MODAL ("IN THE MATCH") */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        state={matchState}
        onTriggerAiAnalysis={handleTriggerAiAnalysis}
        isAiLoading={isAiLoading}
      />

      {/* KEYBOARD SHORTCUTS GUIDE MODAL */}
      <KeyboardHelpModal
        isOpen={isKeyboardHelpOpen}
        onClose={() => setIsKeyboardHelpOpen(false)}
      />

      {/* AI TACTICAL ANALYSIS & PRESS RELEASE MODAL */}
      <AiAnalysisModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        type={aiAnalysisType}
        content={aiContent}
        isLoading={isAiLoading}
        onRegenerate={() => handleTriggerAiAnalysis(aiAnalysisType)}
      />
    </div>
  );
}
