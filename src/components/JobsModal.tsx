/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language, PlayerStats } from '../types/game';
import { PRAVA_XONA_COORDS } from '../game/openWorld';
import {
  Briefcase,
  X,
  MapPin,
  Wrench,
  Sparkles,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export interface CityJobOption {
  id: string;
  title: string;
  description: string;
  reward: number;
  distanceLabel: string;
  category: 'Marshrutka' | 'Taksi' | 'Yetkazish' | 'Ustaxona';
  vehicleHint: string;
  type: 'route' | 'instant_ustaxona';
  x?: number;
  z?: number;
}

export const CITY_JOB_OPTIONS: CityJobOption[] = [
  {
    id: 'damas_marshrutka_74',
    title: 'Damas #74 Marshrutka (Chorsu ➔ Markaz)',
    description: 'Amir Temur shoh ko‘chasi bo‘ylab yo‘lovchilarni Chorsu bozoridan markazga eltib qo‘ying.',
    reward: 110000,
    distanceLabel: 'Yaqin (~95 m)',
    category: 'Marshrutka',
    vehicleHint: 'Damas',
    type: 'route',
    x: -68,
    z: 68,
  },
  {
    id: 'matiz_tezkor_taxi',
    title: 'Matiz Tezkor Taksi (Mehmonxona VIP)',
    description: 'Chorsu yaqinidan mijozni olib, markaziy mehmonxonaga tez va xavfsiz yetkazing.',
    reward: 135000,
    distanceLabel: 'O‘rtacha (~120 m)',
    category: 'Taksi',
    vehicleHint: 'Matiz / Spark',
    type: 'route',
    x: 14,
    z: -105,
  },
  {
    id: 'choyxona_osh',
    title: 'Milliy Choyxonaga Issiq Osh Yetkazish',
    description: 'Yangi damlangan palov va issiq nonlarni Choyxona mijozlariga zudlik bilan yetkazing.',
    reward: 95000,
    distanceLabel: 'Yaqin (~80 m)',
    category: 'Yetkazish',
    vehicleHint: 'Har qanday',
    type: 'route',
    x: 14,
    z: 75,
  },
  {
    id: 'chorsu_yuk',
    title: 'Chorsu Bozor Savdo Yoki & Non Tashish',
    description: 'Bozor rastalariga ulgurji qovun-tarvuz va oziq-ovqat yuklarini yetkazib bering.',
    reward: 125000,
    distanceLabel: 'Yaqin (~95 m)',
    category: 'Yetkazish',
    vehicleHint: 'Damas Yuk',
    type: 'route',
    x: -56,
    z: -24,
  },
  {
    id: 'prava_hujjat',
    title: 'Prava Xona Avtodrom Hujjati',
    description: 'Avtodrom ma’muriyatiga shoshilinch haydovchilik guvohnomasi hujjatlarini olib boring.',
    reward: 140000,
    distanceLabel: 'O‘rtacha (~175 m)',
    category: 'Yetkazish',
    vehicleHint: 'Cobalt / Gentra',
    type: 'route',
    x: PRAVA_XONA_COORDS.x - 11,
    z: PRAVA_XONA_COORDS.z,
  },
  {
    id: 'zapravka_qism',
    title: 'A-380 Metan Zapravkaga Ehtiyot Qism',
    description: 'Magistral bo‘yidagi yoqilg‘i shoxobchasiga yangi kompressor qismlarini yetkazing.',
    reward: 160000,
    distanceLabel: 'O‘rtacha (~245 m)',
    category: 'Yetkazish',
    vehicleHint: 'Tracker / Damas',
    type: 'route',
    x: -13,
    z: 245,
  },
  {
    id: 'samarqand_order',
    title: 'Samarqand Registon VIP Transfer',
    description: 'Poytaxtdan Registon maydoniga shaharlararo qulay VIP sayohat buyurtmasi.',
    reward: 235000,
    distanceLabel: 'Uzoq (~410 m)',
    category: 'Taksi',
    vehicleHint: 'Malibu 2 / BYD',
    type: 'route',
    x: 324,
    z: -260,
  },
  {
    id: 'xiva_taxi',
    title: 'Xiva Ichan Qal‘aga Sayyohlar Reysi',
    description: 'Mehmonlarni Xiva Ichan Qal‘a darvozasigacha qulay sharoitda olib boring.',
    reward: 245000,
    distanceLabel: 'Uzoq (~410 m)',
    category: 'Taksi',
    vehicleHint: 'Monza / Gentra',
    type: 'route',
    x: -315,
    z: -260,
  },
  {
    id: 'ustaxona_shift',
    title: 'Ustaxona Avtomexanik Smenasi',
    description: 'Pod’yomnikdagi Damas va Matiz motorlarini ta’mirlab darhol naqd pul ishlang.',
    reward: 75000,
    distanceLabel: 'Darhol (-12% quvvat)',
    category: 'Ustaxona',
    vehicleHint: 'Ustaxona',
    type: 'instant_ustaxona',
  },
];

interface JobsModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  language: Language;
  onClose: () => void;
  onSelectRouteJob: (job: { title: string; x: number; z: number; reward: number }) => void;
  onDoInstantShift: () => void;
  onOpenGarage: () => void;
}

