/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { WorldRegionId, PoiKind } from '../types/game';
import {
  createCitySpire,
  createTashkentTVTower,
  createKhivaKaltaMinor,
  createIchanQalaGate,
  createStreetLightPole,
  createHighwayGantrySign,
  createTrafficLightMesh,
  createUstaxonaWorkerMesh,
  TrafficLightVisual,
  PedestrianParts,
} from './models';

export const ROAD_AXES = [-480, -320, -160, 0, 160, 320, 480];
export const SECONDARY_ROAD_AXES = [-400, -240, -80, 80, 240, 400];
export const ALL_ROAD_AXES = [
  -560, -480, -400, -320, -240, -160, -80, 0, 80, 160, 240, 320, 400, 480, 560,
];

export const CITY_SPAWN_COORDS: Record<
  WorldRegionId,
  { x: number; z: number; heading: number }
> = {
  tashkent: { x: 4.5, z: 12, heading: 0 },
  m39_highway: { x: 4.5, z: 345, heading: 0 },
  khorezm: { x: -315.5, z: -310, heading: 0 },
  samarkand: { x: 324.5, z: -310, heading: 0 },
};

export const PRAVA_XONA_COORDS = { x: 136, z: 112 };
export const AVTODROM_CENTER = { x: 185, z: 112 };
export const JANG_MAYDONI_CENTER = { x: -195, z: 118 };
export const USTAXONA_COORDS = { x: 26, z: -38 };
export const ISH_MARKAZI_COORDS = { x: -26, z: 38 };
export const MY_HOME_COORDS = { x: 46, z: 118 };

export type PoiType = Exclude<PoiKind, 'none'>;

export interface WorldPoi {
  id: string;
  type: PoiType;
  name: string;
  x: number;
  z: number;
  radius: number;
}

export interface WorldCollider {
  x: number;
  z: number;
  rx: number;
  rz: number;
  label: string;
}

export interface WorldRamp {
  x: number;
  z: number;
  width: number;
  length: number;
  axis: 'ns' | 'ew';
}

export interface WorldRoadBump {
  x: number;
  z: number;
  rx: number;
  rz: number;
  intensity: number;
  label: string;
}

export interface TrafficLightNode {
  x: number;
  z: number;
  nsLights: TrafficLightVisual[];
  ewLights: TrafficLightVisual[];
}

export interface CrosswalkZone {
  x: number;
  z: number;
  axis: 'ns' | 'ew'; // Road axis direction
  width: number;
}

export interface OpenWorldBuildResult {
  pois: WorldPoi[];
  beaconPairs: { red: THREE.Mesh; blue: THREE.Mesh }[];
  trafficLights: TrafficLightNode[];
  crosswalks: CrosswalkZone[];
  avtodromCones: { x: number; z: number }[];
  colliders: WorldCollider[];
  workers: PedestrianParts[];
  ramps: WorldRamp[];
  roadBumps: WorldRoadBump[];
}

function createSignCanvasTexture(
  title: string,
  subtitle: string,
  bg: string,
  accent: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 148);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 56);

  ctx.fillStyle = accent;
  ctx.font = '700 22px sans-serif';
  ctx.fillText(subtitle, 256, 112);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createChoyxonaMesh(name: string): THREE.Group {
  const g = new THREE.Group();

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.45, metalness: 0.25 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 9), floorMat);
  deck.position.y = 0.175;
  deck.receiveShadow = true;
  g.add(deck);

  for (const px of [-4.6, 0, 4.6]) {
    for (const pz of [-3.6, 3.6]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 3.8, 10), pillarMat);
      col.position.set(px, 2.05, pz);
      col.castShadow = true;
      g.add(col);
    }
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.45, 10.2), roofMat);
  roof.position.y = 4.1;
  roof.castShadow = true;
  g.add(roof);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.4, roughness: 0.35 })
  );
  dome.position.y = 4.3;
  g.add(dome);

  for (const tx of [-2.8, 2.8]) {
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 2.0), tableMat);
    table.position.set(tx, 0.62, 0);
    g.add(table);

    const cloth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 1.8), clothMat);
    cloth.position.set(tx, 0.92, 0);
    g.add(cloth);

    const runner = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.06, 1.82),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.7 })
    );
    runner.position.set(tx, 0.94, 0);
    g.add(runner);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.22, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
    );
    plate.position.set(tx, 1.0, 0);
    g.add(plate);
  }

  // Warm glowing Uzbek lanterns under eaves
  for (const lx of [-4.2, 0, 4.2]) {
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    lantern.position.set(lx, 3.65, 4.3);
    g.add(lantern);
  }

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '🥣 OVQATLANISH JOYI • CHOYXONA (G)',
    '#451a03',
    '#fbbf24'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 2.2),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 5.5, 4.9);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.8, 5.6, 32),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  return g;
}

function createYotoqHotelMesh(name: string): THREE.Group {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.4 });
  const winMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });

  const base = new THREE.Mesh(new THREE.BoxGeometry(12, 8.5, 9), wallMat);
  base.position.y = 4.25;
  base.castShadow = true;
  g.add(base);

  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.7, 9.6), trimMat);
  roofTrim.position.y = 8.7;
  g.add(roofTrim);

  // Warm lit hotel bedroom windows
  for (let row = 0; row < 2; row++) {
    for (let col = -1; col <= 1; col++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.4), winMat);
      win.position.set(col * 3.4, 3.0 + row * 3.0, 4.55);
      g.add(win);
    }
  }

  // Bed porch sign
  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '🛏️ YOTOQ JOY • MEHMONXONA UXLAB DAM OLING (G)',
    '#1e1b4b',
    '#a78bfa'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(9.6, 2.3),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 10.4, 0);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.6, 6.4, 32),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);

  return g;
}

function createRestParkMesh(name: string): THREE.Group {
  const g = new THREE.Group();

  const lawn = new THREE.Mesh(
    new THREE.CylinderGeometry(8.5, 8.5, 0.12, 24),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
  );
  lawn.position.y = 0.06;
  lawn.receiveShadow = true;
  g.add(lawn);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
  for (const px of [-2.5, 2.5]) {
    for (const pz of [-2.5, 2.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), woodMat);
      post.position.set(px, 1.7, pz);
      g.add(post);
    }
  }
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 })
  );
  canopy.position.y = 4.0;
  g.add(canopy);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 });
  for (const [tx, tz] of [
    [-5.8, -5.2],
    [5.8, -5.2],
    [-5.8, 5.2],
    [5.8, 5.2],
  ]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.4, 8), trunkMat);
    trunk.position.set(tx, 1.2, tz);
    g.add(trunk);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.75, 10, 8), leafMat);
    leaves.position.set(tx, 3.2, tz);
    g.add(leaves);
  }

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '🌳 DAM OLISH BOG‘I • KUCH TIKLASH (G)',
    '#064e3b',
    '#34d399'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 2.0),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 5.4, 0);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.8, 6.5, 32),
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.14;
  g.add(ring);

  return g;
}

function createFuelStationMesh(name: string): THREE.Group {
  const g = new THREE.Group();
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  });

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.18, 8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
  );
  pad.position.y = 0.09;
  g.add(pad);

  for (const px of [-3.8, 3.8]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.2, 0.55), canopyMat);
    col.position.set(px, 2.2, 0);
    g.add(col);
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.55, 7.5), canopyMat);
  roof.position.y = 4.4;
  g.add(roof);

  const strip = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.18, 7.6), accentMat);
  strip.position.y = 4.4;
  g.add(strip);

  for (const dx of [-1.8, 1.8]) {
    const dispenser = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.8, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    dispenser.position.set(dx, 1.05, 0);
    g.add(dispenser);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.45),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
    );
    screen.position.set(dx, 1.45, 0.34);
    g.add(screen);
  }

  // Roadside Fuel Price Totem
  const totem = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 4.6, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  totem.position.set(4.9, 2.3, 3.2);
  g.add(totem);
  const totemFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 3.6),
    new THREE.MeshBasicMaterial({
      map: createSignCanvasTexture('AI-95 • 12 500', 'METAN • 3 800', '#0284c7', '#fde047'),
    })
  );
  totemFace.position.set(4.9, 2.5, 3.39);
  g.add(totemFace);

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '⛽ ZAPRAVKA • AI-95 / METAN / NITRO (G)',
    '#0f172a',
    '#22d3ee'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8.5, 2.1),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 5.7, 3.8);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.2, 6.0, 32),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.11;
  g.add(ring);

  return g;
}

