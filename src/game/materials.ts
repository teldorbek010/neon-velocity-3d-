/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// Detect software WebGL as instructed by Three.js skill directives
export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

// Helper to create procedural cyber grid texture
export function createTrackTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark asphalt cyber base
  ctx.fillStyle = '#050814';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle grid lines
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  const step = 64;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Glowing center highway dividers
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 12;

  // Dashed center line
  ctx.setLineDash([48, 48]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  // Edge neon strips
  ctx.setLineDash([]);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(12, 512);
  ctx.moveTo(500, 0);
  ctx.lineTo(500, 512);
  ctx.stroke();

  // Lateral glowing warning notches
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 4;
  for (let y = 32; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(36, y);
    ctx.moveTo(512 - 36, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

// Procedural speed pad chevron texture
export function createBoostPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 256, 256);

  // Chevron arrows
  ctx.fillStyle = '#10b981';
  ctx.shadowColor = '#34d399';
  ctx.shadowBlur = 16;

  for (let i = 0; i < 3; i++) {
    const yOffset = 40 + i * 70;
    ctx.beginPath();
    ctx.moveTo(128, yOffset);
    ctx.lineTo(210, yOffset + 50);
    ctx.lineTo(185, yOffset + 50);
    ctx.lineTo(128, yOffset + 15);
    ctx.lineTo(71, yOffset + 50);
    ctx.lineTo(46, yOffset + 50);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural obstacle warning stripe texture
export function createWarningTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#09090b';
  for (let x = -64; x < 256 + 64; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x - 8, 64);
    ctx.lineTo(x - 24, 64);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