export const JobsModal: React.FC<JobsModalProps> = ({
  isOpen,
  stats,
  language,
  onClose,
  onSelectRouteJob,
  onDoInstantShift,
  onOpenGarage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-white truncate">
                {language === 'uz' ? 'Pul Ishlash — Ishlar Birjasi' : 'City Jobs & Earnings'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {language === 'uz'
                  ? 'Yangi moshina sotib olish uchun buyurtmalarni bajaring'
                  : 'Complete jobs to earn money and unlock new cars'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 cursor-pointer shrink-0"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance & Active Job Summary */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Balansingiz</div>
              <div className="text-base sm:text-lg font-black text-emerald-300 tabular-nums">
                {stats.money.toLocaleString()} so‘m
              </div>
            </div>
            <div className="w-px h-7 bg-slate-800" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Bajarilgan</div>
              <div className="text-base sm:text-lg font-black text-amber-300 tabular-nums">
                {stats.jobsCompleted} ta ish
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenGarage();
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 text-xs font-black flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Avtosalon (Moshina olish)</span>
          </button>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {stats.activeJob && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-400/70 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>HOZIRGI FAOL ISH</span>
                </div>
                <div className="text-sm font-bold text-white truncate mt-0.5">
                  {stats.activeJob.title}
                </div>
                <div className="text-xs text-slate-300 tabular-nums">
                  Qolgan masofa: {stats.activeJob.distanceLeft} m · +{stats.activeJob.reward.toLocaleString()} so‘m
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CITY_JOB_OPTIONS.map((job) => {
              const isActive = stats.activeJob?.title === job.title;
              return (
                <div
                  key={job.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                    isActive
                      ? 'bg-emerald-950/50 border-emerald-400'
                      : 'bg-slate-800/70 border-slate-700/80 hover:border-cyan-500/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-[10px] font-black text-amber-300 uppercase">
                        {job.category}
                      </span>
                      <span className="text-[10px] font-bold text-cyan-300">
                        🚗 {job.vehicleHint}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-white leading-snug">
                        {job.title}
                      </h3>
                      <span className="text-xs font-black text-emerald-300 tabular-nums whitespace-nowrap shrink-0">
                        +{job.reward.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      {job.type === 'instant_ustaxona' ? (
                        <Wrench className="w-3.5 h-3.5 text-orange-400" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {job.distanceLabel}
                    </span>

                    <button
                      onClick={() => {
                        if (job.type === 'instant_ustaxona') {
                          onDoInstantShift();
                        } else if (job.x !== undefined && job.z !== undefined) {
                          onSelectRouteJob({
                            title: job.title,
                            x: job.x,
                            z: job.z,
                            reward: job.reward,
                          });
                          onClose();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all ${
                        job.type === 'instant_ustaxona'
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          : isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                      }`}
                    >
                      {job.type === 'instant_ustaxona'
                        ? 'Ishlash (+75k)'
                        : isActive
                        ? 'Tanlangan'
                        : 'Ishni olish'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
