/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuickZoneId =
  | 'prava_xona'
  | 'jang_maydoni'
  | 'yotoq'
  | 'choyxona'
  | 'fuel'
  | 'ustaxona'
  | 'ish_markazi'
  | 'my_home';

export interface CityMapPoi {
  id: string;
  type:
    | 'choyxona'
    | 'yotoq'
    | 'fuel'
    | 'ustaxona'
    | 'ish_markazi'
    | 'prava_xona'
    | 'jang_maydoni'
    | 'my_home'
    | 'landmark';
  name: string;
  shortName: string;
  x: number;
  z: number;
  color: string;
  icon: string;
  zone?: QuickZoneId;
}

export const CITY_MAP_POIS: CityMapPoi[] = [
  {
    id: 'my_home_1',
    type: 'my_home',
    name: 'Mening Uyim (Villa, Garaj, Osh, Qurol)',
    shortName: 'Mening Uyim',
    x: 46,
    z: 104,
    color: '#22d3ee',
    icon: '🏠',
    zone: 'my_home',
  },
  {
    id: 'ish_markazi_1',
    type: 'ish_markazi',
    name: 'Ishlar Birjasi Markazi',
    shortName: 'Ish Markazi',
    x: -26,
    z: 38,
    color: '#84cc16',
    icon: '💼',
    zone: 'ish_markazi',
  },
  {
    id: 'ustaxona_1',
    type: 'ustaxona',
    name: 'Toshkent Avtoservis Ustaxonasi',
    shortName: 'Ustaxona',
    x: 26,
    z: -38,
    color: '#f97316',
    icon: '🔧',
    zone: 'ustaxona',
  },
  {
    id: 'choyxona_1',
    type: 'choyxona',
    name: 'Toshkent Milliy Choyxona',
    shortName: 'Choyxona',
    x: 24,
    z: 62,
    color: '#f59e0b',
    icon: '🥣',
    zone: 'choyxona',
  },
  {
    id: 'yotoq_1',
    type: 'yotoq',
    name: 'Toshkent Saroy Yotoq Joy',
    shortName: 'Yotoq Joy',
    x: 25,
    z: -115,
    color: '#a855f7',
    icon: '🛏️',
    zone: 'yotoq',
  },
  {
    id: 'fuel_1',
    type: 'fuel',
    name: 'A-380 Metan Zapravka',
    shortName: 'Zapravka',
    x: -24,
    z: 215,
    color: '#06b6d4',
    icon: '⛽',
    zone: 'fuel',
  },
  {
    id: 'prava_xona_1',
    type: 'prava_xona',
    name: 'Prava Xona & Avtodrom',
    shortName: 'Prava Xona',
    x: 136,
    z: 112,
    color: '#eab308',
    icon: '🎓',
    zone: 'prava_xona',
  },
  {
    id: 'jang_maydoni_1',
    type: 'jang_maydoni',
    name: 'Jang Maydoni (Arena)',
    shortName: 'Jang Maydoni',
    x: -195,
    z: 118,
    color: '#f43f5e',
    icon: '⚔️',
    zone: 'jang_maydoni',
  },
  {
    id: 'chorsu',
    type: 'landmark',
    name: 'Chorsu Bozori',
    shortName: 'Chorsu',
    x: -40,
    z: -40,
    color: '#14b8a6',
    icon: '🏪',
  },
  {
    id: 'teleminora',
    type: 'landmark',
    name: 'Toshkent Teleminorasi',
    shortName: 'Teleminora',
    x: -125,
    z: 125,
    color: '#38bdf8',
    icon: '🗼',
  },
  {
    id: 'fuel_2',
    type: 'fuel',
    name: 'Toshkent AI-95 Zapravka',
    shortName: 'AI-95',
    x: 24,
    z: -205,
    color: '#06b6d4',
    icon: '⛽',
  },
  {
    id: 'fuel_3',
    type: 'fuel',
    name: 'Sharq Zapravka',
    shortName: 'Sharq Gas',
    x: 184,
    z: -55,
    color: '#06b6d4',
    icon: '⛽',
  },
  {
    id: 'yotoq_2',
    type: 'yotoq',
    name: 'Xiva Karvonsaroy Yotoqxonasi',
    shortName: 'Karvonsaroy',
    x: -185,
    z: -115,
    color: '#a855f7',
    icon: '🛏️',
  },
  {
    id: 'choyxona_2',
    type: 'choyxona',
    name: 'Xorazm Taomlari Choyxonasi',
    shortName: 'Xorazm Osh',
    x: -294,
    z: -265,
    color: '#f59e0b',
    icon: '🥣',
  },
  {
    id: 'ustaxona_2',
    type: 'ustaxona',
    name: 'Xorazm Avto Ustaxonasi',
    shortName: 'Xiva Servis',
    x: -294,
    z: -355,
    color: '#f97316',
    icon: '🔧',
  },
  {
    id: 'choyxona_3',
    type: 'choyxona',
    name: 'Samarqand Osh Markazi',
    shortName: 'Samarqand Osh',
    x: 344,
    z: -265,
    color: '#f59e0b',
    icon: '🥣',
  },
  {
    id: 'ichan_qala',
    type: 'landmark',
    name: 'Xiva Ichan Qal‘a',
    shortName: 'Ichan Qal‘a',
    x: -320,
    z: -260,
    color: '#38bdf8',
    icon: '🏰',
  },
  {
    id: 'registon',
    type: 'landmark',
    name: 'Samarqand Registon',
    shortName: 'Registon',
    x: 320,
    z: -260,
    color: '#38bdf8',
    icon: '🕌',
  },
];
