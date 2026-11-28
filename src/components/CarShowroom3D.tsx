/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShipModel, ShipColor, CarCustomization } from '../types/game';
import { COLOR_SCHEMES } from '../data/constants';
import { createHovercraft, VehicleParts } from '../game/models';
import { isSoftwareGl } from '../game/materials';
import { Rotate3d } from 'lucide-react';

interface CarShowroom3DProps {
  model: ShipModel;
  color: ShipColor;
  customization?: CarCustomization;
}

export const CarShowroom3D: React.FC<CarShowroom3DProps> = ({ model, color, customization }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<VehicleParts | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const turntableRef = useRef<THREE.Group | null>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Manual drag rotation
  const isDraggingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const manualRotYRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(4.6, 2.35, 5.1);
    camera.lookAt(0, 0.65, 0);

    // 3. Studio Reflections
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {}

    // 4. Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    const fillLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 1.2);
    scene.add(fillLight);

    // 5. Glowing Neon Showroom Turntable Platform
    const turntable = new THREE.Group();
    turntableRef.current = turntable;

    const platformGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.18, 36);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.9,
      roughness: 0.25,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.09;
    platform.receiveShadow = true;
    turntable.add(platform);

    // Glowing Neon Ring Edge
    const ringGeo = new THREE.TorusGeometry(3.3, 0.06, 8, 36);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: COLOR_SCHEMES[color].glow });
    ringMatRef.current = ringMat;
    const neonRing = new THREE.Mesh(ringGeo, ringMat);
    neonRing.position.y = 0.01;
    turntable.add(neonRing);

    // Circular contact shadow
    const shadowGeo = new THREE.PlaneGeometry(3.2, 5.0);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.65,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.02;
    turntable.add(shadow);

    scene.add(turntable);

    // 6. Build 3D Car Model
    const parts = createHovercraft(model, color, customization);
    partsRef.current = parts;
    carGroupRef.current = parts.group;
    turntable.add(parts.group);

    // 7. Interactive Drag Handlers
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevPointerXRef.current = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevPointerXRef.current;
      prevPointerXRef.current = e.clientX;
      manualRotYRef.current += dx * 0.015;
    };
    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 8. Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Auto rotation + manual drag
      if (!isDraggingRef.current) {
        manualRotYRef.current += delta * 0.55;
      }
      turntable.rotation.y = manualRotYRef.current;

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const ro = new ResizeObserver(() => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // Teardown
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, []);

  // Live Update Car Model & Color when changed!
  useEffect(() => {
    if (!turntableRef.current) return;
    const turntable = turntableRef.current;

    if (ringMatRef.current) {
      ringMatRef.current.color.setHex(COLOR_SCHEMES[color].glow);
    }

    // Remove existing car group
    if (carGroupRef.current) {
      turntable.remove(carGroupRef.current);
    }

    // Build new updated 3D car model
    const newParts = createHovercraft(model, color, customization);
    partsRef.current = newParts;
    carGroupRef.current = newParts.group;

    // Animate pop entry
    newParts.group.scale.set(0.1, 0.1, 0.1);
    let scaleVal = 0.1;
    const scaleAnim = () => {
      scaleVal += 0.15;
      if (scaleVal >= 1.0) {
        newParts.group.scale.set(1, 1, 1);
      } else {
        newParts.group.scale.set(scaleVal, scaleVal, scaleVal);
        requestAnimationFrame(scaleAnim);
      }
    };
    scaleAnim();

    turntable.add(newParts.group);
  }, [model, color, customization]);

  return (
    <div className="relative w-full h-56 sm:h-72 rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 border border-slate-800 shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* 360 Spin Hint Badge */}
      <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-700/60 text-slate-300 text-[11px] font-semibold backdrop-blur-md shadow-sm">
        <Rotate3d className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        <span>360° Aylantirib ko‘rish</span>
      </div>

      {/* Lighting reflection floor fade */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
};
