/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerStats, Language, CameraMode } from '../types/game';
import {
  TRANSLATIONS,
  WORLD_REGIONS,
  SIREN_MODES,
  RADIO_STATIONS,
} from '../data/constants';
import {
  Shield,
  Zap,
  Pause,
  Gauge,
  Activity,
  Compass,
  MapPin,
  Trophy,
  Download,
  Utensils,
  BatteryCharging,
  Siren,
  Lightbulb,
  Fuel,
  Heart,
  GraduationCap,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Radio,
  Globe,
  Briefcase,
  Megaphone,
  Camera,
  Volume2,
  VolumeX,
  Star,
  Map as MapIcon,
  Smartphone,
  Speaker,
  Home,
} from 'lucide-react';
import { MiniMap } from './MiniMap';
import { QuickZoneId } from '../data/mapPois';

interface HUDProps {
  stats: PlayerStats;
  language: Language;
  cameraMode?: CameraMode;
  soundEnabled?: boolean;
  onPauseToggle: () => void;
  onCycleCamera?: () => void;
  onToggleSound?: () => void;
  onOpenWorldAtlas?: () => void;
  onOpenCityMap?: () => void;
  onOpenPWAInstall?: () => void;
  onOpenJobs?: () => void;
  onInteractPoi?: () => void;
  onToggleExitCar?: () => void;
  onToggleHeadlights?: () => void;
  onOpenPravaXona?: () => void;
  onCycleSirenMode?: () => void;
  onTriggerMegafon?: () => void;
  onCycleRadio?: () => void;
  onCycleSubwoofer?: () => void;
  onOpenPhone?: () => void;
  onToggleOnline?: () => void;
  onNavigateZone?: (zone: QuickZoneId) => void;
  onOpenHomeMenu?: () => void;
  onInteractHouseSpot?: (spot?: 'kitchen' | 'bed' | 'safe' | 'laptop' | 'exit') => void;
  isPaused: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  language,
  cameraMode = 'chase',
  soundEnabled = true,
  onPauseToggle,
  onCycleCamera,
  onToggleSound,
  onOpenWorldAtlas,
  onOpenCityMap,
  onOpenPWAInstall,
  onOpenJobs,
  onInteractPoi,
  onToggleExitCar,
  onToggleHeadlights,
  onOpenPravaXona,
  onCycleSirenMode,
  onTriggerMegafon,
  onCycleRadio,
  onCycleSubwoofer,
  onOpenPhone,
  onToggleOnline,
  onNavigateZone,
  onOpenHomeMenu,
  onInteractHouseSpot,
}) => {
  const [mobileGpsOpen, setMobileGpsOpen] = useState(false);
  const t = TRANSLATIONS[language];
  const currentReg = WORLD_REGIONS[stats.currentRegion] || WORLD_REGIONS.tashkent;
  const activeSirenObj =
    SIREN_MODES.find((s) => s.id === stats.sirenMode) || SIREN_MODES[0];
  const activeRadioObj =
    RADIO_STATIONS.find((r) => r.id === stats.radioStation) || RADIO_STATIONS[0];

  const rpmPercent = Math.min(
    100,
    Math.max(0, ((stats.rpm - 900) / 7200) * 100)
  );

  const cameraLabelMap: Record<CameraMode, string> = {
    chase: 'ORQA',
    cockpit: 'SALON',
    top_down: 'TEPA',
    cinematic: 'KINO',
  };

  const getPoiActionLabel = () => {
    switch (stats.nearbyPoi) {
      case 'choyxona':
        return '🥣 OVQATLANISH';
      case 'yotoq':
        return '🛏️ DAM OLISH';
      case 'rest_park':
        return '🌳 DAM OLISH';
      case 'fuel':
        return '⛽ ZAPRAVKA';
      case 'prava_xona':
        return '🎓 PRAVA XONA';
      case 'jang_maydoni':
        return '⚔️ MILTIQ & O‘Q';
      case 'ustaxona':
        return stats.carCondition < 99 ? '🔧 TA‘MIRLASH' : '💼 ISH +75k';
      case 'ish_markazi':
        return '💼 ISH OLISH';
      case 'my_home':
        return '🏠 UYGA KIRISH';
      default:
        return 'KIRISH';
    }
  };

  // When on foot (or inside 3D house), keep HUD crisp so the 3D world/room stays clear
  if (stats.isOnFoot) {
    return (
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] select-none">
        <div className="w-full flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
            {stats.isInsideHouse && (
              <>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/95 border border-cyan-400 text-cyan-200 text-xs font-black">
                  <Home className="w-3.5 h-3.5 text-cyan-300" />
                  <span>UY ICHIDASIZ</span>
                </div>
                {onOpenHomeMenu && (
                  <button
                    onClick={onOpenHomeMenu}
                    className="h-9 px-2.5 rounded-xl bg-slate-950/95 border border-amber-400/70 text-amber-200 text-[11px] font-black cursor-pointer active:scale-95"
                  >
                    💻 UY MENYUSI
                  </button>
                )}
                {onInteractHouseSpot && (
                  <button
                    onClick={() => onInteractHouseSpot('exit')}
                    className="h-9 px-2.5 rounded-xl bg-emerald-500 text-slate-950 text-[11px] font-black cursor-pointer active:scale-95"
                  >
                    🚪 KO‘CHAGA CHIQISH
                  </button>
                )}
              </>
            )}
            {stats.weaponEquipped && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/95 border border-red-500 text-red-200 text-xs font-black">
                <Crosshair className="w-3.5 h-3.5 text-red-400" />
                <span>O‘Q: {stats.ammo} • JANG: {stats.arenaKills}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {onOpenPhone && (
              <button
                onClick={onOpenPhone}
                className="h-10 px-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/70 flex items-center justify-center gap-1 text-cyan-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                aria-label="Telefon"
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[10px] font-black">TEL</span>
              </button>
            )}
            <button
              onClick={onPauseToggle}
              className="pointer-events-auto w-10 h-10 rounded-xl bg-slate-950/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 active:scale-95 transition-all cursor-pointer"
              aria-label={t.pause}
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-1.5 mb-[116px] sm:mb-4 pointer-events-none">
          {stats.lastStuntName && (
            <div className="px-3 py-1 bg-slate-950/90 border border-cyan-500/60 rounded-full text-[10px] font-black text-cyan-200 tracking-wide uppercase text-center">
              {stats.lastStuntName}
            </div>
          )}

          {stats.isInsideHouse && stats.housePoiAction && stats.housePoiAction !== 'none' && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-cyan-400 border-2 border-white text-slate-950 px-3 py-1.5 rounded-2xl shadow-xl">
              <div className="text-xs font-black">{stats.nearbyPoiLabel}</div>
              {onInteractHouseSpot && (
                <button
                  onClick={() => onInteractHouseSpot()}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 text-cyan-300 text-[11px] font-black cursor-pointer active:scale-95"
                >
                  BAJARISH (G)
                </button>
              )}
            </div>
          )}

          {!stats.isInsideHouse && stats.nearbyPoi !== 'none' && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 bg-amber-500 border-2 border-amber-200 text-slate-950 px-3 py-1.5 rounded-2xl shadow-xl">
              <div className="text-xs font-black">{stats.nearbyPoiLabel}</div>
              {onInteractPoi && (
                <button
                  onClick={onInteractPoi}
                  className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 text-[11px] font-black cursor-pointer active:scale-95"
                >
                  {getPoiActionLabel()}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2 sm:p-4 pt-[max(0.5rem,env(safe-area-inset-top))] select-none">
      {/* TOP BAR (In Car: neatly aligned & structured rows) */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="w-full flex items-start justify-between gap-2">
          {/* Left: Structured 3-row Info & Controls Block */}
          <div className="flex flex-col gap-1.5 pointer-events-auto min-w-0">
            {/* Row 1: Score + Balance + Jobs Quick Trigger */}
            <div className="flex items-center gap-2 sm:gap-2.5 bg-slate-950/95 border border-slate-800 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-lg w-fit max-w-full">
              <div>
                <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                  {t.score}
                </div>
                <div className="text-sm sm:text-lg font-black text-white tabular-nums leading-tight mt-0.5">
                  {stats.score.toLocaleString()}
                </div>
              </div>

              <div className="w-px h-6 bg-slate-800" />

              <div>
                <div className="text-[8px] sm:text-[9px] text-emerald-400 font-bold uppercase tracking-wider leading-none">
                  BALANS
                </div>
                <div className="text-[11px] sm:text-sm font-black text-emerald-300 tabular-nums leading-tight whitespace-nowrap mt-0.5">
                  {stats.money.toLocaleString()} <span className="text-[9px]">so‘m</span>
                </div>
              </div>

              {onOpenJobs && (
                <>
                  <div className="w-px h-6 bg-slate-800 hidden sm:block" />
                  <button
                    onClick={onOpenJobs}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 text-[10px] font-black cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <Briefcase className="w-3 h-3" />
                    <span>ISHLAR</span>
                  </button>
                </>
              )}
            </div>

            {/* Row 2: Uniform Vitals Grid */}
            <div className="flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1 bg-slate-950/90 border border-amber-800/70 rounded-lg px-2 py-1">
                <Utensils className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-300 tabular-nums">
                  {Math.round(stats.hunger)}%
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950/90 border border-purple-800/70 rounded-lg px-2 py-1">
                <BatteryCharging className="w-3 h-3 text-purple-300" />
                <span className="text-[10px] font-bold text-purple-200 tabular-nums">
                  {Math.round(stats.energy)}%
                </span>
              </div>

              <div
                className={`flex items-center gap-1 bg-slate-950/90 border rounded-lg px-2 py-1 ${
                  stats.fuel < 20 ? 'border-rose-500 animate-pulse' : 'border-cyan-800/70'
                }`}
              >
                <Fuel className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-300 tabular-nums">
                  {Math.round(stats.fuel)}%
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950/90 border border-rose-800/70 rounded-lg px-2 py-1">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span className="text-[10px] font-bold text-rose-300 tabular-nums">
                  {Math.round(stats.hp)}%
                </span>
              </div>

              <button
                onClick={() => onNavigateZone?.('ustaxona')}
                title="Moshina holati (Ustaxonaga borish)"
                className={`flex items-center gap-1 bg-slate-950/90 border rounded-lg px-2 py-1 cursor-pointer active:scale-95 ${
                  stats.carCondition <= 0
                    ? 'border-rose-500 text-rose-300 animate-pulse'
                    : stats.carCondition < 55
                    ? 'border-amber-500 text-amber-300'
                    : 'border-emerald-800/70 text-emerald-300'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span className="text-[10px] font-bold tabular-nums">
                  {Math.round(stats.carCondition)}%
                </span>
              </button>

              <div className="flex items-center gap-1 bg-slate-950/90 border border-amber-500/60 rounded-lg px-2 py-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-amber-200 tabular-nums">
                  {stats.respect}
                </span>
              </div>

              {stats.wantedLevel > 0 && (
                <div className="flex items-center gap-0.5 bg-rose-950/95 border border-rose-500 rounded-lg px-2 py-1 animate-pulse">
                  {Array.from({ length: stats.wantedLevel }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-300 fill-amber-300" />
                  ))}
                </div>
              )}

              {onToggleOnline && (
                <button
                  onClick={onToggleOnline}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer active:scale-95 ${
                    stats.onlineConnected
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                      : stats.onlineEnabled
                      ? 'bg-amber-950/90 border-amber-500/70 text-amber-300'
                      : 'bg-slate-950/90 border-slate-700 text-slate-400'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>
                    {stats.onlineConnected
                      ? `${stats.onlinePlayersCount} ON`
                      : stats.onlineEnabled
                      ? 'ONLAYN'
                      : 'OFLAYN'}
                  </span>
                </button>
              )}
            </div>

            {/* Row 3 (Desktop/Tablet): Uniform Car Toolbar */}
            <div className="hidden md:flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-slate-950/90 border-slate-700 text-slate-300">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold">
                  {stats.totalRacers > 1
                    ? `${stats.racePosition}/${stats.totalRacers}`
                    : `Ishlar: ${stats.jobsCompleted}`}
                </span>
              </div>

              {onOpenPravaXona && (
                <button
                  onClick={onOpenPravaXona}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer active:scale-95 ${
                    stats.hasPrava
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                      : 'bg-rose-950/90 border-rose-500/80 text-rose-300'
                  }`}
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>{stats.hasPrava ? 'PRAVA ✅' : 'PRAVASIZ ❌'}</span>
                </button>
              )}

              {onCycleRadio && (
                <button
                  onClick={onCycleRadio}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer active:scale-95 ${
                    stats.radioStation !== 'off'
                      ? 'bg-indigo-950/95 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950/90 border-slate-700 text-slate-400'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>
                    {stats.radioStation !== 'off'
                      ? `${activeRadioObj.artist}`
                      : 'MUSIQA'}
                  </span>
                </button>
              )}

              {onCycleSubwoofer && (
                <button
                  onClick={onCycleSubwoofer}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer active:scale-95 ${
                    stats.subwooferLevel === 2
                      ? 'bg-fuchsia-600/95 border-fuchsia-200 text-white'
                      : stats.subwooferLevel === 1
                      ? 'bg-fuchsia-950/95 border-fuchsia-500 text-fuchsia-300'
                      : 'bg-slate-950/90 border-slate-700 text-slate-400'
                  }`}
                  title="Moshina Sombuferi (Bass)"
                >
                  <Speaker className="w-3 h-3" />
                  <span>
                    {stats.subwooferLevel === 2
                      ? 'BASS MAX'
                      : stats.subwooferLevel === 1
                      ? 'SOMBUFER'
                      : 'BASS OFF'}
                  </span>
                </button>
              )}

              {onCycleSirenMode && (
                <button
                  onClick={onCycleSirenMode}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer active:scale-95 ${
                    stats.migalkaActive
                      ? 'bg-blue-600/90 border-rose-400 text-white'
                      : 'bg-slate-950/90 border-blue-800/80 text-blue-300'
                  }`}
                >
                  <Siren className="w-3 h-3" />
                  <span>{activeSirenObj.label[language]}</span>
                </button>
              )}

              {onTriggerMegafon && (
                <button
                  onClick={onTriggerMegafon}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-slate-950/90 border-rose-700/80 text-rose-300 text-[10px] font-black cursor-pointer active:scale-95"
                  title="Kryakalka / Megafon (B)"
                >
                  <Megaphone className="w-3 h-3" />
                  <span>KRYAK</span>
                </button>
              )}

              {onToggleHeadlights && (
                <button
                  onClick={onToggleHeadlights}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black cursor-pointer active:scale-95 ${
                    stats.headlightsOn
                      ? 'bg-amber-400/95 border-amber-200 text-slate-950'
                      : 'bg-slate-950/90 border-slate-700 text-slate-400'
                  }`}
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>{stats.headlightsOn ? 'FARA: ON' : 'FARA: OFF'}</span>
                </button>
              )}
            </div>

            {/* Row 4: Live GTA Mini-Map GPS Radar */}
            <div className="pt-0.5 flex items-start gap-2">
              <MiniMap
                stats={stats}
                onOpenFullMap={() => onOpenCityMap?.()}
              />
            </div>
          </div>

          {/* Center (Desktop / Tablet): City Switcher & Organized Zone Bar */}
          <div className="hidden md:flex pointer-events-auto flex-col items-center max-w-lg">
            <button
              onClick={onOpenWorldAtlas}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/95 border border-cyan-500/60 hover:border-cyan-300 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-lg">{currentReg.flag}</span>
              <div className="flex flex-col text-left">
                <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{currentReg.city[language]} • SHAHARLAR ▼</span>
                </div>
                <div className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                  {stats.regionName}
                </div>
              </div>
            </button>

            {onNavigateZone && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                <button
                  onClick={() => onNavigateZone('my_home')}
                  className="px-2 py-0.5 rounded-lg bg-cyan-950/95 border border-cyan-400/70 text-[10px] font-black text-cyan-200 hover:border-cyan-200 cursor-pointer flex items-center gap-1"
                >
                  <Home className="w-2.5 h-2.5" />
                  <span>Uyim</span>
                </button>
                <button
                  onClick={() => onNavigateZone('ustaxona')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-orange-500/60 text-[10px] font-bold text-orange-300 hover:border-orange-300 cursor-pointer"
                >
                  🔧 Ustaxona
                </button>
                <button
                  onClick={() => onNavigateZone('ish_markazi')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-lime-500/60 text-[10px] font-bold text-lime-300 hover:border-lime-300 cursor-pointer"
                >
                  💼 Ish Joyi
                </button>
                <button
                  onClick={() => onNavigateZone('prava_xona')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-amber-500/50 text-[10px] font-bold text-amber-300 hover:border-amber-300 cursor-pointer"
                >
                  🎓 Prava Xona
                </button>
                <button
                  onClick={() => onNavigateZone('jang_maydoni')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-rose-500/50 text-[10px] font-bold text-rose-300 hover:border-rose-300 cursor-pointer"
                >
                  ⚔️ Jang
                </button>
                <button
                  onClick={() => onNavigateZone('yotoq')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-purple-500/50 text-[10px] font-bold text-purple-300 hover:border-purple-300 cursor-pointer"
                >
                  🛏️ Yotoq
                </button>
                <button
                  onClick={() => onNavigateZone('choyxona')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 hover:border-emerald-300 cursor-pointer"
                >
                  🥣 Choyxona
                </button>
                <button
                  onClick={() => onNavigateZone('fuel')}
                  className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-cyan-500/50 text-[10px] font-bold text-cyan-300 hover:border-cyan-300 cursor-pointer"
                >
                  ⛽ Zapravka
                </button>
              </div>
            )}
          </div>

          {/* Right: Uniform Height Controls Row */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
            <div className="hidden lg:flex bg-slate-950/90 border border-slate-800 rounded-2xl px-3 h-10 flex-col justify-center items-end gap-0.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium leading-none">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                <span>{t.shields}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: stats.maxShields }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-1.5 rounded-sm ${
                      i < stats.shields ? 'bg-emerald-400' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl sm:rounded-2xl px-2 sm:px-2.5 h-10 flex flex-col justify-center items-end gap-1 min-w-[50px] sm:min-w-[82px]">
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-slate-400 font-bold leading-none">
                <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
                <span>{t.nitro}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-sm overflow-hidden">
                <div
                  style={{ width: `${stats.nitro}%` }}
                  className={`h-full transition-all duration-75 ${
                    stats.isNitroActive
                      ? 'bg-gradient-to-r from-cyan-400 to-white'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                  }`}
                />
              </div>
            </div>

            {onOpenPhone && (
              <button
                onClick={onOpenPhone}
                className="h-10 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl bg-cyan-950/95 border border-cyan-400/75 flex items-center justify-center gap-1 text-cyan-200 hover:text-white active:scale-95 cursor-pointer"
                title="GTA Telefon (T)"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] font-black">TEL</span>
              </button>
            )}

            {onOpenJobs && (
              <button
                onClick={onOpenJobs}
                className="sm:hidden h-10 px-2 rounded-xl bg-emerald-950/95 border border-emerald-400/70 flex items-center justify-center gap-1 text-emerald-200 active:scale-95 cursor-pointer"
                title="Pul ishlash — Ishlar"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black">ISH</span>
              </button>
            )}

            {onCycleCamera && (
              <button
                onClick={onCycleCamera}
                className="h-10 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl bg-slate-950/90 border border-slate-700 hover:border-cyan-400 flex items-center justify-center gap-1 text-cyan-300 active:scale-95 transition-all cursor-pointer"
                title="Kamera (C)"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] font-black">
                  {cameraLabelMap[cameraMode]}
                </span>
              </button>
            )}

            {onToggleSound && (
              <button
                onClick={onToggleSound}
                className="w-10 h-10 rounded-xl sm:rounded-2xl bg-slate-950/90 border border-slate-700 hover:border-cyan-400 hidden sm:flex items-center justify-center text-slate-300 active:scale-95 transition-all cursor-pointer"
                title={t.sound}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                )}
              </button>
            )}

            {onNavigateZone && (
              <button
                onClick={() => setMobileGpsOpen((prev) => !prev)}
                className={`md:hidden h-10 px-2 rounded-xl border flex items-center justify-center gap-1 text-[10px] font-black active:scale-95 transition-all cursor-pointer ${
                  mobileGpsOpen
                    ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                    : 'bg-slate-950/90 border-slate-700 text-emerald-300'
                }`}
                title="Joylar GPS"
              >
                <span>📍</span>
              </button>
            )}

            {onOpenWorldAtlas && (
              <button
                onClick={onOpenWorldAtlas}
                className="md:hidden h-10 px-2 rounded-xl bg-slate-950/90 border border-cyan-500/60 flex items-center justify-center gap-1 text-cyan-300 active:scale-95 transition-all cursor-pointer"
                title="Shaharlar"
              >
                <span className="text-sm">{currentReg.flag}</span>
              </button>
            )}

            {onOpenPWAInstall && (
              <button
                onClick={onOpenPWAInstall}
                className="hidden sm:flex h-10 px-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-300 hover:text-white active:scale-95 transition-all items-center gap-1 text-xs font-black cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                <span className="text-[11px] font-black">APK</span>
              </button>
            )}

            <button
              onClick={onPauseToggle}
              className="w-10 h-10 rounded-xl sm:rounded-2xl bg-slate-950/90 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400 active:scale-95 transition-all cursor-pointer"
              aria-label={t.pause}
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile GPS Zone Drawer */}
        {mobileGpsOpen && onNavigateZone && (
          <div className="md:hidden pointer-events-auto grid grid-cols-4 gap-1.5 bg-slate-950/95 border border-cyan-500/50 rounded-2xl p-2 shadow-xl">
            <button
              onClick={() => {
                onNavigateZone('my_home');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-cyan-950 border border-cyan-400 text-[10px] font-black text-cyan-200"
            >
              🏠 Uyim
            </button>
            <button
              onClick={() => {
                onNavigateZone('ustaxona');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-orange-500/60 text-[10px] font-bold text-orange-300"
            >
              🔧 Ustaxona
            </button>
            <button
              onClick={() => {
                onNavigateZone('ish_markazi');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-lime-500/60 text-[10px] font-bold text-lime-300"
            >
              💼 Ish Joyi
            </button>
            <button
              onClick={() => {
                onNavigateZone('prava_xona');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-amber-500/60 text-[10px] font-bold text-amber-300"
            >
              🎓 Prava
            </button>
            <button
              onClick={() => {
                onNavigateZone('jang_maydoni');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-rose-500/60 text-[10px] font-bold text-rose-300"
            >
              ⚔️ Jang
            </button>
            <button
              onClick={() => {
                onNavigateZone('yotoq');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-purple-500/60 text-[10px] font-bold text-purple-300"
            >
              🛏️ Yotoq
            </button>
            <button
              onClick={() => {
                onNavigateZone('choyxona');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/60 text-[10px] font-bold text-emerald-300"
            >
              🥣 Choyxona
            </button>
            <button
              onClick={() => {
                onNavigateZone('fuel');
                setMobileGpsOpen(false);
              }}
              className="px-2 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/60 text-[10px] font-bold text-cyan-300"
            >
              ⛽ Zapravka
            </button>
            {onOpenPravaXona && (
              <button
                onClick={() => {
                  onOpenPravaXona();
                  setMobileGpsOpen(false);
                }}
                className="px-2 py-1.5 rounded-xl bg-amber-950 border border-amber-400 text-[10px] font-black text-amber-200"
              >
                🪪 {stats.hasPrava ? 'Prava ✅' : 'Imtihon'}
              </button>
            )}
          </div>
        )}

        {/* Center Alerts, Turn Signal, Job/Exam Trackers & POI Prompt */}
        <div className="w-full flex flex-col items-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center max-w-[330px] sm:max-w-lg gap-1">
            {stats.turnSignal !== 'none' && (
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-xl border text-[10px] font-black ${
                  stats.turnSignalBlinkOn
                    ? 'bg-amber-400 border-amber-100 text-slate-950'
                    : 'bg-slate-950/90 border-amber-600 text-amber-400'
                }`}
              >
                {stats.turnSignal === 'left' ? (
                  <>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>CHAP POV</span>
                  </>
                ) : (
                  <>
                    <span>O‘NG POV</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </div>
            )}

            {stats.carCondition <= 0 && (
              <button
                onClick={() => onNavigateZone?.('ustaxona')}
                className="px-3 py-1 rounded-xl bg-orange-600 border-2 border-amber-200 text-white text-[11px] sm:text-xs font-black tracking-wide animate-pulse shadow-lg cursor-pointer text-center"
              >
                🔧 MOSHINA BUZILDI! USTAXONAGA BORING
              </button>
            )}

            {stats.redLightWarning && (
              <div className="px-3 py-1 rounded-xl bg-rose-600 border-2 border-white text-white text-[11px] sm:text-xs font-black tracking-wide animate-pulse shadow-lg">
                🔴 QIZIL SVETAFOR! TO‘XTANG!
              </div>
            )}

            {stats.pedestrianWarning && (
              <div className="px-3 py-1 rounded-xl bg-amber-400 border-2 border-slate-950 text-slate-950 text-[11px] sm:text-xs font-black tracking-wide animate-bounce shadow-lg">
                🚶 PIYODA YO‘LDAN O‘TMOQDA! TO‘XTANG!
              </div>
            )}

            {stats.activeJob && (
              <div className="w-full bg-emerald-950/95 border-2 border-emerald-400 rounded-2xl px-3 py-1.5 shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-black text-emerald-300 gap-2">
                  <span className="flex items-center gap-1 truncate">
                    <Briefcase className="w-3 h-3 shrink-0" />
                    <span className="truncate">{stats.activeJob.title}</span>
                  </span>
                  <span className="text-amber-300 shrink-0">
                    +{stats.activeJob.reward.toLocaleString()} so‘m
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white mt-0.5 flex items-center justify-between gap-2">
                  <span>Yashil mayoqqa boring</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-emerald-300 font-black tabular-nums">
                      {stats.activeJob.distanceLeft} m
                    </span>
                    {onOpenCityMap && (
                      <button
                        onClick={onOpenCityMap}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black cursor-pointer active:scale-95"
                      >
                        <MapIcon className="w-3 h-3" />
                        <span>XARITA</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {stats.examActive && (
              <div className="w-full bg-slate-950/95 border-2 border-cyan-400 rounded-2xl px-3 py-1.5 shadow-xl">
                <div className="flex items-center justify-between text-[10px] font-black text-cyan-300 mb-0.5">
                  <span>🎓 3D YEZDA IMTIHONI</span>
                  <span className="text-amber-300">
                    Xato: {stats.examMistakes}/3 • {stats.examProgress}%
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white">{stats.examStepLabel}</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    style={{ width: `${stats.examProgress}%` }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                  />
                </div>
              </div>
            )}

            {stats.lastStuntName && (
              <div className="px-3 py-0.5 bg-gradient-to-r from-indigo-700/95 to-cyan-700/95 border border-cyan-400/80 rounded-full text-[10px] font-black text-white tracking-wide uppercase text-center">
                {stats.lastStuntName}
              </div>
            )}

            {stats.nearbyPoi !== 'none' && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 bg-amber-500 border-2 border-amber-200 text-slate-950 px-2.5 py-1 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.7)]">
                <div className="text-[11px] sm:text-xs font-black">{stats.nearbyPoiLabel}</div>
                {onInteractPoi && (
                  <button
                    onClick={onInteractPoi}
                    className="px-2.5 py-1 rounded-xl bg-slate-950 text-amber-300 text-[10px] sm:text-[11px] font-black cursor-pointer active:scale-95"
                  >
                    {getPoiActionLabel()}
                  </button>
                )}
                {onToggleExitCar && (
                  <button
                    onClick={onToggleExitCar}
                    className="px-2 py-1 rounded-xl bg-emerald-700 text-white text-[10px] font-black cursor-pointer"
                  >
                    TUSHISH
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM-CENTER: Speedometer, Gear, RPM, GPS — neatly lifted above thumb pedals on < sm */}
      <div className="self-center flex flex-col items-center pointer-events-auto mb-[138px] sm:mb-2">
        <div className="bg-slate-950/95 border border-slate-800 rounded-2xl sm:rounded-3xl px-3 py-1.5 sm:px-5 sm:py-2.5 shadow-2xl flex items-center justify-center gap-2.5 sm:gap-5">
          {/* Gear */}
          <div className="flex flex-col items-center bg-slate-900 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl border border-slate-800">
            <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              {t.gear}
            </span>
            <span className="text-sm sm:text-xl font-black text-cyan-400 tabular-nums leading-tight">
              {stats.gear < 0 ? 'R' : `D${stats.gear}`}
            </span>
          </div>

          {/* Speedometer */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-3xl font-black text-white tabular-nums tracking-tight leading-none">
                {stats.speed}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
                {t.kmh}
              </span>
            </div>
          </div>

          {/* Tachometer RPM */}
          <div className="hidden md:flex flex-col items-start min-w-[95px]">
            <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-rose-400" /> {stats.rpm}
              </span>
              <span>{t.rpm}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
              <div
                style={{ width: `${rpmPercent}%` }}
                className={`h-full transition-all duration-75 ${
                  rpmPercent > 80
                    ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                }`}
              />
            </div>
          </div>

          <div className="w-px h-6 bg-slate-800 hidden sm:block" />

          {/* GPS Coordinates */}
          <div className="hidden sm:flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-slate-400 uppercase font-bold">
                GPS: {stats.worldX}m, {stats.worldZ}m
              </span>
              <span className="text-xs font-bold text-slate-200 tabular-nums">
                {stats.distance} {t.meters}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
