/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CameraMode, GameSettings, Language } from '../types/game';
import { TRANSLATIONS } from '../data/constants';
import {
  Camera,
  Volume2,
  VolumeX,
  Music,
  Globe,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SettingsDockProps {
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  language: Language;
  onOpenWorldAtlas?: () => void;
}

export const SettingsDock: React.FC<SettingsDockProps> = ({
  settings,
  onUpdateSettings,
  language,
  onOpenWorldAtlas,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = TRANSLATIONS[language];

  const cameraOptions: { id: CameraMode; label: string }[] = [
    { id: 'chase', label: t.cameraChase },
    { id: 'cockpit', label: t.cameraCockpit },
    { id: 'top_down', label: t.cameraTop },
    { id: 'cinematic', label: t.cameraCinematic },
  ];

  return (
    <div
      style={{
        maxWidth: 'min(940px, 94vw)',
      }}
      className={`fixed bottom-2.5 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-in-out pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3.5 py-1 bg-slate-900/90 border-t border-x border-slate-700/80 rounded-t-xl text-[11px] font-semibold text-slate-300 hover:text-cyan-400 backdrop-blur-md shadow-md transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>▴ Boshqaruv & Kamera</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>▾ Yashirish</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 text-xs">
        {/* Camera Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1">
          <div className="px-2 text-slate-400 flex items-center gap-1 font-medium">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Kamera:</span>
          </div>
          <div className="flex gap-1">
            {cameraOptions.map((cam) => (
              <button
                key={cam.id}
                onClick={() => onUpdateSettings({ cameraMode: cam.id })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  settings.cameraMode === cam.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cam.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Sound FX */}
          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              settings.soundEnabled
                ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                : 'bg-red-950/30 border-red-900/50 text-red-400'
            }`}
            title={t.sound}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline text-[11px] font-medium">{t.sound}</span>
          </button>

          {/* Synthwave Music */}
          <button
            onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition-all ${
              settings.musicEnabled
                ? 'bg-slate-900/80 border-slate-700 text-slate-200'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}
            title={t.music}
          >
            <Music
              className={`w-3.5 h-3.5 ${
                settings.musicEnabled ? 'text-purple-400' : 'text-slate-500'
              }`}
            />
            <span className="hidden md:inline text-[11px] font-medium">{t.music}</span>
          </button>
        </div>

        {/* Touch Style, World Atlas & Language */}
        <div className="flex items-center gap-1.5">
          {onOpenWorldAtlas && (
            <button
              onClick={onOpenWorldAtlas}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-bold hover:bg-cyan-900/50 shadow-sm"
              title="Dunyo Xaritasi"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold">Xarita</span>
            </button>
          )}

          {/* Touch style toggle */}
          <button
            onClick={() =>
              onUpdateSettings({
                touchStyle: settings.touchStyle === 'joystick' ? 'buttons' : 'joystick',
              })
            }
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white"
            title="Sensor boshqaruv turi"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-medium">
              {settings.touchStyle === 'joystick' ? t.touchJoystick : t.touchButtons}
            </span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() =>
              onUpdateSettings({
                language: language === 'uz' ? 'en' : 'uz',
              })
            }
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-800/60 text-cyan-300 font-bold hover:bg-cyan-950/40"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px]">{language === 'uz' ? 'O‘Z' : 'EN'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
