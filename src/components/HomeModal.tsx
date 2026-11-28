/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats, Language, RadioStationId } from '../types/game';
import { RADIO_STATIONS } from '../data/constants';
import {
  X,
  Home,
  Utensils,
  BedDouble,
  Wrench,
  Car,
  Crosshair,
  Briefcase,
  Music,
  Volume2,
  MapPin,
} from 'lucide-react';

interface HomeModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  language: Language;
  onClose: () => void;
  onHomeAction: (action: 'eat' | 'rest' | 'repair' | 'ammo') => void;
  onOpenGarage: () => void;
  onOpenJobs: () => void;
  onSelectMusic: (station: RadioStationId) => void;
  onSetSubwoofer: (level: 0 | 1 | 2) => void;
  onEnterHouse3D?: () => void;
  onExitHouse3D?: () => void;
}

export const HomeModal: React.FC<HomeModalProps> = ({
  isOpen,
  stats,
  language,
  onClose,
  onHomeAction,
  onOpenGarage,
  onOpenJobs,
  onSelectMusic,
  onSetSubwoofer,
  onEnterHouse3D,
  onExitHouse3D,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/88 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto overscroll-contain bg-slate-900 border-2 border-cyan-400/50 rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {language === 'uz'
                  ? 'MENING UYIM — SHAXSIY VILLA'
                  : 'MY HOME — PRIVATE VILLA'}
              </h2>
              <p className="text-xs text-cyan-300 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>Uyingizda hamma narsa bepul va bir joyda!</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.isInsideHouse && onExitHouse3D ? (
              <button
                onClick={() => {
                  onClose();
                  onExitHouse3D();
                }}
                className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer active:scale-95"
              >
                🚪 Ko‘chaga chiqish
              </button>
            ) : onEnterHouse3D ? (
              <button
                onClick={() => {
                  onClose();
                  onEnterHouse3D();
                }}
                className="px-3 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black cursor-pointer active:scale-95"
              >
                🚶 Uy Ichida Yurish
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-amber-400 font-bold">OSH / QUVVAT</div>
            <div className="text-sm font-black text-white">{Math.round(stats.hunger)}%</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-purple-400 font-bold">ENERGIYA</div>
            <div className="text-sm font-black text-white">{Math.round(stats.energy)}%</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-emerald-400 font-bold">MOSHINA</div>
            <div className="text-sm font-black text-white">{Math.round(stats.carCondition)}%</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-cyan-400 font-bold">BENZIN</div>
            <div className="text-sm font-black text-white">{Math.round(stats.fuel)}%</div>
          </div>
        </div>

        {/* Complete Villa Services Grid ("Shu yerda hamma narsa bo'lsin") */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => onHomeAction('eat')}
            className="p-3.5 rounded-2xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/50 text-left flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">🥣 Uyda Osh & Choy</div>
              <div className="text-[11px] text-amber-200">Ochlik va Jonni bepul 100% tiklash</div>
            </div>
          </button>

          <button
            onClick={() => onHomeAction('rest')}
            className="p-3.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/50 text-left flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">🛏️ Yotoqda Dam Olish</div>
              <div className="text-[11px] text-purple-200">Energiya, Jon va Qalqon 100%</div>
            </div>
          </button>

          <button
            onClick={() => onHomeAction('repair')}
            className="p-3.5 rounded-2xl bg-orange-950/60 hover:bg-orange-900/70 border border-orange-500/50 text-left flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-300 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">🔧 Uy Garajida Ta'mir & Benzin</div>
              <div className="text-[11px] text-orange-200">Moshina holati, Benzin va Nitro 100%</div>
            </div>
          </button>

          <button
            onClick={() => onHomeAction('ammo')}
            className="p-3.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/50 text-left flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-300 shrink-0">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">🔫 Qurol Seyfi (Bepul)</div>
              <div className="text-[11px] text-rose-200">Miltiq va 150 ta o‘q-dori olish</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenGarage();
            }}
            className="p-3.5 rounded-2xl bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/50 text-left flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">🚗 Shaxsiy Avtopark & Tuning</div>
              <div className="text-[11px] text-cyan-200">Moshinalarni almashtirish, rang & nomer</div>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenJobs();
            }}
            className="p-3.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/50 text-left flex items-center gap-3 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white">💼 Uy Noutbugi — Ishlar Birjasi</div>
              <div className="text-[11px] text-emerald-200">Uydan chiqmasdan daromadli ish olish</div>
            </div>
          </button>
        </div>

        {/* Home Audio & Car Subwoofer Tuner */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-fuchsia-500/40 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-fuchsia-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              SOMBUFER & O‘ZBEK MUSIQA MARKAZI
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((lv) => (
                <button
                  key={lv}
                  onClick={() => onSetSubwoofer(lv as 0 | 1 | 2)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                    stats.subwooferLevel === lv
                      ? 'bg-fuchsia-500 border-fuchsia-200 text-slate-950'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {lv === 0 ? 'O‘chiq' : lv === 1 ? 'Standart' : 'Mega Bass'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RADIO_STATIONS.filter((r) => r.id !== 'off').map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectMusic(st.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black border flex items-center gap-1 cursor-pointer ${
                  stats.radioStation === st.id
                    ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Music className="w-3 h-3" />
                <span>{st.artist}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
