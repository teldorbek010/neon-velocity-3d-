/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle2, Copy, Check, X, Sparkles, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types/game';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>(
    isIOS ? 'ios' : 'android'
  );

  if (!isOpen) return null;

  const appUrl = window.location.href;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col gap-5 text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4">
          <img
            src="/icon.svg"
            alt="Neon Velocity Icon"
            className="w-16 h-16 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-400/60 p-1 bg-slate-900"
          />
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" />
              <span>TELEFON VA APK UCHUN TAYYOR</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {language === 'uz' ? 'Telefonga O‘rnatish (APK)' : 'Install on Phone (APK / PWA)'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'uz'
                ? 'Brauzersiz, to‘liq ekran va internetsiz ham ishlaydi'
                : 'Standalone full-screen, offline capable app'}
            </p>
          </div>
        </div>

        {/* If Already Installed */}
        {isInstalled && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 flex items-center gap-3 text-emerald-200 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              {language === 'uz'
                ? 'Tabriklaymiz! O‘yin allaqachon telefoningizga o‘rnatilgan va ilova rejimida ishlamoqda.'
                : 'Great! The app is already installed and running in standalone mode.'}
            </span>
          </div>
        )}

        {/* Instant 1-Click Install Button if browser supports BeforeInstallPrompt */}
        {isInstallable && !isInstalled && (
          <button
            onClick={handleDirectInstall}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>
              {language === 'uz'
                ? '📲 1-BOSISHDA TELEFONGA O‘RNATISH (APK)'
                : '📲 1-CLICK INSTALL ON PHONE (APK)'}
            </span>
          </button>
        )}

        {/* Platform Tabs: Android / iPhone */}
        <div className="flex rounded-xl bg-slate-900/90 border border-slate-800 p-1">
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activePlatform === 'android'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>ANDROID (APK / WEBAPK)</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activePlatform === 'ios'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>APPLE / IPHONE</span>
          </button>
        </div>

        {/* Instructions content */}
        {activePlatform === 'android' ? (
          <div className="flex flex-col gap-3 text-xs bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Android telefoningizda qanday o‘rnatiladi:</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>
                Ushbu havolani telefoningizdagi <strong>Google Chrome</strong> yoki <strong>Samsung Internet</strong> brauzerida oching.
              </li>
              <li>
                Brauzerning o‘ng yuqori qismidagi <strong>3 ta nuqta (⋮)</strong> menyusini bosing.
              </li>
              <li>
                <strong>«Ilovani o‘rnatish» (Install app / Добавить на главный экран)</strong> tugmasini bosing.
              </li>
              <li>
                Telefon tizimi buni mustaqil <strong>APK ilova</strong> sifatida telefoningizga o‘rnatadi!
              </li>
            </ol>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-xs bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="font-bold text-cyan-300">iPhone / iPad Safari uchun:</div>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
              <li>
                Saytni <strong>Safari</strong> brauzerida oching.
              </li>
              <li>
                Pastki paneldagi <strong>«Ulashish» (Share / Поделиться <span className="inline-block">⬆️</span>)</strong> tugmasini bosing.
              </li>
              <li>
                Menyudan pastga tushib <strong>«Bosh ekranga qo‘shish» (Add to Home Screen)</strong> bandini bosing.
              </li>
              <li>
                Ilova telefon ekraningizda alohida o‘yin bo‘lib ochiladi.
              </li>
            </ol>
          </div>
        )}

        {/* App link share / copy box */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'uz' ? 'Telefon uchun havola (Link)' : 'Phone URL'}
          </label>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
            <input
              type="text"
              readOnly
              value={appUrl}
              className="bg-transparent text-xs text-cyan-200 flex-1 outline-none font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxalandi!' : 'Nusxa olish'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Features */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-2 rounded-xl">
            <div className="font-bold text-white mb-0.5">⚡ Tezkor</div>
            <div>0 soniya yuklanish</div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-xl">
            <div className="font-bold text-cyan-300 mb-0.5">🎮 To‘liq ekran</div>
            <div>Brauzersiz o‘yin</div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-xl">
            <div className="font-bold text-emerald-300 mb-0.5">📦 WebAPK</div>
            <div>Telefon xotirasida</div>
          </div>
        </div>
      </div>
    </div>
  );
};