function createGaiPostMesh(
  name: string,
  beaconPairs: { red: THREE.Mesh; blue: THREE.Mesh }[]
): THREE.Group {
  const g = new THREE.Group();

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });

  const booth = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.2, 4.2), whiteMat);
  booth.position.y = 1.65;
  booth.castShadow = true;
  g.add(booth);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 4.3), blueMat);
  stripe.position.y = 1.25;
  g.add(stripe);

  const win = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.1, 4.28), glassMat);
  win.position.y = 2.25;
  g.add(win);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.35, 4.8), blueMat);
  roof.position.y = 3.4;
  g.add(roof);

  const redBeacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.38, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff0033 })
  );
  redBeacon.position.set(-1.1, 3.78, 0);
  g.add(redBeacon);

  const blueBeacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.38, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x0088ff })
  );
  blueBeacon.position.set(1.1, 3.78, 0);
  g.add(blueBeacon);
  beaconPairs.push({ red: redBeacon, blue: blueBeacon });

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '🚓 YPX / MILITSIYA POSTI • HUJJAT TEKSHIRUVI',
    '#0c4a6e',
    '#38bdf8'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.9),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 4.9, 2.2);
  g.add(sign);

  return g;
}

function createPravaXonaAndAvtodrom(
  worldGroup: THREE.Group
): { cones: { x: number; z: number }[] } {
  const cones: { x: number; z: number }[] = [];

  // 1. Prava Xona / Avtomaktab Building
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });

  const building = new THREE.Mesh(new THREE.BoxGeometry(14, 5.2, 10), wallMat);
  building.position.y = 2.6;
  building.castShadow = true;
  g.add(building);

  const headerBand = new THREE.Mesh(new THREE.BoxGeometry(14.3, 1.1, 10.3), blueMat);
  headerBand.position.y = 4.6;
  g.add(headerBand);

  const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 10.2), glassMat);
  doorGlass.position.y = 1.4;
  g.add(doorGlass);

  const signTex = createSignCanvasTexture(
    'PRAVA XONA • AVTOMAKTAB',
    '🪪 TEST & 3D YEZDA IMTIHONI (G)',
    '#0c4a6e',
    '#fde047'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 2.8),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 6.8, 0);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(6.5, 7.5, 32),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  g.add(ring);

  g.position.set(PRAVA_XONA_COORDS.x, 0, PRAVA_XONA_COORDS.z);
  worldGroup.add(g);

  // 2. 3D Avtodrom Yezda Exam Track Pad (east of Prava Xona)
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(74, 52),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(AVTODROM_CENTER.x, 0.02, AVTODROM_CENTER.z);
  pad.receiveShadow = true;
  worldGroup.add(pad);

  // White Parking Box & Slalom Markings
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const parkBox = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.7, 4), lineMat);
  parkBox.rotation.x = -Math.PI / 2;
  parkBox.rotation.z = Math.PI / 4;
  parkBox.position.set(AVTODROM_CENTER.x + 22, 0.05, AVTODROM_CENTER.z);
  worldGroup.add(parkBox);

  // Orange Traffic Cones along slalom course
  const coneGeo = new THREE.ConeGeometry(0.45, 1.15, 10);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x090d16 });
  const coneOffsets = [
    [-16, -8],
    [-16, 8],
    [-4, -6],
    [-4, 6],
    [8, -8],
    [8, 8],
    [22, -7],
    [22, 7],
  ];
  for (const [ox, oz] of coneOffsets) {
    const cx = AVTODROM_CENTER.x + ox;
    const cz = AVTODROM_CENTER.z + oz;
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95), baseMat);
    base.position.set(cx, 0.08, cz);
    worldGroup.add(base);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(cx, 0.68, cz);
    worldGroup.add(cone);
    cones.push({ x: cx, z: cz });
  }

  return { cones };
}

function createJangMaydoniArena(worldGroup: THREE.Group) {
  const cx = JANG_MAYDONI_CENTER.x;
  const cz = JANG_MAYDONI_CENTER.z;

  const arenaFloor = new THREE.Mesh(
    new THREE.CircleGeometry(36, 36),
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.85 })
  );
  arenaFloor.rotation.x = -Math.PI / 2;
  arenaFloor.position.set(cx, 0.02, cz);
  arenaFloor.receiveShadow = true;
  worldGroup.add(arenaFloor);

  const glowRing = new THREE.Mesh(
    new THREE.RingGeometry(33.5, 35.5, 40),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.set(cx, 0.06, cz);
  worldGroup.add(glowRing);

  // Tactical concrete cover blocks & barriers
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const barrierOffsets = [
    [12, 12],
    [-12, 12],
    [12, -12],
    [-12, -12],
    [0, 18],
    [0, -18],
  ];
  for (const [bx, bz] of barrierOffsets) {
    const blk = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.8, 1.4), barrierMat);
    blk.position.set(cx + bx, 0.9, cz + bz);
    blk.rotation.y = bx === 0 ? 0 : Math.PI / 4;
    blk.castShadow = true;
    worldGroup.add(blk);
  }

  // Weapon & Ammo Supply Crate at arena entrance
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.5, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.7 })
  );
  crate.position.set(cx + 24, 0.75, cz);
  worldGroup.add(crate);

  const signTex = createSignCanvasTexture(
    '⚔️ JANG MAYDONI (ARENA)',
    '🔫 MILTIQ OLISH (R) • O‘Q-DORI & JANG (G)',
    '#450a0a',
    '#f87171'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12.5, 3.0),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(cx, 8.2, cz - 26);
  worldGroup.add(sign);
}

function createUstaxonaWorkshopMesh(name: string, workers: PedestrianParts[]): THREE.Group {
  const g = new THREE.Group();

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.4 });
  const liftMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45, metalness: 0.5 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });

  // Service apron concrete pad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(15, 0.16, 12), floorMat);
  pad.position.y = 0.08;
  pad.receiveShadow = true;
  g.add(pad);

  // Back garage wall & side bays
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14.5, 5.2, 0.7), wallMat);
  backWall.position.set(0, 2.7, -5.2);
  backWall.castShadow = true;
  g.add(backWall);

  for (const sx of [-7.0, 0, 7.0]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, 5.2, 8.2), wallMat);
    col.position.set(sx, 2.7, -1.2);
    col.castShadow = true;
    g.add(col);
  }

  // Workshop Roof + Yellow accent fascia
  const roof = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.5, 10.0), roofMat);
  roof.position.set(0, 5.5, -1.0);
  roof.castShadow = true;
  g.add(roof);

  const fascia = new THREE.Mesh(new THREE.BoxGeometry(15.3, 0.28, 0.35), yellowMat);
  fascia.position.set(0, 5.25, 3.95);
  g.add(fascia);

  // Red Hydraulic Car Lift Posts + Display Car Chassis on Lift
  for (const lx of [2.1, 4.9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.4, 0.28), liftMat);
    post.position.set(lx, 1.75, -1.4);
    g.add(post);
  }
  const liftBeam = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.14, 1.6), liftMat);
  liftBeam.position.set(3.5, 1.95, -1.4);
  g.add(liftBeam);
  const serviceCar = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 0.95, 3.4),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.35, roughness: 0.25 })
  );
  serviceCar.position.set(3.5, 2.52, -1.4);
  g.add(serviceCar);

  // Tool Bench & Stacked Spare Tires
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.9), liftMat);
  bench.position.set(-3.4, 0.6, -4.3);
  g.add(bench);

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  for (let t = 0; t < 3; t++) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.26, 14), tireMat);
    tire.position.set(-5.8, 0.28 + t * 0.27, -4.1);
    g.add(tire);
  }

  // Mechanic Workers (Ustaxona Ishchilari)
  const workerSpecs = [
    { x: -3.2, z: -2.0, rot: 0.2, color: 0x1d4ed8 },
    { x: 3.5, z: -2.2, rot: -0.3, color: 0x0f766e },
    { x: -1.4, z: 2.8, rot: 0.0, color: 0x2563eb },
  ];
  for (const ws of workerSpecs) {
    const w = createUstaxonaWorkerMesh(ws.color);
    w.group.position.set(ws.x, 0.16, ws.z);
    w.group.rotation.y = ws.rot;
    g.add(w.group);
    workers.push(w);
  }

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '🔧 AVTOSERVIS • TA‘MIRLASH & USTADA ISHLASH (G)',
    '#0c4a6e',
    '#facc15'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12.2, 2.8),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 7.1, 3.9);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.6, 6.5, 32),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.18, 2.2);
  g.add(ring);

  return g;
}

function createIshMarkaziMesh(name: string, workers: PedestrianParts[]): THREE.Group {
  const g = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x34d399, transparent: true, opacity: 0.55 });

  const building = new THREE.Mesh(new THREE.BoxGeometry(13, 6.2, 9), wallMat);
  building.position.set(0, 3.1, -1.5);
  building.castShadow = true;
  g.add(building);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.65, 9.4), accentMat);
  trim.position.set(0, 6.0, -1.5);
  g.add(trim);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.0, 9.2), glassMat);
  glass.position.set(0, 2.0, -1.5);
  g.add(glass);

  // Stacked Logistics Cargo Boxes at loading bay
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
  for (const [cx, cy, cz] of [[-4.5, 0.5, 3.4], [-3.3, 0.5, 3.4], [-3.9, 1.35, 3.4]]) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 1.0), crateMat);
    crate.position.set(cx, cy, cz);
    crate.castShadow = true;
    g.add(crate);
  }

  // Dispatcher NPC worker standing at entrance bay
  const dispatcher = createUstaxonaWorkerMesh(0x059669);
  dispatcher.group.position.set(3.2, 0.05, 3.8);
  dispatcher.group.rotation.y = 0;
  g.add(dispatcher.group);
  workers.push(dispatcher);

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '💼 ISH MARKAZI • YETKAZIB BERISH & PUL TOPISH (G)',
    '#064e3b',
    '#34d399'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.4, 2.7),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 7.8, 2.8);
  g.add(sign);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(5.5, 6.4, 32),
    new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.08, 4.4);
  g.add(ring);

  return g;
}

