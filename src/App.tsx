/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  ShipModel,
  ShipColor,
  PlayerStats,
  ControlInputState,
  GameSettings,
  WorldRegionId,
  CarCustomization,
  YouTubeTrack,
} from './types/game';
import { GameEngine } from './game/GameEngine';
import { soundEngine } from './audio/soundEngine';
import {
  TRANSLATIONS,
  WORLD_REGIONS,
  DEFAULT_CUSTOMIZATION,
  VEHICLES,
} from './data/constants';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { SettingsDock } from './components/SettingsDock';
import { GarageModal } from './components/GarageModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { ControlsHelpModal } from './components/ControlsHelpModal';
import { WorldAtlasModal } from './components/WorldAtlasModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PravaXonaModal } from './components/PravaXonaModal';
import { JobsModal } from './components/JobsModal';
import { CityMapModal } from './components/CityMapModal';
import { PhoneModal } from './components/PhoneModal';
import { HomeModal } from './components/HomeModal';
import splashMobileImg from './assets/images/uz_splash_damas_matiz_mob_1795867035405.jpg';
import splashDesktopImg from './assets/images/uz_splash_damas_matiz_desk_1795867035212.jpg';
import {
  Play,
  Sparkles,
  HelpCircle,
  Trophy,
  Globe,
  Monitor,
  Smartphone,
  Navigation,
  Download,
  GraduationCap,
  ChevronRight,
  Briefcase,
  Map as MapIcon,
} from 'lucide-react';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App UI State
  const [gameStatus, setGameStatus] = useState<'splash' | 'menu' | 'playing' | 'paused' | 'game_over'>('splash');
  const [splashImgError, setSplashImgError] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('open_world');
  const [selectedRegion, setSelectedRegion] = useState<WorldRegionId>('tashkent');
  const [ownedVehicles, setOwnedVehicles] = useState<ShipModel[]>(() => {
    try {
      const raw = localStorage.getItem('uz_race_owned_vehicles_v2');
      if (raw) {
        const parsed = JSON.parse(raw) as ShipModel[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from(new Set<ShipModel>(['damas', ...parsed]));
        }
      }
    } catch {
      // ignore
    }
    return ['damas'];
  });
  const [selectedModel, setSelectedModel] = useState<ShipModel>(() => {
    try {
      const savedModel = localStorage.getItem('uz_race_selected_model_v2') as ShipModel | null;
      if (savedModel && VEHICLES[savedModel]) return savedModel;
    } catch {
      // ignore
    }
    return 'damas';
  });
  const [selectedColor, setSelectedColor] = useState<ShipColor>('white');
  const [customization, setCustomization] = useState<CarCustomization>(() => {
    try {
      const raw = localStorage.getItem('uz_race_customization');
      if (raw) return { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { ...DEFAULT_CUSTOMIZATION };
  });

  // Modals
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isWorldAtlasOpen, setIsWorldAtlasOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [isPravaXonaOpen, setIsPravaXonaOpen] = useState(false);
  const [isJobsOpen, setIsJobsOpen] = useState(false);
  const [isCityMapOpen, setIsCityMapOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [activeYoutubeTrack, setActiveYoutubeTrack] = useState<YouTubeTrack | null>(null);
  const [theoryPassed, setTheoryPassed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('uz_race_theory') === '1';
    } catch {
      return false;
    }
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    language: 'uz',
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.75,
    touchControls: 'always',
    touchStyle: 'buttons',
    cameraMode: 'chase',
    graphicsQuality: 'high',
  });

  // Controls input state (neutral at idle so car only drives when Gaz is pressed)
  const [controlInput, setControlInput] = useState<ControlInputState>({
    steer: 0,
    throttle: 0,
    boost: false,
    jump: false,
    drift: false,
    fire: false,
  });

  // Realtime Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    highScore: 0,
    distance: 0,
    speed: 0,
    maxSpeedReached: 0,
    gear: 1,
    rpm: 900,
    crystals: 0,
    multiplier: 1,
    comboCount: 0,
    shields: 4,
    maxShields: 4,
    nitro: 100,
    isNitroActive: false,
    lapTime: 0,
    bestLapTime: 0,
    stuntScore: 0,
    lastStuntName: '',
    currentRegion: 'tashkent',
    regionName: 'Katta Ochiq Dunyo • O‘zbekiston',
    regionProgress: 0,
    worldX: 0,
    worldZ: 0,
    racePosition: 1,
    totalRacers: 6,
    isOnFoot: false,
    energy: 100,
    hunger: 100,
    fuel: 100,
    hp: 100,
    money: 250000,
    sirenActive: false,
    migalkaActive: false,
    nearbyPoi: 'none',
    nearbyPoiLabel: '',
    nearCar: true,
    gaiAlert: 0,
    gaiFines: 0,
    headlightsOn: true,
    turnSignal: 'none',
    turnSignalBlinkOn: false,
    hasPrava: false,
    hasDocuments: false,
    weaponEquipped: false,
    ammo: 120,
    inBattleArena: false,
    arenaKills: 0,
    pedestrianWarning: false,
    redLightWarning: false,
    examActive: false,
    examStepLabel: '',
    examProgress: 0,
    examMistakes: 0,
    carCondition: 100,
    sirenMode: 'wail',
    radioStation: 'off',
    playerHeading: 0,
    customWaypoint: null,
    respect: 0,
    cashPickupsCollected: 0,
    activeJob: null,
    jobsCompleted: 0,
    onlineConnected: false,
    onlinePlayersCount: 0,
    onlineEnabled: true,
    subwooferLevel: 1,
    onlineRoomCode: 'UZB-01',
    onlineDriverName: 'Haydovchi',
    onlinePeers: [],
    wantedLevel: 0,
  });

  // Touch screen detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouchDevice(isTouch);
  }, []);

  // Initialize GameEngine & restore persistent career progress
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current);
    engineRef.current = engine;
    const validModel = ownedVehicles.includes(selectedModel) ? selectedModel : 'damas';
    if (validModel !== selectedModel) setSelectedModel(validModel);
    engine.setShipModel(validModel);
    engine.setCustomization(customization);

    try {
      const saved = localStorage.getItem('neon_velocity_highscore');
      const savedMoney = localStorage.getItem('uz_race_money');
      const savedPrava = localStorage.getItem('uz_race_prava') === '1';
      const savedDocs = localStorage.getItem('uz_race_docs') === '1';

      const highScore = saved ? parseInt(saved, 10) || 0 : 0;
      const money = savedMoney ? parseInt(savedMoney, 10) || 250000 : 250000;
      engine.stats.highScore = highScore;
      engine.setCareerProgress({ money, hasPrava: savedPrava, hasDocuments: savedDocs });

      setStats((prev) => ({
        ...prev,
        highScore,
        money,
        hasPrava: savedPrava,
        hasDocuments: savedDocs,
      }));
    } catch {
      // Storage unavailable
    }

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    engine.onCareerUpdate = ({ money, hasPrava, hasDocuments }) => {
      try {
        localStorage.setItem('uz_race_money', String(money));
        localStorage.setItem('uz_race_prava', hasPrava ? '1' : '0');
        localStorage.setItem('uz_race_docs', hasDocuments ? '1' : '0');
      } catch {
        // ignore
      }
    };

    engine.onOpenPravaXona = () => {
      setIsPravaXonaOpen(true);
    };

    engine.onOpenJobs = () => {
      setIsJobsOpen(true);
    };

    engine.onOpenHome = () => {
      soundEngine.stopEngine();
      setIsHomeOpen(true);
    };

    engine.onGameOver = (finalStats) => {
      setGameStatus('game_over');
      try {
        localStorage.setItem('neon_velocity_highscore', finalStats.highScore.toString());
      } catch {
        // Storage unavailable
      }
    };

    engine.startAnimationLoop();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Settings in Engine
  const handleUpdateSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };

      if (updates.cameraMode && engineRef.current) {
        engineRef.current.setCameraMode(updates.cameraMode);
      }
      if (updates.soundEnabled !== undefined) {
        soundEngine.setMuted(!updates.soundEnabled);
      }
      if (updates.musicEnabled !== undefined) {
        soundEngine.setMusicMuted(!updates.musicEnabled);
      }
      if (updates.volume !== undefined) {
        soundEngine.setVolume(updates.volume);
      }

      return next;
    });
  }, []);

  const handleSelectModel = (model: ShipModel) => {
    if (!ownedVehicles.includes(model)) return;
    setSelectedModel(model);
    engineRef.current?.setShipModel(model);
    try {
      localStorage.setItem('uz_race_selected_model_v2', model);
    } catch {
      // ignore
    }
  };

  const handlePurchaseVehicle = (model: ShipModel) => {
    const vehicle = VEHICLES[model];
    if (!vehicle || ownedVehicles.includes(model)) return;
    const currentMoney = engineRef.current?.stats.money ?? stats.money;
    if (currentMoney < vehicle.price) return;

    const nextMoney = currentMoney - vehicle.price;
    const nextOwned = [...ownedVehicles, model];

    setOwnedVehicles(nextOwned);
    setSelectedModel(model);
    engineRef.current?.setCareerProgress({ money: nextMoney });
    engineRef.current?.setShipModel(model);
    if (engineRef.current) {
      engineRef.current.stats.lastStuntName = `🚗 YANGI MOSHINA OLINDI: ${vehicle.name[settings.language].toUpperCase()}!`;
    }
    setStats((prev) => ({ ...prev, money: nextMoney }));
    soundEngine.userGesture();
    soundEngine.playSuccessBell();

    try {
      localStorage.setItem('uz_race_money', String(nextMoney));
      localStorage.setItem('uz_race_owned_vehicles_v2', JSON.stringify(nextOwned));
      localStorage.setItem('uz_race_selected_model_v2', model);
    } catch {
      // ignore
    }
  };

  const handleSelectColor = (color: ShipColor) => {
    setSelectedColor(color);
    engineRef.current?.setShipColor(color);
  };

  const handleUpdateCustomization = (next: CarCustomization) => {
    setCustomization(next);
    engineRef.current?.setCustomization(next);
    try {
      localStorage.setItem('uz_race_customization', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleSelectRegion = (regionId: WorldRegionId) => {
    setSelectedRegion(regionId);
    setStats((prev) => ({
      ...prev,
      currentRegion: regionId,
      regionName: WORLD_REGIONS[regionId].name.uz,
    }));
    engineRef.current?.teleportToRegion(regionId);
  };

  const handleInputChange = useCallback((newInput: ControlInputState) => {
    setControlInput(newInput);
    if (engineRef.current) {
      engineRef.current.input = newInput;
    }
  }, []);

  const handlePatchInput = useCallback((partial: Partial<ControlInputState>) => {
    setControlInput((prev) => {
      const next = { ...prev, ...partial };
      if (engineRef.current) {
        engineRef.current.input = next;
      }
      return next;
    });
  }, []);

  // Keyboard Event Listeners for Computer
  useEffect(() => {
    const activeKeys: Record<string, boolean> = {};

    const updateControlsFromKeys = () => {
      let steer = 0;
      if (activeKeys['ArrowLeft'] || activeKeys['KeyA']) steer -= 1;
      if (activeKeys['ArrowRight'] || activeKeys['KeyD']) steer += 1;

      let throttle = 0;
      if (activeKeys['ArrowUp'] || activeKeys['KeyW']) throttle += 1;
      if (activeKeys['ArrowDown'] || activeKeys['KeyS']) throttle -= 1;

      const boost =
        activeKeys['ShiftLeft'] === true || activeKeys['ShiftRight'] === true;
      const isArmedOnFoot =
        Boolean(engineRef.current?.stats.isOnFoot && engineRef.current?.stats.weaponEquipped);
      const fire = isArmedOnFoot && activeKeys['Space'] === true;
      const jump = !isArmedOnFoot && activeKeys['Space'] === true;
      const drift = activeKeys['ShiftLeft'] === true || activeKeys['ShiftRight'] === true;
      const horn = activeKeys['KeyH'] === true;

      const nextInput: ControlInputState = {
        steer,
        throttle,
        boost,
        jump,
        drift,
        horn,
        fire,
      };

      handleInputChange(nextInput);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow typing in custom license plate inputs inside modals!
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      soundEngine.userGesture();

      if (e.code === 'KeyH') {
        engineRef.current?.triggerHorn();
      }

      if (e.code === 'KeyQ' && !e.repeat) {
        engineRef.current?.toggleTurnSignal('left');
        return;
      }

      if (e.code === 'KeyE' && !e.repeat) {
        engineRef.current?.toggleTurnSignal('right');
        return;
      }

      if (e.code === 'KeyR' && !e.repeat) {
        engineRef.current?.toggleWeapon();
        return;
      }

      if (e.code === 'KeyF' && !e.repeat) {
        engineRef.current?.toggleExitEnterCar();
        return;
      }

      if (e.code === 'KeyG' && !e.repeat) {
        engineRef.current?.interactNearbyPoi();
        return;
      }

      if (e.code === 'KeyL' && !e.repeat) {
        engineRef.current?.toggleMigalkaAndSiren();
        return;
      }

      if (e.code === 'KeyJ' && !e.repeat) {
        engineRef.current?.cycleSirenMode();
        return;
      }

      if (e.code === 'KeyB' && !e.repeat) {
        engineRef.current?.triggerMegafonChirp();
        return;
      }

      if (e.code === 'KeyN' && !e.repeat) {
        engineRef.current?.cycleRadioStation();
        return;
      }

      if (e.code === 'KeyK' && !e.repeat) {
        engineRef.current?.toggleHeadlights();
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameStatus === 'playing') {
          handlePauseToggle();
        } else if (gameStatus === 'paused') {
          handleResume();
        }
        return;
      }

      if (e.code === 'KeyM' && !e.repeat) {
        setIsCityMapOpen((prev) => {
          const next = !prev;
          if (engineRef.current && gameStatus === 'playing') {
            engineRef.current.isRunning = !next;
            if (next) soundEngine.stopEngine();
          }
          return next;
        });
        return;
      }

      if (e.code === 'KeyT' && !e.repeat) {
        setIsPhoneOpen((prev) => {
          const next = !prev;
          if (engineRef.current && gameStatus === 'playing') {
            engineRef.current.isRunning = !next;
            if (next) soundEngine.stopEngine();
          }
          return next;
        });
        return;
      }

      if (e.code === 'KeyC') {
        const modes: ('chase' | 'cockpit' | 'top_down' | 'cinematic')[] = [
          'chase',
          'cockpit',
          'top_down',
          'cinematic',
        ];
        const nextCam =
          modes[(modes.indexOf(settings.cameraMode) + 1) % modes.length];
        handleUpdateSettings({ cameraMode: nextCam });
        return;
      }

      activeKeys[e.code] = true;
      updateControlsFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys[e.code] = false;
      updateControlsFromKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStatus, settings.cameraMode, handleInputChange, handleUpdateSettings]);

  const handleStartGame = (mode: GameMode = selectedMode) => {
    soundEngine.userGesture();
    setGameStatus('playing');
    engineRef.current?.startGame(mode, selectedRegion);
  };

  const handlePauseToggle = () => {
    if (gameStatus === 'playing') {
      setGameStatus('paused');
      if (engineRef.current) engineRef.current.isRunning = false;
      soundEngine.stopEngine();
      soundEngine.stopMusic();
    } else if (gameStatus === 'paused') {
      handleResume();
    }
  };

  const handleResume = () => {
    soundEngine.userGesture();
    setGameStatus('playing');
    if (engineRef.current) engineRef.current.isRunning = true;
    soundEngine.startMusic();
  };

  const handleRestart = () => {
    soundEngine.userGesture();
    setGameStatus('playing');
    engineRef.current?.restartGame();
  };

  const handleMainMenu = () => {
    setGameStatus('menu');
    soundEngine.stopEngine();
    soundEngine.stopMusic();
    if (engineRef.current) {
      engineRef.current.isRunning = false;
      engineRef.current.isGameOver = false;
    }
  };

  const handleCycleCamera = useCallback(() => {
    const modes: ('chase' | 'cockpit' | 'top_down' | 'cinematic')[] = [
      'chase',
      'cockpit',
      'top_down',
      'cinematic',
    ];
    const nextCam =
      modes[(modes.indexOf(settings.cameraMode) + 1) % modes.length];
    handleUpdateSettings({ cameraMode: nextCam });
  }, [settings.cameraMode, handleUpdateSettings]);

  const t = TRANSLATIONS[settings.language];
  const showTouchControls =
    gameStatus === 'playing' &&
    (settings.touchControls === 'always' ||
      (settings.touchControls === 'auto' && isTouchDevice));

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans game-viewport select-none">
      {/* Three.js Isolated Canvas Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* PRE-GAME KEY ART SPLASH SCREEN */}
      {gameStatus === 'splash' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950 overflow-hidden">
          {!splashImgError && (
            <>
              <img
                src={splashMobileImg}
                alt="Uzbek Street Racer 3D"
                referrerPolicy="no-referrer"
                onError={() => setSplashImgError(true)}
                className="md:hidden absolute inset-0 w-full h-full object-cover object-center"
              />
              <img
                src={splashDesktopImg}
                alt="Uzbek Street Racer 3D"
                referrerPolicy="no-referrer"
                onError={() => setSplashImgError(true)}
                className="hidden md:block absolute inset-0 w-full h-full object-cover object-center"
              />
            </>
          )}

          {/* Readability scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/65 pointer-events-none" />

          {/* Top Splash Tag */}
          <div className="relative z-10 w-full flex items-center justify-between px-4 sm:px-8 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-400/50 text-cyan-300 text-[10px] sm:text-xs font-black tracking-widest uppercase">
              <span>✦ O‘ZBEKISTON AVTO SIMULYATORI 3D ✦</span>
            </div>
            <button
              onClick={() =>
                handleUpdateSettings({
                  language: settings.language === 'uz' ? 'en' : 'uz',
                })
              }
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
            >
              {settings.language === 'uz' ? 'O‘Z' : 'EN'}
            </button>
          </div>

          {/* Bottom Hero Content & CTA */}
          <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300">
                UZBEK STREET RACER 3D
              </span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-200 font-medium max-w-md drop-shadow">
              {settings.language === 'uz'
                ? 'Chevrolet Damas va Daewoo Matiz bilan keng shahar yo‘llari, Chorsu bozori, ishlar birjasi va ochiq dunyoda erkin sayohat qiling!'
                : 'Cruise wide Uzbek city avenues with Chevrolet Damas and Daewoo Matiz, explore Chorsu bazaar, earn money through city jobs, and enjoy open-world freedom!'}
            </p>

            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
              <button
                onClick={() => {
                  soundEngine.userGesture();
                  setGameStatus('menu');
                }}
                className="w-full sm:flex-1 min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-[0_0_32px_rgba(6,182,212,0.65)] active:scale-95 transition-all cursor-pointer"
              >
                <span>{settings.language === 'uz' ? 'O‘YINGA KIRISH' : 'ENTER GAME'}</span>
                <ChevronRight className="w-5 h-5 stroke-[2.8]" />
              </button>

              <button
                onClick={() => handleStartGame('open_world')}
                className="w-full sm:w-auto min-h-[52px] py-3.5 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-400/70 text-amber-300 font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{settings.language === 'uz' ? 'DARHOL HAYDASH' : 'DRIVE NOW'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-GAME HUD */}
      {gameStatus === 'playing' && (
        <HUD
          stats={stats}
          language={settings.language}
          cameraMode={settings.cameraMode}
          soundEnabled={settings.soundEnabled}
          onPauseToggle={handlePauseToggle}
          onCycleCamera={handleCycleCamera}
          onToggleSound={() =>
            handleUpdateSettings({ soundEnabled: !settings.soundEnabled })
          }
          onOpenWorldAtlas={() => setIsWorldAtlasOpen(true)}
          onOpenCityMap={() => {
            if (engineRef.current) {
              engineRef.current.isRunning = false;
              soundEngine.stopEngine();
            }
            setIsCityMapOpen(true);
          }}
          onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
          onOpenJobs={() => {
            if (engineRef.current) {
              engineRef.current.isRunning = false;
              soundEngine.stopEngine();
            }
            setIsJobsOpen(true);
          }}
          onInteractPoi={() => engineRef.current?.interactNearbyPoi()}
          onToggleExitCar={() => engineRef.current?.toggleExitEnterCar()}
          onToggleHeadlights={() => engineRef.current?.toggleHeadlights()}
          onCycleSirenMode={() => engineRef.current?.cycleSirenMode()}
          onTriggerMegafon={() => engineRef.current?.triggerMegafonChirp()}
          onCycleRadio={() => engineRef.current?.cycleRadioStation()}
          onCycleSubwoofer={() => engineRef.current?.cycleSubwooferLevel()}
          onOpenPhone={() => {
            if (engineRef.current) {
              engineRef.current.isRunning = false;
              soundEngine.stopEngine();
            }
            setIsPhoneOpen(true);
          }}
          onToggleOnline={() => engineRef.current?.toggleOnlineMode()}
          onOpenPravaXona={() => {
            if (engineRef.current) {
              engineRef.current.isRunning = false;
              soundEngine.stopEngine();
            }
            setIsPravaXonaOpen(true);
          }}
          onNavigateZone={(zone) => engineRef.current?.navigateToZone(zone)}
          onOpenHomeMenu={() => {
            if (engineRef.current) {
              engineRef.current.isRunning = false;
              soundEngine.stopEngine();
            }
            setIsHomeOpen(true);
          }}
          onInteractHouseSpot={(spot) => engineRef.current?.interactHouseSpot(spot)}
          isPaused={false}
        />
      )}

      {/* MOBILE TOUCH CONTROLS */}
      {showTouchControls && (
        <TouchControls
          input={controlInput}
          stats={stats}
          onInputChange={handleInputChange}
          onPatchInput={handlePatchInput}
          onToggleExitCar={() => engineRef.current?.toggleExitEnterCar()}
          onToggleMigalka={() => engineRef.current?.toggleMigalkaAndSiren()}
          onCycleSirenMode={() => engineRef.current?.cycleSirenMode()}
          onTriggerMegafon={() => engineRef.current?.triggerMegafonChirp()}
          onCycleRadio={() => engineRef.current?.cycleRadioStation()}
          onToggleHeadlights={() => engineRef.current?.toggleHeadlights()}
          onToggleTurnSignal={(dir) => engineRef.current?.toggleTurnSignal(dir)}
          onToggleWeapon={() => engineRef.current?.toggleWeapon()}
          onInteractPoi={() => engineRef.current?.interactNearbyPoi()}
          onOpenJobs={() => {
            if (engineRef.current) {
              engineRef.current.isRunning = false;
              soundEngine.stopEngine();
            }
            setIsJobsOpen(true);
          }}
          language={settings.language}
          touchStyle={settings.touchStyle}
        />
      )}

      {/* COLLAPSIBLE BOTTOM SETTINGS DOCK (only visible in Main Menu so gameplay controls stay clear) */}
      {gameStatus === 'menu' && (
        <SettingsDock
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          language={settings.language}
          onOpenWorldAtlas={() => setIsWorldAtlasOpen(true)}
        />
      )}

      {/* MAIN MENU OVERLAY */}
      {gameStatus === 'menu' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-between gap-4 p-3 sm:p-8 pb-32 sm:pb-24 overflow-y-auto overscroll-contain bg-gradient-to-t from-slate-950/92 via-slate-950/45 to-slate-950/85">
          {/* Top Bar */}
          <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-2xl px-3.5 py-1.5 backdrop-blur-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-xs">
                <span className="text-slate-400 font-medium">{t.highScore}: </span>
                <span className="font-black text-amber-300 tabular-nums">
                  {stats.highScore.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsPWAInstallOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 hover:from-emerald-500/40 hover:to-cyan-500/40 border border-emerald-400 text-emerald-300 text-xs font-black backdrop-blur-md transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                <span>📲 {settings.language === 'uz' ? 'APK O‘RNATISH' : 'INSTALL APK'}</span>
              </button>

              <button
                onClick={() => setIsJobsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/70 text-emerald-200 text-xs font-black transition-colors cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span>{settings.language === 'uz' ? '💼 Pul ishlash (Ishlar)' : '💼 City Jobs'}</span>
              </button>

              <button
                onClick={() => setIsPhoneOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-fuchsia-950/90 hover:bg-fuchsia-900 border border-fuchsia-500/70 text-fuchsia-200 text-xs font-black transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>{settings.language === 'uz' ? '📱 Telefon & Do‘stlar' : '📱 Phone & Friends'}</span>
              </button>

              <button
                onClick={() => setIsCityMapOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200 text-xs font-black transition-colors cursor-pointer"
              >
                <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{settings.language === 'uz' ? '🗺️ Katta Xarita' : '🗺️ City Map'}</span>
              </button>

              <button
                onClick={() => setIsPravaXonaOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/60 text-amber-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{stats.hasPrava ? '🪪 Prava ✅' : '🎓 Prava Xona'}</span>
              </button>

              <button
                onClick={() => setIsWorldAtlasOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-950/80 hover:bg-cyan-900/90 border border-cyan-500/60 text-cyan-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{WORLD_REGIONS[selectedRegion].city[settings.language]} ({t.worldRegions})</span>
              </button>

              <button
                onClick={() => setIsControlsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold backdrop-blur-md transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.controlsHelp}</span>
              </button>

              <button
                onClick={() =>
                  handleUpdateSettings({
                    language: settings.language === 'uz' ? 'en' : 'uz',
                  })
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 text-xs font-bold backdrop-blur-md transition-colors cursor-pointer"
              >
                <span>{settings.language === 'uz' ? 'O‘zbekcha' : 'English'}</span>
              </button>
            </div>
          </div>

          {/* Center Hero Title & Start Button */}
          <div className="flex flex-col items-center text-center max-w-xl my-auto py-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-2 sm:mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span>✦ TOSHKENT & XORAZM KO‘CHALARI 3D ✦</span>
            </div>

            <h1 className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-rose-400 to-indigo-300 tracking-tight drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium max-w-md">
              {settings.language === 'uz'
                ? 'Keng shahar yo‘llari, Chorsu bozori, tramplinlar, svetafor, povorotnik, Prava Xona, Ustaxona, Choyxona va Onlayn rejim bilan to‘liq 3D O‘zbekiston ochiq dunyo simulyatori!'
                : 'Complete 3D Uzbekistan open-world driving simulator with expanded city roads, Chorsu bazaar, jump ramps, traffic lights, turn signals, driving school, workshop, and online mode!'}
            </p>

            {/* Mode Selector Tabs */}
            <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2 bg-slate-900/80 border border-slate-800/90 p-1.5 rounded-2xl backdrop-blur-md">
              <button
                onClick={() => setSelectedMode('open_world')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedMode === 'open_world'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t.modeOpenWorld}</span>
              </button>

              <button
                onClick={() => setSelectedMode('world_tour')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedMode === 'world_tour'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{t.modeWorldTour}</span>
              </button>

              <button
                onClick={() => setSelectedMode('stunt_arena')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  selectedMode === 'stunt_arena'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{t.modeStuntArena}</span>
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full max-w-md">
              <button
                onClick={() => handleStartGame(selectedMode)}
                className="w-full sm:flex-1 py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{t.startGame}</span>
              </button>

              <button
                onClick={() => setIsGarageOpen(true)}
                className="w-full sm:w-auto py-3.5 sm:py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-extrabold text-sm flex items-center justify-center gap-2 backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{t.garage}</span>
              </button>
            </div>

            {/* Device Controls Hint */}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-slate-400 text-[10px] sm:text-[11px]">
              <span className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                PC: W/A/S/D, Q/E, F, G, R, Space
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Telefon: Gaz/Tormoz, POV & Miltiq
              </span>
            </div>
          </div>

          <div className="h-2 shrink-0" />
        </div>
      )}

      {/* PAUSE MODAL */}
      <PauseModal
        isOpen={gameStatus === 'paused'}
        onResume={handleResume}
        onRestart={handleRestart}
        onOpenGarage={() => setIsGarageOpen(true)}
        onOpenControls={() => setIsControlsOpen(true)}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        onMainMenu={handleMainMenu}
        language={settings.language}
      />

      {/* GAME OVER MODAL */}
      <GameOverModal
        isOpen={gameStatus === 'game_over'}
        stats={stats}
        onRestart={handleRestart}
        onOpenGarage={() => {
          setGameStatus('menu');
          setIsGarageOpen(true);
        }}
        onMainMenu={handleMainMenu}
        language={settings.language}
      />

      {/* GARAGE & TUNING MODAL */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        selectedModel={selectedModel}
        selectedColor={selectedColor}
        customization={customization}
        money={stats.money}
        ownedVehicles={ownedVehicles}
        onSelectModel={handleSelectModel}
        onPurchaseVehicle={handlePurchaseVehicle}
        onSelectColor={handleSelectColor}
        onUpdateCustomization={handleUpdateCustomization}
        language={settings.language}
      />

      {/* PRAVA XONA & AVTODROM EXAM MODAL */}
      <PravaXonaModal
        isOpen={isPravaXonaOpen}
        onClose={() => {
          setIsPravaXonaOpen(false);
          if (gameStatus === 'playing' && engineRef.current) {
            engineRef.current.isRunning = true;
          }
        }}
        hasPrava={stats.hasPrava}
        hasDocuments={stats.hasDocuments}
        theoryPassed={theoryPassed}
        onTheoryPass={() => {
          setTheoryPassed(true);
          soundEngine.playSuccessBell();
          try {
            localStorage.setItem('uz_race_theory', '1');
          } catch {
            // ignore
          }
        }}
        onStartYezdaExam={() => {
          setGameStatus('playing');
          engineRef.current?.startYezdaExam();
        }}
        language={settings.language}
      />

      {/* CONTROLS GUIDE MODAL */}
      <ControlsHelpModal
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
        language={settings.language}
      />

      {/* WORLD ATLAS FAST TRAVEL MODAL */}
      <WorldAtlasModal
        isOpen={isWorldAtlasOpen}
        onClose={() => setIsWorldAtlasOpen(false)}
        currentRegion={stats.currentRegion}
        onSelectRegion={handleSelectRegion}
        language={settings.language}
      />

      {/* JOBS & EARNINGS MODAL */}
      <JobsModal
        isOpen={isJobsOpen}
        stats={stats}
        language={settings.language}
        onClose={() => {
          setIsJobsOpen(false);
          if (gameStatus === 'playing' && engineRef.current) {
            engineRef.current.isRunning = true;
          }
        }}
        onSelectRouteJob={(job) => {
          setGameStatus('playing');
          engineRef.current?.startSpecificCityJob(job);
        }}
        onDoInstantShift={() => {
          soundEngine.userGesture();
          engineRef.current?.workUstaxonaShift();
          if (engineRef.current) {
            setStats({ ...engineRef.current.stats });
          }
        }}
        onOpenGarage={() => setIsGarageOpen(true)}
      />

      {/* INTERACTIVE GTA CITY MAP MODAL */}
      <CityMapModal
        isOpen={isCityMapOpen}
        stats={stats}
        language={settings.language}
        onClose={() => {
          setIsCityMapOpen(false);
          if (gameStatus === 'playing' && engineRef.current) {
            engineRef.current.isRunning = true;
          }
        }}
        onSetWaypoint={(x, z, label) => {
          soundEngine.userGesture();
          engineRef.current?.setCustomWaypoint(x, z, label);
          if (engineRef.current) {
            setStats({ ...engineRef.current.stats });
          }
        }}
        onClearWaypoint={() => {
          engineRef.current?.clearCustomWaypoint();
          if (engineRef.current) {
            setStats({ ...engineRef.current.stats });
          }
        }}
        onNavigateZone={(zone) => {
          setGameStatus('playing');
          engineRef.current?.navigateToZone(zone);
        }}
        onOpenJobs={() => {
          setIsJobsOpen(true);
        }}
      />

      {/* GTA SMARTPHONE MODAL (YouTube, Instagram, Games, Uzbek Radio, Online Friends, GPS) */}
      <PhoneModal
        isOpen={isPhoneOpen}
        stats={stats}
        language={settings.language}
        activeYoutubeTrack={activeYoutubeTrack}
        onSelectYoutubeTrack={setActiveYoutubeTrack}
        onClose={() => {
          setIsPhoneOpen(false);
          if (gameStatus === 'playing' && engineRef.current) {
            engineRef.current.isRunning = true;
          }
        }}
        onSelectMusic={(station) => {
          soundEngine.userGesture();
          engineRef.current?.setRadioStation(station);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onSetSubwoofer={(level) => {
          soundEngine.userGesture();
          engineRef.current?.setSubwooferLevel(level);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onJoinRoom={(code) => {
          engineRef.current?.joinOnlineRoom(code);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onSetDriverName={(name) => {
          engineRef.current?.setDriverName(name);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onToggleOnline={() => {
          engineRef.current?.toggleOnlineMode();
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onTeleportToFriend={(peerId) => {
          setGameStatus('playing');
          engineRef.current?.teleportToFriend(peerId);
        }}
        onSetWaypoint={(x, z, label) => {
          engineRef.current?.setCustomWaypoint(x, z, label);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onNavigateZone={(zone) => {
          setGameStatus('playing');
          engineRef.current?.navigateToZone(zone);
        }}
        onEnterHouse={() => {
          setGameStatus('playing');
          if (engineRef.current && engineRef.current.mode !== 'open_world') {
            engineRef.current.startGame('open_world', 'tashkent');
          }
          if (engineRef.current) engineRef.current.isRunning = true;
          engineRef.current?.enterHouseInterior();
        }}
        onSummonCar={() => {
          setGameStatus('playing');
          engineRef.current?.summonCarToMe();
        }}
        onOpenJobs={() => setIsJobsOpen(true)}
        onOpenMap={() => setIsCityMapOpen(true)}
        onOpenGarage={() => setIsGarageOpen(true)}
        onOpenPrava={() => setIsPravaXonaOpen(true)}
        onEarnMiniGameMoney={(amount, label) => {
          if (engineRef.current) {
            const nextMoney = engineRef.current.stats.money + amount;
            engineRef.current.setCareerProgress({ money: nextMoney });
            engineRef.current.stats.lastStuntName = `${label}: +${amount.toLocaleString()} so‘m`;
            setStats({ ...engineRef.current.stats });
          }
        }}
        onCaptureGamePhoto={() => engineRef.current?.captureScreenshot() || ''}
      />

      {/* PERSISTENT BACKGROUND YOUTUBE CAR AUDIO DOCK (keeps playing real Uzbek YouTube songs while driving!) */}
      {activeYoutubeTrack && !isPhoneOpen && (
        <div className="fixed bottom-24 sm:bottom-5 left-2 sm:left-5 z-30 flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-slate-950/95 border border-rose-500/70 shadow-2xl max-w-[260px]">
          <iframe
            key={`bg-${activeYoutubeTrack.videoId}`}
            src={`https://www.youtube.com/embed/${activeYoutubeTrack.videoId}?autoplay=1&rel=0`}
            title={activeYoutubeTrack.title}
            className="w-14 h-9 rounded-lg border-0 shrink-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          <button
            onClick={() => {
              if (engineRef.current && gameStatus === 'playing') {
                engineRef.current.isRunning = false;
                soundEngine.stopEngine();
              }
              setIsPhoneOpen(true);
            }}
            className="min-w-0 flex-1 text-left cursor-pointer"
          >
            <div className="text-[9px] font-black text-rose-400">▶ YOUTUBE</div>
            <div className="text-[11px] font-bold text-white truncate">{activeYoutubeTrack.title}</div>
          </button>
          <button
            onClick={() => setActiveYoutubeTrack(null)}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] font-black cursor-pointer shrink-0"
            aria-label="YouTube yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* PLAYER'S OWN VILLA HUB MODAL ("Mening Uyim - hamma narsa shu yerda") */}
      <HomeModal
        isOpen={isHomeOpen}
        stats={stats}
        language={settings.language}
        onClose={() => {
          setIsHomeOpen(false);
          if (gameStatus === 'playing' && engineRef.current) {
            engineRef.current.isRunning = true;
          }
        }}
        onHomeAction={(action) => {
          soundEngine.userGesture();
          engineRef.current?.performHomeAction(action);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onOpenGarage={() => setIsGarageOpen(true)}
        onOpenJobs={() => setIsJobsOpen(true)}
        onSelectMusic={(station) => {
          soundEngine.userGesture();
          engineRef.current?.setRadioStation(station);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onSetSubwoofer={(level) => {
          soundEngine.userGesture();
          engineRef.current?.setSubwooferLevel(level);
          if (engineRef.current) setStats({ ...engineRef.current.stats });
        }}
        onEnterHouse3D={() => {
          setGameStatus('playing');
          if (engineRef.current) engineRef.current.isRunning = true;
          engineRef.current?.enterHouseInterior();
        }}
        onExitHouse3D={() => {
          setGameStatus('playing');
          if (engineRef.current) engineRef.current.isRunning = true;
          engineRef.current?.exitHouseInterior();
        }}
      />

      {/* PWA & ANDROID APK INSTALL MODAL */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        language={settings.language}
      />
    </div>
  );
}
