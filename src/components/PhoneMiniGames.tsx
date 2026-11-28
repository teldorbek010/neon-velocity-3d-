/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Coins } from 'lucide-react';

interface PhoneMiniGamesProps {
  onEarnMoney: (amount: number, label: string) => void;
}

type MiniGameId = 'menu' | 'snake' | 'damas_dodge';

export const PhoneMiniGames: React.FC<PhoneMiniGamesProps> = ({ onEarnMoney }) => {
  const [activeGame, setActiveGame] = useState<MiniGameId>('menu');

  // --- GAME 1: SNAKE (ILONCHA) ---
  const GRID = 12;
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 5, y: 6 },
    { x: 4, y: 6 },
  ]);
  const dirRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 8, y: 4 });
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeOver, setSnakeOver] = useState(false);

  const resetSnake = () => {
    setSnake([
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ]);
    dirRef.current = { x: 1, y: 0 };
    setFood({ x: 8, y: 4 });
    setSnakeScore(0);
    setSnakeOver(false);
  };

  useEffect(() => {
    if (activeGame !== 'snake' || snakeOver) return;
    const timer = window.setInterval(() => {
      setSnake((prev) => {
        const head = {
          x: (prev[0].x + dirRef.current.x + GRID) % GRID,
          y: (prev[0].y + dirRef.current.y + GRID) % GRID,
        };
        if (prev.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setSnakeOver(true);
          return prev;
        }
        const ate = head.x === food.x && head.y === food.y;
        const next = [head, ...prev];
        if (!ate) {
          next.pop();
        } else {
          setSnakeScore((s) => {
            const ns = s + 10;
            if (ns % 30 === 0) onEarnMoney(5000, '🐍 Iloncha Bonusi');
            return ns;
          });
          setFood({
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID),
          });
        }
        return next;
      });
    }, 170);
    return () => window.clearInterval(timer);
  }, [activeGame, snakeOver, food, onEarnMoney]);

  // --- GAME 2: DAMAS DODGE ---
  const [damasLane, setDamasLane] = useState<0 | 1 | 2>(1);
  const [obstacles, setObstacles] = useState<{ id: number; lane: 0 | 1 | 2; y: number; isCoin: boolean }[]>([]);
  const [dodgeScore, setDodgeScore] = useState(0);
  const [dodgeOver, setDodgeOver] = useState(false);
  const dodgeIdRef = useRef(1);

  const resetDodge = () => {
    setDamasLane(1);
    setObstacles([]);
    setDodgeScore(0);
    setDodgeOver(false);
  };

  useEffect(() => {
    if (activeGame !== 'damas_dodge' || dodgeOver) return;
    const tick = window.setInterval(() => {
      setObstacles((prev) => {
        const moved = prev
          .map((o) => ({ ...o, y: o.y + 8 }))
          .filter((o) => o.y <= 102);

        // Collision check around player y = 78..92
        for (const o of moved) {
          if (o.y >= 74 && o.y <= 92 && o.lane === damasLane) {
            if (o.isCoin) {
              o.y = 200; // consume
              setDodgeScore((s) => s + 25);
              onEarnMoney(2500, '🚗 Damas Mini Coin');
            } else {
              setDodgeOver(true);
            }
          }
        }

        if (Math.random() < 0.24) {
          const lane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
          const isCoin = Math.random() < 0.38;
          moved.push({
            id: dodgeIdRef.current++,
            lane,
            y: 0,
            isCoin,
          });
        }
        return moved.filter((o) => o.y <= 102);
      });
      setDodgeScore((s) => s + 1);
    }, 110);
    return () => window.clearInterval(tick);
  }, [activeGame, dodgeOver, damasLane, onEarnMoney]);

  if (activeGame === 'menu') {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40">
          <div className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            TELEFON O‘YINLARI (PUL BONUSLI)
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            Yo‘lda dam olishda telefonda mini-o‘yin o‘ynang va hisobingizga so‘m ishlang!
          </p>
        </div>

        <button
          onClick={() => {
            resetSnake();
            setActiveGame('snake');
          }}
          className="p-3.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-left flex items-center justify-between cursor-pointer active:scale-95"
        >
          <div>
            <div className="text-sm font-black text-white">🐍 Iloncha (Classic Snake)</div>
            <div className="text-[11px] text-emerald-300">Har 30 ballga +5,000 so‘m bonus</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 text-[11px] font-black">
            O‘YNASH
          </span>
        </button>

        <button
          onClick={() => {
            resetDodge();
            setActiveGame('damas_dodge');
          }}
          className="p-3.5 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-left flex items-center justify-between cursor-pointer active:scale-95"
        >
          <div>
            <div className="text-sm font-black text-white">🚐 Damas Tez Poyga</div>
            <div className="text-[11px] text-cyan-300">Tanga yig‘ing (+2,500 so‘m) & konusdan qoching</div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-cyan-400 text-slate-950 text-[11px] font-black">
            O‘YNASH
          </span>
        </button>
      </div>
    );
  }

  if (activeGame === 'snake') {
    const changeDir = (nx: number, ny: number) => {
      if (dirRef.current.x === -nx && dirRef.current.y === -ny) return;
      dirRef.current = { x: nx, y: ny };
    };

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame('menu')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-black text-slate-200 cursor-pointer"
          >
            ◀ O‘yinlar
          </button>
          <span className="text-xs font-black text-emerald-300">Ball: {snakeScore}</span>
          <button
            onClick={resetSnake}
            className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 cursor-pointer"
            aria-label="Qayta"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className="w-full aspect-square bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-1.5 grid gap-0.5 relative overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GRID * GRID }).map((_, idx) => {
            const x = idx % GRID;
            const y = Math.floor(idx / GRID);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;
            return (
              <div
                key={idx}
                className={`rounded-[3px] ${
                  isHead
                    ? 'bg-emerald-300'
                    : isBody
                    ? 'bg-emerald-500'
                    : isFood
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-950/80'
                }`}
              />
            );
          })}
          {snakeOver && (
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-2">
              <span className="text-sm font-black text-rose-400">O‘YIN TUGADI!</span>
              <span className="text-xs font-bold text-white">Ball: {snakeScore}</span>
              <button
                onClick={resetSnake}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer"
              >
                Qayta o‘ynash
              </button>
            </div>
          )}
        </div>

        {/* Touch D-Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-40 mx-auto">
          <div />
          <button
            onClick={() => changeDir(0, -1)}
            className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer active:scale-95"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button
            onClick={() => changeDir(-1, 0)}
            className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => changeDir(0, 1)}
            className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer active:scale-95"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => changeDir(1, 0)}
            className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveGame('menu')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-black text-slate-200 cursor-pointer"
        >
          ◀ O‘yinlar
        </button>
        <span className="text-xs font-black text-cyan-300">Ball: {dodgeScore}</span>
        <button
          onClick={resetDodge}
          className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 cursor-pointer"
          aria-label="Qayta"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3-Lane Road Arena */}
      <div className="relative w-full h-56 rounded-2xl bg-slate-800 border-2 border-cyan-500/50 overflow-hidden grid grid-cols-3">
        {[0, 1, 2].map((l) => (
          <div key={l} className="border-r border-dashed border-slate-600/60 last:border-r-0 relative" />
        ))}

        {obstacles.map((o) => (
          <div
            key={o.id}
            style={{
              left: `${o.lane * 33.33 + 16.66}%`,
              top: `${o.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
              o.isCoin ? 'bg-amber-400 text-slate-950' : 'bg-rose-600 text-white'
            }`}
          >
            {o.isCoin ? <Coins className="w-4 h-4" /> : '🚧'}
          </div>
        ))}

        {/* Player Mini Damas */}
        <div
          style={{
            left: `${damasLane * 33.33 + 16.66}%`,
            top: '83%',
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute w-9 h-12 rounded-xl bg-white border-2 border-cyan-400 shadow-lg flex flex-col items-center justify-center text-[10px] font-black text-slate-950 transition-all"
        >
          <span>🚐</span>
          <span className="text-[7px]">UZB</span>
        </div>

        {dodgeOver && (
          <div className="absolute inset-0 bg-slate-950/88 flex flex-col items-center justify-center gap-2 z-10">
            <span className="text-sm font-black text-rose-400">TO‘QNASHUV!</span>
            <span className="text-xs font-bold text-white">Ball: {dodgeScore}</span>
            <button
              onClick={resetDodge}
              className="px-3 py-1.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-black cursor-pointer"
            >
              Qayta haydash
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setDamasLane((l) => (l > 0 ? ((l - 1) as 0 | 1 | 2) : 0))}
          className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> CHAPGA
        </button>
        <button
          onClick={() => setDamasLane((l) => (l < 2 ? ((l + 1) as 0 | 1 | 2) : 2))}
          className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
        >
          O‘NGGA <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
