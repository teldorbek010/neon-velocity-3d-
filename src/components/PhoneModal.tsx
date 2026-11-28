/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerStats, Language, RadioStationId, YouTubeTrack } from '../types/game';
import { RADIO_STATIONS, VEHICLES } from '../data/constants';
import { MY_HOME_COORDS } from '../game/openWorld';
import { QuickZoneId } from '../data/mapPois';
import { PhoneYouTubeApp } from './PhoneYouTubeApp';
import { PhoneMiniGames } from './PhoneMiniGames';
import { PhoneInstagramApp } from './PhoneInstagramApp';
import {
  X,
  Home,
  Music,
  Users,
  Briefcase,
  Map as MapIcon,
  Car,
  GraduationCap,
  Volume2,
  ChevronLeft,
  Wifi,
  Star,
  Copy,
  Check,
  MapPin,
  Youtube,
  Instagram,
  Gamepad2,
  Play,
} from 'lucide-react';

interface PhoneModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  language: Language;
  activeYoutubeTrack: YouTubeTrack | null;
  onSelectYoutubeTrack: (track: YouTubeTrack | null) => void;
  onClose: () => void;
  onSelectMusic: (station: RadioStationId) => void;
  onSetSubwoofer: (level: 0 | 1 | 2) => void;
  onJoinRoom: (roomCode: string) => void;
  onSetDriverName: (name: string) => void;
  onToggleOnline: () => void;
  onTeleportToFriend: (peerId: string) => void;
  onSetWaypoint: (x: number, z: number, label: string) => void;
  onNavigateZone: (zone: QuickZoneId) => void;
  onEnterHouse: () => void;
  onSummonCar: () => void;
  onOpenJobs: () => void;
  onOpenMap: () => void;
  onOpenGarage: () => void;
  onOpenPrava: () => void;
  onEarnMiniGameMoney: (amount: number, label: string) => void;
  onCaptureGamePhoto: () => string;
}

type PhoneTab = 'home' | 'youtube' | 'instagram' | 'games' | 'music' | 'friends';

