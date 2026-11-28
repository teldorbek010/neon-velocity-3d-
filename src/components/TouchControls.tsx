/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ControlInputState, Language, PlayerStats } from '../types/game';
import { TRANSLATIONS, RADIO_STATIONS, SIREN_MODES } from '../data/constants';
import { soundEngine } from '../audio/soundEngine';
import {
  Zap,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  Volume2,
  Siren,
  Footprints,
  CarFront,
  Utensils,
  Lightbulb,
  Crosshair,
  Radio,
  Megaphone,
  SlidersHorizontal,
  Briefcase,
} from 'lucide-react';

interface TouchControlsProps {
  input: ControlInputState;
  stats: PlayerStats;
  onInputChange: (input: ControlInputState) => void;
  onPatchInput?: (partial: Partial<ControlInputState>) => void;
  onToggleExitCar: () => void;
  onToggleMigalka: () => void;
  onCycleSirenMode: () => void;
  onTriggerMegafon: () => void;
  onCycleRadio: () => void;
  onToggleHeadlights: () => void;
  onToggleTurnSignal: (dir: 'left' | 'right') => void;
  onToggleWeapon: () => void;
  onInteractPoi: () => void;
  onOpenJobs?: () => void;
  language: Language;
  touchStyle: 'joystick' | 'buttons';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  input,
  stats,
  onInputChange,
  onPatchInput,
  onToggleExitCar,
  onToggleMigalka,
  onCycleSirenMode,
  onTriggerMegafon,
  onCycleRadio,
  onToggleHeadlights,
  onToggleTurnSignal,
  onToggleWeapon,
  onInteractPoi,
  onOpenJobs,
  language,
  touchStyle,
}) => {
  const t = TRANSLATIONS[language];
  const patchInput = useCallback(
    (partial: Partial<ControlInputState>) => {
      soundEngine.userGesture();
      if (onPatchInput) {
        onPatchInput(partial);
      } else {
        onInputChange({ ...input, ...partial });
      }
    },
    [input, onInputChange, onPatchInput]
  );

  const [useTilt, setUseTilt] = useState(false);
  const [tiltActive, setTiltActive] = useState(false);
  const [extraToolsOpen, setExtraToolsOpen] = useState(false);

  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickKnobPos, setJoystickKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  useEffect(() => {
    if (!useTilt) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        const normalized = Math.max(-1, Math.min(1, e.gamma / 25));
        patchInput({ steer: normalized });
        setTiltActive(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      setTiltActive(false);
    };
  }, [useTilt, patchInput]);

  const toggleTilt = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === 'function'
    ) {
      try {
        const response = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission!();
        if (response === 'granted') {
          setUseTilt(!useTilt);
        }
      } catch {
        // fallback
      }
    } else {
      setUseTilt(!useTilt);
    }
  };

  const handleJoystickTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!joystickRef.current) return;
      const touch = e.targetTouches[0];
      if (!touch) return;
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;
      const maxRadius = rect.width / 2;

      const distance = Math.min(maxRadius, Math.hypot(deltaX, deltaY));
      const angle = Math.atan2(deltaY, deltaX);

      const knobX = Math.cos(angle) * distance;
      const knobY = Math.sin(angle) * distance;

      setJoystickKnobPos({ x: knobX, y: knobY });
      const normalizedSteer = knobX / maxRadius;
      patchInput({ steer: normalizedSteer });
    },
    [patchInput]
  );

  const handleJoystickTouchEnd = useCallback(() => {
    setIsJoystickActive(false);
    setJoystickKnobPos({ x: 0, y: 0 });
    patchInput({ steer: 0 });
  }, [patchInput]);

  const handleJoystickTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsJoystickActive(true);
      handleJoystickTouchMove(e.nativeEvent);
    },
    [handleJoystickTouchMove]
  );

  const [activeStyle, setActiveStyle] = useState<'joystick' | 'buttons'>(touchStyle);

  useEffect(() => {
    setActiveStyle(touchStyle);
  }, [touchStyle]);

  const getPoiTouchLabel = () => {
    switch (stats.nearbyPoi) {
      case 'choyxona':
        return t.eatFood;
      case 'yotoq':
        return 'UXLASH';
      case 'rest_park':
        return t.restNow;
      case 'fuel':
        return 'ZAPRAVKA';
      case 'prava_xona':
        return 'PRAVA';
      case 'jang_maydoni':
        return 'JANG O‘Q';
      case 'ustaxona':
        return stats.carCondition < 99 ? '🔧 TA‘MIR' : '💼 ISH +75k';
      case 'ish_markazi':
        return '💼 ISH';
      default:
        return 'KIRISH';
    }
  };

  const radioStation =
    RADIO_STATIONS.find((r) => r.id === stats.radioStation) || RADIO_STATIONS[0];
  const sirenObj =
    SIREN_MODES.find((s) => s.id === stats.sirenMode) || SIREN_MODES[0];

  // ON-FOOT MODE: Clean minimal walking & enter-car controls only
  if (stats.isOnFoot) {
    return (
      <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-end px-2.5 sm:px-5 md:px-7 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none">
        {/* Minimal top-right Minish + POI + Miltiq */}
        <div className="absolute top-[60px] right-2.5 sm:right-5 pointer-events-auto flex items-center justify-end gap-1.5">
          {stats.nearbyPoi !== 'none' && (
            <button
              onClick={() => {
                soundEngine.userGesture();
                onInteractPoi();
              }}
              className="flex items-center gap-1 px-3 min-h-[40px] rounded-xl text-xs font-black bg-amber-500 border border-amber-200 text-slate-950 shadow-lg active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{getPoiTouchLabel()}</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.userGesture();
              onToggleWeapon();
            }}
            className={`flex items-center gap-1 px-2.5 min-h-[40px] rounded-xl text-xs font-black border active:scale-95 cursor-pointer ${
              stats.weaponEquipped
                ? 'bg-rose-600 border-rose-200 text-white'
                : 'bg-slate-950/90 border-rose-500/60 text-rose-300'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{stats.weaponEquipped ? 'OLISH' : 'MILTIQ'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.userGesture();
              onToggleExitCar();
            }}
            className="flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl text-xs font-black border bg-emerald-600 border-emerald-300 text-white shadow-lg active:scale-95 cursor-pointer"
          >
            <CarFront className="w-4 h-4" />
            <span>{t.enterCar}</span>
          </button>
        </div>

        {/* Clean Walking Controls */}
        <div className="w-full flex items-end justify-between gap-2">
          <div className="pointer-events-auto flex gap-1.5 sm:gap-2.5">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ steer: -1 });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ steer: 0 });
              }}
              onPointerLeave={() => {
                if (input.steer < 0) patchInput({ steer: 0 });
              }}
              onPointerCancel={() => {
                if (input.steer < 0) patchInput({ steer: 0 });
              }}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.steer < -0.1
                  ? 'border-cyan-300 bg-cyan-600/90 text-white'
                  : 'bg-slate-950/90 border-slate-700 text-cyan-400'
              }`}
              aria-label={t.steerLeft}
            >
              <ChevronLeft className="w-7 h-7 stroke-[2.8]" />
              <span className="text-[10px] font-black text-slate-100">CHAP</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ steer: 1 });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ steer: 0 });
              }}
              onPointerLeave={() => {
                if (input.steer > 0) patchInput({ steer: 0 });
              }}
              onPointerCancel={() => {
                if (input.steer > 0) patchInput({ steer: 0 });
              }}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.steer > 0.1
                  ? 'border-cyan-300 bg-cyan-600/90 text-white'
                  : 'bg-slate-950/90 border-slate-700 text-cyan-400'
              }`}
              aria-label={t.steerRight}
            >
              <ChevronRight className="w-7 h-7 stroke-[2.8]" />
              <span className="text-[10px] font-black text-slate-100">O‘NG</span>
            </button>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              {stats.weaponEquipped && (
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    patchInput({ fire: true });
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    patchInput({ fire: false });
                  }}
                  onPointerCancel={() => patchInput({ fire: false })}
                  onPointerLeave={() => {
                    if (input.fire) patchInput({ fire: false });
                  }}
                  className={`px-3 h-11 rounded-xl border-2 flex items-center justify-center gap-1 font-black text-xs active:scale-95 touch-none select-none cursor-pointer ${
                    input.fire
                      ? 'bg-red-500 border-white text-white'
                      : 'bg-red-950/95 border-red-400 text-red-200'
                  }`}
                >
                  <Crosshair className="w-4 h-4" />
                  <span>OTISH</span>
                </button>
              )}

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  patchInput({ jump: true });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  patchInput({ jump: false });
                }}
                onPointerCancel={() => patchInput({ jump: false })}
                onPointerLeave={() => {
                  if (input.jump) patchInput({ jump: false });
                }}
                className={`w-12 h-11 rounded-xl border flex flex-col items-center justify-center active:scale-95 touch-none select-none cursor-pointer ${
                  input.jump
                    ? 'bg-emerald-600 border-emerald-300 text-white'
                    : 'bg-slate-950/90 border-slate-700 text-emerald-400'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span className="text-[7px] font-black">{t.jump}</span>
              </button>
            </div>

            <div className="flex items-end gap-1.5">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  patchInput({ throttle: -1 });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  patchInput({ throttle: 0 });
                }}
                onPointerCancel={() => patchInput({ throttle: 0 })}
                onPointerLeave={() => {
                  if (input.throttle < 0) patchInput({ throttle: 0 });
                }}
                className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center active:scale-95 touch-none select-none cursor-pointer ${
                  input.throttle < -0.1
                    ? 'bg-rose-600 border-rose-200 text-white'
                    : 'bg-slate-950/90 border-rose-500/70 text-rose-400'
                }`}
              >
                <span className="text-[10px] font-black">ORQA</span>
              </button>

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  patchInput({ throttle: 1 });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  patchInput({ throttle: 0 });
                }}
                onPointerCancel={() => patchInput({ throttle: 0 })}
                onPointerLeave={() => {
                  if (input.throttle > 0) patchInput({ throttle: 0 });
                }}
                className={`w-[72px] h-[72px] rounded-2xl border-2 flex flex-col items-center justify-center active:scale-95 touch-none select-none cursor-pointer ${
                  input.throttle > 0.1
                    ? 'bg-emerald-500 border-emerald-200 text-slate-950'
                    : 'bg-slate-950/90 border-emerald-500/80 text-emerald-400'
                }`}
              >
                <span className="text-[11px] font-black">YURISH</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IN-CAR MODE: All car controls neatly organized & aligned
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-end px-2.5 sm:px-5 md:px-7 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none">
      {/* Top right organized action rail */}
      <div className="absolute top-[74px] sm:top-[82px] right-2 sm:right-5 pointer-events-auto flex flex-col items-end gap-1.5">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {stats.nearbyPoi !== 'none' && (
            <button
              onClick={() => {
                soundEngine.userGesture();
                onInteractPoi();
              }}
              className="flex items-center gap-1 px-2.5 min-h-[38px] rounded-xl text-[11px] font-black bg-amber-500 border border-amber-200 text-slate-950 shadow-lg active:scale-95 cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{getPoiTouchLabel()}</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.userGesture();
              onToggleExitCar();
            }}
            className="flex items-center gap-1 px-2.5 min-h-[38px] rounded-xl text-[11px] font-black border bg-slate-950/90 border-amber-500/60 text-amber-300 active:scale-95 cursor-pointer"
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>{t.exitCar}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.userGesture();
              onToggleHeadlights();
            }}
            className={`flex items-center gap-1 px-2.5 min-h-[38px] rounded-xl text-[11px] font-black border active:scale-95 cursor-pointer ${
              stats.headlightsOn
                ? 'bg-amber-400 border-amber-100 text-slate-950'
                : 'bg-slate-950/90 border-slate-700 text-slate-400'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.headlights}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.userGesture();
              onToggleWeapon();
            }}
            className="flex items-center gap-1 px-2.5 min-h-[38px] rounded-xl text-[11px] font-black border bg-slate-950/90 border-rose-500/60 text-rose-300 active:scale-95 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MILTIQ</span>
          </button>

          <button
            onClick={() => setExtraToolsOpen((prev) => !prev)}
            className={`md:hidden flex items-center gap-1 px-2.5 min-h-[38px] rounded-xl text-[11px] font-black border active:scale-95 cursor-pointer ${
              extraToolsOpen
                ? 'bg-cyan-500 border-cyan-200 text-slate-950'
                : 'bg-slate-950/90 border-slate-700 text-cyan-300'
            }`}
            aria-label="Qo'shimcha tugmalar"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Panel</span>
          </button>
        </div>

        {/* Organized secondary panel */}
        <div
          className={`${
            extraToolsOpen ? 'grid grid-cols-3' : 'hidden'
          } md:flex flex-wrap items-center justify-end gap-1.5 bg-slate-950/90 md:bg-transparent p-2 md:p-0 rounded-2xl border border-slate-700/80 md:border-0 shadow-xl md:shadow-none`}
        >
          {onOpenJobs && (
            <button
              onClick={() => {
                soundEngine.userGesture();
                setExtraToolsOpen(false);
                onOpenJobs();
              }}
              className="flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-black border bg-emerald-950/90 border-emerald-500/70 text-emerald-300 active:scale-95 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>ISH</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.userGesture();
              onCycleRadio();
            }}
            className={`flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-black border active:scale-95 cursor-pointer ${
              stats.radioStation !== 'off'
                ? 'bg-indigo-900 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{stats.radioStation !== 'off' ? radioStation.freq : 'RADIO'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.userGesture();
              onTriggerMegafon();
            }}
            className="flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-black border bg-slate-900 border-rose-500/70 text-rose-300 active:scale-95 cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>KRYAK</span>
          </button>

          <button
            onClick={() => {
              soundEngine.userGesture();
              onCycleSirenMode();
            }}
            className="flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-black border bg-slate-900 border-blue-500/70 text-blue-300 active:scale-95 cursor-pointer"
          >
            <span>{sirenObj.label[language].split(' ')[0]}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.userGesture();
              onToggleMigalka();
            }}
            className={`flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-black border active:scale-95 cursor-pointer ${
              stats.migalkaActive
                ? 'bg-gradient-to-r from-rose-600 to-blue-600 border-white text-white'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>{t.siren}</span>
          </button>

          <button
            onClick={() =>
              setActiveStyle((prev) => (prev === 'joystick' ? 'buttons' : 'joystick'))
            }
            className="flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-bold bg-slate-900 border border-slate-700 text-cyan-300 active:scale-95 cursor-pointer"
          >
            <span>{activeStyle === 'joystick' ? '🔘 Tugma' : '🕹️ Rul'}</span>
          </button>

          <button
            onClick={toggleTilt}
            className={`flex items-center justify-center gap-1 px-2.5 min-h-[36px] rounded-xl text-[11px] font-semibold border cursor-pointer ${
              useTilt
                ? 'bg-cyan-600/40 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${tiltActive ? 'animate-spin' : ''}`} />
            <span>{useTilt ? 'Tilt ON' : 'Tilt'}</span>
          </button>
        </div>
      </div>

      {/* BOTTOM DRIVING CLUSTER */}
      <div className="w-full flex items-end justify-between gap-2">
        {/* LEFT CONTROL ZONE: Povorotniklar + Rul */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                soundEngine.userGesture();
                onToggleTurnSignal('left');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-black flex items-center gap-0.5 cursor-pointer active:scale-95 ${
                stats.turnSignal === 'left' && stats.turnSignalBlinkOn
                  ? 'bg-amber-400 border-white text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.9)]'
                  : stats.turnSignal === 'left'
                  ? 'bg-amber-950 border-amber-400 text-amber-300'
                  : 'bg-slate-950/90 border-slate-700 text-amber-400'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>POV</span>
            </button>

            <button
              onClick={() => {
                soundEngine.userGesture();
                onToggleTurnSignal('right');
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-black flex items-center gap-0.5 cursor-pointer active:scale-95 ${
                stats.turnSignal === 'right' && stats.turnSignalBlinkOn
                  ? 'bg-amber-400 border-white text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.9)]'
                  : stats.turnSignal === 'right'
                  ? 'bg-amber-950 border-amber-400 text-amber-300'
                  : 'bg-slate-950/90 border-slate-700 text-amber-400'
              }`}
            >
              <span>POV</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeStyle === 'joystick' && !useTilt ? (
            <div
              ref={joystickRef}
              onTouchStart={handleJoystickTouchStart}
              onTouchMove={(e) => handleJoystickTouchMove(e.nativeEvent)}
              onTouchEnd={handleJoystickTouchEnd}
              onTouchCancel={handleJoystickTouchEnd}
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 transition-colors flex items-center justify-center touch-none ${
                isJoystickActive
                  ? 'border-cyan-400 bg-cyan-950/70 shadow-[0_0_24px_rgba(6,182,212,0.4)]'
                  : 'border-slate-700 bg-slate-950/85'
              }`}
            >
              <div className="absolute inset-x-2 flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-500 pointer-events-none">
                <span>◀</span>
                <span>▶</span>
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/30" />
              <div
                style={{
                  transform: `translate(${joystickKnobPos.x}px, ${joystickKnobPos.y}px)`,
                }}
                className={`absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform ${
                  isJoystickActive
                    ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                    : 'bg-slate-700 border border-slate-500'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white/50" />
              </div>
            </div>
          ) : !useTilt ? (
            <div className="flex gap-1.5 sm:gap-2.5">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  patchInput({ steer: -1 });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  patchInput({ steer: 0 });
                }}
                onPointerLeave={() => {
                  if (input.steer < 0) patchInput({ steer: 0 });
                }}
                onPointerCancel={() => {
                  if (input.steer < 0) patchInput({ steer: 0 });
                }}
                className={`w-16 h-16 sm:w-22 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all touch-none select-none cursor-pointer ${
                  input.steer < -0.1
                    ? 'border-cyan-300 bg-cyan-600/90 text-white shadow-[0_0_25px_rgba(6,182,212,0.9)] scale-95'
                    : 'bg-slate-950/90 border-slate-700 text-cyan-400 hover:border-cyan-500'
                }`}
                aria-label={t.steerLeft}
              >
                <ChevronLeft className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.8]" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-slate-100">
                  CHAP
                </span>
              </button>

              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  patchInput({ steer: 1 });
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  patchInput({ steer: 0 });
                }}
                onPointerLeave={() => {
                  if (input.steer > 0) patchInput({ steer: 0 });
                }}
                onPointerCancel={() => {
                  if (input.steer > 0) patchInput({ steer: 0 });
                }}
                className={`w-16 h-16 sm:w-22 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all touch-none select-none cursor-pointer ${
                  input.steer > 0.1
                    ? 'border-cyan-300 bg-cyan-600/90 text-white shadow-[0_0_25px_rgba(6,182,212,0.9)] scale-95'
                    : 'bg-slate-950/90 border-slate-700 text-cyan-400 hover:border-cyan-500'
                }`}
                aria-label={t.steerRight}
              >
                <ChevronRight className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.8]" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-slate-100">
                  O‘NG
                </span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-slate-950/85 border border-slate-700 text-[11px] text-cyan-300 max-w-[160px]">
              📲 Telefonni egib boshqaring
            </div>
          )}
        </div>

        {/* RIGHT CONTROL ZONE: Signal, Sakrash, Nitro, Tormoz & GAZ */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ horn: true });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ horn: false });
              }}
              onPointerCancel={() => patchInput({ horn: false })}
              onPointerLeave={() => {
                if (input.horn) patchInput({ horn: false });
              }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex flex-col items-center justify-center active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.horn
                  ? 'bg-amber-500/80 border-amber-300 text-white'
                  : 'bg-slate-950/90 border-amber-600/60 text-amber-400'
              }`}
              aria-label={t.horn}
            >
              <Volume2 className="w-4 h-4 stroke-[2.5]" />
              <span className="text-[7px] sm:text-[8px] font-black mt-0.5">{t.horn}</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ jump: true });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ jump: false });
              }}
              onPointerCancel={() => patchInput({ jump: false })}
              onPointerLeave={() => {
                if (input.jump) patchInput({ jump: false });
              }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex flex-col items-center justify-center active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.jump
                  ? 'bg-emerald-600 border-emerald-300 text-white'
                  : 'bg-slate-950/90 border-slate-700 text-emerald-400'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[7px] sm:text-[8px] font-black">{t.jump}</span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ boost: true, throttle: 1 });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ boost: false, throttle: 0 });
              }}
              onPointerCancel={() => patchInput({ boost: false, throttle: 0 })}
              onPointerLeave={() => {
                if (input.boost) patchInput({ boost: false, throttle: 0 });
              }}
              className={`w-12 h-11 sm:w-14 sm:h-12 rounded-xl border flex flex-col items-center justify-center active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.boost
                  ? 'bg-cyan-500 border-white text-white shadow-[0_0_20px_rgba(6,182,212,0.8)]'
                  : 'bg-slate-950/90 border-cyan-500/70 text-cyan-300'
              }`}
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span className="text-[7px] sm:text-[8px] font-black">{t.nitro}</span>
            </button>
          </div>

          {/* Primary Driving Pedals: TORMOZ & GAZ */}
          <div className="flex items-end gap-1.5 sm:gap-2.5">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ throttle: -1 });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ throttle: 0 });
              }}
              onPointerCancel={() => patchInput({ throttle: 0 })}
              onPointerLeave={() => {
                if (input.throttle < 0) patchInput({ throttle: 0 });
              }}
              className={`w-16 h-[68px] sm:w-22 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.throttle < -0.1
                  ? 'bg-rose-600 border-rose-200 text-white shadow-[0_0_24px_rgba(244,63,94,0.8)] scale-95'
                  : 'bg-slate-950/90 border-rose-500/70 text-rose-400'
              }`}
            >
              <span className="text-base sm:text-lg font-black">🛑</span>
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider">
                {t.brake}
              </span>
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                patchInput({ throttle: 1 });
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                patchInput({ throttle: 0 });
              }}
              onPointerCancel={() => patchInput({ throttle: 0 })}
              onPointerLeave={() => {
                if (input.throttle > 0) patchInput({ throttle: 0 });
              }}
              className={`w-[72px] h-20 sm:w-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all touch-none select-none cursor-pointer ${
                input.throttle > 0.1
                  ? 'bg-emerald-500 border-emerald-200 text-slate-950 shadow-[0_0_28px_rgba(16,185,129,0.9)] scale-95'
                  : 'bg-slate-950/90 border-emerald-500/80 text-emerald-400'
              }`}
            >
              <span className="text-lg sm:text-xl font-black">⚡</span>
              <span className="text-[11px] sm:text-xs font-black tracking-wider">
                {t.gas}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