function createChorsuBazaarMesh(name: string): THREE.Group {
  const g = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.65 });
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x0ea5a4, roughness: 0.24, metalness: 0.35 });
  const ribMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.75 });

  // Stone podium & perimeter colonnade arches (just like cover Chorsu Bazaar!)
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 17.5, 0.45, 28), baseMat);
  podium.position.y = 0.22;
  podium.receiveShadow = true;
  g.add(podium);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 14.5, 5.2, 24), baseMat);
  base.position.y = 2.8;
  base.castShadow = true;
  g.add(base);

  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.26, 8, 16, Math.PI),
      ribMat
    );
    arch.position.set(Math.cos(ang) * 14.1, 2.2, Math.sin(ang) * 14.1);
    arch.rotation.y = -ang + Math.PI / 2;
    g.add(arch);
  }

  // Iconic Tall Turquoise Ribbed Dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(12.6, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    domeMat
  );
  dome.position.y = 5.1;
  dome.scale.set(1, 1.18, 1);
  dome.castShadow = true;
  g.add(dome);

  for (let r = 0; r < 8; r++) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(12.68, 0.22, 6, 20, Math.PI),
      ribMat
    );
    rib.position.y = 5.1;
    rib.scale.set(1, 1.18, 1);
    rib.rotation.y = (r * Math.PI) / 8;
    g.add(rib);
  }

  const finial = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.0, 10), goldMat);
  finial.position.y = 20.6;
  g.add(finial);

  const stallColors = [0xe11d48, 0xf59e0b, 0x10b981, 0x0284c7];
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const stall = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.2, 2.5),
      new THREE.MeshStandardMaterial({ color: stallColors[i], roughness: 0.65 })
    );
    stall.position.set(Math.cos(angle) * 16.2, 1.3, Math.sin(angle) * 16.2);
    stall.rotation.y = -angle;
    g.add(stall);
  }

  const signTex = createSignCanvasTexture(
    name.toUpperCase(),
    '🛍️ CHORSU BOZOR • SAVDO & MILLIY MAHSULOTLAR',
    '#0e7490',
    '#fef08a'
  );
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(12.0, 2.7),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 8.6, 14.6);
  g.add(sign);

  return g;
}

function createFountainMesh(): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.1,
    metalness: 0.3,
  });

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 0.75, 24), stoneMat);
  rim.position.y = 0.38;
  g.add(rim);

  const pool = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.7, 0.78, 24), waterMat);
  pool.position.y = 0.4;
  g.add(pool);

  const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 1.5, 18), stoneMat);
  tier1.position.y = 1.1;
  g.add(tier1);

  const jet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.55, 3.2, 12),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.72 })
  );
  jet.position.y = 2.6;
  g.add(jet);

  return g;
}

function createBusStopMesh(): THREE.Group {
  const g = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.45 });
  const benchMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 2.1), metalMat);
  roof.position.y = 2.55;
  g.add(roof);

  for (const px of [-2.0, 2.0]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.5, 0.14), metalMat);
    post.position.set(px, 1.25, -0.8);
    g.add(post);
  }

  const backGlass = new THREE.Mesh(new THREE.BoxGeometry(3.9, 2.1, 0.08), glassMat);
  backGlass.position.set(0, 1.3, -0.8);
  g.add(backGlass);

  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.55), benchMat);
  bench.position.set(0, 0.52, -0.35);
  g.add(bench);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
  );
  sign.position.set(2.3, 2.2, 0.1);
  g.add(sign);

  return g;
}

function createStreetTreeMesh(scale: number = 1): THREE.Group {
  const g = new THREE.Group();
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.85 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.92 });
  const leafMainMat = new THREE.MeshStandardMaterial({ color: 0x3a7d34, roughness: 0.82 });
  const leafSunMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.78 });

  const planter = new THREE.Mesh(new THREE.BoxGeometry(1.7 * scale, 0.24, 1.7 * scale), curbMat);
  planter.position.y = 0.12;
  g.add(planter);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.32 * scale, 3.0 * scale, 8), trunkMat);
  trunk.position.y = 1.5 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const crownMain = new THREE.Mesh(new THREE.DodecahedronGeometry(1.85 * scale, 1), leafMainMat);
  crownMain.position.set(0, 3.6 * scale, 0);
  crownMain.castShadow = true;
  g.add(crownMain);

  const crownSun = new THREE.Mesh(new THREE.DodecahedronGeometry(1.35 * scale, 1), leafSunMat);
  crownSun.position.set(0.6 * scale, 4.3 * scale, 0.4 * scale);
  crownSun.castShadow = true;
  g.add(crownSun);

  const crownSide = new THREE.Mesh(new THREE.DodecahedronGeometry(1.25 * scale, 1), leafMainMat);
  crownSide.position.set(-0.7 * scale, 3.3 * scale, -0.35 * scale);
  g.add(crownSide);

  return g;
}

function createKioskMesh(title: string, accentHex: number): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.5, 2.6),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
  );
  body.position.y = 1.25;
  body.castShadow = true;
  g.add(body);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.35, 3.1),
    new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.4 })
  );
  awning.position.set(0, 2.55, 0.2);
  g.add(awning);

  const signTex = createSignCanvasTexture(title, 'OCHIQ • 24 SOAT', '#1e293b', '#38bdf8');
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 0.7),
    new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
  );
  sign.position.set(0, 3.1, 1.3);
  g.add(sign);

  return g;
}

function createJumpRampMesh(): THREE.Group {
  const g = new THREE.Group();
  const rampMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0x92400e,
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.4,
  });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const slope = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.25, 7.6), rampMat);
  slope.rotation.x = -0.22;
  slope.position.y = 0.85;
  g.add(slope);

  const chevron = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 5.2), stripeMat);
  chevron.rotation.x = -Math.PI / 2 - 0.22;
  chevron.position.y = 1.02;
  g.add(chevron);

  return g;
}

function createRoadGridTexture(maxAniso: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Sunlit warm charcoal asphalt base (NO white stripes / oq chiziq)
  ctx.fillStyle = '#28303d';
  ctx.fillRect(0, 0, 512, 512);

  // Realistic asphalt aggregate grain
  for (let i = 0; i < 2400; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(226,232,240,0.055)' : 'rgba(15,23,42,0.16)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Polished dark tire-wear tracks & subtle asphalt shoulder borders
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.fillRect(88, 0, 46, 512);
  ctx.fillRect(184, 0, 46, 512);
  ctx.fillRect(284, 0, 46, 512);
  ctx.fillRect(380, 0, 46, 512);

  ctx.fillStyle = '#181f29';
  ctx.fillRect(0, 0, 14, 512);
  ctx.fillRect(498, 0, 14, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 36);
  tex.anisotropy = Math.min(8, maxAniso || 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoadBumpPatchMesh(): THREE.Group {
  const g = new THREE.Group();
  const patchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.92, metalness: 0.05 });
  const humpMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78 });
  const cautionMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });

  // Uneven asphalt patch base
  const patch = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.05, 11.5), patchMat);
  patch.position.y = 0.025;
  g.add(patch);

  // 3 wavy asphalt humps ("umpak") across the road
  for (let i = -1; i <= 1; i++) {
    const hump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 15.0, 10), humpMat);
    hump.rotation.z = Math.PI / 2;
    hump.scale.set(0.52, 1, 1.35);
    hump.position.set(0, 0.05, i * 3.4);
    g.add(hump);

    const warn = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.25), cautionMat);
    warn.position.set((i % 2 === 0 ? -4.2 : 4.2), 0.24, i * 3.4);
    g.add(warn);
  }

  // Side potholes / sunken dark patches
  for (const [px, pz] of [[-4.8, -1.7], [4.6, 1.8], [-2.1, 4.4]]) {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.4, 0.04, 10),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.98 })
    );
    hole.position.set(px, 0.055, pz);
    g.add(hole);
  }

  // Roadside warning sign
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 })
  );
  pole.position.set(10.8, 1.5, 0);
  g.add(pole);

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.1, 0.1),
    new THREE.MeshBasicMaterial({ map: createSignCanvasTexture('O‘MPAQ YO‘L', 'SEKINROQ!', '#78350f', '#fbbf24') })
  );
  signBoard.position.set(10.8, 2.8, 0);
  g.add(signBoard);

  return g;
}

