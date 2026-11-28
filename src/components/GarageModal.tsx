/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShipModel,
  ShipColor,
  Language,
  CarCustomization,
  HeadlightStyleId,
  TaillightStyleId,
} from '../types/game';
import {
  VEHICLES,
  COLOR_SCHEMES,
  HEADLIGHT_STYLES,
  TAILLIGHT_STYLES,
  UZ_PLATE_REGIONS,
  TRANSLATIONS,
} from '../data/constants';
import {
  X,
  Shield,
  Gauge,
  Activity,
  Sparkles,
  Check,
  Lightbulb,
  Hash,
  Lock,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { CarShowroom3D } from './CarShowroom3D';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ShipModel;
  selectedColor: ShipColor;
  customization: CarCustomization;
  money: number;
  ownedVehicles: ShipModel[];
  onSelectModel: (model: ShipModel) => void;
  onPurchaseVehicle: (model: ShipModel) => void;
  onSelectColor: (color: ShipColor) => void;
  onUpdateCustomization: (next: CarCustomization) => void;
  language: Language;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  selectedColor,
  customization,
  money,
  ownedVehicles,
  onSelectModel,
  onPurchaseVehicle,
  onSelectColor,
  onUpdateCustomization,
  language,
}) => {
  const [filterCat, setFilterCat] = useState<'all' | 'uzbek' | 'supercar'>('all');
  const [inspectedModel, setInspectedModel] = useState<ShipModel>(selectedModel);

  useEffect(() => {
    if (isOpen) {
      setInspectedModel(selectedModel);
    }
  }, [isOpen, selectedModel]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const allVehicles = Object.values(VEHICLES);
  const vehicleList =
    filterCat === 'all'
      ? allVehicles
      : allVehicles.filter((v) => v.category === filterCat);
  const colorList = Object.values(COLOR_SCHEMES);
  const currentVehicle = VEHICLES[inspectedModel];
  const isInspectedOwned = ownedVehicles.includes(inspectedModel);
  const canAffordInspected = money >= currentVehicle.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-950/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>{t.garage}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'uz'
                ? 'Avtosalonda O‘zbek moshinalarini pulga sotib oling va tuning qiling!'
                : 'Buy Uzbek cars & supercars with earned money and tune them in 3D'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-black">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{money.toLocaleString()} so‘m</span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D INTERACTIVE CAR SHOWROOM TURNTABLE */}
        <div className="flex flex-col gap-2">
          <CarShowroom3D
            model={inspectedModel}
            color={selectedColor}
            customization={customization}
          />

          {/* Dealership Purchase Bar when inspecting a locked car */}
          {!isInspectedOwned && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/70 rounded-2xl p-3.5">
              <div className="flex flex-col">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {currentVehicle.name[language]} —{' '}
                    {language === 'uz' ? 'SOTUVDA (QULFLANGAN)' : 'FOR SALE (LOCKED)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  {canAffordInspected
                    ? language === 'uz'
                      ? 'Mablag‘ingiz yetarli! Hoziroq sotib olib haydashingiz mumkin.'
                      : 'You have enough money to purchase this vehicle.'
                    : language === 'uz'
                    ? 'Pul yetarli emas! Shahardagi Ish Markazi, Ustaxona yoki Jang Maydonida pul ishlang.'
                    : 'Not enough money! Earn money at Work Center, Ustaxona, or Battle Arena.'}
                </div>
              </div>

              <button
                onClick={() => onPurchaseVehicle(inspectedModel)}
                disabled={!canAffordInspected}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                  canAffordInspected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer active:scale-95'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  SOTIB OLISH • {currentVehicle.price.toLocaleString()} so‘m
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Category Filter & Vehicle Selection Cards */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t.selectVehicle} ({vehicleList.length})
            </label>
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterCat('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterCat === 'all'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'uz' ? 'Barchasi' : 'All'}
              </button>
              <button
                onClick={() => setFilterCat('uzbek')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterCat === 'uzbek'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇿 {language === 'uz' ? 'O‘zbek Moshinalari' : 'Uzbek Cars'}
              </button>
              <button
                onClick={() => setFilterCat('supercar')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterCat === 'supercar'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏎️ {language === 'uz' ? 'Superkarlar' : 'Supercars'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicleList.map((veh) => {
              const isOwned = ownedVehicles.includes(veh.id);
              const isActive = veh.id === selectedModel;
              const isInspecting = veh.id === inspectedModel;
              return (
                <button
                  key={veh.id}
                  onClick={() => {
                    setInspectedModel(veh.id);
                    if (isOwned) {
                      onSelectModel(veh.id);
                    }
                  }}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isInspecting
                      ? isOwned
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                      : isOwned
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/35 border-slate-800/70 hover:border-amber-500/60'
                  }`}
                >
                  {isActive ? (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : !isOwned ? (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-800 border border-amber-500/60 text-amber-400 flex items-center justify-center">
                      <Lock className="w-3 h-3" />
                    </div>
                  ) : null}

                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap pr-6">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[10px] font-black text-cyan-300">
                        {veh.badge}
                      </span>
                      {isOwned ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-600/60 text-[10px] font-black text-emerald-300">
                          {veh.price === 0 ? 'BEPUL' : '✅ OCHILGAN'}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-amber-950 border border-amber-600/70 text-[10px] font-black text-amber-300">
                          {veh.price.toLocaleString()} so‘m
                        </span>
                      )}
                    </div>
                    <div className="font-extrabold text-sm sm:text-base text-white pr-6">
                      {veh.name[language]}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {veh.description[language]}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>{veh.topSpeed} km/h</span>
                    <span className="text-emerald-400">
                      {veh.shieldMax}x {t.shields}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Ship Stats Specs */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {currentVehicle.name[language]} — Xususiyatlar
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.statsSpeed}</span>
              </div>
              <div className="font-black text-sm sm:text-base text-white">
                {currentVehicle.topSpeed} km/h
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.statsAccel}</span>
              </div>
              <div className="font-black text-sm sm:text-base text-white">
                {currentVehicle.acceleration}/10
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.statsHandling}</span>
              </div>
              <div className="font-black text-sm sm:text-base text-white">
                {currentVehicle.handling}/10
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.statsShield}</span>
              </div>
              <div className="font-black text-sm sm:text-base text-emerald-400">
                {currentVehicle.shieldMax} Qatlam
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Selection */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.selectColor}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {colorList.map((col) => {
              const isSelected = col.id === selectedColor;
              return (
                <button
                  key={col.id}
                  onClick={() => onSelectColor(col.id)}
                  style={{
                    borderColor: isSelected ? col.cssGlow : undefined,
                    boxShadow: isSelected ? `0 0 16px ${col.cssGlow}66` : undefined,
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-2'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span
                    style={{ backgroundColor: col.cssGlow }}
                    className="w-4 h-4 rounded-full shadow-sm"
                  />
                  <span className="text-xs font-bold text-white">
                    {col.name[language]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tuning: Davlat Nomeri, Oldi Fara, Orqa Fara */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          {/* Custom UZ Plate Editor */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span>{language === 'uz' ? 'Davlat Nomeri (UZ Raqam)' : 'License Plate (UZ)'}</span>
            </label>

            <div className="flex items-center gap-2">
              <select
                value={customization.plateNumber.split(' ')[0] || '01'}
                onChange={(e) => {
                  const rest = customization.plateNumber.split(' ').slice(1).join(' ') || 'Z 777 ZZ';
                  onUpdateCustomization({
                    ...customization,
                    plateNumber: `${e.target.value} ${rest}`,
                  });
                }}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-black text-white"
              >
                {UZ_PLATE_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} • {r.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                maxLength={10}
                value={customization.plateNumber.split(' ').slice(1).join(' ')}
                onChange={(e) => {
                  const reg = customization.plateNumber.split(' ')[0] || '01';
                  const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
                  onUpdateCustomization({
                    ...customization,
                    plateNumber: `${reg} ${clean}`,
                  });
                }}
                placeholder="Z 777 ZZ"
                className="flex-1 bg-white text-slate-950 font-mono font-black text-sm px-3 py-1.5 rounded-xl border-2 border-slate-900 tracking-wider uppercase"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['01 Z 777 ZZ', '01 A 001 AA', '90 X 777 XX', '30 S 555 SS'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onUpdateCustomization({ ...customization, plateNumber: preset })}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 hover:border-cyan-400 text-[11px] font-mono font-bold text-slate-200 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Front & Rear Light Tuning */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{language === 'uz' ? 'Old Fara Rangi' : 'Front Headlight Style'}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(HEADLIGHT_STYLES) as HeadlightStyleId[]).map((hid) => {
                  const hs = HEADLIGHT_STYLES[hid];
                  const active = customization.headlightStyle === hid;
                  return (
                    <button
                      key={hid}
                      onClick={() => onUpdateCustomization({ ...customization, headlightStyle: hid })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer ${
                        active
                          ? 'bg-cyan-950/70 border-cyan-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span style={{ backgroundColor: hs.css }} className="w-3 h-3 rounded-full" />
                      <span>{hs.name[language]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{language === 'uz' ? 'Orqa Fara (Stop Turi)' : 'Rear Taillight Style'}</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TAILLIGHT_STYLES) as TaillightStyleId[]).map((tid) => {
                  const ts = TAILLIGHT_STYLES[tid];
                  const active = customization.taillightStyle === tid;
                  return (
                    <button
                      key={tid}
                      onClick={() => onUpdateCustomization({ ...customization, taillightStyle: tid })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer ${
                        active
                          ? 'bg-rose-950/70 border-rose-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span style={{ backgroundColor: ts.css }} className="w-3 h-3 rounded-full" />
                      <span>{ts.name[language]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end gap-2">
          {!isInspectedOwned && canAffordInspected && (
            <button
              onClick={() => onPurchaseVehicle(inspectedModel)}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              Sotib Olish ({currentVehicle.price.toLocaleString()} so‘m)
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95 cursor-pointer"
          >
            {language === 'uz' ? 'Tanlovni Tasdiqlash' : 'Confirm & Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};
