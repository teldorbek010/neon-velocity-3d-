/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ShipModel, HeadlightStyleId, TaillightStyleId } from '../types/game';
import { HEADLIGHT_STYLES, TAILLIGHT_STYLES } from '../data/constants';
import { CAR_BLUEPRINTS } from './carBlueprints';

const frontTexCache = new Map<string, THREE.CanvasTexture>();
const rearTexCache = new Map<string, THREE.CanvasTexture>();

function setBoundedCache(cache: Map<string, THREE.CanvasTexture>, key: string, tex: THREE.CanvasTexture) {
  if (cache.size > 36) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      const old = cache.get(firstKey);
      old?.dispose();
      cache.delete(firstKey);
    }
  }
  cache.set(key, tex);
}

function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

function drawUzPlate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, plate: string) {
  ctx.save();
  // Outer black plate frame
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 4);
  ctx.fill();

  // White plate background
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2);
  ctx.fill();

  // Region box divider ("01")
  const regW = w * 0.22;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + regW, y);
  ctx.lineTo(x + regW, y + h);
  ctx.stroke();

  const parts = plate.split(' ');
  const reg = parts[0] || '01';
  const rest = parts.slice(1).join(' ') || 'A 777 AA';

  ctx.fillStyle = '#020617';
  ctx.font = `900 ${Math.round(h * 0.56)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(reg, x + regW * 0.5, y + h * 0.54);

  // UZ flag strip + letters on right edge
  const flagW = w * 0.14;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(x + w - flagW, y + 1, flagW - 1, h * 0.30);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x + w - flagW, y + h * 0.30, flagW - 1, h * 0.22);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(x + w - flagW, y + h * 0.52, flagW - 1, h * 0.20);
  ctx.fillStyle = '#0284c7';
  ctx.font = `900 ${Math.round(h * 0.26)}px sans-serif`;
  ctx.fillText('UZ', x + w - flagW * 0.5, y + h * 0.85);

  // Main plate characters
  ctx.fillStyle = '#020617';
  ctx.font = `900 ${Math.round(h * 0.54)}px monospace`;
  ctx.fillText(rest, x + regW + (w - regW - flagW) * 0.5, y + h * 0.54);
  ctx.restore();
}

function drawChevroletBowtie(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Silver chrome outline
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-22, -6);
  ctx.lineTo(-7, -6);
  ctx.lineTo(-7, -11);
  ctx.lineTo(7, -11);
  ctx.lineTo(7, -6);
  ctx.lineTo(25, -6);
  ctx.lineTo(20, 6);
  ctx.lineTo(7, 6);
  ctx.lineTo(7, 11);
  ctx.lineTo(-7, 11);
  ctx.lineTo(-7, 6);
  ctx.lineTo(-25, 6);
  ctx.closePath();
  ctx.fill();

  // Inner gold fill
  const grad = ctx.createLinearGradient(-15, -10, 15, 10);
  grad.addColorStop(0, '#fde047');
  grad.addColorStop(0.5, '#eab308');
  grad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-19, -4);
  ctx.lineTo(-5, -4);
  ctx.lineTo(-5, -9);
  ctx.lineTo(5, -9);
  ctx.lineTo(5, -4);
  ctx.lineTo(21, -4);
  ctx.lineTo(17, 4);
  ctx.lineTo(5, 4);
  ctx.lineTo(5, 9);
  ctx.lineTo(-5, 9);
  ctx.lineTo(-5, 4);
  ctx.lineTo(-21, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawHoneycombMesh(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 8
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();

  ctx.fillStyle = '#090b10';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  for (let gx = x; gx <= x + w; gx += 12) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + 10, y + h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx + 10, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

export function getFrontFasciaTexture(
  model: ShipModel,
  bodyPrimaryHex: number,
  plateNumber?: string,
  headlightStyle: HeadlightStyleId = 'xenon'
): THREE.CanvasTexture {
  const bp = CAR_BLUEPRINTS[model];
  const plate = (plateNumber && plateNumber.trim()) || bp.plateNumber;
  const key = `${model}_${bodyPrimaryHex}_${plate}_${headlightStyle}`;
  const cached = frontTexCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const bodyCss = hexToCss(bodyPrimaryHex);
  const hlCss = (HEADLIGHT_STYLES[headlightStyle] || HEADLIGHT_STYLES.xenon).css;

  // Fill with car body color
  ctx.fillStyle = bodyCss;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle top hood shadow line
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 0, 512, 16);

  if (model === 'damas') {
    // Classic flat cab-over Damas face
    // Upper cowl air vents
    ctx.fillStyle = '#18181b';
    for (let vx = 185; vx <= 325; vx += 14) {
      ctx.fillRect(vx, 22, 8, 20);
    }

    // Center tiny grille strip + badge
    ctx.fillStyle = '#111827';
    ctx.fillRect(156, 76, 200, 34);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(156, 76, 200, 34);
    drawChevroletBowtie(ctx, 256, 93, 0.72);

    // Classic Damas rectangular halogen headlights with corner turn amber
    for (const side of [-1, 1]) {
      const hx = side === -1 ? 36 : 368;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(hx - 4, 66, 116, 62);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(hx + (side === -1 ? 26 : 0), 70, 82, 54);
      // Reflector inner lens
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + (side === -1 ? 32 : 6), 76, 70, 42);
      // Amber turn signal corner
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(side === -1 ? hx : hx + 86, 70, 22, 54);
    }

    // Thick matte dark grey plastic Damas bumper + lower fog lamps
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 150, 512, 106);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(130, 174, 252, 42);
    for (const fx of [62, 450]) {
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(fx - 26, 178, 52, 26, 6);
      ctx.fill();
      ctx.fillStyle = hlCss;
      ctx.beginPath();
      ctx.roundRect(fx - 20, 182, 40, 18, 4);
      ctx.fill();
    }
    drawUzPlate(ctx, 194, 178, 124, 34, plate);
  } else if (model === 'matiz') {
    // Friendly Matiz face with iconic round-oval headlights & smiling intake
    // Matte dark grey lower bumper
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 166, 512, 90);

    // Center oval air intake + smiling lower grille
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(172, 106, 168, 36, 18);
    ctx.fill();
    drawChevroletBowtie(ctx, 256, 78, 0.8);

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(140, 182, 232, 46, 16);
    ctx.fill();

    // Big iconic oval Matiz eyes!
    for (const side of [-1, 1]) {
      const cx = side === -1 ? 82 : 430;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx, 88, 52, 42, side * -0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(cx, 88, 44, 35, side * -0.18, 0, Math.PI * 2);
      ctx.fill();

      // Projector bulb circle
      ctx.fillStyle = hlCss;
      ctx.beginPath();
      ctx.arc(cx, 88, 20, 0, Math.PI * 2);
      ctx.fill();

      // Amber round turn light below
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + side * 12, 146, 13, 0, Math.PI * 2);
      ctx.fill();

      // Lower bumper round fog lamp
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(side === -1 ? 76 : 436, 204, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(side === -1 ? 76 : 436, 204, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    drawUzPlate(ctx, 194, 188, 124, 34, plate);
  } else if (model === 'spark') {
    // Aggressive Chevrolet Spark dual-port grille + huge diamond swept headlights
    // Upper grille
    drawHoneycombMesh(ctx, 160, 62, 192, 44, 10);
    // Body crossbar
    ctx.fillStyle = bodyCss;
    ctx.fillRect(150, 106, 212, 22);
    // Lower large grille
    drawHoneycombMesh(ctx, 132, 128, 248, 86, 14);
    // Chrome surround
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(132, 128, 248, 86, 14);
    ctx.stroke();

    drawChevroletBowtie(ctx, 256, 116, 0.92);

    // Huge swept-back Spark headlights
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (side === -1) {
        ctx.moveTo(22, 34);
        ctx.lineTo(136, 76);
        ctx.lineTo(124, 124);
        ctx.lineTo(28, 102);
      } else {
        ctx.moveTo(490, 34);
        ctx.lineTo(376, 76);
        ctx.lineTo(388, 124);
        ctx.lineTo(484, 102);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Amber turn strip
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(side === -1 ? 30 : 458, 56, 24, 36);
      ctx.restore();
    }

    // Round fog lights in lower black corners
    for (const fx of [62, 450]) {
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(fx, 184, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(fx, 184, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    drawUzPlate(ctx, 192, 148, 128, 34, plate);
  } else if (model === 'cobalt') {
    // Tall Cobalt nose: iconic split Chevrolet grille divided by body bar + tall boxy headlights
    drawHoneycombMesh(ctx, 146, 62, 220, 44, 10);
    // Body-colored horizontal divider bar
    ctx.fillStyle = bodyCss;
    ctx.fillRect(140, 106, 232, 22);
    // Lower port
    drawHoneycombMesh(ctx, 152, 128, 208, 66, 12);

    // Chrome rim around Cobalt grille
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(146, 62, 220, 132, 14);
    ctx.stroke();

    drawChevroletBowtie(ctx, 256, 117, 1.0);

    // Large boxy-rounded Cobalt headlamps
    for (const side of [-1, 1]) {
      const x = side === -1 ? 26 : 362;
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(x, 60, 124, 70, 14);
      ctx.fill();
      ctx.stroke();

      // Inner round dual reflector bowls
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(x + 42, 95, 22, 0, Math.PI * 2);
      ctx.arc(x + 86, 95, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lower bumper intake & fog lights
    ctx.fillStyle = '#090d16';
    ctx.fillRect(136, 212, 240, 32);
    for (const fx of [66, 446]) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(fx - 26, 178, 52, 34, 8);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(fx, 195, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    drawUzPlate(ctx, 192, 198, 128, 34, plate);
  } else if (model === 'gentra') {
    // Classic Gentra / Lacetti: 3-bar horizontal chrome slat grille + narrow swept headlights
    drawHoneycombMesh(ctx, 154, 74, 204, 52, 10);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(154, 74, 204, 52, 10);
    ctx.stroke();

    // 3 Chrome horizontal bars
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(160, 88, 192, 4);
    ctx.fillRect(160, 100, 192, 5);
    ctx.fillRect(160, 112, 192, 4);
    drawChevroletBowtie(ctx, 256, 100, 0.9);

    // Sleek horizontal Gentra headlamps
    for (const side of [-1, 1]) {
      const x = side === -1 ? 22 : 352;
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, 70, 138, 48, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(side === -1 ? x + 6 : x + 114, 78, 18, 32);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(x + (side === -1 ? 74 : 64), 94, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Black Gentra bumper guard + lower wide grille + fog lamps
    ctx.fillStyle = '#111827';
    ctx.fillRect(90, 174, 332, 42);
    for (const fx of [56, 456]) {
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(fx, 194, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(fx, 194, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    drawUzPlate(ctx, 192, 146, 128, 34, plate);
  } else if (model === 'nexia3') {
    // Ravon Nexia-3 (T250): large angular headlights, chrome horizontal bar + black lower mouth
    drawHoneycombMesh(ctx, 160, 68, 192, 46, 8);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(160, 68, 192, 46, 8);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(164, 88, 184, 6);
    drawChevroletBowtie(ctx, 256, 91, 0.88);

    // Lower trapezoidal bumper mouth
    drawHoneycombMesh(ctx, 138, 158, 236, 56, 10);

    // Large wraparound Nexia-3 headlamps
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (side === -1) {
        ctx.moveTo(22, 54);
        ctx.lineTo(146, 72);
        ctx.lineTo(138, 126);
        ctx.lineTo(26, 114);
      } else {
        ctx.moveTo(490, 54);
        ctx.lineTo(366, 72);
        ctx.lineTo(374, 126);
        ctx.lineTo(486, 114);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(side === -1 ? 30 : 464, 72, 18, 36);
    }

    drawUzPlate(ctx, 192, 166, 128, 34, plate);
  } else if (model === 'malibu2' || model === 'onix' || model === 'monza') {
    // Modern Chevrolet Facia: sleek upper grille + massive lower grille + sharp LED headlights
    const isMonza = model === 'monza';
    const isMalibu = model === 'malibu2';

    // Upper slim grille
    drawHoneycombMesh(ctx, 140, 54, 232, 34, 8);
    // Lower massive dual-port grille
    drawHoneycombMesh(ctx, 110, 104, 292, 98, 16);

    // Chrome surround (Malibu) or Gloss Black/Red (Monza RS)
    ctx.strokeStyle = isMonza ? '#ef4444' : '#e2e8f0';
    ctx.lineWidth = isMalibu ? 5 : 3;
    ctx.beginPath();
    ctx.roundRect(110, 104, 292, 98, 16);
    ctx.stroke();

    // Crossbar & Chevrolet bowtie (dark black bowtie for Monza RS!)
    ctx.fillStyle = bodyCss;
    ctx.fillRect(128, 86, 256, 20);
    drawChevroletBowtie(ctx, 256, 94, 0.92);

    if (isMonza) {
      // Red RS badge!
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(320, 62, 38, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RS', 339, 75);
    }

    // Sleek sharp projector LED headlights + bright DRL signature
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      if (side === -1) {
        ctx.moveTo(18, 46);
        ctx.lineTo(136, 62);
        ctx.lineTo(126, 92);
        ctx.lineTo(22, 82);
      } else {
        ctx.moveTo(494, 46);
        ctx.lineTo(376, 62);
        ctx.lineTo(386, 92);
        ctx.lineTo(490, 82);
      }
      ctx.closePath();
      ctx.fill();

      // Glowing white LED DRL strip + projector dual lenses
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (side === -1) {
        ctx.moveTo(24, 78);
        ctx.lineTo(122, 86);
      } else {
        ctx.moveTo(488, 78);
        ctx.lineTo(390, 86);
      }
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(side === -1 ? 66 : 446, 68, 9, 0, Math.PI * 2);
      ctx.arc(side === -1 ? 98 : 414, 71, 9, 0, Math.PI * 2);
      ctx.fill();

      // Side air curtains & vertical LED DRLs (Malibu / Onix)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(side === -1 ? 26 : 434, 128, 52, 68);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(side === -1 ? 36 : 468, 134, 8, 52);
    }

    // Lower front lip splitter
    ctx.fillStyle = isMonza ? '#ef4444' : '#090d16';
    ctx.fillRect(0, 224, 512, 32);

    drawUzPlate(ctx, 192, 138, 128, 34, plate);
  } else if (model === 'tracker2') {
    // Tracker 2 Crossover SUV: Split headlights + vertical boomerang DRLs + black cladding + silver skid plate
    drawHoneycombMesh(ctx, 136, 48, 240, 38, 8);
    ctx.fillStyle = bodyCss;
    ctx.fillRect(130, 86, 252, 18);
    drawHoneycombMesh(ctx, 120, 104, 272, 90, 14);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(120, 104, 272, 90, 14);
    ctx.stroke();

    drawChevroletBowtie(ctx, 256, 94, 0.95);

    // Upper thin DRL eyebrows + lower dual-projector pods + boomerang LED L-DRL
    for (const side of [-1, 1]) {
      const bx = side === -1 ? 24 : 380;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(bx, 48, 108, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 8, 56, 92, 8);

      // Vertical lower bumper pocket with boomerang DRL
      const px = side === -1 ? 28 : 422;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(px, 104, 62, 84);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(px + (side === -1 ? 14 : 34), 114, 14, 56);
    }

    // Rugged black SUV bumper & silver center skid plate
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 206, 512, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(140, 214, 232, 34, 6);
    ctx.fill();

    drawUzPlate(ctx, 192, 138, 128, 34, plate);
  } else if (model === 'byd_uz') {
    // BYD Chazor: Ocean Aesthetics borderless cascading horizontal chrome grille + Starlight Warship LEDs!
    // Cascading horizontal silver/chrome louvres across wide nose
    drawHoneycombMesh(ctx, 64, 92, 384, 122, 18);
    ctx.fillStyle = '#cbd5e1';
    for (let row = 0; row < 6; row++) {
      const ry = 104 + row * 18;
      const w = 360 - row * 22;
      const x = (512 - w) / 2;
      // Broken dashed chrome louvre droplets!
      for (let sx = x; sx < x + w - 18; sx += 26) {
        ctx.fillRect(sx, ry, 18, 5);
      }
    }

    // Top chrome eyebrow spanning full width connecting Starlight Warship headlights
    const chromeGrad = ctx.createLinearGradient(0, 50, 512, 50);
    chromeGrad.addColorStop(0, '#e2e8f0');
    chromeGrad.addColorStop(0.5, '#f8fafc');
    chromeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = chromeGrad;
    ctx.fillRect(36, 48, 440, 26);

    // Center "BYD" chrome emblem badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(216, 46, 80, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BYD', 256, 62);

    // Starlight Warship LED Dual-Lens Headlights
    for (const side of [-1, 1]) {
      const x = side === -1 ? 22 : 368;
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.roundRect(x, 42, 122, 44, 10);
      ctx.fill();
      // Glowing white dual LED lenses + DRL blade
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 8, 74, 106, 6);
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(x + 38, 60, 11, 0, Math.PI * 2);
      ctx.arc(x + 82, 60, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    drawUzPlate(ctx, 192, 164, 128, 34, plate);
  } else {
    // Supercars (GT-R / Mustang V8 / Hyper Phantom)
    drawHoneycombMesh(ctx, 130, 74, 252, 128, 12);
    for (const side of [-1, 1]) {
      const x = side === -1 ? 24 : 384;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(x, 58, 104, 48);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x + 10, 78, 84, 10);
    }
    drawUzPlate(ctx, 192, 152, 128, 34, plate);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  setBoundedCache(frontTexCache, key, tex);
  return tex;
}

export function getRearFasciaTexture(
  model: ShipModel,
  bodyPrimaryHex: number,
  plateNumber?: string,
  taillightStyle: TaillightStyleId = 'classic_red'
): THREE.CanvasTexture {
  const bp = CAR_BLUEPRINTS[model];
  const plate = (plateNumber && plateNumber.trim()) || bp.plateNumber;
  const tlStyle = TAILLIGHT_STYLES[taillightStyle] || TAILLIGHT_STYLES.classic_red;
  const key = `${model}_${bodyPrimaryHex}_${plate}_${taillightStyle}`;
  const cached = rearTexCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const bodyCss = hexToCss(bodyPrimaryHex);

  ctx.fillStyle = bodyCss;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle trunk lid seam
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(86, 16, 340, 148);

  // Unlit dark tail housing colors (stop lamps only illuminate bright red in 3D when braking!)
  const tlDark = tlStyle.housingCss;
  const tlLens = tlStyle.stripCss;

  if (model === 'damas') {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 158, 512, 98);

    for (const lx of [22, 444]) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(lx - 4, 164, 52, 80);
      // Unlit dark stop lens + amber turn + white reverse
      ctx.fillStyle = tlDark;
      ctx.fillRect(lx, 168, 44, 30);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(lx, 200, 44, 20);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(lx, 222, 44, 18);
    }
    drawUzPlate(ctx, 192, 118, 128, 34, plate);
  } else if (model === 'matiz') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 168, 512, 88);

    for (const side of [-1, 1]) {
      const cx = side === -1 ? 48 : 464;
      ctx.fillStyle = tlDark;
      ctx.beginPath();
      ctx.roundRect(cx - 24, 32, 48, 118, 22);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(cx, 62, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tlLens;
      ctx.beginPath();
      ctx.arc(cx, 102, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(cx, 134, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    drawUzPlate(ctx, 192, 176, 128, 34, plate);
  } else if (model === 'cobalt') {
    for (const side of [-1, 1]) {
      const x = side === -1 ? 24 : 410;
      ctx.fillStyle = tlDark;
      ctx.beginPath();
      ctx.roundRect(x, 40, 78, 108, 10);
      ctx.fill();
      ctx.fillStyle = tlLens;
      ctx.fillRect(x + 8, 48, 62, 54);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 12, 108, 54, 28);
    }
    drawChevroletBowtie(ctx, 256, 64, 0.85);
    drawUzPlate(ctx, 192, 92, 128, 34, plate);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 210, 512, 46);
  } else if (model === 'nexia3') {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(140, 62, 232, 12);
    for (const side of [-1, 1]) {
      const x = side === -1 ? 22 : 362;
      ctx.fillStyle = tlDark;
      ctx.beginPath();
      ctx.roundRect(x, 48, 128, 72, 12);
      ctx.fill();
      ctx.fillStyle = tlLens;
      ctx.beginPath();
      ctx.arc(x + 38, 84, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(x + 92, 84, 17, 0, Math.PI * 2);
      ctx.fill();
    }
    drawChevroletBowtie(ctx, 256, 44, 0.82);
    drawUzPlate(ctx, 192, 98, 128, 34, plate);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 212, 512, 44);
  } else if (model === 'gentra') {
    for (const side of [-1, 1]) {
      const x = side === -1 ? 20 : 344;
      ctx.fillStyle = tlDark;
      ctx.beginPath();
      ctx.roundRect(x, 54, 148, 56, 8);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + (side === -1 ? 76 : 12), 78, 60, 14);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + (side === -1 ? 10 : 108), 60, 30, 14);
    }
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(174, 62, 164, 10);
    drawChevroletBowtie(ctx, 256, 42, 0.8);
    drawUzPlate(ctx, 192, 98, 128, 34, plate);
    ctx.fillStyle = '#111827';
    ctx.fillRect(48, 178, 416, 22);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 216, 512, 40);
  } else if (model === 'byd_uz') {
    ctx.fillStyle = tlDark;
    ctx.beginPath();
    ctx.roundRect(22, 54, 468, 42, 10);
    ctx.fill();

    // Unlit smoked/dark bar until braking
    ctx.fillStyle = tlLens;
    ctx.fillRect(30, 68, 452, 14);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(36, 58, 440, 4);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BYD CHAZOR', 256, 42);

    drawUzPlate(ctx, 192, 120, 128, 34, plate);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(40, 200, 432, 56);
  } else if (model === 'malibu2' || model === 'monza' || model === 'onix' || model === 'tracker2') {
    for (const side of [-1, 1]) {
      const x = side === -1 ? 22 : 344;
      ctx.fillStyle = tlDark;
      ctx.beginPath();
      ctx.roundRect(x, 54, 146, 52, 10);
      ctx.fill();

      ctx.strokeStyle = tlLens;
      ctx.lineWidth = 7;
      ctx.beginPath();
      if (side === -1) {
        ctx.moveTo(x + 12, 64);
        ctx.lineTo(x + 62, 64);
        ctx.lineTo(x + 48, 96);
        ctx.moveTo(x + 76, 66);
        ctx.lineTo(x + 132, 66);
        ctx.lineTo(x + 118, 94);
      } else {
        ctx.moveTo(x + 134, 64);
        ctx.lineTo(x + 84, 64);
        ctx.lineTo(x + 98, 96);
        ctx.moveTo(x + 70, 66);
        ctx.lineTo(x + 14, 66);
        ctx.lineTo(x + 28, 94);
      }
      ctx.stroke();
    }

    drawChevroletBowtie(ctx, 256, 58, 0.88);
    drawUzPlate(ctx, 192, 104, 128, 34, plate);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 198, 512, 58);
    if (model === 'tracker2') {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(134, 212, 244, 34, 8);
      ctx.fill();
    } else if (model === 'malibu2') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 5;
      ctx.strokeRect(56, 212, 76, 26);
      ctx.strokeRect(380, 212, 76, 26);
    }
    ctx.fillStyle = '#521118';
    ctx.fillRect(42, 182, 56, 8);
    ctx.fillRect(414, 182, 56, 8);
  } else {
    for (const side of [-1, 1]) {
      const x = side === -1 ? 26 : 374;
      ctx.fillStyle = tlDark;
      ctx.beginPath();
      ctx.roundRect(x, 56, 112, 64, 14);
      ctx.fill();
      ctx.fillStyle = tlLens;
      ctx.beginPath();
      ctx.arc(x + 34, 88, 17, 0, Math.PI * 2);
      ctx.arc(x + 78, 88, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    drawUzPlate(ctx, 192, 114, 128, 34, plate);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 200, 512, 56);
  }

  // Model badge lettering
  ctx.fillStyle = bodyPrimaryHex === 0xf8fafc || bodyPrimaryHex === 0xd1d5db ? '#334155' : '#e2e8f0';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(bp.rearBadgeText, 36, 154);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  setBoundedCache(rearTexCache, key, tex);
  return tex;
}
