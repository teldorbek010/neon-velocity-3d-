/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language } from '../types/game';
import { ShieldAlert, FileCheck2, CreditCard, Zap, AlertTriangle } from 'lucide-react';

interface MilitsiyaModalProps {
  isOpen: boolean;
  reason: string;
  hasPrava: boolean;
  hasDocuments: boolean;
  money: number;
  plateNumber: string;
  onShowDocuments: () => void;
  onPayFine: (amount: number) => void;
  onEscape: () => void;
  onGoToPravaXona: () => void;
  language: Language;
}

export const MilitsiyaModal: React.FC<MilitsiyaModalProps> = ({
  isOpen,
  reason,
  hasPrava,
  hasDocuments,
  money,
  plateNumber,
  onShowDocuments,
  onPayFine,
  onEscape,
  onGoToPravaXona,
}) => {
  const [docsChecked, setDocsChecked] = useState(false);

  if (!isOpen) return null;

  const baseFine = hasPrava && hasDocuments ? 150000 : 350000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-950 border-2 border-blue-500/70 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(37,99,235,0.45)] flex flex-col gap-4">
        {/* Siren Header Strip */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[11px] font-black tracking-widest text-blue-400 uppercase">
              O‘ZBEKISTON YPX / MILITSIYA INSPEKTORI
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              🚔 TO‘XTANG! HUJJAT TEKSHIRUVI
            </h2>
          </div>
        </div>

        {/* Violation Reason */}
        <div className="bg-rose-950/50 border border-rose-500/60 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-100 leading-relaxed">
            <div className="font-black text-rose-300 mb-0.5">QOIDABUZARLIK SABABI:</div>
            <span>{reason}</span>
          </div>
        </div>

        {/* Officer Prompt & Document Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
          <p className="text-slate-200 font-semibold italic">
            “Assalomu alaykum! YPX inspektori. Avtomobil ({plateNumber}) bo‘yicha Prava, Tehpasport va Sug‘urta hujjatlarini taqdim eting!”
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              className={`p-2 rounded-xl border text-center ${
                hasPrava
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="font-black">🪪 PRAVA</div>
              <div className="text-[10px]">{hasPrava ? 'BOR ✅' : 'YO‘Q ❌'}</div>
            </div>

            <div
              className={`p-2 rounded-xl border text-center ${
                hasDocuments
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="font-black">📄 TEHPASPORT</div>
              <div className="text-[10px]">{hasDocuments ? 'BOR ✅' : 'YO‘Q ❌'}</div>
            </div>

            <div
              className={`p-2 rounded-xl border text-center ${
                hasDocuments
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
              }`}
            >
              <div className="font-black">🛡️ SUG‘URTA</div>
              <div className="text-[10px]">{hasDocuments ? 'BOR ✅' : 'YO‘Q ❌'}</div>
            </div>
          </div>

          {docsChecked && !hasPrava && (
            <div className="text-[11px] font-bold text-amber-300 bg-amber-950/50 border border-amber-600/50 rounded-xl p-2.5">
              ⚠️ Sizda Prava yo‘q ekan! Jarima ikki barobar oshdi ({baseFine.toLocaleString()} so‘m). Prava Xonadan imtihon topshiring!
            </div>
          )}

          {docsChecked && hasPrava && (
            <div className="text-[11px] font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-600/50 rounded-xl p-2.5">
              ✅ Hujjatlar joyida! Qoidabuzarlik uchun chegirmali jarima: {baseFine.toLocaleString()} so‘m.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!docsChecked ? (
            <button
              onClick={() => {
                setDocsChecked(true);
                onShowDocuments();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>📄 HUJJATLARNI KO‘RSATISH (PRAVA & TEHPASPORT)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setDocsChecked(false);
                onPayFine(baseFine);
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                💳 JARIMANI TO‘LASH ({baseFine.toLocaleString()} SO‘M) — BALANS: {money.toLocaleString()}
              </span>
            </button>
          )}

          {!hasPrava && (
            <button
              onClick={() => {
                setDocsChecked(false);
                onGoToPravaXona();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 font-bold text-xs cursor-pointer"
            >
              🎓 PRAVA XONAGA BORISH (IMTIHON TOPSHIRISH)
            </button>
          )}

          <button
            onClick={() => {
              setDocsChecked(false);
              onEscape();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-rose-600/60 text-rose-300 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>💨 QOCHISH (GAZNI BOSIB KETISH!)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