function createPlayerHomeMesh(): THREE.Group {
  const g = new THREE.Group();
  const travertineMat = new THREE.MeshStandardMaterial({ color: 0xf4ece0, roughness: 0.62 });
  const warmWallMat = new THREE.MeshStandardMaterial({ color: 0xfbe7c6, roughness: 0.68 });
  const trimStoneMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.55 });
  const roofTileMat = new THREE.MeshStandardMaterial({ color: 0x3f2318, roughness: 0.42, metalness: 0.25 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d3616, roughness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.35,
    metalness: 0.72,
    roughness: 0.14,
  });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 });
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x2f7a32, roughness: 0.92 });
  const driveMat = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.82 });
  const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const warmLampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // Courtyard Lawn + Stone Flagstone Path + Paved Driveway straight to z=80 street
  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(30, 0.14, 30), lawnMat);
  courtyard.position.set(0, 0.05, 4);
  courtyard.receiveShadow = true;
  g.add(courtyard);

  const patio = new THREE.Mesh(new THREE.BoxGeometry(20, 0.19, 10), trimStoneMat);
  patio.position.set(1, 0.08, 1.5);
  patio.receiveShadow = true;
  g.add(patio);

  const driveway = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.18, 34), driveMat);
  driveway.position.set(-4.5, 0.06, -16);
  driveway.receiveShadow = true;
  g.add(driveway);

  // Perimeter Brick & Wrought-Iron Courtyard Fence (leaving Darvoza opening at x=-10.5..0.5)
  const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(30, 2.2, 0.45), travertineMat);
  fenceBack.position.set(0, 1.1, 18.8);
  g.add(fenceBack);
  for (const [fx, fz, fl] of [
    [-14.8, 4, 29.6],
    [14.8, 4, 29.6],
  ]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.1, fl), travertineMat);
    sideWall.position.set(fx, 1.05, fz);
    g.add(sideWall);
  }
  const frontRightWall = new THREE.Mesh(new THREE.BoxGeometry(13.8, 2.1, 0.45), travertineMat);
  frontRightWall.position.set(7.8, 1.05, -9.8);
  g.add(frontRightWall);
  const frontLeftWall = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.1, 0.45), travertineMat);
  frontLeftWall.position.set(-12.9, 1.05, -9.8);
  g.add(frontLeftWall);

  // Main 2-Story Luxury Uzbek Villa House
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.6, 11.4), trimStoneMat);
  plinth.position.set(2.5, 0.3, 9.5);
  g.add(plinth);

  const houseMain = new THREE.Mesh(new THREE.BoxGeometry(14.5, 7.6, 10.6), travertineMat);
  houseMain.position.set(2.5, 4.1, 9.5);
  houseMain.castShadow = true;
  houseMain.receiveShadow = true;
  g.add(houseMain);

  const upperWing = new THREE.Mesh(new THREE.BoxGeometry(9.4, 3.6, 8.4), warmWallMat);
  upperWing.position.set(4.5, 9.2, 9.5);
  upperWing.castShadow = true;
  g.add(upperWing);

  // Realistic Pitched Tiled Roofs + Brick Chimney
  const roofMain = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.55, 11.8), roofTileMat);
  roofMain.position.set(2.5, 8.0, 9.5);
  g.add(roofMain);

  const roofTop = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.8, 4), roofTileMat);
  roofTop.rotation.y = Math.PI / 4;
  roofTop.position.set(4.5, 12.2, 9.5);
  roofTop.castShadow = true;
  g.add(roofTop);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.1, 0.85), trimStoneMat);
  chimney.position.set(7.6, 12.4, 11.2);
  g.add(chimney);

  // Grand Front Entrance Porch, Columns, Steps & Double Carved Walnut Doors
  const porchBase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.45, 2.8), trimStoneMat);
  porchBase.position.set(2.5, 0.25, 3.1);
  g.add(porchBase);

  const porchCanopy = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.35, 3.0), roofTileMat);
  porchCanopy.position.set(2.5, 3.6, 3.1);
  g.add(porchCanopy);

  for (const cx of [0.55, 4.45]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 10), travertineMat);
    col.position.set(cx, 1.9, 1.9);
    g.add(col);
  }

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.8, 0.28), trimStoneMat);
  doorFrame.position.set(2.5, 1.8, 4.22);
  g.add(doorFrame);
  const frontDoor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 0.32), woodMat);
  frontDoor.position.set(2.5, 1.65, 4.24);
  g.add(frontDoor);
  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.38), warmLampMat);
  doorHandle.position.set(2.5, 1.6, 4.28);
  g.add(doorHandle);

  // Framed Multi-Pane Windows (left/right & 2nd floor) + Balcony with Glass Railing
  for (const wx of [-2.4, 7.3]) {
    const frame1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.0, 0.22), trimStoneMat);
    frame1.position.set(wx, 2.4, 4.18);
    g.add(frame1);
    const pane1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.65, 0.25), glassMat);
    pane1.position.set(wx, 2.4, 4.19);
    g.add(pane1);
  }
  const upperFrame = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.0, 0.22), trimStoneMat);
  upperFrame.position.set(2.5, 5.8, 4.18);
  g.add(upperFrame);
  const upperPane = new THREE.Mesh(new THREE.BoxGeometry(10.3, 1.65, 0.25), glassMat);
  upperPane.position.set(2.5, 5.8, 4.19);
  g.add(upperPane);

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.26, 2.3), trimStoneMat);
  balcony.position.set(4.2, 4.35, 3.25);
  g.add(balcony);
  const balconyRail = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.9, 0.1), glassMat);
  balconyRail.position.set(4.2, 4.9, 2.15);
  g.add(balconyRail);

  // Covered Private Car Garage Bay (left wing) with Ribbed Sectional Door
  const garageBay = new THREE.Mesh(new THREE.BoxGeometry(7.6, 4.3, 8.6), travertineMat);
  garageBay.position.set(-8.2, 2.15, 8.2);
  garageBay.castShadow = true;
  g.add(garageBay);

  const garageRoof = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.45, 9.1), roofTileMat);
  garageRoof.position.set(-8.2, 4.45, 8.2);
  g.add(garageRoof);

  const garageDoor = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 3.2, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.65, roughness: 0.32 })
  );
  garageDoor.position.set(-8.2, 1.7, 3.9);
  g.add(garageDoor);

  // Courtyard Tapchan / Gazebo with Red Atlas Ko'rpacha & Teapot Table
  const tapchan = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.58, 4.4), woodMat);
  tapchan.position.set(9.2, 0.48, -1.5);
  g.add(tapchan);
  const tapchanCarpet = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.1, 3.7),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.85 })
  );
  tapchanCarpet.position.set(9.2, 0.82, -1.5);
  g.add(tapchanCarpet);
  const tapchanRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.5, 4), roofTileMat);
  tapchanRoof.rotation.y = Math.PI / 4;
  tapchanRoof.position.set(9.2, 3.5, -1.5);
  g.add(tapchanRoof);
  for (const sx of [-2.1, 2.1]) {
    for (const sz of [-1.8, 1.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6), woodMat);
      post.position.set(9.2 + sx, 1.75, -1.5 + sz);
      g.add(post);
    }
  }

  // Yard Chinor Trees
  for (const [tx, tz] of [[-12.5, -4.5], [12.5, 4.2]]) {
    const yardTree = createStreetTreeMesh(0.75);
    yardTree.position.set(tx, 0.1, tz);
    g.add(yardTree);
  }

  // Ornate Uzbek Darvoza Gate Pillars + Glowing Lanterns + Sign
  for (const gx of [-10.5, 0.5]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 4.1, 1.15), travertineMat);
    pillar.position.set(gx, 2.05, -9.8);
    g.add(pillar);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 1.4), ironMat);
    cap.position.set(gx, 4.15, -9.8);
    g.add(cap);
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), cyanGlowMat);
    lantern.position.set(gx, 4.45, -9.8);
    g.add(lantern);
  }

  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 2.0, 0.35),
    new THREE.MeshBasicMaterial({
      map: createSignCanvasTexture('🏠 MENING UYIM', 'UY ICHIGA KIRISH (G) • GARAJ • OSH • DAM OLISH', '#082f49', '#22d3ee'),
    })
  );
  signBoard.position.set(-5.0, 4.9, -9.8);
  g.add(signBoard);

  // Glowing Front Door Threshold & Driveway Ring
  const pad = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.4, 24),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.22, -14);
  g.add(pad);

  const doorPad = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.4),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  doorPad.rotation.x = -Math.PI / 2;
  doorPad.position.set(2.5, 0.49, 2.4);
  g.add(doorPad);

  return g;
}

