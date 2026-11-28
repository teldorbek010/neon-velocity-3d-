/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats, Language } from '../types/game';
import { TRANSLATIONS } from '../data/constants';
import { RotateCcw, Trophy, Gem, Gauge, Compass, Home } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  onRestart: () => void;
  onOpenGarage: () => void;
  onMainMenu: () => void;
  language: Language;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  onRestart,
  onOpenGarage,
  onMainMenu,
  language,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isNewHighScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-center">
        {/* Banner */}
        <div>
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400 text-yellow-300 text-xs font-black mb-2 animate-bounce">
              <Trophy className="w-3.5 h-3.5" />
              <span>{t.newRecord}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-bold mb-2">
              <span>{t.gameOver}</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {stats.score.toLocaleString()}
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            {t.score}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
          {/* Distance */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.distance}</span>
            </div>
            <div className="font-extrabold text-sm sm:text-base text-white tabular-nums">
              {stats.distance} {t.meters}
            </div>
          </div>

          {/* Crystals */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.crystalsCollected}</span>
            </div>
            <div className="font-extrabold text-sm sm:text-base text-cyan-300 tabular-nums">
              {stats.crystals}
            </div>
          </div>

          {/* Top Speed */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.maxSpeed}</span>
            </div>
            <div className="font-extrabold text-sm sm:text-base text-white tabular-nums">
              {stats.maxSpeedReached} {t.kmh}
            </div>
          </div>

          {/* High Score */}
          <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.highScore}</span>
            </div>
            <div className="font-extrabold text-sm sm:text-base text-amber-300 tabular-nums">
              {stats.highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            onClick={onRestart}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>{t.restart}</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onOpenGarage}
              className="flex-1 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              {t.garage}
            </button>
            <button
              onClick={onMainMenu}
              className="flex-1 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.mainMenu}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