export const PhoneModal: React.FC<PhoneModalProps> = ({
  isOpen,
  stats,
  language,
  activeYoutubeTrack,
  onSelectYoutubeTrack,
  onClose,
  onSelectMusic,
  onSetSubwoofer,
  onJoinRoom,
  onSetDriverName,
  onToggleOnline,
  onTeleportToFriend,
  onSetWaypoint,
  onNavigateZone,
  onEnterHouse,
  onSummonCar,
  onOpenJobs,
  onOpenMap,
  onOpenGarage,
  onOpenPrava,
  onEarnMiniGameMoney,
  onCaptureGamePhoto,
}) => {
  const [tab, setTab] = useState<PhoneTab>('home');
  const [roomInput, setRoomInput] = useState(stats.onlineRoomCode || 'UZB-01');
  const [nameInput, setNameInput] = useState(stats.onlineDriverName || 'Haydovchi');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeStation =
    RADIO_STATIONS.find((r) => r.id === stats.radioStation) || RADIO_STATIONS[0];

  const handleCopyRoom = () => {
    try {
      navigator.clipboard?.writeText(stats.onlineRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const tabTitles: Record<Exclude<PhoneTab, 'home'>, string> = {
    youtube: 'YouTube — Haqiqiy Musiqa',
    instagram: 'Instagram — Profil & Feed',
    games: 'Telefon O‘yinlari',
    music: 'Moshina Sombufer & Radio',
    friends: 'Onlayn Do‘stlar',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-[365px] max-h-[90dvh] overflow-y-auto overscroll-contain bg-slate-950 border-4 border-slate-700 rounded-[2.4rem] shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col">
        {/* Phone Top Notch & Status Bar */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 rounded-t-[2.1rem] sticky top-0 z-20">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-cyan-300">
            <Wifi className="w-3 h-3" />
            <span>UZB 5G</span>
          </div>
          <div className="w-16 h-3.5 rounded-full bg-slate-950 border border-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-400">100%</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-header Navigation */}
        {tab !== 'home' && (
          <div className="px-4 py-2 flex items-center justify-between bg-slate-900/85 border-b border-slate-800 sticky top-[45px] z-20">
            <button
              onClick={() => setTab('home')}
              className="flex items-center gap-1 text-xs font-black text-cyan-300 hover:text-white cursor-pointer min-h-[36px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Orqaga</span>
            </button>
            <span className="text-xs font-black text-white uppercase truncate px-2">
              {tabTitles[tab]}
            </span>
            <div className="w-10" />
          </div>
        )}

        {/* Phone Body */}
        <div className="p-4 flex flex-col gap-3">
          {tab === 'home' && (
            <>
              {/* Phone Wallet & Status Widget */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/70 to-slate-900 border border-cyan-500/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-cyan-300 uppercase">
                    Mening Balansim
                  </div>
                  <div className="text-lg font-black text-white tabular-nums">
                    {stats.money.toLocaleString()} <span className="text-xs text-emerald-300">so‘m</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-xs font-black text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{stats.respect}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    Xona: {stats.onlineRoomCode}
                  </div>
                </div>
              </div>

              {/* Featured YouTube App Quick Launcher (pops up immediately when opening phone!) */}
              <button
                onClick={() => setTab('youtube')}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border border-rose-500/60 hover:border-rose-400 flex items-center justify-between gap-2 text-left cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-rose-300 truncate uppercase">
                      {activeYoutubeTrack ? '▶ YouTube Ijroda' : 'YouTube • Haqiqiy Qo‘shiqlar'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {activeYoutubeTrack
                        ? activeYoutubeTrack.title
                        : 'Konsta, Jaloliddin, Shoxrux, Phonk...'}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1.5 rounded-xl bg-rose-500 text-white text-[10px] font-black flex items-center gap-1 shrink-0">
                  <Play className="w-3 h-3 fill-current" />
                  OCHISH
                </span>
              </button>

              {/* Quick Radio Strip */}
              <button
                onClick={() => setTab('music')}
                className="w-full p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 flex items-center justify-between gap-2 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-600/30 border border-fuchsia-400/50 flex items-center justify-center text-fuchsia-300 shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-fuchsia-300 truncate">
                      {activeStation.genre} • SOMBUFER {stats.subwooferLevel === 2 ? 'MAX' : stats.subwooferLevel === 1 ? 'ON' : 'OFF'}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {activeStation.artist} — {activeStation.name[language]}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-fuchsia-500 text-slate-950 shrink-0">
                  RADIO
                </span>
              </button>

              {/* App Grid (12 Smartphone Apps) */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  onClick={() => setTab('youtube')}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/60 cursor-pointer active:scale-95"
                >
                  <Youtube className="w-6 h-6 text-rose-400" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    YouTube
                  </span>
                </button>

                <button
                  onClick={() => setTab('instagram')}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-gradient-to-br from-fuchsia-950/90 via-rose-950/80 to-amber-950/80 hover:brightness-110 border border-pink-500/60 cursor-pointer active:scale-95"
                >
                  <Instagram className="w-6 h-6 text-pink-400" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Instagram
                  </span>
                </button>

                <button
                  onClick={() => setTab('games')}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/60 cursor-pointer active:scale-95"
                >
                  <Gamepad2 className="w-6 h-6 text-indigo-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    O‘yinlar
                  </span>
                </button>

                <button
                  onClick={() => {
                    onEnterHouse();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 cursor-pointer active:scale-95"
                >
                  <Home className="w-6 h-6 text-cyan-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Uyga Kirish
                  </span>
                </button>

                <button
                  onClick={() => setTab('music')}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-fuchsia-950/70 hover:bg-fuchsia-900/80 border border-fuchsia-500/50 cursor-pointer active:scale-95"
                >
                  <Music className="w-6 h-6 text-fuchsia-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Radio & Bas
                  </span>
                </button>

                <button
                  onClick={() => setTab('friends')}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 cursor-pointer active:scale-95 relative"
                >
                  <Users className="w-6 h-6 text-emerald-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Do‘stlar ({stats.onlinePlayersCount})
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenJobs();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-lime-950/70 hover:bg-lime-900/80 border border-lime-500/50 cursor-pointer active:scale-95"
                >
                  <Briefcase className="w-6 h-6 text-lime-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Ishlar Birjasi
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMap();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/50 cursor-pointer active:scale-95"
                >
                  <MapIcon className="w-6 h-6 text-blue-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Katta Xarita
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (stats.isOnFoot) {
                      onSummonCar();
                      onClose();
                    } else {
                      onClose();
                      onOpenGarage();
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-orange-950/70 hover:bg-orange-900/80 border border-orange-500/50 cursor-pointer active:scale-95"
                >
                  <Car className="w-6 h-6 text-orange-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    {stats.isOnFoot ? 'Moshina Chaqir' : 'Garaj / Tuning'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onSetWaypoint(MY_HOME_COORDS.x, MY_HOME_COORDS.z - 14, 'Mening Uyim');
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer active:scale-95"
                >
                  <MapPin className="w-6 h-6 text-cyan-400" />
                  <span className="text-[10px] font-black text-slate-200 text-center leading-tight">
                    Uyga GPS
                  </span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenPrava();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 cursor-pointer active:scale-95"
                >
                  <GraduationCap className="w-6 h-6 text-amber-300" />
                  <span className="text-[10px] font-black text-white text-center leading-tight">
                    Prava Xona
                  </span>
                </button>

                <button
                  onClick={() => {
                    onNavigateZone('ustaxona');
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer active:scale-95"
                >
                  <Car className="w-6 h-6 text-orange-400" />
                  <span className="text-[10px] font-black text-slate-200 text-center leading-tight">
                    Ustaxonaga
                  </span>
                </button>
              </div>
            </>
          )}

          {tab === 'youtube' && (
            <PhoneYouTubeApp
              activeTrack={activeYoutubeTrack}
              onSelectTrack={(tr) => {
                onSelectYoutubeTrack(tr);
                if (tr) onSelectMusic('off');
              }}
              subwooferLevel={stats.subwooferLevel}
              onSetSubwoofer={onSetSubwoofer}
            />
          )}

          {tab === 'instagram' && (
            <PhoneInstagramApp
              driverName={stats.onlineDriverName || 'Haydovchi'}
              onCaptureGamePhoto={onCaptureGamePhoto}
            />
          )}

          {tab === 'games' && <PhoneMiniGames onEarnMoney={onEarnMiniGameMoney} />}

          {tab === 'music' && (
            <div className="flex flex-col gap-3">
              {/* Subwoofer Bass Control */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-fuchsia-500/50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-fuchsia-300 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    MOSHINA SOMBUFERI (BASS)
                  </span>
                  <span className="text-[10px] font-black text-white">
                    {stats.subwooferLevel === 0
                      ? 'O‘CHIQ'
                      : stats.subwooferLevel === 1
                      ? 'STANDART'
                      : 'MEGA BASS 🔥'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { lv: 0 as const, label: 'O‘chiq' },
                    { lv: 1 as const, label: 'Standart' },
                    { lv: 2 as const, label: 'Mega Bass' },
                  ].map((opt) => (
                    <button
                      key={opt.lv}
                      onClick={() => onSetSubwoofer(opt.lv)}
                      className={`min-h-[40px] rounded-xl text-xs font-black border cursor-pointer transition-all ${
                        stats.subwooferLevel === opt.lv
                          ? 'bg-fuchsia-500 border-fuchsia-200 text-slate-950'
                          : 'bg-slate-950 border-slate-700 text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uzbek Singers & Rap Playlist */}
              <div className="flex flex-col gap-1.5">
                {RADIO_STATIONS.map((st) => {
                  const active = stats.radioStation === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        onSelectYoutubeTrack(null);
                        onSelectMusic(st.id);
                      }}
                      className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        active
                          ? 'bg-cyan-950/90 border-cyan-400 shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-black text-cyan-300">
                            {st.genre}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{st.freq}</span>
                        </div>
                        <div className="text-xs font-black text-white truncate mt-0.5">
                          {st.artist}
                        </div>
                        <div className="text-[10px] text-slate-300 truncate">{st.name[language]}</div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 ${
                          active ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {active ? 'IJRODA' : 'QO‘YISH'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'friends' && (
            <div className="flex flex-col gap-3">
              {/* Connection Status & Toggle */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-white">
                    {stats.onlineConnected ? '🌐 Onlayn Ulangan' : '📴 Oflayn Holat'}
                  </div>
                  <div className="text-[11px] text-emerald-300 font-bold">
                    Xona: {stats.onlineRoomCode} • {stats.onlinePlayersCount} haydovchi
                  </div>
                </div>
                <button
                  onClick={onToggleOnline}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-black cursor-pointer ${
                    stats.onlineEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {stats.onlineEnabled ? 'YOQILGAN' : 'YOQISH'}
                </button>
              </div>

              {/* Driver Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Sizning ismingiz (Do‘stlar ko‘radi)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={18}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white outline-none focus:border-cyan-400"
                    placeholder="Ismingiz..."
                  />
                  <button
                    onClick={() => onSetDriverName(nameInput)}
                    className="px-3 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black cursor-pointer"
                  >
                    Saqlash
                  </button>
                </div>
              </div>

              {/* Friend Room Code */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  Do‘stlar Xona Kodi (Bir xil kod kiriting!)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    maxLength={12}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-black text-amber-300 uppercase outline-none focus:border-emerald-400"
                    placeholder="UZB-01"
                  />
                  <button
                    onClick={() => onJoinRoom(roomInput)}
                    className="px-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer"
                  >
                    Kirish
                  </button>
                  <button
                    onClick={handleCopyRoom}
                    className="px-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                    title="Xona kodini nusxalash"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Active Friends in Room */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] font-black text-slate-400 uppercase">
                  Xonadagi do‘stlar ({stats.onlinePeers.length})
                </div>
                {stats.onlinePeers.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400 text-center">
                    Hozircha bu xonada boshqa do‘stingiz yo‘q. Xona kodingizni ({stats.onlineRoomCode}) do‘stingizga yuboring — u kirishi bilan birga haydaysiz!
                  </div>
                ) : (
                  stats.onlinePeers.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">{peer.name}</div>
                        <div className="text-[10px] text-cyan-300 truncate">
                          {VEHICLES[peer.model]?.name.uz || peer.model}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            onSetWaypoint(peer.x, peer.z, peer.name);
                            onClose();
                          }}
                          className="px-2 py-1.5 rounded-xl bg-fuchsia-950 border border-fuchsia-500/60 text-fuchsia-200 text-[10px] font-black cursor-pointer"
                        >
                          GPS
                        </button>
                        <button
                          onClick={() => {
                            onTeleportToFriend(peer.id);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-[10px] font-black cursor-pointer"
                        >
                          Borish
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Home Bar */}
        <div className="pb-3 pt-1 flex justify-center">
          <button
            onClick={() => setTab('home')}
            className="w-24 h-1.5 rounded-full bg-slate-700 hover:bg-cyan-400 cursor-pointer"
            aria-label="Bosh ekran"
          />
        </div>
      </div>
    </div>
  );
};