// Realistic 1- & 2-Story Uzbek Mahalla Courtyard Houses ("Uylarni rost qil")
function createRealisticUzbekHouseMesh(variant: number): THREE.Group {
  const g = new THREE.Group();
  const wallPalette = [0xf5ebd8, 0xfde8cd, 0xe8e2d5, 0xe0ebf5];
  const roofPalette = [0x7c2d12, 0x334155, 0x451a03, 0x1e3a5f];
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallPalette[variant % wallPalette.length],
    roughness: 0.68,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: roofPalette[variant % roofPalette.length],
    roughness: 0.48,
    metalness: 0.18,
  });
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b3416, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.28,
    metalness: 0.65,
    roughness: 0.18,
  });
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x3a7a36, roughness: 0.92 });

  const isTwoStory = variant % 2 === 0;
  const h = isTwoStory ? 6.4 : 4.0;
  const w = 11.2;
  const d = 8.8;

  // Hovli Yard + Fence Wall
  const yard = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.12, 16.5), lawnMat);
  yard.position.set(0, 0.05, 0);
  yard.receiveShadow = true;
  g.add(yard);

  for (const [fx, fz, fw, fd] of [
    [0, 8.1, 16.5, 0.35],
    [-8.1, 0, 0.35, 16.5],
    [8.1, 0, 0.35, 16.5],
    [-4.6, -8.1, 7.2, 0.35],
    [4.6, -8.1, 7.2, 0.35],
  ]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(fw, 1.75, fd), wallMat);
    f.position.set(fx, 0.88, fz);
    f.castShadow = true;
    g.add(f);
  }

  // Carved Wooden Darvoza Gate
  const gate = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.3, 0.22), woodMat);
  gate.position.set(0, 1.15, -8.1);
  g.add(gate);

  // Main House Volume + Stone Plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.45, d + 0.5), plinthMat);
  plinth.position.set(0, 0.22, 2.4);
  g.add(plinth);

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.set(0, h / 2 + 0.4, 2.4);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Pitched Hipped Roof + Chimney
  const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 1.0, 0.32, d + 1.0), roofMat);
  eave.position.set(0, h + 0.45, 2.4);
  g.add(eave);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 2.6, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, h + 1.85, 2.4);
  roof.castShadow = true;
  g.add(roof);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.6, 0.65), plinthMat);
  chimney.position.set(2.8, h + 2.2, 3.6);
  g.add(chimney);

  // Front Porch Veranda + Columns + Door + Framed Windows
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 2.2), roofMat);
  porchRoof.position.set(0, 3.1, -2.7);
  g.add(porchRoof);
  for (const px of [-1.8, 1.8]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.8, 8), wallMat);
    col.position.set(px, 1.6, -3.5);
    g.add(col);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.22), woodMat);
  door.position.set(0, 1.55, -2.02);
  g.add(door);

  const winYs = isTwoStory ? [2.0, 5.0] : [2.0];
  for (const wy of winYs) {
    for (const wx of [-3.4, 3.4]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.45, 0.18), plinthMat);
      frame.position.set(wx, wy, -2.02);
      g.add(frame);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 0.22), glassMat);
      pane.position.set(wx, wy, -2.03);
      g.add(pane);
    }
  }

  // Yard Tree
  const tree = createStreetTreeMesh(0.72);
  tree.position.set(-5.6, 0.1, -4.5);
  g.add(tree);

  return g;
}

export function buildHouseInteriorGroup(): THREE.Group {
  const g = new THREE.Group();

  const parquetMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.55 });
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 });
  const carpetTrimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfaf3e6, roughness: 0.78 });
  const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c2d12, roughness: 0.62 });
  const darkLeatherMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
  const bedSheetMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
  const glassWinMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });

  // Cozy Floor (18m x 14m)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), parquetMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  // Ornate Uzbek Carpet in Center Hall
  const carpetTrim = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.03, 5.2), carpetTrimMat);
  carpetTrim.position.set(0, 0.015, 0.2);
  g.add(carpetTrim);
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.04, 4.6), carpetMat);
  carpet.position.set(0, 0.025, 0.2);
  g.add(carpet);

  // Warm Interior Ceiling & Chandelier
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4.3;
  g.add(ceiling);

  const chandelierRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), carpetTrimMat);
  chandelierRod.position.set(0, 3.9, 0.2);
  g.add(chandelierRod);
  const chandelierRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 20), carpetTrimMat);
  chandelierRing.rotation.x = Math.PI / 2;
  chandelierRing.position.set(0, 3.45, 0.2);
  g.add(chandelierRing);

  const indoorLight = new THREE.PointLight(0xffe4b5, 2.2, 26);
  indoorLight.position.set(0, 3.5, 0.5);
  g.add(indoorLight);

  // 4 Perimeter Walls
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(18, 4.3, 0.35), wallMat);
  wallBack.position.set(0, 2.15, 7.0);
  g.add(wallBack);
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(18, 4.3, 0.35), wallMat);
  wallFront.position.set(0, 2.15, -7.0);
  g.add(wallFront);
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.3, 14), wallMat);
  wallLeft.position.set(-9.0, 2.15, 0);
  g.add(wallLeft);
  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.3, 14), wallMat);
  wallRight.position.set(9.0, 2.15, 0);
  g.add(wallRight);

  // Sunny Side Windows
  for (const wx of [-4.8, 4.8]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.1), glassWinMat);
    win.position.set(wx, 2.2, 6.8);
    win.rotation.y = Math.PI;
    g.add(win);
  }

  // Big Wall TV + Media Console (Back Center Wall z=6.6)
  const tvStand = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 0.8), woodMat);
  tvStand.position.set(0, 0.35, 6.3);
  g.add(tvStand);
  const tvScreen = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.9, 0.14),
    new THREE.MeshBasicMaterial({
      map: createSignCanvasTexture('📺 MENING UYIM TV', 'UZBEK STREET RACER • YOUTUBE & MUSIQA', '#0f172a', '#38bdf8'),
    })
  );
  tvScreen.position.set(0, 2.1, 6.75);
  tvScreen.rotation.y = Math.PI;
  g.add(tvScreen);

  // 1. OSHXONA / DASTURXON (Left Zone: x=-5.6, z=2.0)
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.9), woodMat);
  tableTop.position.set(-5.6, 0.82, 2.0);
  g.add(tableTop);
  for (const [lx, lz] of [[-1.3, -0.7], [1.3, -0.7], [-1.3, 0.7], [1.3, 0.7]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), woodMat);
    leg.position.set(-5.6 + lx, 0.4, 2.0 + lz);
    g.add(leg);
  }
  const plovPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.32, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
  );
  plovPlate.position.set(-5.6, 0.94, 2.0);
  g.add(plovPlate);
  const kitchenZoneSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map: createSignCanvasTexture('🥣 OSHXONA', 'OVQAT & CHOY (G)', '#451a03', '#fbbf24'), side: THREE.DoubleSide })
  );
  kitchenZoneSign.position.set(-5.6, 2.4, 2.0);
  g.add(kitchenZoneSign);

  // 2. YOTOQXONA (Right Zone: x=5.6, z=2.2)
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.48, 3.8), woodMat);
  bedFrame.position.set(5.6, 0.28, 2.2);
  g.add(bedFrame);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.32, 3.5), bedSheetMat);
  mattress.position.set(5.6, 0.62, 2.2);
  g.add(mattress);
  for (const px of [4.9, 6.3]) {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.55), pillowMat);
    pillow.position.set(px, 0.84, 3.45);
    g.add(pillow);
  }
  const bedZoneSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map: createSignCanvasTexture('🛏️ YOTOQXONA', 'DAM OLISH & JON 100% (G)', '#2e1065', '#c4b5fd'), side: THREE.DoubleSide })
  );
  bedZoneSign.position.set(5.6, 2.4, 2.2);
  g.add(bedZoneSign);

  // 3. QUROL SEYFI (Left Back Corner: x=-6.2, z=-3.2)
  const safeBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 1.2), darkLeatherMat);
  safeBox.position.set(-6.2, 1.1, -3.2);
  g.add(safeBox);
  const safeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 0.75),
    new THREE.MeshBasicMaterial({ map: createSignCanvasTexture('🔫 QUROL SEYFI', 'MILTIQ & O‘Q (G)', '#450a0a', '#fca5a5'), side: THREE.DoubleSide })
  );
  safeSign.position.set(-6.2, 2.65, -3.2);
  g.add(safeSign);

  // 4. NOUTBUK & UY KOMPYUTER STOLI (Right Back Corner: x=6.0, z=-3.2)
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.82, 1.1), woodMat);
  desk.position.set(6.0, 0.41, -3.2);
  g.add(desk);
  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.58, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  laptopScreen.position.set(6.0, 1.12, -3.45);
  g.add(laptopScreen);
  const laptopSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 0.78),
    new THREE.MeshBasicMaterial({ map: createSignCanvasTexture('💻 UY MENYUSI', 'ISHLAR & GARAJ (G)', '#064e3b', '#6ee7b7'), side: THREE.DoubleSide })
  );
  laptopSign.position.set(6.0, 2.5, -3.2);
  g.add(laptopSign);

  // 5. FRONT EXIT DOOR TO STREET (x=0, z=-6.75)
  const exitDoor = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.0, 0.25), woodMat);
  exitDoor.position.set(0, 1.5, -6.78);
  g.add(exitDoor);
  const exitPad = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.75, 20),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide })
  );
  exitPad.rotation.x = -Math.PI / 2;
  exitPad.position.set(0, 0.05, -5.7);
  g.add(exitPad);
  const exitSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.85),
    new THREE.MeshBasicMaterial({ map: createSignCanvasTexture('🚪 KO‘CHAGA CHIQISH', 'ESHIKDAN CHIQISH (G)', '#082f49', '#22d3ee'), side: THREE.DoubleSide })
  );
  exitSign.position.set(0, 3.4, -6.5);
  g.add(exitSign);

  return g;
}

