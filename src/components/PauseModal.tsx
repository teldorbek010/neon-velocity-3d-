/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language } from '../types/game';
import { TRANSLATIONS } from '../data/constants';
import { Play, RotateCcw, Home, Sparkles, HelpCircle, Download } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenGarage: () => void;
  onOpenControls: () => void;
  onOpenPWAInstall?: () => void;
  onMainMenu: () => void;
  language: Language;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenGarage,
  onOpenControls,
  onOpenPWAInstall,
  onMainMenu,
  language,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-center">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wide uppercase">
            {t.pause}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'uz' ? 'O‘yin to‘xtatib turildi' : 'Game Paused'}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.resume}</span>
          </button>

          {/* Restart */}
          <button
            onClick={onRestart}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.restart}</span>
          </button>

          {/* Garage */}
          <button
            onClick={onOpenGarage}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.garage}</span>
          </button>

          {/* Controls */}
          <button
            onClick={onOpenControls}
            className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.controlsHelp}</span>
          </button>

          {/* Telefonga O'rnatish / APK */}
          {onOpenPWAInstall && (
            <button
              onClick={onOpenPWAInstall}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-400 text-emerald-300 hover:text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'uz' ? '📲 Telefonga o‘rnatish (APK)' : '📲 Install on Phone (APK)'}</span>
            </button>
          )}

          {/* Main Menu */}
          <button
            onClick={onMainMenu}
            className="w-full py-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t.mainMenu}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
