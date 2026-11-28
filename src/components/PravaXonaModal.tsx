/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language } from '../types/game';
import { YHQ_QUESTIONS } from '../data/constants';
import { X, GraduationCap, CheckCircle2, Car, Award, AlertCircle } from 'lucide-react';

interface PravaXonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPrava: boolean;
  hasDocuments: boolean;
  theoryPassed: boolean;
  onTheoryPass: () => void;
  onStartYezdaExam: () => void;
  language: Language;
}

export const PravaXonaModal: React.FC<PravaXonaModalProps> = ({
  isOpen,
  onClose,
  hasPrava,
  hasDocuments,
  theoryPassed,
  onTheoryPass,
  onStartYezdaExam,
  language,
}) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const correctCount = YHQ_QUESTIONS.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const isAllAnswered = YHQ_QUESTIONS.every((q) => answers[q.id] !== undefined);
  const passedNow = submitted && correctCount >= 4;

  const handleSubmitTheory = () => {
    setSubmitted(true);
    if (correctCount >= 4) {
      onTheoryPass();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {language === 'uz'
                  ? 'PRAVA XONA • AVTOMAKTAB IMTIHONI'
                  : 'DRIVING SCHOOL • LICENSE EXAM'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'uz'
                  ? '1-bosqich: YHQ Nazariy Test • 2-bosqich: 3D Avtodrom Yezda Imtihoni'
                  : 'Step 1: Traffic Rules Quiz • Step 2: 3D Practical Driving Exam'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div
            className={`p-3 rounded-2xl border flex items-center gap-2 ${
              hasPrava
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900/70 border-slate-800 text-slate-300'
            }`}
          >
            <Award className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-black">HAYDOVCHILIK GUVOHNOMASI</div>
              <div className="text-[11px] opacity-80">
                {hasPrava ? '✅ B-TOIFA PRAVA BOR' : '❌ HALI OLINMAGAN'}
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border flex items-center gap-2 ${
              hasDocuments
                ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-900/70 border-slate-800 text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-black">TEHPASPORT & SUG‘URTA</div>
              <div className="text-[11px] opacity-80">
                {hasDocuments ? '✅ HUJJATLAR TAYYOR' : '⏳ PRAVA BILAN BERILADI'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: YHQ Theory Quiz */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              1-BOSQICH: YHQ NAZARIY TEST (5 SAVOLDAN KAMIDA 4 TA)
            </span>
            {(theoryPassed || passedNow) && (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[11px] font-black">
                ✅ O‘TILDİ
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {YHQ_QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className="bg-slate-950/75 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="text-xs font-bold text-white">
                  {idx + 1}. {q.question}
                </div>
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt, oIdx) => {
                    const chosen = answers[q.id] === oIdx;
                    const isCorrect = q.correctIndex === oIdx;
                    let cls =
                      'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600';
                    if (submitted) {
                      if (isCorrect) {
                        cls = 'bg-emerald-950/70 border-emerald-400 text-emerald-200';
                      } else if (chosen && !isCorrect) {
                        cls = 'bg-rose-950/70 border-rose-400 text-rose-200';
                      }
                    } else if (chosen) {
                      cls = 'bg-cyan-950/70 border-cyan-400 text-cyan-200';
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => {
                          setSubmitted(false);
                          setAnswers((prev) => ({ ...prev, [q.id]: oIdx }));
                        }}
                        className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {submitted && !passedNow && !theoryPassed && (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-bold bg-rose-950/40 border border-rose-800 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Natija: {correctCount}/5. Kamida 4 ta to‘g‘ri javob toping va qayta topshiring!
              </span>
            </div>
          )}

          {!theoryPassed && (
            <button
              disabled={!isAllAnswered}
              onClick={handleSubmitTheory}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                isAllAnswered
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              📝 NAZARIY TESTNI TEKSHIRISH
            </button>
          )}
        </div>

        {/* Step 2: 3D Practical Driving Exam */}
        <div className="bg-gradient-to-r from-cyan-950/70 to-blue-950/70 border border-cyan-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-cyan-300 uppercase">
              2-BOSQICH: 3D AVTODROM YEZDA IMTIHONI
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Moshinada povorotnik (Q/E) yoqing, Avtodrom halqasidan konuslarga tegmasdan o‘ting va Parkovka chizig‘iga to‘xtang!
            </p>
          </div>

          <button
            onClick={() => {
              onStartYezdaExam();
              onClose();
            }}
            className="w-full sm:w-auto shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95"
          >
            <Car className="w-4 h-4" />
            <span>🏁 3D YEZDA BOSHLASH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