function createZebraCrosswalkMesh(): THREE.Group {
  const g = new THREE.Group();
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  for (let sx = -7.5; sx <= 7.5; sx += 2.5) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 4.2), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(sx, 0.025, 0);
    g.add(stripe);
  }
  return g;
}

export function buildGrandOpenWorld(
  worldGroup: THREE.Group,
  maxAniso: number
): OpenWorldBuildResult {
  const pois: WorldPoi[] = [];
  const beaconPairs: { red: THREE.Mesh; blue: THREE.Mesh }[] = [];
  const trafficLights: TrafficLightNode[] = [];
  const crosswalks: CrosswalkZone[] = [];
  const colliders: WorldCollider[] = [];
  const workers: PedestrianParts[] = [];
  const ramps: WorldRamp[] = [];
  const roadBumps: WorldRoadBump[] = [];

  // 1. Massive 2200m x 2200m sunlit city ground terrain & lush green blocks
  const groundGeo = new THREE.PlaneGeometry(2200, 2200);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x4b5c43,
    roughness: 0.92,
    metalness: 0.04,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.04;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7337, roughness: 0.92 });
  for (let gx = -440; gx <= 440; gx += 80) {
    for (let gz = -440; gz <= 440; gz += 80) {
      if (ALL_ROAD_AXES.includes(gx) || ALL_ROAD_AXES.includes(gz)) continue;
      const lawn = new THREE.Mesh(new THREE.PlaneGeometry(58, 58), grassMat);
      lawn.rotation.x = -Math.PI / 2;
      lawn.position.set(gx, -0.02, gz);
      lawn.receiveShadow = true;
      worldGroup.add(lawn);
    }
  }

  // 2. Massive Expanded Intersecting Asphalt City Avenue & Street Network (30 intersecting roads!)
  const roadTex = createRoadGridTexture(maxAniso);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.26,
    metalness: 0.30,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xaba196, roughness: 0.82 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc7, roughness: 0.7 });

  // Main wide avenues + outer ring roads + stone sidewalks & curbs
  for (const ax of [...ROAD_AXES, -560, 560]) {
    const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(20, 1440), roadMat);
    roadNS.rotation.x = -Math.PI / 2;
    roadNS.position.set(ax, 0.005, 0);
    roadNS.receiveShadow = true;
    worldGroup.add(roadNS);

    if (Math.abs(ax) <= 320) {
      for (const side of [-1, 1]) {
        const sw = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1280), sidewalkMat);
        sw.position.set(ax + side * 11.7, 0.04, 0);
        sw.receiveShadow = true;
        worldGroup.add(sw);

        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 1280), curbMat);
        curb.position.set(ax + side * 10.1, 0.055, 0);
        worldGroup.add(curb);
      }
    }
  }

  for (const az of [...ROAD_AXES, -560, 560]) {
    const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(20, 1440), roadMat);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.rotation.z = Math.PI / 2;
    roadEW.position.set(0, 0.008, az);
    roadEW.receiveShadow = true;
    worldGroup.add(roadEW);
  }

  // Secondary neighborhood streets (14m wide every 80m offset)
  for (const sx of SECONDARY_ROAD_AXES) {
    const streetNS = new THREE.Mesh(new THREE.PlaneGeometry(14, 1200), roadMat);
    streetNS.rotation.x = -Math.PI / 2;
    streetNS.position.set(sx, 0.004, 0);
    streetNS.receiveShadow = true;
    worldGroup.add(streetNS);
  }

  for (const sz of SECONDARY_ROAD_AXES) {
    const streetEW = new THREE.Mesh(new THREE.PlaneGeometry(14, 1200), roadMat);
    streetEW.rotation.x = -Math.PI / 2;
    streetEW.rotation.z = Math.PI / 2;
    streetEW.position.set(0, 0.006, sz);
    streetEW.receiveShadow = true;
    worldGroup.add(streetEW);
  }

  // 3. Working 3D Traffic Lights (Svetaforlar) & Painted Zebra Crosswalks
  const majorIntersections: [number, number][] = [
    [0, 0],
    [0, 80],
    [0, -80],
    [80, 0],
    [-80, 0],
    [0, 160],
    [0, -160],
    [160, 0],
    [-160, 0],
    [160, 160],
    [-160, 160],
    [160, -160],
    [-160, -160],
    [320, 0],
    [-320, 0],
  ];

  for (const [ix, iz] of majorIntersections) {
    const nsA = createTrafficLightMesh();
    nsA.group.position.set(ix - 11.5, 0, iz - 13);
    worldGroup.add(nsA.group);

    const nsB = createTrafficLightMesh();
    nsB.group.position.set(ix + 11.5, 0, iz + 13);
    nsB.group.rotation.y = Math.PI;
    worldGroup.add(nsB.group);

    const ewA = createTrafficLightMesh();
    ewA.group.position.set(ix - 13, 0, iz + 11.5);
    ewA.group.rotation.y = Math.PI / 2;
    worldGroup.add(ewA.group);

    const ewB = createTrafficLightMesh();
    ewB.group.position.set(ix + 13, 0, iz - 11.5);
    ewB.group.rotation.y = -Math.PI / 2;
    worldGroup.add(ewB.group);

    trafficLights.push({
      x: ix,
      z: iz,
      nsLights: [nsA, nsB],
      ewLights: [ewA, ewB],
    });
  }

  // Zebra crosswalks where pedestrians cross roads
  const zebraSpecs: { x: number; z: number; axis: 'ns' | 'ew' }[] = [
    { x: 0, z: 48, axis: 'ns' },
    { x: 0, z: -48, axis: 'ns' },
    { x: 0, z: 215, axis: 'ns' },
    { x: 160, z: 58, axis: 'ns' },
    { x: -160, z: 58, axis: 'ns' },
    { x: 58, z: 0, axis: 'ew' },
    { x: -58, z: 0, axis: 'ew' },
    { x: 80, z: 42, axis: 'ns' },
    { x: -80, z: -42, axis: 'ns' },
  ];
  for (const zs of zebraSpecs) {
    const zMesh = createZebraCrosswalkMesh();
    zMesh.position.set(zs.x, 0, zs.z);
    if (zs.axis === 'ew') zMesh.rotation.y = Math.PI / 2;
    worldGroup.add(zMesh);
    crosswalks.push({ x: zs.x, z: zs.z, axis: zs.axis, width: 20 });
  }

  // 4. Roadside POIs: Ovqatlanish, Yotoq Joy, Bog'lar, Zapravka, Prava Xona, Jang, Ustaxona, Ish Markazi
  const choyxonaSpecs = [
    { id: 'choyxona_1', name: 'Toshkent Milliy Choyxona', x: 24, z: 62 },
    { id: 'choyxona_2', name: 'Xorazm Taomlari Choyxonasi', x: -294, z: -265 },
    { id: 'choyxona_3', name: 'Samarqand Osh Markazi', x: 344, z: -265 },
  ];
  for (const sp of choyxonaSpecs) {
    const m = createChoyxonaMesh(sp.name);
    m.position.set(sp.x, 0, sp.z);
    m.rotation.y = sp.x > 0 ? -Math.PI / 2 : Math.PI / 2;
    worldGroup.add(m);
    pois.push({ id: sp.id, type: 'choyxona', name: sp.name, x: sp.x, z: sp.z, radius: 10.5 });
    colliders.push({ x: sp.x, z: sp.z, rx: 4.5, rz: 4.5, label: sp.name });
  }

  const yotoqSpecs = [
    { id: 'yotoq_1', name: 'Toshkent Saroy Yotoq Joy', x: 25, z: -115 },
    { id: 'yotoq_2', name: 'Xiva Karvonsaroy Yotoqxonasi', x: -185, z: -115 },
  ];
  for (const sp of yotoqSpecs) {
    const m = createYotoqHotelMesh(sp.name);
    m.position.set(sp.x, 0, sp.z);
    m.rotation.y = sp.x > 0 ? -Math.PI / 2 : Math.PI / 2;
    worldGroup.add(m);
    pois.push({ id: sp.id, type: 'yotoq', name: sp.name, x: sp.x, z: sp.z, radius: 11.5 });
    colliders.push({ x: sp.x, z: sp.z, rx: 5.2, rz: 4.8, label: sp.name });
  }

  const parkSpecs = [
    { id: 'park_1', name: 'Toshkent Bog‘i', x: -24, z: -60 },
    { id: 'park_2', name: 'Xiva Sayilgohi', x: -344, z: -265 },
    { id: 'park_3', name: 'Samarqand Navoiy Parki', x: 294, z: -265 },
  ];
  for (const sp of parkSpecs) {
    const m = createRestParkMesh(sp.name);
    m.position.set(sp.x, 0, sp.z);
    worldGroup.add(m);
    pois.push({ id: sp.id, type: 'rest_park', name: sp.name, x: sp.x, z: sp.z, radius: 10.5 });
  }

  const fuelSpecs = [
    { id: 'fuel_1', name: 'A-380 Metan Zapravka', x: -24, z: 215 },
    { id: 'fuel_2', name: 'Toshkent AI-95 Zapravka', x: 24, z: -205 },
    { id: 'fuel_3', name: 'Sharq Zapravka', x: 184, z: -55 },
  ];
  for (const sp of fuelSpecs) {
    const m = createFuelStationMesh(sp.name);
    m.position.set(sp.x, 0, sp.z);
    worldGroup.add(m);
    pois.push({ id: sp.id, type: 'fuel', name: sp.name, x: sp.x, z: sp.z, radius: 10 });
  }

  // Moshina Ustaxonalari (Car Workshops + NPC Mechanic Workers)
  const ustaxonaSpecs = [
    { id: 'ustaxona_1', name: 'Toshkent Avtoservis Ustaxonasi', x: USTAXONA_COORDS.x, z: USTAXONA_COORDS.z },
    { id: 'ustaxona_2', name: 'Xorazm Avto Ustaxonasi', x: -294, z: -355 },
  ];
  for (const sp of ustaxonaSpecs) {
    const m = createUstaxonaWorkshopMesh(sp.name, workers);
    m.position.set(sp.x, 0, sp.z);
    m.rotation.y = -Math.PI / 2;
    worldGroup.add(m);
    pois.push({ id: sp.id, type: 'ustaxona', name: sp.name, x: sp.x - 4, z: sp.z, radius: 12 });
    colliders.push({ x: sp.x + 5.2, z: sp.z, rx: 2.0, rz: 7.4, label: sp.name });
  }

  // Ish Markazi (Logistika / Taksi / Pul Topish)
  const ishSpecs = [
    { id: 'ish_1', name: 'Toshkent Ish Markazi & Logistika', x: ISH_MARKAZI_COORDS.x, z: ISH_MARKAZI_COORDS.z },
    { id: 'ish_2', name: 'Samarqand Yuk & Taksi Markazi', x: 344, z: -355 },
  ];
  for (const sp of ishSpecs) {
    const m = createIshMarkaziMesh(sp.name, workers);
    m.position.set(sp.x, 0, sp.z);
    m.rotation.y = sp.x < 0 ? Math.PI / 2 : -Math.PI / 2;
    worldGroup.add(m);
    const doorOffset = sp.x < 0 ? 4.5 : -4.5;
    pois.push({ id: sp.id, type: 'ish_markazi', name: sp.name, x: sp.x + doorOffset, z: sp.z, radius: 11.5 });
    colliders.push({ x: sp.x - (sp.x < 0 ? 1.5 : -1.5), z: sp.z, rx: 4.8, rz: 6.5, label: sp.name });
  }

  // Prava Xona + 3D Avtodrom
  const avtodromRes = createPravaXonaAndAvtodrom(worldGroup);
  pois.push({
    id: 'prava_xona_1',
    type: 'prava_xona',
    name: 'Prava Xona • Avtomaktab',
    x: PRAVA_XONA_COORDS.x,
    z: PRAVA_XONA_COORDS.z,
    radius: 13.5,
  });
  colliders.push({ x: PRAVA_XONA_COORDS.x, z: PRAVA_XONA_COORDS.z, rx: 7.2, rz: 5.2, label: 'Prava Xona' });

  // Jang Maydoni (Battle Arena)
  createJangMaydoniArena(worldGroup);
  pois.push({
    id: 'jang_maydoni_1',
    type: 'jang_maydoni',
    name: 'Jang Maydoni (Miltiq & Arena)',
    x: JANG_MAYDONI_CENTER.x + 22,
    z: JANG_MAYDONI_CENTER.z,
    radius: 16,
  });

  // 4B. Yangi Shahar Obyektlari: Chorsu Bozor, Favvoralar, Bekatlar, Kiosklar, Tramplinlar, Daraxtlar!
  const chorsuBazaar = createChorsuBazaarMesh('Chorsu Bozor');
  chorsuBazaar.position.set(-40, 0, -40);
  worldGroup.add(chorsuBazaar);
  colliders.push({ x: -40, z: -40, rx: 12.5, rz: 12.5, label: 'Chorsu Bozor' });

  const fountainPositions: [number, number][] = [
    [40, 40],
    [-120, -40],
    [120, -120],
    [-280, -280],
    [280, -280],
  ];
  for (const [fx, fz] of fountainPositions) {
    const f = createFountainMesh();
    f.position.set(fx, 0, fz);
    worldGroup.add(f);
    colliders.push({ x: fx, z: fz, rx: 5.2, rz: 5.2, label: 'Shahar Favvorasi' });
  }

  const busStops: { x: number; z: number; rot: number }[] = [
    { x: -13.5, z: 22, rot: Math.PI / 2 },
    { x: 13.5, z: 125, rot: -Math.PI / 2 },
    { x: -93.5, z: 32, rot: Math.PI / 2 },
    { x: 93.5, z: -32, rot: -Math.PI / 2 },
    { x: 25, z: 93.5, rot: Math.PI },
    { x: -25, z: -93.5, rot: 0 },
  ];
  for (const bs of busStops) {
    const b = createBusStopMesh();
    b.position.set(bs.x, 0, bs.z);
    b.rotation.y = bs.rot;
    worldGroup.add(b);
  }

  const kiosks: { x: number; z: number; title: string; color: number }[] = [
    { x: 24, z: 18, title: 'SAMSA & CHOY', color: 0xea580c },
    { x: -24, z: 105, title: 'MUZQAYMOQ 24/7', color: 0x06b6d4 },
    { x: 104, z: 24, title: 'SHASHLIK MARKAZI', color: 0xdc2626 },
    { x: -104, z: -24, title: 'NONVOYXONA', color: 0xd97706 },
  ];
  for (const ks of kiosks) {
    const k = createKioskMesh(ks.title, ks.color);
    k.position.set(ks.x, 0, ks.z);
    worldGroup.add(k);
    colliders.push({ x: ks.x, z: ks.z, rx: 2.0, rz: 1.6, label: ks.title });
  }

  // 3D Tramplinlar (Jump Ramps along wide avenues)
  const rampSpecs: { x: number; z: number; axis: 'ns' | 'ew'; rot: number }[] = [
    { x: 4.5, z: 195, axis: 'ns', rot: 0 },
    { x: -4.5, z: -135, axis: 'ns', rot: Math.PI },
    { x: 205, z: 4.5, axis: 'ew', rot: Math.PI / 2 },
    { x: -205, z: -4.5, axis: 'ew', rot: -Math.PI / 2 },
    { x: 164.5, z: -195, axis: 'ns', rot: 0 },
  ];
  for (const rs of rampSpecs) {
    const rMesh = createJumpRampMesh();
    rMesh.position.set(rs.x, 0, rs.z);
    rMesh.rotation.y = rs.rot;
    worldGroup.add(rMesh);
    ramps.push({ x: rs.x, z: rs.z, width: 5.8, length: 7.8, axis: rs.axis });
  }

  // Player's Own Villa & Complete Hub ("Mening Uyim")
  const myHomeMesh = createPlayerHomeMesh();
  myHomeMesh.position.set(MY_HOME_COORDS.x, 0, MY_HOME_COORDS.z);
  worldGroup.add(myHomeMesh);
  pois.push({
    id: 'my_home_1',
    type: 'my_home',
    name: 'Mening Uyim (Villa & Hamma Narsa)',
    x: MY_HOME_COORDS.x,
    z: MY_HOME_COORDS.z - 14,
    radius: 13.5,
  });
  colliders.push({
    x: MY_HOME_COORDS.x + 2,
    z: MY_HOME_COORDS.z + 9,
    rx: 8.5,
    rz: 6.2,
    label: 'Mening Uyim',
  });

  // Bumpy / Uneven Asphalt Road Sections ("O'mpaq yo'l")
  const bumpSpecs: { x: number; z: number; rot: number; axis: 'ns' | 'ew'; intensity: number; label: string }[] = [
    { x: 0, z: 126, rot: 0, axis: 'ns', intensity: 1.0, label: 'Amir Temur O‘mpaq Yo‘l' },
    { x: 0, z: -124, rot: 0, axis: 'ns', intensity: 1.1, label: 'Shimoliy O‘mpaq Yo‘l' },
    { x: 115, z: 0, rot: Math.PI / 2, axis: 'ew', intensity: 1.0, label: 'Sharqiy O‘mpaq Yo‘l' },
    { x: -115, z: 0, rot: Math.PI / 2, axis: 'ew', intensity: 1.0, label: 'G‘arbiy O‘mpaq Yo‘l' },
    { x: 0, z: 265, rot: 0, axis: 'ns', intensity: 1.25, label: 'A-380 Chuqur & O‘mpaq' },
  ];
  for (const bs of bumpSpecs) {
    const bm = createRoadBumpPatchMesh();
    bm.position.set(bs.x, 0, bs.z);
    bm.rotation.y = bs.rot;
    worldGroup.add(bm);
    roadBumps.push({
      x: bs.x,
      z: bs.z,
      rx: bs.axis === 'ns' ? 8.5 : 6.2,
      rz: bs.axis === 'ns' ? 6.2 : 8.5,
      intensity: bs.intensity,
      label: bs.label,
    });
  }

  // 5. Iconic City District Landmarks & Highway Gantry Signs
  const tvTower = createTashkentTVTower();
  tvTower.position.set(-125, 0, 125);
  worldGroup.add(tvTower);
  colliders.push({ x: -125, z: 125, rx: 7, rz: 7, label: 'Toshkent Teleminorasi' });

  const tashkentSign = createHighwayGantrySign('TOSHKENT SHAHRI • MARKAZ', 'AMIR TEMUR SHOH KO‘CHASI');
  tashkentSign.position.set(0, 0, 32);
  worldGroup.add(tashkentSign);

  const m39Sign = createHighwayGantrySign('A-380 XALQARO MAGISTRAL', 'TOSHKENT ➔ SAMARQAND ➔ XIVA');
  m39Sign.position.set(0, 0, 290);
  worldGroup.add(m39Sign);

  const kaltaMinor = createKhivaKaltaMinor();
  kaltaMinor.position.set(-362, 0, -280);
  worldGroup.add(kaltaMinor);
  colliders.push({ x: -362, z: -280, rx: 6, rz: 6, label: 'Kalta Minor' });

  const khivaGate = createIchanQalaGate();
  khivaGate.position.set(-320, 0, -275);
  worldGroup.add(khivaGate);

  const khivaSign = createHighwayGantrySign('XORAZM VILOYATI • XIVA', 'ICHAN QAL‘A & KALTA MINOR');
  khivaSign.position.set(-320, 0, -215);
  worldGroup.add(khivaSign);

  const registanGate = createIchanQalaGate();
  registanGate.position.set(320, 0, -275);
  worldGroup.add(registanGate);

  const registanTower = createKhivaKaltaMinor();
  registanTower.position.set(362, 0, -275);
  worldGroup.add(registanTower);
  colliders.push({ x: 362, z: -275, rx: 6, rz: 6, label: 'Registon Minorasi' });

  const samarkandSign = createHighwayGantrySign('SAMARQAND SHAHRI', 'REGISTON MAYDONI • BUYUK IPAK YO‘LI');
  samarkandSign.position.set(320, 0, -215);
  worldGroup.add(samarkandSign);

  // 6. Sunlit Toshkent Avenue Shop/Apartment Blocks + Skyline Towers (respecting ALL 30 roads & POIs!)
  const isNearRoad = (x: number, z: number) =>
    ALL_ROAD_AXES.some((ax) => Math.abs(x - ax) < 22 || Math.abs(z - ax) < 22);

  const isNearSpecialZone = (x: number, z: number) =>
    pois.some((p) => Math.hypot(p.x - x, p.z - z) < 26) ||
    Math.hypot(x - MY_HOME_COORDS.x, z - MY_HOME_COORDS.z) < 32 ||
    Math.hypot(x + 40, z + 40) < 26 ||
    Math.hypot(x - AVTODROM_CENTER.x, z - AVTODROM_CENTER.z) < 48 ||
    Math.hypot(x - JANG_MAYDONI_CENTER.x, z - JANG_MAYDONI_CENTER.z) < 44;

  // Realistic Neighborhood Uzbek Hovli Houses framing residential blocks ("Uylarni rost qil")
  const mahallaHouseSpots: { x: number; z: number; rot: number; v: number }[] = [
    { x: -45, z: 38, rot: 0, v: 0 },
    { x: -45, z: 122, rot: Math.PI, v: 1 },
    { x: 45, z: -42, rot: 0, v: 2 },
    { x: 45, z: -122, rot: Math.PI, v: 3 },
    { x: -125, z: 38, rot: 0, v: 1 },
    { x: -125, z: -122, rot: Math.PI, v: 0 },
    { x: 125, z: 42, rot: 0, v: 3 },
    { x: 125, z: 122, rot: Math.PI, v: 2 },
    { x: 45, z: 202, rot: 0, v: 0 },
    { x: -45, z: -202, rot: Math.PI, v: 2 },
    { x: 125, z: -202, rot: 0, v: 1 },
    { x: -125, z: 202, rot: Math.PI, v: 3 },
  ];
  for (const hs of mahallaHouseSpots) {
    if (isNearRoad(hs.x, hs.z) || isNearSpecialZone(hs.x, hs.z)) continue;
    const uHouse = createRealisticUzbekHouseMesh(hs.v);
    uHouse.position.set(hs.x, 0, hs.z);
    uHouse.rotation.y = hs.rot;
    worldGroup.add(uHouse);
    colliders.push({ x: hs.x, z: hs.z + 2.0, rx: 6.2, rz: 5.0, label: 'Hovli Uy' });
  }

  // Classic 4-6 story avenueside Tashkent blocks framing main streets
  for (let z = -340; z <= 340; z += 44) {
    if (ALL_ROAD_AXES.some((ax) => Math.abs(z - ax) < 24)) continue;
    for (const bx of [-25.5, 25.5, -105.5, 105.5]) {
      if (isNearSpecialZone(bx, z)) continue;
      const h = 14 + (Math.abs(z) % 3) * 4;
      const w = 13;
      const block = createCitySpire(h, w);
      block.position.set(bx, 0, z);
      worldGroup.add(block);
      colliders.push({ x: bx, z, rx: w * 0.54, rz: w * 0.54, label: 'Shahar Binosi' });
    }
  }

  for (let i = 0; i < 100; i++) {
    const bx = (Math.sin(i * 17.3) * 0.5 + Math.cos(i * 31.7) * 0.5) * 515;
    const bz = (Math.cos(i * 23.1) * 0.5 + Math.sin(i * 11.9) * 0.5) * 515;
    if (isNearRoad(bx, bz) || isNearSpecialZone(bx, bz)) continue;
    if (i % 3 === 0) {
      const uh = createRealisticUzbekHouseMesh(i);
      uh.position.set(bx, 0, bz);
      uh.rotation.y = ((i % 4) * Math.PI) / 2;
      worldGroup.add(uh);
      colliders.push({ x: bx, z: bz, rx: 6.0, rz: 5.0, label: 'Hovli Uy' });
    } else {
      const h = 24 + (i % 7) * 12;
      const w = 9 + (i % 4) * 2.5;
      const spire = createCitySpire(h, w);
      spire.position.set(bx, 0, bz);
      worldGroup.add(spire);
      colliders.push({ x: bx, z: bz, rx: w * 0.54, rz: w * 0.54, label: 'Bino' });
    }
  }

  // Dense lush Chinor trees lining central avenues & neighborhood boulevards (just like the cover!)
  for (let t = -440; t <= 440; t += 38) {
    if (ALL_ROAD_AXES.some((ax) => Math.abs(t - ax) < 17)) continue;
    for (const ax of [-160, -80, 0, 80, 160]) {
      for (const side of [-14.8, 14.8]) {
        if (isNearSpecialZone(ax + side, t)) continue;
        const tree = createStreetTreeMesh(0.95 + (Math.abs(t + ax) % 3) * 0.14);
        tree.position.set(ax + side, 0, t);
        worldGroup.add(tree);
      }
    }
  }

  // 7. Street lights along central avenues (skipping intersections) + pole colliders
  for (let z = -460; z <= 460; z += 75) {
    if (ALL_ROAD_AXES.some((ax) => Math.abs(z - ax) < 20)) continue;
    const l1 = createStreetLightPole();
    l1.position.set(-13.5, 0, z);
    worldGroup.add(l1);
    colliders.push({ x: -13.5, z, rx: 0.7, rz: 0.7, label: 'Chiroq Ustuni' });

    const l2 = createStreetLightPole();
    l2.position.set(13.5, 0, z);
    l2.rotation.y = Math.PI;
    worldGroup.add(l2);
    colliders.push({ x: 13.5, z, rx: 0.7, rz: 0.7, label: 'Chiroq Ustuni' });
  }

  return {
    pois,
    beaconPairs,
    trafficLights,
    crosswalks,
    avtodromCones: avtodromRes.cones,
    colliders,
    workers,
    ramps,
    roadBumps,
  };
}
