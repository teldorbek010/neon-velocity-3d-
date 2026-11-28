/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorldRegionId, Language } from '../types/game';
import { WORLD_REGIONS, TRANSLATIONS } from '../data/constants';
import { Globe, X, MapPin, Sparkles, Navigation } from 'lucide-react';

interface WorldAtlasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: WorldRegionId;
  onSelectRegion: (regionId: WorldRegionId) => void;
  language: Language;
}

export const WorldAtlasModal: React.FC<WorldAtlasModalProps> = ({
  isOpen,
  onClose,
  currentRegion,
  onSelectRegion,
  language,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const regionsList = Object.values(WORLD_REGIONS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>{t.worldRegions}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'uz'
                ? 'Istalgan hududni tanlang va u yerga tezkor sayohat qiling (Teleport)'
                : 'Choose any global destination to fast travel across the world'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {regionsList.map((reg) => {
            const isCurrent = reg.id === currentRegion;
            return (
              <button
                key={reg.id}
                onClick={() => {
                  onSelectRegion(reg.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  isCurrent
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{reg.flag}</span>
                    <div>
                      <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                        {reg.country[language]}
                      </div>
                      <div className="font-extrabold text-sm sm:text-base text-white">
                        {reg.name[language]}
                      </div>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-black text-[10px]">
                      Hozirgi
                    </span>
                  ) : (
                    <Navigation className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {reg.description[language]}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1 text-[11px] text-amber-300">
                    <Sparkles className="w-3 h-3" />
                    <span>{reg.landmark[language]}</span>
                  </span>
                  <span className="text-cyan-400 text-[11px] font-bold">
                    {t.teleport} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
