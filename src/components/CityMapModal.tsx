/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { PlayerStats, Language } from '../types/game';
import { ROAD_AXES, SECONDARY_ROAD_AXES } from '../game/openWorld';
import { CITY_MAP_POIS, CityMapPoi, QuickZoneId } from '../data/mapPois';
import { X, MapPin, Briefcase, Navigation, Trash2, Compass } from 'lucide-react';

interface CityMapModalProps {
  isOpen: boolean;
  stats: PlayerStats;
  language: Language;
  onClose: () => void;
  onSetWaypoint: (x: number, z: number, label: string) => void;
  onClearWaypoint: () => void;
  onNavigateZone: (zone: QuickZoneId) => void;
  onOpenJobs: () => void;
}

const MAP_BOUND = 605;

export const CityMapModal: React.FC<CityMapModalProps> = ({
  isOpen,
  stats,
  language,
  onClose,
  onSetWaypoint,
  onClearWaypoint,
  onNavigateZone,
  onOpenJobs,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<CityMapPoi | null>(null);

  if (!isOpen) return null;

  const px = stats.worldX;
  const pz = stats.worldZ;
  const arrowDeg = ((Math.PI - stats.playerHeading) * 180) / Math.PI;

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const wx = Math.round(Math.max(-555, Math.min(555, (nx * 2 - 1) * MAP_BOUND)));
    const wz = Math.round(Math.max(-555, Math.min(555, (ny * 2 - 1) * MAP_BOUND)));

    setSelectedPoi(null);
    onSetWaypoint(wx, wz, `Xarita nuqtasi (${wx}, ${wz})`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-5xl max-h-[92dvh] overflow-y-auto overscroll-contain bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl p-3 sm:p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                {language === 'uz'
                  ? 'O‘ZBEKISTON KATTA XARITASI (GTA GPS)'
                  : 'UZBEKISTAN CITY MAP (GTA GPS)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'uz'
                  ? 'Ish joyini ko‘ring yoki xaritadagi istalgan joyni bosib GPS belgi qo‘ying'
                  : 'Track your active job destination or tap anywhere on the map to set a GPS waypoint'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content: Interactive Map + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* Interactive City SVG Map */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            <div className="relative w-full aspect-square max-h-[60dvh] rounded-2xl overflow-hidden border-2 border-slate-700 bg-[#08101e] shadow-inner">
              <svg
                ref={svgRef}
                onClick={handleMapClick}
                viewBox={`${-MAP_BOUND} ${-MAP_BOUND} ${MAP_BOUND * 2} ${MAP_BOUND * 2}`}
                className="w-full h-full block cursor-crosshair select-none"
              >
                {/* Background districts */}
                <rect x={-605} y={-605} width={1210} height={1210} fill="#08101e" />
                <rect x={-560} y={-560} width={380} height={340} rx={24} fill="#131c2e" opacity={0.75} />
                <rect x={180} y={-560} width={380} height={340} rx={24} fill="#151d30" opacity={0.75} />
                <rect x={-160} y={-160} width={320} height={320} rx={24} fill="#0f2035" opacity={0.75} />
                <rect x={-260} y={50} width={130} height={135} rx={18} fill="#311022" opacity={0.75} />
                <rect x={100} y={60} width={145} height={105} rx={18} fill="#252010" opacity={0.75} />

                {/* District Labels */}
                <text x={-370} y={-490} fill="#7dd3fc" fontSize={28} fontWeight={900} opacity={0.65}>
                  XIVA / XORAZM
                </text>
                <text x={240} y={-490} fill="#fde047" fontSize={28} fontWeight={900} opacity={0.65}>
                  SAMARQAND
                </text>
                <text x={-110} y={-125} fill="#5eead4" fontSize={24} fontWeight={900} opacity={0.75}>
                  TOSHKENT MARKAZ
                </text>
                <text x={-85} y={445} fill="#94a3b8" fontSize={24} fontWeight={900} opacity={0.65}>
                  A-380 TRASSA
                </text>

                {/* Secondary Roads */}
                {SECONDARY_ROAD_AXES.map((ax) => (
                  <g key={`m-sec-${ax}`}>
                    <line x1={ax} y1={-560} x2={ax} y2={560} stroke="#1e293b" strokeWidth={12} />
                    <line x1={-560} y1={ax} x2={560} y2={ax} stroke="#1e293b" strokeWidth={12} />
                  </g>
                ))}

                {/* Main Avenues */}
                {[...ROAD_AXES, -560, 560].map((ax) => (
                  <g key={`m-pri-${ax}`}>
                    <line x1={ax} y1={-560} x2={ax} y2={560} stroke="#334155" strokeWidth={20} />
                    <line x1={-560} y1={ax} x2={560} y2={ax} stroke="#334155" strokeWidth={20} />
                  </g>
                ))}

                {/* Active Job GPS Route Line */}
                {stats.activeJob && (
                  <g>
                    <line
                      x1={px}
                      y1={pz}
                      x2={stats.activeJob.targetX}
                      y2={stats.activeJob.targetZ}
                      stroke="#34d399"
                      strokeWidth={11}
                      strokeDasharray="22 14"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={stats.activeJob.targetX}
                      cy={stats.activeJob.targetZ}
                      r={44}
                      fill="#10b981"
                      fillOpacity={0.28}
                    />
                    <circle
                      cx={stats.activeJob.targetX}
                      cy={stats.activeJob.targetZ}
                      r={24}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={6}
                    />
                    <text
                      x={stats.activeJob.targetX}
                      y={stats.activeJob.targetZ - 36}
                      textAnchor="middle"
                      fill="#a7f3d0"
                      fontSize={26}
                      fontWeight={900}
                    >
                      ISH MANZILI ({stats.activeJob.distanceLeft}m)
                    </text>
                  </g>
                )}

                {/* Custom GTA Waypoint Route Line */}
                {stats.customWaypoint && (
                  <g>
                    <line
                      x1={px}
                      y1={pz}
                      x2={stats.customWaypoint.x}
                      y2={stats.customWaypoint.z}
                      stroke="#e879f9"
                      strokeWidth={9}
                      strokeDasharray="16 12"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={stats.customWaypoint.x}
                      cy={stats.customWaypoint.z}
                      r={34}
                      fill="#d946ef"
                      fillOpacity={0.3}
                    />
                    <circle
                      cx={stats.customWaypoint.x}
                      cy={stats.customWaypoint.z}
                      r={18}
                      fill="#d946ef"
                      stroke="#ffffff"
                      strokeWidth={5}
                    />
                  </g>
                )}

                {/* Clickable City POIs */}
                {CITY_MAP_POIS.map((poi) => {
                  const isSelected = selectedPoi?.id === poi.id;
                  return (
                    <g
                      key={poi.id}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelectedPoi(poi);
                        onSetWaypoint(poi.x, poi.z, poi.shortName);
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={poi.x}
                        cy={poi.z}
                        r={isSelected ? 24 : 17}
                        fill={poi.color}
                        stroke="#020617"
                        strokeWidth={5}
                      />
                      <text
                        x={poi.x}
                        y={poi.z + 7}
                        textAnchor="middle"
                        fontSize={18}
                      >
                        {poi.icon}
                      </text>
                    </g>
                  );
                })}

                {/* Online Friends in Room */}
                {stats.onlinePeers.map((peer) => (
                  <g
                    key={peer.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSetWaypoint(peer.x, peer.z, peer.name);
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={peer.x}
                      cy={peer.z}
                      r={24}
                      fill="#38bdf8"
                      fillOpacity={0.28}
                    />
                    <circle
                      cx={peer.x}
                      cy={peer.z}
                      r={14}
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth={4}
                    />
                    <text
                      x={peer.x}
                      y={peer.z - 22}
                      textAnchor="middle"
                      fill="#bae6fd"
                      fontSize={22}
                      fontWeight={900}
                    >
                      👥 {peer.name}
                    </text>
                  </g>
                ))}

                {/* Player GTA Arrow */}
                <g transform={`translate(${px}, ${pz}) rotate(${arrowDeg})`}>
                  <circle cx={0} cy={0} r={28} fill="#22d3ee" fillOpacity={0.22} />
                  <polygon
                    points="0,-24 18,18 0,8 -18,18"
                    fill="#22d3ee"
                    stroke="#020617"
                    strokeWidth={5}
                    strokeLinejoin="round"
                  />
                </g>
              </svg>

              {/* Coordinates Badge */}
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-700 text-[11px] font-bold text-slate-200 tabular-nums pointer-events-none">
                Siz: X={stats.worldX}m, Z={stats.worldZ}m • Obro‘: {stats.respect}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800 rounded-2xl px-3 py-2">
              <span>👆 Xaritaning istalgan nuqtasini bosing — binafsha GPS yo‘l chiziladi!</span>
              {stats.customWaypoint && (
                <button
                  onClick={onClearWaypoint}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950 border border-rose-500/70 text-rose-200 font-black cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Belgini o‘chirish</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Info & Quick GPS Directory */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Active Job Banner */}
            {stats.activeJob ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300">
                    <Briefcase className="w-4 h-4" />
                    FAOL ISH MANZILI
                  </span>
                  <span className="text-xs font-black text-amber-300">
                    +{stats.activeJob.reward.toLocaleString()} so‘m
                  </span>
                </div>
                <div className="text-sm font-black text-white">{stats.activeJob.title}</div>
                <div className="flex items-center justify-between text-xs text-emerald-200">
                  <span>Yashil GPS chizig‘i bo‘ylab haydang</span>
                  <span className="font-black tabular-nums">{stats.activeJob.distanceLeft} m</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-slate-200">Hozir faol ish yo‘q</div>
                  <div className="text-[11px] text-slate-400">
                    Ish olib xaritada manzilini ko‘ring va pul ishlang
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenJobs();
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>ISH OLISH</span>
                </button>
              </div>
            )}

            {/* Selected Custom Waypoint Info */}
            {stats.customWaypoint && (
              <div className="p-3 rounded-2xl bg-fuchsia-950/80 border border-fuchsia-400/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-black text-fuchsia-300 uppercase">
                    📍 BELGILANGAN GPS NUQTA
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {stats.customWaypoint.label} ({stats.customWaypoint.distanceLeft} m)
                  </div>
                </div>
                <button
                  onClick={onClearWaypoint}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-fuchsia-500/60 text-fuchsia-200 text-xs font-black cursor-pointer"
                >
                  O‘chirish
                </button>
              </div>
            )}

            {/* Key POIs List */}
            <div className="flex flex-col gap-1.5">
              <div className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Shahar obyektlari (GPS yoki Tez borish)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[34dvh] overflow-y-auto pr-1">
                {CITY_MAP_POIS.map((poi) => (
                  <div
                    key={poi.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${
                      selectedPoi?.id === poi.id
                        ? 'bg-cyan-950/80 border-cyan-400'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{poi.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{poi.name}</div>
                        <div className="text-[10px] text-slate-400 tabular-nums">
                          {Math.round(Math.hypot(poi.x - px, poi.z - pz))} m
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedPoi(poi);
                          onSetWaypoint(poi.x, poi.z, poi.shortName);
                        }}
                        className="min-h-[38px] px-2.5 py-1 rounded-lg bg-fuchsia-950 hover:bg-fuchsia-900 border border-fuchsia-500/60 text-fuchsia-200 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        title="GPS belgi qo'yish"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>GPS</span>
                      </button>

                      {poi.zone && (
                        <button
                          onClick={() => {
                            onNavigateZone(poi.zone!);
                            onClose();
                          }}
                          className="min-h-[38px] px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                          title="Darhol borish"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Borish</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
