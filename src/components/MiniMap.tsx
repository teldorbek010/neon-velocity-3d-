/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerStats } from '../types/game';
import { ROAD_AXES, SECONDARY_ROAD_AXES } from '../game/openWorld';
import { CITY_MAP_POIS } from '../data/mapPois';

interface MiniMapProps {
  stats: PlayerStats;
  onOpenFullMap: () => void;
}

const RADAR_RADIUS = 195;

export const MiniMap: React.FC<MiniMapProps> = ({ stats, onOpenFullMap }) => {
  const px = stats.worldX;
  const pz = stats.worldZ;

  // Player arrow points UP (0, -1) at angle 0; match Three.js heading (sin(h), cos(h))
  const arrowDeg = ((Math.PI - stats.playerHeading) * 180) / Math.PI;

  const target = stats.activeJob
    ? {
        x: stats.activeJob.targetX,
        z: stats.activeJob.targetZ,
        dist: stats.activeJob.distanceLeft,
        color: '#10b981',
        stroke: '#34d399',
        kind: 'job' as const,
      }
    : stats.customWaypoint
    ? {
        x: stats.customWaypoint.x,
        z: stats.customWaypoint.z,
        dist: stats.customWaypoint.distanceLeft,
        color: '#d946ef',
        stroke: '#f0abfc',
        kind: 'waypoint' as const,
      }
    : null;

  const getClampedPoint = (tx: number, tz: number) => {
    const dx = tx - px;
    const dz = tz - pz;
    const len = Math.hypot(dx, dz);
    const maxRim = RADAR_RADIUS - 20;
    if (len <= maxRim || len < 0.01) {
      return { x: dx, y: dz, clamped: false };
    }
    const scale = maxRim / len;
    return { x: dx * scale, y: dz * scale, clamped: true };
  };

  const targetPt = target ? getClampedPoint(target.x, target.z) : null;
  const secondaryJobPt =
    stats.activeJob && stats.customWaypoint
      ? getClampedPoint(stats.customWaypoint.x, stats.customWaypoint.z)
      : null;

  const borderClass = stats.activeJob
    ? 'border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
    : stats.customWaypoint
    ? 'border-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.45)]'
    : 'border-cyan-500/75 shadow-lg';

  return (
    <button
      onClick={onOpenFullMap}
      title="Katta Xarita & GPS ochish"
      className={`group relative pointer-events-auto flex flex-col items-center rounded-2xl bg-slate-950/95 border-2 ${borderClass} overflow-hidden active:scale-95 transition-transform cursor-pointer w-[94px] sm:w-[128px]`}
    >
      <div className="relative w-[94px] h-[82px] sm:w-[128px] sm:h-[112px] bg-[#0b1322]">
        <svg
          viewBox={`${-RADAR_RADIUS} ${-RADAR_RADIUS} ${RADAR_RADIUS * 2} ${RADAR_RADIUS * 2}`}
          className="w-full h-full block"
        >
          {/* City block grid */}
          <rect
            x={-RADAR_RADIUS}
            y={-RADAR_RADIUS}
            width={RADAR_RADIUS * 2}
            height={RADAR_RADIUS * 2}
            fill="#0b1322"
          />

          {/* Secondary roads */}
          {SECONDARY_ROAD_AXES.map((ax) => {
            const rx = ax - px;
            const rz = ax - pz;
            return (
              <g key={`sec-${ax}`}>
                {Math.abs(rx) <= RADAR_RADIUS + 20 && (
                  <line
                    x1={rx}
                    y1={-RADAR_RADIUS}
                    x2={rx}
                    y2={RADAR_RADIUS}
                    stroke="#1e293b"
                    strokeWidth={11}
                  />
                )}
                {Math.abs(rz) <= RADAR_RADIUS + 20 && (
                  <line
                    x1={-RADAR_RADIUS}
                    y1={rz}
                    x2={RADAR_RADIUS}
                    y2={rz}
                    stroke="#1e293b"
                    strokeWidth={11}
                  />
                )}
              </g>
            );
          })}

          {/* Primary roads & outer perimeter */}
          {[...ROAD_AXES, -560, 560].map((ax) => {
            const rx = ax - px;
            const rz = ax - pz;
            return (
              <g key={`pri-${ax}`}>
                {Math.abs(rx) <= RADAR_RADIUS + 25 && (
                  <line
                    x1={rx}
                    y1={-RADAR_RADIUS}
                    x2={rx}
                    y2={RADAR_RADIUS}
                    stroke="#334155"
                    strokeWidth={17}
                  />
                )}
                {Math.abs(rz) <= RADAR_RADIUS + 25 && (
                  <line
                    x1={-RADAR_RADIUS}
                    y1={rz}
                    x2={RADAR_RADIUS}
                    y2={rz}
                    stroke="#334155"
                    strokeWidth={17}
                  />
                )}
              </g>
            );
          })}

          {/* Nearby POIs */}
          {CITY_MAP_POIS.map((poi) => {
            const rx = poi.x - px;
            const rz = poi.z - pz;
            if (Math.abs(rx) > RADAR_RADIUS - 8 || Math.abs(rz) > RADAR_RADIUS - 8) {
              return null;
            }
            return (
              <circle
                key={poi.id}
                cx={rx}
                cy={rz}
                r={7}
                fill={poi.color}
                stroke="#020617"
                strokeWidth={2.5}
              />
            );
          })}

          {/* Online Friends in Room */}
          {stats.onlinePeers.map((peer) => {
            const pt = getClampedPoint(peer.x, peer.z);
            return (
              <circle
                key={peer.id}
                cx={pt.x}
                cy={pt.y}
                r={8.5}
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth={2.5}
              />
            );
          })}

          {/* Secondary custom waypoint if an active job also exists */}
          {secondaryJobPt && (
            <circle
              cx={secondaryJobPt.x}
              cy={secondaryJobPt.y}
              r={8}
              fill="#d946ef"
              stroke="#ffffff"
              strokeWidth={2.5}
            />
          )}

          {/* Primary Active Job or Custom Waypoint GPS Route & Marker */}
          {target && targetPt && (
            <g>
              <line
                x1={0}
                y1={0}
                x2={targetPt.x}
                y2={targetPt.y}
                stroke={target.stroke}
                strokeWidth={6}
                strokeDasharray="10 7"
                strokeLinecap="round"
              />
              <circle
                cx={targetPt.x}
                cy={targetPt.y}
                r={15}
                fill={target.color}
                fillOpacity={0.32}
              />
              <circle
                cx={targetPt.x}
                cy={targetPt.y}
                r={9.5}
                fill={target.color}
                stroke="#ffffff"
                strokeWidth={3}
              />
            </g>
          )}

          {/* Player GTA directional arrow at radar center */}
          <g transform={`rotate(${arrowDeg})`}>
            <polygon
              points="0,-17 12,13 0,6 -12,13"
              fill="#22d3ee"
              stroke="#020617"
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {/* Top-left compass badge */}
        <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[8px] font-black text-cyan-300 leading-none">
          GPS
        </div>
      </div>

      {/* Bottom MiniMap strip */}
      <div
        className={`w-full px-1.5 py-1 flex items-center justify-between text-[9px] sm:text-[10px] font-black leading-none ${
          stats.activeJob
            ? 'bg-emerald-950 text-emerald-200 border-t border-emerald-500/60'
            : stats.customWaypoint
            ? 'bg-fuchsia-950 text-fuchsia-200 border-t border-fuchsia-500/60'
            : 'bg-slate-900 text-cyan-200 border-t border-slate-800'
        }`}
      >
        {stats.activeJob ? (
          <>
            <span className="truncate">💼 ISH</span>
            <span className="tabular-nums text-emerald-300 shrink-0">
              {stats.activeJob.distanceLeft} m
            </span>
          </>
        ) : stats.customWaypoint ? (
          <>
            <span className="truncate">📍 BELGI</span>
            <span className="tabular-nums text-fuchsia-300 shrink-0">
              {stats.customWaypoint.distanceLeft} m
            </span>
          </>
        ) : (
          <>
            <span>🗺️ XARITA</span>
            <span className="text-slate-400">OCHISH</span>
          </>
        )}
      </div>
    </button>
  );
};
