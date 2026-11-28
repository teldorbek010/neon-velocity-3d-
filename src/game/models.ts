/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ShipModel, ShipColor, CarCustomization } from '../types/game';
import { COLOR_SCHEMES, HEADLIGHT_STYLES, TAILLIGHT_STYLES } from '../data/constants';
import { createWarningTexture } from './materials';
import { CAR_BLUEPRINTS, CarBlueprint } from './carBlueprints';
import { getFrontFasciaTexture, getRearFasciaTexture } from './carTextures';

export interface VehicleParts {
  group: THREE.Group;
  thrusters: THREE.Mesh[]; // Exhaust flames
  hoverDisc?: THREE.Mesh;
  headlights: THREE.Mesh[];
  taillights?: THREE.Mesh[];
  headlightBeams?: THREE.Group;
  headlightSpot?: THREE.SpotLight;
  headlightMat?: THREE.MeshBasicMaterial;
  headlightOnHex?: number;
  taillightMat?: THREE.MeshBasicMaterial;
  taillightOffHex?: number;
  taillightBrakeHex?: number;
  leftTurnMat?: THREE.MeshBasicMaterial;
  rightTurnMat?: THREE.MeshBasicMaterial;
  cockpit: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  wheels: THREE.Group[]; // 4 wheels for rotation
  frontSteerPivots: THREE.Group[]; // 2 front wheels for steering angle
  isCar: boolean;
  driverGroup?: THREE.Group;
  steeringWheel?: THREE.Group;
  migalkaGroup?: THREE.Group;
  migalkaRed?: THREE.Mesh;
  migalkaBlue?: THREE.Mesh;
  subwooferGroup?: THREE.Group;
  subwooferCones?: THREE.Mesh[];
  subwooferRings?: THREE.Mesh[];
}

export interface PedestrianParts {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  weaponGroup?: THREE.Group;
  muzzleFlash?: THREE.Mesh;
}

export interface TrafficLightVisual {
  group: THREE.Group;
  redMat: THREE.MeshBasicMaterial;
  yellowMat: THREE.MeshBasicMaterial;
  greenMat: THREE.MeshBasicMaterial;
}

// Builds a clean watertight tapered greenhouse frustum mesh with automotive tumblehome
function buildTaperedCabinGeometry(bp: CarBlueprint): THREE.BufferGeometry {
  const halfL = bp.length / 2;
  const wBot = bp.width * 0.90;
  const wTop = bp.width * bp.tumblehome;

  const zCowl = halfL - bp.hoodLen;
  const zWindTop = halfL - bp.windshieldTopX;
  const zRoofEnd = halfL - bp.roofEndX;
  const zTrunkStart = halfL - bp.trunkStartX;

  const yBotF = bp.cowlY - 0.02;
  const yBotR = bp.trunkY - 0.02;
  const yTop = bp.roofY - 0.025;

  // 4 longitudinal profiles: [z, halfWidth, yBottom, yTop]
  // Using a solid prism from base loop (zCowl -> zTrunkStart) up to roof loop (zWindTop -> zRoofEnd)
  const hxBotF = wBot * 0.5;
  const hxBotR = wBot * 0.485;
  const hxTopF = wTop * 0.5;
  const hxTopR = wTop * 0.49;

  // 8 corner vertices of tapered greenhouse
  // 0: Front-Left Bottom, 1: Front-Right Bottom, 2: Rear-Right Bottom, 3: Rear-Left Bottom
  // 4: Front-Left Top,    5: Front-Right Top,    6: Rear-Right Top,    7: Rear-Left Top
  const positions = new Float32Array([
    -hxBotF, yBotF, zCowl,       // 0
     hxBotF, yBotF, zCowl,       // 1
     hxBotR, yBotR, zTrunkStart, // 2
    -hxBotR, yBotR, zTrunkStart, // 3
    -hxTopF, yTop,  zWindTop,    // 4
     hxTopF, yTop,  zWindTop,    // 5
     hxTopR, yTop,  zRoofEnd,    // 6
    -hxTopR, yTop,  zRoofEnd,    // 7
  ]);

  const indices = [
    // Front Windshield (0, 1, 5, 4) -> facing +Z / +Y
    0, 1, 5,
    0, 5, 4,
    // Rear Window (2, 3, 7, 6) -> facing -Z / +Y
    2, 3, 7,
    2, 7, 6,
    // Left Side Windows (3, 0, 4, 7) -> facing -X / +Y
    3, 0, 4,
    3, 4, 7,
    // Right Side Windows (1, 2, 6, 5) -> facing +X / +Y
    1, 2, 6,
    1, 6, 5,
    // Roof Cap inside (4, 5, 6, 7) -> facing +Y
    4, 5, 6,
    4, 6, 7,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Helper to create a clean cylindrical strut connecting two 3D points (A/B/C pillars)
function createPillarMesh(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  widthX: number,
  depthZ: number,
  mat: THREE.Material
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.BoxGeometry(widthX, len, depthZ);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  return mesh;
}

// Creates an authentic, proportionally accurate 3D Car matching real Uzbekistan models
export function createRealCar(
  model: ShipModel,
  colorId: ShipColor,
  customization?: CarCustomization
): VehicleParts {
  const group = new THREE.Group();
  const colorScheme = COLOR_SCHEMES[colorId] || COLOR_SCHEMES.white;
  const bp = CAR_BLUEPRINTS[model] || CAR_BLUEPRINTS.malibu2;
  const hlStyle = HEADLIGHT_STYLES[customization?.headlightStyle || 'xenon'] || HEADLIGHT_STYLES.xenon;
  const tlStyle = TAILLIGHT_STYLES[customization?.taillightStyle || 'classic_red'] || TAILLIGHT_STYLES.classic_red;
  const customPlate = customization?.plateNumber;

  // Glossy Clearcoat Automotive Paint
  const carPaintMat = new THREE.MeshPhysicalMaterial({
    color: colorScheme.primary,
    metalness: colorId === 'white' ? 0.25 : 0.72,
    roughness: colorId === 'white' ? 0.22 : 0.20,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.25,
    roughness: 0.65,
  });

  const glossBlackMat = new THREE.MeshPhysicalMaterial({
    color: 0x090d16,
    metalness: 0.45,
    roughness: 0.14,
    clearcoat: 0.9,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.96,
    roughness: 0.08,
  });

  const silverSkidMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.85,
    roughness: 0.25,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x16161a,
    roughness: 0.92,
    metalness: 0.08,
  });

  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.35,
    metalness: 0.55,
  });

  // Semi-transparent tinted auto glass so the 3D driver inside is clearly visible!
  const windshieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b172a,
    metalness: 0.35,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    transparent: true,
    opacity: 0.30,
    depthWrite: false,
  });

  const headlightOnHex = hlStyle.lensHex;
  const ledHeadlightMat = new THREE.MeshBasicMaterial({
    color: headlightOnHex,
  });

  // Rear Stop Lamps stay DARK/OFF by default — illuminate bright ONLY when braking!
  const ledTaillightMat = new THREE.MeshBasicMaterial({
    color: tlStyle.offHex,
  });

  const leftTurnMat = new THREE.MeshBasicMaterial({ color: 0x3b2306 });
  const rightTurnMat = new THREE.MeshBasicMaterial({ color: 0x3b2306 });

  const exhaustFlameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.88,
  });

  const thrusters: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];
  const wheels: THREE.Group[] = [];
  const frontSteerPivots: THREE.Group[] = [];

  const bodyGroup = new THREE.Group();
  const halfL = bp.length / 2;
  const carWidth = bp.width;

  // ==========================================
  // 1. LOWER CAR BODY WITH CARVED WHEEL ARCHES
  // ==========================================
  const archR = bp.wheelRadius + bp.archGap;
  const dyArch = Math.max(0.01, bp.wheelRadius - bp.clearance);
  const dropAngle = Math.asin(Math.min(0.92, dyArch / archR));
  const dxArchSpan = Math.cos(dropAngle) * archR;

  const cxF = -bp.wheelBaseF; // In Shape coords, -X maps to +Z (front)
  const cxR = bp.wheelBaseR;  // +X maps to -Z (rear)

  const carLowerProfile = new THREE.Shape();
  // Start at front lower bumper
  carLowerProfile.moveTo(-halfL + 0.06, bp.clearance);
  carLowerProfile.lineTo(cxF - dxArchSpan, bp.clearance);
  // Carve front wheel well clockwise over the front tire
  carLowerProfile.absarc(cxF, bp.wheelRadius, archR, Math.PI + dropAngle, -dropAngle, true);
  // Rocker sill between axles
  carLowerProfile.lineTo(cxR - dxArchSpan, bp.clearance);
  // Carve rear wheel well clockwise over the rear tire
  carLowerProfile.absarc(cxR, bp.wheelRadius, archR, Math.PI + dropAngle, -dropAngle, true);
  // Rear lower apron up to rear bumper
  carLowerProfile.lineTo(halfL - 0.06, bp.clearance + 0.02);
  carLowerProfile.lineTo(halfL, bp.clearance + 0.14);
  carLowerProfile.lineTo(halfL, bp.rearY);
  // Trunk deck & rear fender shoulder
  carLowerProfile.lineTo(-halfL + bp.trunkStartX, bp.trunkY);
  // Door beltline & windshield cowl
  carLowerProfile.lineTo(-halfL + bp.hoodLen, bp.cowlY);
  // Sculpted sloping hood down to front grille top
  if (bp.style !== 'van') {
    carLowerProfile.lineTo(-halfL + 0.24, bp.noseY + 0.06);
  }
  carLowerProfile.lineTo(-halfL + 0.02, bp.noseY);
  carLowerProfile.lineTo(-halfL, bp.noseY - 0.14);
  carLowerProfile.lineTo(-halfL, bp.clearance + 0.12);
  carLowerProfile.closePath();

  const bevelThick = bp.style === 'van' ? 0.06 : 0.08;
  const bevelSz = bp.style === 'van' ? 0.05 : 0.07;
  const innerExtrudeDepth = carWidth - bevelThick * 2;

  const lowerBodyGeo = new THREE.ExtrudeGeometry(carLowerProfile, {
    depth: innerExtrudeDepth,
    bevelEnabled: true,
    bevelThickness: bevelThick,
    bevelSize: bevelSz,
    bevelSegments: 4,
  });
  lowerBodyGeo.rotateY(Math.PI / 2);
  lowerBodyGeo.translate(-innerExtrudeDepth / 2, 0, 0);

  const bodyMesh = new THREE.Mesh(lowerBodyGeo, carPaintMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Dark Inner Wheel-Well Liners (prevents seeing daylight through wheel wells)
  const linerGeo = new THREE.CylinderGeometry(archR * 0.96, archR * 0.96, carWidth * 0.94, 18, 1, false, 0, Math.PI);
  linerGeo.rotateZ(Math.PI / 2);
  for (const wz of [bp.wheelBaseF, -bp.wheelBaseR]) {
    const liner = new THREE.Mesh(linerGeo, tireRubberMat);
    liner.position.set(0, bp.wheelRadius, wz);
    bodyGroup.add(liner);
  }

  // Dark Underbody Chassis Floor Pan
  const floorGeo = new THREE.BoxGeometry(carWidth * 0.86, 0.06, bp.length * 0.86);
  const floorMesh = new THREE.Mesh(floorGeo, blackTrimMat);
  floorMesh.position.set(0, bp.clearance + 0.04, 0);
  bodyGroup.add(floorMesh);

  // Sculpted Hood Center Bulge (gives curved real-car bonnet look instead of flat sheet)
  if (bp.style !== 'van') {
    const hoodLen = bp.hoodLen - 0.16;
    const hoodCenterZ = halfL - 0.14 - hoodLen / 2;
    const hoodGeo = new THREE.BoxGeometry(carWidth * 0.64, 0.05, hoodLen);
    const hoodMesh = new THREE.Mesh(hoodGeo, carPaintMat);
    hoodMesh.position.set(0, (bp.cowlY + bp.noseY) / 2 + 0.045, hoodCenterZ);
    hoodMesh.rotation.x = Math.atan2(bp.cowlY - bp.noseY, hoodLen);
    bodyGroup.add(hoodMesh);
  }

  // ==========================================
  // 2. INTERIOR CABIN, STEERING WHEEL & 3D SEATED DRIVER
  // ==========================================
  const zCowl = halfL - bp.hoodLen;
  const zWindTop = halfL - bp.windshieldTopX;
  const zRoofEnd = halfL - bp.roofEndX;
  const zTrunkStart = halfL - bp.trunkStartX;

  const wBot = carWidth * 0.90;
  const wTop = carWidth * bp.tumblehome;

  const seatY = bp.beltY - 0.14;
  const zDriver = (zWindTop + zRoofEnd) * 0.50 + 0.14;
  const driverX = carWidth * 0.20; // Left-hand drive (+X is left when facing +Z)

  // Dashboard console
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const dashGeo = new THREE.BoxGeometry(wBot * 0.84, 0.20, 0.36);
  const dashMesh = new THREE.Mesh(dashGeo, dashMat);
  dashMesh.position.set(0, bp.beltY - 0.08, zCowl - 0.18);
  bodyGroup.add(dashMesh);

  // Two Front Seats + Headrests
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
  const seatBackGeo = new THREE.BoxGeometry(0.36, 0.42, 0.10);
  const headrestGeo = new THREE.BoxGeometry(0.18, 0.14, 0.09);
  for (const sx of [driverX, -driverX]) {
    const seatBack = new THREE.Mesh(seatBackGeo, seatMat);
    seatBack.position.set(sx, seatY + 0.14, zDriver - 0.14);
    seatBack.rotation.x = -0.18;
    bodyGroup.add(seatBack);

    const headrest = new THREE.Mesh(headrestGeo, seatMat);
    headrest.position.set(sx, seatY + 0.40, zDriver - 0.19);
    bodyGroup.add(headrest);
  }

  // Rotating 3D Steering Wheel
  const steeringWheel = new THREE.Group();
  steeringWheel.position.set(driverX, bp.beltY + 0.03, zCowl - 0.36);
  steeringWheel.rotation.x = -0.35;
  const wheelRimGeo = new THREE.TorusGeometry(0.13, 0.018, 8, 18);
  const wheelRim = new THREE.Mesh(wheelRimGeo, blackTrimMat);
  steeringWheel.add(wheelRim);
  const wheelSpokeGeo = new THREE.BoxGeometry(0.24, 0.025, 0.018);
  const wheelSpoke = new THREE.Mesh(wheelSpokeGeo, silverSkidMat);
  steeringWheel.add(wheelSpoke);
  bodyGroup.add(steeringWheel);

  // 3D Seated Driver inside the car!
  const driverGroup = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.65 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.8, roughness: 0.15 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.36, 0.18), jacketMat);
  torso.position.set(driverX, seatY + 0.14, zDriver - 0.02);
  torso.rotation.x = 0.12;
  driverGroup.add(torso);

  // Head + Expressive 3D Eyes + Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), skinMat);
  head.position.set(driverX, seatY + 0.42, zDriver);
  driverGroup.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.set(driverX, seatY + 0.43, zDriver - 0.01);
  driverGroup.add(hair);

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  for (const side of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeWhiteMat);
    sclera.position.set(driverX + side * 0.042, seatY + 0.435, zDriver + 0.098);
    driverGroup.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), pupilMat);
    pupil.position.set(driverX + side * 0.042, seatY + 0.435, zDriver + 0.112);
    driverGroup.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.01, 0.015), hairMat);
    brow.position.set(driverX + side * 0.042, seatY + 0.462, zDriver + 0.098);
    driverGroup.add(brow);
  }

  // Arms reaching forward toward steering wheel
  const armGeo = new THREE.BoxGeometry(0.075, 0.075, 0.30);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, jacketMat);
    arm.position.set(driverX + side * 0.15, seatY + 0.22, zDriver + 0.15);
    arm.rotation.x = -0.22;
    arm.rotation.y = side * -0.18;
    driverGroup.add(arm);
  }
  bodyGroup.add(driverGroup);

  // 3D Rear Trunk / Cabin Dual-Subwoofer Bass Box ("SOMBUFER")
  const subwooferGroup = new THREE.Group();
  const subwooferCones: THREE.Mesh[] = [];
  const subwooferRings: THREE.Mesh[] = [];
  const subBoxZ = Math.max(-halfL + 0.32, zRoofEnd - 0.18);
  const subBoxY = bp.trunkY + 0.08;
  subwooferGroup.position.set(0, subBoxY, subBoxZ);

  const subCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(0.86, wTop * 0.72), 0.30, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.75, metalness: 0.25 })
  );
  subwooferGroup.add(subCabinet);

  const ampBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.04, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
  );
  ampBar.position.set(0, 0.16, 0);
  subwooferGroup.add(ampBar);

  const coneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.55 });
  const dustCapMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.75 });
  for (const side of [-1, 1]) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.06, 0.045, 16), coneMat);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(side * 0.20, 0, -0.125);
    subwooferGroup.add(cone);
    subwooferCones.push(cone);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), dustCapMat);
    cap.position.set(0, 0.02, 0);
    cone.add(cap);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.014, 8, 20), ringMat);
    ring.position.set(side * 0.20, 0, -0.135);
    subwooferGroup.add(ring);
    subwooferRings.push(ring);
  }
  bodyGroup.add(subwooferGroup);

  // Tinted Glass Greenhouse Shell (Rendered after interior so driver shows cleanly through glass!)
  const cabinGeo = buildTaperedCabinGeometry(bp);
  const cockpit = new THREE.Mesh(cabinGeo, windshieldMat);
  cockpit.renderOrder = 2;
  cockpit.castShadow = true;
  bodyGroup.add(cockpit);

  // Painted Roof Panel sitting cleanly on top of cabin
  const roofMat = bp.blackRoof ? glossBlackMat : carPaintMat;
  const roofLen = Math.max(0.4, zWindTop - zRoofEnd + 0.08);
  const roofGeo = new THREE.BoxGeometry(wTop + 0.03, 0.065, roofLen);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(0, bp.roofY, (zWindTop + zRoofEnd) / 2);
  roofMesh.castShadow = true;
  bodyGroup.add(roofMesh);

  // A-Pillars (Left & Right framing front windshield)
  for (const side of [-1, 1]) {
    const aPillar = createPillarMesh(
      new THREE.Vector3(side * (wBot * 0.49), bp.cowlY - 0.01, zCowl),
      new THREE.Vector3(side * (wTop * 0.49), bp.roofY - 0.01, zWindTop),
      0.065,
      0.075,
      roofMat
    );
    bodyGroup.add(aPillar);

    // C-Pillars (Body color on sedans/Matiz/Damas, gloss black on Tracker 2 for Floating Roof!)
    const cMat = bp.floatingCpillar || bp.blackRoof ? glossBlackMat : carPaintMat;
    const cPillar = createPillarMesh(
      new THREE.Vector3(side * (wBot * 0.48), bp.trunkY - 0.01, zTrunkStart),
      new THREE.Vector3(side * (wTop * 0.48), bp.roofY - 0.01, zRoofEnd),
      bp.style === 'van' ? 0.08 : 0.11,
      0.14,
      cMat
    );
    bodyGroup.add(cPillar);

    // Matte-black B-Pillar (center door post)
    const zMid = (zWindTop + zRoofEnd) * 0.52;
    const bPillar = createPillarMesh(
      new THREE.Vector3(side * (wBot * 0.495), bp.beltY - 0.01, zMid),
      new THREE.Vector3(side * (wTop * 0.495), bp.roofY - 0.01, zMid),
      0.045,
      0.10,
      blackTrimMat
    );
    bodyGroup.add(bPillar);

    // Extra window pillar dividers for Damas van (3 distinct side window bays!)
    if (bp.style === 'van') {
      const zSlide = zRoofEnd + (zWindTop - zRoofEnd) * 0.34;
      const dPillar = createPillarMesh(
        new THREE.Vector3(side * (wBot * 0.495), bp.beltY - 0.01, zSlide),
        new THREE.Vector3(side * (wTop * 0.495), bp.roofY - 0.01, zSlide),
        0.045,
        0.09,
        carPaintMat
      );
      bodyGroup.add(dPillar);
    }
  }

  // ==========================================
  // 3. WHEEL ARCH FLARES, SIDE TRIM & MIRRORS
  // ==========================================
  const flareMat = bp.blackCladding ? blackTrimMat : carPaintMat;
  const flareGeo = new THREE.TorusGeometry(archR + 0.005, 0.042, 8, 20, Math.PI);
  flareGeo.rotateY(Math.PI / 2);

  for (const wz of [bp.wheelBaseF, -bp.wheelBaseR]) {
    for (const side of [-1, 1]) {
      const flare = new THREE.Mesh(flareGeo, flareMat);
      flare.position.set(side * (carWidth * 0.5 - 0.01), bp.wheelRadius, wz);
      bodyGroup.add(flare);
    }
  }

  // Side Skirts / Black SUV Cladding / Door Rub Strips & Door Handles
  const sideSpan = Math.max(0.6, bp.wheelBaseF + bp.wheelBaseR - archR * 2.1);
  const sideCenterZ = (bp.wheelBaseF - bp.wheelBaseR) / 2;

  if (bp.blackCladding) {
    const skirtGeo = new THREE.BoxGeometry(carWidth + 0.03, 0.15, sideSpan);
    const skirt = new THREE.Mesh(skirtGeo, blackTrimMat);
    skirt.position.set(0, bp.clearance + 0.08, sideCenterZ);
    bodyGroup.add(skirt);
  }

  if (bp.sideRubStrip) {
    const stripGeo = new THREE.BoxGeometry(carWidth + 0.03, 0.06, sideSpan * 0.96);
    const strip = new THREE.Mesh(stripGeo, blackTrimMat);
    strip.position.set(0, bp.clearance + (bp.style === 'van' ? 0.28 : 0.24), sideCenterZ);
    bodyGroup.add(strip);
  }

  // Door Handles (Hidden on Spark rear C-pillar!)
  const handleMat = model === 'malibu2' || model === 'byd_uz' ? chromeMat : bp.style === 'van' ? blackTrimMat : carPaintMat;
  const handleGeo = new THREE.BoxGeometry(0.04, 0.032, 0.16);
  for (const side of [-1, 1]) {
    const frontHandle = new THREE.Mesh(handleGeo, handleMat);
    frontHandle.position.set(side * (carWidth * 0.5 + 0.01), bp.beltY - 0.10, sideCenterZ + 0.12);
    bodyGroup.add(frontHandle);

    if (model !== 'spark' && bp.style !== 'supercar') {
      const rearHandle = new THREE.Mesh(handleGeo, handleMat);
      rearHandle.position.set(side * (carWidth * 0.5 + 0.01), bp.beltY - 0.10, sideCenterZ - 0.55);
      bodyGroup.add(rearHandle);
    }
  }

  // Side Wing Mirrors mounted on A-Pillar base
  const mirrorMat = model === 'monza' || bp.style === 'supercar' ? glossBlackMat : bp.style === 'van' ? blackTrimMat : carPaintMat;
  const mirrorArmGeo = new THREE.BoxGeometry(0.11, 0.035, 0.05);
  const mirrorHeadGeo = new THREE.BoxGeometry(0.15, 0.09, 0.11);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(mirrorArmGeo, blackTrimMat);
    arm.position.set(side * (carWidth * 0.49), bp.cowlY + 0.04, zCowl - 0.12);
    bodyGroup.add(arm);

    const head = new THREE.Mesh(mirrorHeadGeo, mirrorMat);
    head.position.set(side * (carWidth * 0.5 + 0.09), bp.cowlY + 0.06, zCowl - 0.15);
    head.castShadow = true;
    bodyGroup.add(head);
  }

  // Roof Rails (Damas luggage rails / Tracker 2 silver rails)
  if (bp.roofRails) {
    const railLen = roofLen * 0.78;
    const railGeo = new THREE.BoxGeometry(0.055, 0.065, railLen);
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, bp.style === 'van' ? chromeMat : silverSkidMat);
      rail.position.set(side * (wTop * 0.42), bp.roofY + 0.055, (zWindTop + zRoofEnd) / 2);
      bodyGroup.add(rail);
    }
  }

  // Cover-accurate Sport Stripes (Matiz/Spark/Monza) & Uzbek Flag/Side Decals (Damas)
  if (model === 'matiz' || model === 'spark' || model === 'monza') {
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.65,
      roughness: 0.22,
    });
    const hoodSpan = Math.max(0.45, bp.hoodLen - 0.16);
    const hoodCz = halfL - 0.12 - hoodSpan * 0.5;
    for (const sx of [-0.11, 0.11]) {
      const hStripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.014, hoodSpan), stripeMat);
      hStripe.position.set(sx, (bp.cowlY + bp.noseY) * 0.5 + 0.072, hoodCz);
      hStripe.rotation.x = Math.atan2(bp.cowlY - bp.noseY, hoodSpan);
      bodyGroup.add(hStripe);

      const rStripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.012, roofLen * 0.92), stripeMat);
      rStripe.position.set(sx, bp.roofY + 0.036, (zWindTop + zRoofEnd) * 0.5);
      bodyGroup.add(rStripe);
    }
  } else if (model === 'damas') {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 20, 256, 8);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(10, 6, 48, 12);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(10, 18, 48, 10);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(10, 28, 48, 12);
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px sans-serif';
    ctx.fillText('UZBEK RACER', 70, 38);
    const decalTex = new THREE.CanvasTexture(c);
    decalTex.colorSpace = THREE.SRGBColorSpace;
    const decalMat = new THREE.MeshBasicMaterial({ map: decalTex, transparent: true });
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.36), decalMat);
      panel.position.set(side * (carWidth * 0.5 + 0.012), bp.beltY - 0.16, -0.15);
      panel.rotation.y = side * (Math.PI / 2);
      bodyGroup.add(panel);
    }
  }

  // Muscle V8 Hood Scoop
  if (model === 'muscle_v8') {
    const scoopGeo = new THREE.BoxGeometry(0.58, 0.10, 0.95);
    const scoop = new THREE.Mesh(scoopGeo, glossBlackMat);
    scoop.position.set(0, bp.cowlY + 0.02, halfL - 0.9);
    bodyGroup.add(scoop);
  }

  // ==========================================
  // 4. MODEL-EXACT FRONT & REAR FASCIA TEXTURES + 3D BUMPERS/LIGHTS
  // ==========================================
  const frontTex = getFrontFasciaTexture(
    model,
    colorScheme.primary,
    customPlate,
    customization?.headlightStyle || 'xenon'
  );
  const rearTex = getRearFasciaTexture(
    model,
    colorScheme.primary,
    customPlate,
    customization?.taillightStyle || 'classic_red'
  );

  const frontZ = halfL + bevelSz + 0.006;
  const rearZ = -halfL - bevelSz - 0.006;

  const frontH = Math.max(0.30, bp.noseY - bp.clearance - 0.02);
  const frontFasciaGeo = new THREE.PlaneGeometry(carWidth - bevelThick * 2.2, frontH);
  const frontFasciaMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    roughness: 0.35,
    metalness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const frontFascia = new THREE.Mesh(frontFasciaGeo, frontFasciaMat);
  frontFascia.position.set(0, bp.clearance + frontH / 2 + 0.02, frontZ);
  bodyGroup.add(frontFascia);

  const rearH = Math.max(0.34, bp.rearY - bp.clearance - 0.01);
  const rearFasciaGeo = new THREE.PlaneGeometry(carWidth - bevelThick * 2.2, rearH);
  const rearFasciaMat = new THREE.MeshStandardMaterial({
    map: rearTex,
    roughness: 0.35,
    metalness: 0.25,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const rearFascia = new THREE.Mesh(rearFasciaGeo, rearFasciaMat);
  rearFascia.rotation.y = Math.PI;
  rearFascia.position.set(0, bp.clearance + rearH / 2 + 0.02, rearZ);
  bodyGroup.add(rearFascia);

  // 3D Protruding Front Lower Bumper Lip / Chin
  const frontLipMat = model === 'monza' ? new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 }) : blackTrimMat;
  const frontLipGeo = new THREE.BoxGeometry(carWidth - 0.06, 0.065, 0.10);
  const frontLip = new THREE.Mesh(frontLipGeo, frontLipMat);
  frontLip.position.set(0, bp.clearance + 0.035, halfL + 0.03);
  bodyGroup.add(frontLip);

  // 3D Protruding Glowing Headlight Lenses (aligned with texture headlights)
  const headY = bp.clearance + frontH * 0.62;
  if (model === 'byd_uz') {
    const bydEyeGeo = new THREE.BoxGeometry(0.32, 0.06, 0.025);
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(bydEyeGeo, ledHeadlightMat);
      hl.position.set(side * (carWidth * 0.33), headY + 0.02, frontZ + 0.008);
      bodyGroup.add(hl);
      headlights.push(hl);
    }
    const barGeo = new THREE.BoxGeometry(carWidth * 0.56, 0.024, 0.02);
    const bar = new THREE.Mesh(barGeo, chromeMat);
    bar.position.set(0, headY + 0.02, frontZ + 0.008);
    bodyGroup.add(bar);
  } else {
    const hlW = model === 'matiz' ? 0.22 : model === 'damas' ? 0.24 : 0.30;
    const hlH = model === 'matiz' ? 0.12 : model === 'cobalt' || model === 'damas' ? 0.10 : 0.068;
    const hlGeo = new THREE.BoxGeometry(hlW, hlH, 0.025);
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(hlGeo, ledHeadlightMat);
      hl.position.set(side * (carWidth * 0.33), headY, frontZ + 0.007);
      bodyGroup.add(hl);
      headlights.push(hl);
    }
  }

  // 3D Protruding Glowing Taillight Housings + Brake Lamp Support
  const tailY = model === 'damas' ? bp.clearance + 0.14 : bp.clearance + rearH * 0.62;
  if (model === 'byd_uz') {
    const bydTailGeo = new THREE.BoxGeometry(carWidth * 0.82, 0.05, 0.025);
    const bydTail = new THREE.Mesh(bydTailGeo, ledTaillightMat);
    bydTail.position.set(0, tailY + 0.02, rearZ - 0.008);
    bodyGroup.add(bydTail);
    taillights.push(bydTail);
  } else {
    const tlW = model === 'damas' ? 0.12 : model === 'cobalt' ? 0.17 : model === 'matiz' ? 0.12 : 0.35;
    const tlH = model === 'damas' ? 0.18 : model === 'cobalt' ? 0.20 : model === 'matiz' ? 0.20 : 0.085;
    const tlY = model === 'matiz' ? bp.rearY - 0.04 : tailY;
    const tlGeo = new THREE.BoxGeometry(tlW, tlH, 0.025);
    for (const side of [-1, 1]) {
      const tl = new THREE.Mesh(tlGeo, ledTaillightMat);
      tl.position.set(side * (carWidth * 0.35), tlY, rearZ - 0.008);
      bodyGroup.add(tl);
      taillights.push(tl);
    }
  }

  // 3D Turn Signal Corner Blinkers (Povorotniklar: +X = Chap, -X = O'ng)
  const turnGeo = new THREE.BoxGeometry(0.11, 0.07, 0.035);
  const frontLeftTurn = new THREE.Mesh(turnGeo, leftTurnMat);
  frontLeftTurn.position.set(carWidth * 0.43, headY - 0.03, frontZ + 0.012);
  bodyGroup.add(frontLeftTurn);
  const rearLeftTurn = new THREE.Mesh(turnGeo, leftTurnMat);
  rearLeftTurn.position.set(carWidth * 0.43, tailY - 0.02, rearZ - 0.012);
  bodyGroup.add(rearLeftTurn);

  const frontRightTurn = new THREE.Mesh(turnGeo, rightTurnMat);
  frontRightTurn.position.set(-carWidth * 0.43, headY - 0.03, frontZ + 0.012);
  bodyGroup.add(frontRightTurn);
  const rearRightTurn = new THREE.Mesh(turnGeo, rightTurnMat);
  rearRightTurn.position.set(-carWidth * 0.43, tailY - 0.02, rearZ - 0.012);
  bodyGroup.add(rearRightTurn);

  // Clean Realistic Front Headlight Beams + Ground Pool (To'g'rilangan Fara Nuri)
  const headlightBeams = new THREE.Group();
  const beamColor = hlStyle.beamHex;
  const beamMat = new THREE.MeshBasicMaterial({
    color: beamColor,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beamConeGeo = new THREE.ConeGeometry(1.15, 11, 14, 1, true);
  beamConeGeo.translate(0, -5.5, 0);
  beamConeGeo.rotateX(Math.PI / 2);

  for (const side of [-1, 1]) {
    const cone = new THREE.Mesh(beamConeGeo, beamMat);
    cone.position.set(side * (carWidth * 0.33), headY - 0.02, frontZ + 0.04);
    cone.rotation.x = 0.085; // Crisp downward aim toward asphalt road
    headlightBeams.add(cone);

    // Subtle ground illumination oval ahead of each lamp
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.65, 18),
      new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    pool.scale.set(0.95, 3.2, 1);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(side * (carWidth * 0.33), 0.03, frontZ + 6.5);
    headlightBeams.add(pool);
  }
  bodyGroup.add(headlightBeams);

  const headlightSpot = new THREE.SpotLight(beamColor, 7.5, 48, Math.PI / 4.4, 0.65, 1.15);
  headlightSpot.position.set(0, headY + 0.1, frontZ + 0.08);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, 0.02, frontZ + 16);
  bodyGroup.add(spotTarget);
  headlightSpot.target = spotTarget;
  bodyGroup.add(headlightSpot);

  // Spoilers (Hatch roof wing on Spark/Tracker 2, trunk lip on Malibu/Monza/BYD, GT wing on supercars)
  if (bp.spoilerType === 'gt_wing') {
    const standGeo = new THREE.BoxGeometry(0.06, 0.28, 0.12);
    for (const side of [-1, 1]) {
      const stand = new THREE.Mesh(standGeo, glossBlackMat);
      stand.position.set(side * 0.58, bp.trunkY + 0.12, -halfL + 0.22);
      bodyGroup.add(stand);
    }
    const bladeGeo = new THREE.BoxGeometry(carWidth + 0.04, 0.05, 0.30);
    const blade = new THREE.Mesh(bladeGeo, glossBlackMat);
    blade.position.set(0, bp.trunkY + 0.26, -halfL + 0.18);
    blade.rotation.x = 0.06;
    bodyGroup.add(blade);
  } else if (bp.spoilerType === 'lip') {
    const lipMat = model === 'monza' ? glossBlackMat : carPaintMat;
    const lipGeo = new THREE.BoxGeometry(carWidth * 0.80, 0.045, 0.12);
    const lip = new THREE.Mesh(lipGeo, lipMat);
    lip.position.set(0, bp.trunkY + 0.02, -halfL + 0.10);
    bodyGroup.add(lip);
  } else if (bp.spoilerType === 'hatch_wing') {
    const wingMat = model === 'tracker2' ? glossBlackMat : carPaintMat;
    const hWingGeo = new THREE.BoxGeometry(wTop * 0.95, 0.06, 0.20);
    const hWing = new THREE.Mesh(hWingGeo, wingMat);
    hWing.position.set(0, bp.roofY + 0.01, zRoofEnd - 0.08);
    bodyGroup.add(hWing);
  }

  // ==========================================
  // 5. AUTHENTIC EXHAUST TIPS & HIDDEN NITRO FLAMES
  // ==========================================
  const flameGeo = new THREE.ConeGeometry(0.09, 0.55, 10);
  flameGeo.rotateX(-Math.PI / 2);

  if (bp.exhaustStyle === 'dual_trapezoid') {
    // Malibu 2 wide trapezoidal integrated chrome exhaust outlets
    const trapGeo = new THREE.BoxGeometry(0.24, 0.085, 0.14);
    for (const side of [-1, 1]) {
      const tip = new THREE.Mesh(trapGeo, chromeMat);
      tip.position.set(side * (carWidth * 0.30), bp.clearance + 0.07, -halfL - 0.04);
      bodyGroup.add(tip);

      const flame = new THREE.Mesh(flameGeo, exhaustFlameMat);
      flame.position.set(side * (carWidth * 0.30), bp.clearance + 0.07, -halfL - 0.35);
      flame.visible = false;
      bodyGroup.add(flame);
      thrusters.push(flame);
    }
  } else if (bp.exhaustStyle === 'dual_round' || bp.exhaustStyle === 'quad_sport') {
    const tipGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.18, 12);
    tipGeo.rotateX(Math.PI / 2);
    for (const side of [-1, 1]) {
      const tip = new THREE.Mesh(tipGeo, chromeMat);
      tip.position.set(side * (carWidth * 0.28), bp.clearance + 0.06, -halfL - 0.05);
      bodyGroup.add(tip);

      const flame = new THREE.Mesh(flameGeo, exhaustFlameMat);
      flame.position.set(side * (carWidth * 0.28), bp.clearance + 0.06, -halfL - 0.35);
      flame.visible = false;
      bodyGroup.add(flame);
      thrusters.push(flame);
    }
  } else {
    // Single discreet tailpipe tucked neatly under bumper (Damas, Matiz, Cobalt, Nexia, Spark, Tracker, BYD)
    const tipGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.14, 10);
    tipGeo.rotateX(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeo, silverSkidMat);
    tip.position.set(carWidth * 0.28, bp.clearance + 0.04, -halfL - 0.02);
    bodyGroup.add(tip);

    const flame = new THREE.Mesh(flameGeo, exhaustFlameMat);
    flame.position.set(carWidth * 0.28, bp.clearance + 0.04, -halfL - 0.32);
    flame.visible = false;
    bodyGroup.add(flame);
    thrusters.push(flame);
  }

  group.add(bodyGroup);

  // ==========================================
  // 6. REALISTIC WHEELS TUCKED FLUSH INSIDE FENDERS
  // ==========================================
  const rimMat = bp.rimStyle === 'sport_black' ? glossBlackMat : chromeMat;
  const spokeCount = bp.rimStyle === 'steel_silver' ? 4 : 5;

  function buildWheelMesh(): THREE.Group {
    const wheelGroup = new THREE.Group();

    const tireGeo = new THREE.CylinderGeometry(
      bp.wheelRadius,
      bp.wheelRadius,
      bp.wheelWidth,
      24
    );
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireRubberMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rimRadiusRatio = bp.rimStyle === 'steel_silver' ? 0.62 : 0.70;
    const rimBarrelGeo = new THREE.CylinderGeometry(
      bp.wheelRadius * rimRadiusRatio,
      bp.wheelRadius * rimRadiusRatio,
      bp.wheelWidth + 0.008,
      18
    );
    rimBarrelGeo.rotateZ(Math.PI / 2);
    const rimBarrel = new THREE.Mesh(
      rimBarrelGeo,
      bp.rimStyle === 'diamond_cut' ? blackTrimMat : rimMat
    );
    wheelGroup.add(rimBarrel);

    // Center hub cap + metallic brake rotor disc behind spokes
    const rotorGeo = new THREE.CylinderGeometry(
      bp.wheelRadius * 0.50,
      bp.wheelRadius * 0.50,
      bp.wheelWidth * 0.55,
      16
    );
    rotorGeo.rotateZ(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeo, silverSkidMat);
    wheelGroup.add(rotor);

    const hubGeo = new THREE.CylinderGeometry(
      bp.wheelRadius * 0.19,
      bp.wheelRadius * 0.19,
      bp.wheelWidth + 0.026,
      12
    );
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    wheelGroup.add(hub);

    // Multi-spoke alloy spokes
    const spokeGeo = new THREE.BoxGeometry(
      bp.wheelWidth + 0.020,
      bp.wheelRadius * rimRadiusRatio * 1.9,
      bp.rimStyle === 'steel_silver' ? 0.060 : 0.036
    );
    for (let s = 0; s < spokeCount; s++) {
      const spoke = new THREE.Mesh(spokeGeo, bp.rimStyle === 'diamond_cut' ? chromeMat : rimMat);
      spoke.rotation.x = (s * Math.PI) / spokeCount;
      wheelGroup.add(spoke);
    }

    // Brake caliper (visible on all modern cars)
    const caliperGeo = new THREE.BoxGeometry(0.06, 0.11, 0.09);
    const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMat);
    caliper.position.set(0, bp.wheelRadius * 0.36, 0);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  // Soft Ground Contact Shadow beneath the car so tires feel firmly planted on sunlit asphalt
  const shadowGeo = new THREE.PlaneGeometry(carWidth * 1.24, bp.length * 1.12);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x050811,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const carContactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  carContactShadow.position.y = 0.015;
  group.add(carContactShadow);

  // Tuck wheels flush inside wheel wells so tires never poke out like a buggy!
  const wheelTrackX = carWidth * 0.5 - bp.wheelWidth * 0.42;

  // FRONT WHEELS
  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(-wheelTrackX, bp.wheelRadius, bp.wheelBaseF);
  const frontLeftWheel = buildWheelMesh();
  frontLeftPivot.add(frontLeftWheel);
  group.add(frontLeftPivot);
  frontSteerPivots.push(frontLeftPivot);
  wheels.push(frontLeftWheel);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(wheelTrackX, bp.wheelRadius, bp.wheelBaseF);
  const frontRightWheel = buildWheelMesh();
  frontRightPivot.add(frontRightWheel);
  group.add(frontRightPivot);
  frontSteerPivots.push(frontRightPivot);
  wheels.push(frontRightWheel);

  // REAR WHEELS
  const rearLeftWheel = buildWheelMesh();
  rearLeftWheel.position.set(-wheelTrackX, bp.wheelRadius, -bp.wheelBaseR);
  group.add(rearLeftWheel);
  wheels.push(rearLeftWheel);

  const rearRightWheel = buildWheelMesh();
  rearRightWheel.position.set(wheelTrackX, bp.wheelRadius, -bp.wheelBaseR);
  group.add(rearRightWheel);
  wheels.push(rearRightWheel);

  // ==========================================
  // 7. ROOF MIGALKA (Emergency Red/Blue Lightbar, hidden unless activated or GAI patrol)
  // ==========================================
  const migalkaGroup = new THREE.Group();
  migalkaGroup.position.set(0, bp.roofY + 0.065, (zWindTop + zRoofEnd) * 0.55);
  migalkaGroup.visible = false;

  const barBaseGeo = new THREE.BoxGeometry(wTop * 0.72, 0.045, 0.22);
  const barBase = new THREE.Mesh(barBaseGeo, glossBlackMat);
  migalkaGroup.add(barBase);

  const centerWhiteGeo = new THREE.BoxGeometry(wTop * 0.18, 0.065, 0.20);
  const centerWhite = new THREE.Mesh(centerWhiteGeo, new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
  centerWhite.position.y = 0.025;
  migalkaGroup.add(centerWhite);

  const lensGeo = new THREE.BoxGeometry(wTop * 0.25, 0.075, 0.21);
  const migalkaRed = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0xff0033 }));
  migalkaRed.position.set(wTop * 0.22, 0.03, 0);
  migalkaGroup.add(migalkaRed);

  const migalkaBlue = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x0088ff }));
  migalkaBlue.position.set(-wTop * 0.22, 0.03, 0);
  migalkaGroup.add(migalkaBlue);

  bodyGroup.add(migalkaGroup);

  return {
    group,
    thrusters,
    headlights,
    taillights,
    headlightBeams,
    headlightSpot,
    headlightMat: ledHeadlightMat,
    headlightOnHex,
    taillightMat: ledTaillightMat,
    taillightOffHex: tlStyle.offHex,
    taillightBrakeHex: tlStyle.brakeHex,
    leftTurnMat,
    rightTurnMat,
    cockpit,
    bodyMesh,
    wheels,
    frontSteerPivots,
    isCar: true,
    driverGroup,
    steeringWheel,
    migalkaGroup,
    migalkaRed,
    migalkaBlue,
    subwooferGroup,
    subwooferCones,
    subwooferRings,
  };
}

// Retains hovercraft generator for falcon model option
export function createHovercraft(
  model: ShipModel,
  colorId: ShipColor,
  customization?: CarCustomization
): VehicleParts {
  if (model !== 'falcon') {
    return createRealCar(model, colorId, customization);
  }

  const group = new THREE.Group();
  const colorScheme = COLOR_SCHEMES[colorId] || COLOR_SCHEMES.cyan;

  const primaryHullMat = new THREE.MeshStandardMaterial({
    color: colorScheme.primary,
    metalness: 0.75,
    roughness: 0.25,
  });

  const secondaryDarkMat = new THREE.MeshStandardMaterial({
    color: colorScheme.secondary,
    metalness: 0.85,
    roughness: 0.45,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  });

  const neonGlowMat = new THREE.MeshBasicMaterial({ color: colorScheme.glow });
  const exhaustFlameMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  const thrusters: THREE.Mesh[] = [];
  const headlights: THREE.Mesh[] = [];

  const shape = new THREE.Shape();
  shape.moveTo(0, 2.2);
  shape.lineTo(0.7, -0.6);
  shape.lineTo(0.5, -1.8);
  shape.lineTo(-0.5, -1.8);
  shape.lineTo(-0.7, -0.6);
  shape.closePath();

  const bodyGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.45,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 3,
  });
  bodyGeometry.rotateX(Math.PI / 2);
  bodyGeometry.center();

  const bodyMesh = new THREE.Mesh(bodyGeometry, primaryHullMat);
  bodyMesh.position.y = 0.5;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  const canopyGeo = new THREE.SphereGeometry(0.45, 16, 12);
  canopyGeo.scale(0.7, 0.6, 1.4);
  const cockpit = new THREE.Mesh(canopyGeo, canopyMat);
  cockpit.position.set(0, 0.75, 0.1);
  group.add(cockpit);

  const podGeo = new THREE.CylinderGeometry(0.24, 0.28, 1.4, 16);
  podGeo.rotateX(Math.PI / 2);
  const leftPod = new THREE.Mesh(podGeo, chromeMat);
  leftPod.position.set(-0.7, 0.42, -0.7);
  group.add(leftPod);
  const rightPod = new THREE.Mesh(podGeo, chromeMat);
  rightPod.position.set(0.7, 0.42, -0.7);
  group.add(rightPod);

  const flameGeo = new THREE.ConeGeometry(0.18, 0.8, 12);
  flameGeo.rotateX(-Math.PI / 2);
  const leftFlame = new THREE.Mesh(flameGeo, exhaustFlameMat);
  leftFlame.position.set(-0.7, 0.42, -2.0);
  group.add(leftFlame);
  thrusters.push(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeo, exhaustFlameMat);
  rightFlame.position.set(0.7, 0.42, -2.0);
  group.add(rightFlame);
  thrusters.push(rightFlame);

  const ringGeo = new THREE.TorusGeometry(0.48, 0.05, 8, 24);
  ringGeo.rotateX(Math.PI / 2);
  const hoverDisc = new THREE.Mesh(ringGeo, neonGlowMat);
  hoverDisc.position.set(0, 0.18, 0);
  group.add(hoverDisc);

  return {
    group,
    thrusters,
    hoverDisc,
    headlights,
    cockpit,
    bodyMesh,
    wheels: [],
    frontSteerPivots: [],
    isCar: false,
  };
}

// Procedural Collectible Crystal
export function createCrystal(): THREE.Group {
  const group = new THREE.Group();
  const gemGeo = new THREE.OctahedronGeometry(0.55, 0);
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.6,
    metalness: 0.2,
    roughness: 0.1,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.y = 0.8;
  group.add(gem);

  const ringGeo = new THREE.TorusGeometry(0.85, 0.035, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.8;
  ring.rotation.x = Math.PI / 3;
  group.add(ring);

  return group;
}

// Procedural Shield Health Pickup
export function createShieldPickup(): THREE.Group {
  const group = new THREE.Group();
  const coreGeo = new THREE.IcosahedronGeometry(0.45, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.8;
  group.add(core);

  const ringGeo = new THREE.TorusGeometry(0.75, 0.03, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.position.y = 0.8;
  group.add(ring1);

  const ring2 = ring1.clone();
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);

  return group;
}

// Procedural Speed Boost Pad
export function createBoostPadMesh(boostTex: THREE.CanvasTexture): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(3.6, 6.0);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: boostTex,
    transparent: true,
    opacity: 0.95,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.03;
  return mesh;
}

// Procedural Laser Barrier
export function createLaserBarrier(): {
  group: THREE.Group;
  laserBeam: THREE.Mesh;
  pylonLeft: THREE.Mesh;
  pylonRight: THREE.Mesh;
} {
  const group = new THREE.Group();
  const warningTex = createWarningTexture();

  const pylonMat = new THREE.MeshStandardMaterial({
    map: warningTex,
    metalness: 0.7,
    roughness: 0.35,
  });
  const pylonGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.8, 12);
  pylonGeo.translate(0, 1.4, 0);

  const pylonLeft = new THREE.Mesh(pylonGeo, pylonMat);
  pylonLeft.position.set(-2.8, 0, 0);
  group.add(pylonLeft);

  const pylonRight = new THREE.Mesh(pylonGeo, pylonMat);
  pylonRight.position.set(2.8, 0, 0);
  group.add(pylonRight);

  const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.6, 8);
  beamGeo.rotateZ(Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xff0055,
    transparent: true,
    opacity: 0.9,
  });
  const laserBeam = new THREE.Mesh(beamGeo, beamMat);
  laserBeam.position.set(0, 1.2, 0);
  group.add(laserBeam);

  return { group, laserBeam, pylonLeft, pylonRight };
}

// Procedural Drone Traffic Hazard
export function createDroneHazard(): THREE.Group {
  const group = new THREE.Group();

  const chassisGeo = new THREE.DodecahedronGeometry(0.65);
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.9,
    roughness: 0.25,
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 1.2;
  group.add(chassis);

  const eyeGeo = new THREE.SphereGeometry(0.24, 12, 10);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.set(0, 1.2, 0.55);
  group.add(eye);

  return group;
}

// Procedural Jump Ramp
export function createJumpRamp(): THREE.Group {
  const group = new THREE.Group();
  const w = 3.6;
  const len = 6.0;
  const h = 1.4;

  const vertices = new Float32Array([
    -w / 2, 0, len / 2,
    w / 2, 0, len / 2,
    w / 2, h, -len / 2,
    -w / 2, 0, len / 2,
    w / 2, h, -len / 2,
    -w / 2, h, -len / 2,
  ]);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geom.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.8,
    roughness: 0.3,
  });

  const mesh = new THREE.Mesh(geom, mat);
  group.add(mesh);
  return group;
}

// Procedural Neon Arch Gate
export function createNeonArch(): THREE.Group {
  const group = new THREE.Group();
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.4,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  const colGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
  const leftCol = new THREE.Mesh(colGeo, archMat);
  leftCol.position.set(-5.5, 3, 0);
  group.add(leftCol);

  const rightCol = new THREE.Mesh(colGeo, archMat);
  rightCol.position.set(5.5, 3, 0);
  group.add(rightCol);

  const beamGeo = new THREE.BoxGeometry(11.6, 0.8, 0.8);
  const beam = new THREE.Mesh(beamGeo, archMat);
  beam.position.set(0, 6, 0);
  group.add(beam);

  const neonGeo = new THREE.BoxGeometry(11.4, 0.15, 0.2);
  const neon = new THREE.Mesh(neonGeo, glowMat);
  neon.position.set(0, 5.5, 0);
  group.add(neon);

  return group;
}

let sharedBuildingTex: THREE.CanvasTexture | null = null;
function getBuildingFacadeTexture(): THREE.CanvasTexture {
  if (sharedBuildingTex) return sharedBuildingTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#e7dcc8';
  ctx.fillRect(0, 0, 256, 512);
  // Subtle horizontal stone bands
  ctx.fillStyle = '#d6c7b2';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(0, y, 256, 8);
  }
  // Sunlit reflective & warm interior apartment/office windows
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 4; col++) {
      const wx = 18 + col * 58;
      const wy = 16 + row * 64;
      ctx.fillStyle = '#475569';
      ctx.fillRect(wx - 2, wy - 2, 42, 42);
      const warm = (row + col * 3) % 4 === 0;
      ctx.fillStyle = warm ? '#fde68a' : '#7dd3fc';
      ctx.fillRect(wx, wy, 38, 38);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(wx, wy, 14, 38);
    }
  }
  // Ground-floor sunlit shopfront strip
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 452, 256, 60);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(16, 464, 96, 36);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(140, 464, 96, 36);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  sharedBuildingTex = tex;
  return tex;
}

// Procedural Sunlit Toshkent City Building
export function createCitySpire(height: number, width: number): THREE.Group {
  const group = new THREE.Group();
  const hueIndex = Math.abs(Math.round(height + width)) % 4;
  const tintColors = [0xf5ebd6, 0xe2e8f0, 0xfde8cc, 0xdbeafe];
  const awningColors = [0x0284c7, 0xb45309, 0x0f766e, 0xdc2626];

  const facadeMat = new THREE.MeshStandardMaterial({
    map: getBuildingFacadeTexture(),
    color: tintColors[hueIndex],
    roughness: 0.65,
    metalness: 0.15,
  });
  const corniceMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.55,
    metalness: 0.35,
  });

  const geo = new THREE.BoxGeometry(width, height, width);
  const mesh = new THREE.Mesh(geo, facadeMat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  // Rooftop cornice rim
  const roofRim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.55, 0.8, width + 0.55), corniceMat);
  roofRim.position.y = height + 0.3;
  group.add(roofRim);

  // Ground-floor shop awning
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.9, 0.35, width + 0.9),
    new THREE.MeshStandardMaterial({ color: awningColors[hueIndex], roughness: 0.5 })
  );
  awning.position.y = 3.6;
  group.add(awning);

  if (height > 42) {
    const antennaGeo = new THREE.CylinderGeometry(0.1, 0.3, 7);
    const antenna = new THREE.Mesh(antennaGeo, corniceMat);
    antenna.position.y = height + 4.0;
    group.add(antenna);
  }

  return group;
}

// ========================================================
// O‘ZBEKISTON SHAHARLARI VA KO‘CHALARI (TOSHKENT & XORAZM)
// ========================================================

// 1. Toshkent Teleminorasi (Tashkent TV Tower)
export function createTashkentTVTower(): THREE.Group {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2,
  });

  const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.8,
  });

  // Tripod Lattice Legs (3 angled pylons)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const legGeo = new THREE.CylinderGeometry(0.7, 1.4, 38, 8);
    legGeo.rotateZ(0.24);
    legGeo.translate(0, 19, 0);

    const leg = new THREE.Mesh(legGeo, steelMat);
    leg.rotation.y = angle;
    group.add(leg);
  }

  // Central Tower Trunk
  const trunkGeo = new THREE.CylinderGeometry(2.4, 3.2, 55, 16);
  const trunk = new THREE.Mesh(trunkGeo, steelMat);
  trunk.position.y = 27;
  group.add(trunk);

  // Observation Deck Pod (Aylanuvchi kuzatuv maydonchasi)
  const podGeo = new THREE.CylinderGeometry(8.5, 7.0, 7.5, 24);
  const pod = new THREE.Mesh(podGeo, steelMat);
  pod.position.y = 58;
  group.add(pod);

  // Pod Glass Ring Window
  const glassGeo = new THREE.CylinderGeometry(8.6, 7.8, 3.2, 24);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 58;
  group.add(glass);

  // Upper Antenna Spire with Red/White Stripes (130m balandlik)
  for (let s = 0; s < 8; s++) {
    const stripeGeo = new THREE.CylinderGeometry(
      1.5 - s * 0.15,
      1.7 - s * 0.15,
      8,
      12
    );
    const stripe = new THREE.Mesh(stripeGeo, s % 2 === 0 ? redMat : whiteMat);
    stripe.position.y = 66 + s * 8;
    group.add(stripe);
  }

  // Top Beacon Light
  const beaconGeo = new THREE.SphereGeometry(1.2, 8, 8);
  const beacon = new THREE.Mesh(beaconGeo, redMat);
  beacon.position.y = 132;
  group.add(beacon);

  return group;
}

// 2. Xiva Kalta Minori (Khorezm Turquoise Minaret)
export function createKhivaKaltaMinor(): THREE.Group {
  const group = new THREE.Group();

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.85,
    metalness: 0.05,
  });

  const turquoiseMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Khorezm Turquoise
    roughness: 0.25,
    metalness: 0.3,
  });

  const cobaltMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Cobalt Blue
    roughness: 0.3,
    metalness: 0.25,
  });

  const whiteTileMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
  });

  // Massive Tapered Base & Decorative Bands (Kalta Minor 14m diametr)
  const totalHeight = 36;
  const numBands = 9;
  const bandHeight = totalHeight / numBands;

  for (let b = 0; b < numBands; b++) {
    const bottomRadius = 7.0 - b * 0.32;
    const topRadius = 7.0 - (b + 1) * 0.32;

    const bandGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, bandHeight, 28);
    let bandMat = brickMat;
    if (b === 1 || b === 3 || b === 6 || b === 8) {
      bandMat = turquoiseMat;
    } else if (b === 2 || b === 5 || b === 7) {
      bandMat = cobaltMat;
    } else if (b === 4) {
      bandMat = whiteTileMat;
    }

    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.y = b * bandHeight + bandHeight / 2;
    bandMesh.castShadow = true;
    bandMesh.receiveShadow = true;
    group.add(bandMesh);

    // Relief carved ring trim
    const trimGeo = new THREE.TorusGeometry(bottomRadius + 0.12, 0.14, 6, 28);
    trimGeo.rotateX(Math.PI / 2);
    const trim = new THREE.Mesh(trimGeo, turquoiseMat);
    trim.position.y = b * bandHeight;
    group.add(trim);
  }

  // Top Crenellated Battlement Crown
  const crownGeo = new THREE.CylinderGeometry(4.2, 4.4, 2.5, 24);
  const crown = new THREE.Mesh(crownGeo, turquoiseMat);
  crown.position.y = totalHeight + 1.25;
  group.add(crown);

  return group;
}

// 3. Ichan Qal‘a Qadimiy Darvozasi (Ancient Khorezm Fortress Gate)
export function createIchanQalaGate(): THREE.Group {
  const group = new THREE.Group();

  const mudBrickMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.9,
    metalness: 0.05,
  });

  const turquoiseMat = new THREE.MeshStandardMaterial({
    color: 0x0891b2,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Left Bastion Tower
  const towerGeo = new THREE.CylinderGeometry(2.4, 2.9, 14, 18);
  const leftTower = new THREE.Mesh(towerGeo, mudBrickMat);
  leftTower.position.set(-9.5, 7, 0);
  leftTower.castShadow = true;
  group.add(leftTower);

  // Right Bastion Tower
  const rightTower = new THREE.Mesh(towerGeo, mudBrickMat);
  rightTower.position.set(9.5, 7, 0);
  rightTower.castShadow = true;
  group.add(rightTower);

  // Tower Top Domes
  const domeGeo = new THREE.SphereGeometry(2.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const leftDome = new THREE.Mesh(domeGeo, turquoiseMat);
  leftDome.position.set(-9.5, 14, 0);
  group.add(leftDome);

  const rightDome = new THREE.Mesh(domeGeo, turquoiseMat);
  rightDome.position.set(9.5, 14, 0);
  group.add(rightDome);

  // Central Fortress Wall Bridging Street (Arch Portal)
  const wallGeo = new THREE.BoxGeometry(20, 6, 2.8);
  const wall = new THREE.Mesh(wallGeo, mudBrickMat);
  wall.position.set(0, 11, 0);
  wall.castShadow = true;
  group.add(wall);

  // Carved Archway Contour
  const archRimGeo = new THREE.TorusGeometry(7.2, 0.45, 8, 24, Math.PI);
  const archRim = new THREE.Mesh(archRimGeo, turquoiseMat);
  archRim.position.set(0, 7.8, 0.2);
  group.add(archRim);

  return group;
}

// 4. O‘zbekiston Xalqaro Yo‘l Belgisi (Overhead Green Highway Sign)
export function createHighwayGantrySign(text: string, kmText: string = 'A-380'): THREE.Group {
  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85 });

  // Pylons on left and right
  const pylonGeo = new THREE.CylinderGeometry(0.3, 0.35, 9, 8);
  const leftPylon = new THREE.Mesh(pylonGeo, steelMat);
  leftPylon.position.set(-10, 4.5, 0);
  group.add(leftPylon);

  const rightPylon = new THREE.Mesh(pylonGeo, steelMat);
  rightPylon.position.set(10, 4.5, 0);
  group.add(rightPylon);

  // Overhead Gantry Truss
  const trussGeo = new THREE.BoxGeometry(20.5, 0.5, 0.5);
  const truss = new THREE.Mesh(trussGeo, steelMat);
  truss.position.set(0, 8.8, 0);
  group.add(truss);

  // Green Highway Signboard Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Green international road background
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 512, 128);

  // White Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 45);

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(kmText, 256, 92);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const signGeo = new THREE.PlaneGeometry(12, 3);
  const signMat = new THREE.MeshBasicMaterial({ map: tex });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 7.5, 0.1);
  group.add(sign);

  return group;
}

// 5. Zamonaviy Ko‘cha Chirog‘i Ustuni (Cover-style Golden-Hour Boulevard Street Light Pole)
export function createStreetLightPole(): THREE.Group {
  const group = new THREE.Group();

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.78,
    roughness: 0.28,
  });

  const lightGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  // Base pedestal + tapering pole
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.7, 10), poleMat);
  base.position.y = 0.35;
  group.add(base);

  const poleGeo = new THREE.CylinderGeometry(0.12, 0.20, 9.2, 8);
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 4.6;
  pole.castShadow = true;
  group.add(pole);

  // Curved overhang arm toward avenue
  const armGeo = new THREE.CylinderGeometry(0.075, 0.085, 3.4, 8);
  armGeo.rotateZ(Math.PI / 3);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(1.15, 9.0, 0);
  group.add(arm);

  // Sleek dual-head lamp housing + warm glowing bulb
  const lampGeo = new THREE.BoxGeometry(1.0, 0.16, 0.44);
  const lamp = new THREE.Mesh(lampGeo, poleMat);
  lamp.position.set(2.3, 9.65, 0);
  group.add(lamp);

  const bulbGeo = new THREE.PlaneGeometry(0.86, 0.36);
  bulbGeo.rotateX(Math.PI / 2);
  const bulb = new THREE.Mesh(bulbGeo, lightGlowMat);
  bulb.position.set(2.3, 9.55, 0);
  group.add(bulb);

  return group;
}

// ========================================================
// HAYDOVCHI QAHRAMON & PIYODA ODAMLAR + MILTIQ (AVTOMAT)
// ========================================================
export function createPedestrianCharacter(options?: {
  shirtColor?: number;
  pantsColor?: number;
  skinColor?: number;
  withBag?: boolean;
  hatStyle?: 'none' | 'doppi' | 'cap';
  includeWeapon?: boolean;
}): PedestrianParts {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: options?.skinColor ?? 0xf1c27d,
    roughness: 0.62,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: options?.shirtColor ?? 0x0284c7,
    roughness: 0.58,
    metalness: 0.08,
  });
  const teeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const jeansMat = new THREE.MeshStandardMaterial({
    color: options?.pantsColor ?? 0x1e293b,
    roughness: 0.78,
  });
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });

  // Soft contact shadow under feet
  const pShadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 14),
    new THREE.MeshBasicMaterial({ color: 0x090d16, transparent: true, opacity: 0.36, depthWrite: false })
  );
  pShadow.rotation.x = -Math.PI / 2;
  pShadow.position.y = 0.015;
  group.add(pShadow);

  // Layered Jacket Torso + White Inner T-Shirt + Waist Belt
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.24), jacketMat);
  torso.position.y = 1.13;
  torso.castShadow = true;
  group.add(torso);

  const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.25), teeMat);
  innerShirt.position.set(0, 1.15, 0.005);
  group.add(innerShirt);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.06, 0.25), beltMat);
  belt.position.y = 0.86;
  group.add(belt);

  if (options?.withBag) {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.36, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 })
    );
    bag.position.set(0, 1.14, -0.17);
    group.add(bag);
  }

  // Head + Clear 3D Eyes + Eyebrows + Nose + Smile + Hat/Hair
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), skinMat);
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.158, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hair.position.set(0, 1.60, -0.01);
  group.add(hair);

  if (options?.hatStyle === 'doppi') {
    const doppi = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.155, 0.09, 4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    doppi.rotation.y = Math.PI / 4;
    doppi.position.set(0, 1.72, 0);
    group.add(doppi);
  } else if (options?.hatStyle === 'cap') {
    const capCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 })
    );
    capCrown.position.set(0, 1.61, 0);
    group.add(capCrown);
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.02, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.6 })
    );
    visor.position.set(0, 1.64, 0.14);
    group.add(visor);
  }

  const pedEyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pedPupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  for (const side of [-1, 1]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.029, 10, 8), pedEyeWhiteMat);
    sclera.position.set(side * 0.054, 1.60, 0.128);
    group.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), pedPupilMat);
    pupil.position.set(side * 0.054, 1.60, 0.146);
    group.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.014, 0.018), hairMat);
    brow.position.set(side * 0.054, 1.635, 0.128);
    group.add(brow);
  }

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.036, 0.028), skinMat);
  nose.position.set(0, 1.568, 0.145);
  group.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.012, 0.015),
    new THREE.MeshBasicMaterial({ color: 0x7c2d12 })
  );
  mouth.position.set(0, 1.525, 0.132);
  group.add(mouth);

  // Articulated Arms
  const buildLimb = (w: number, h: number, d: number, mat: THREE.Material, yOffset: number) => {
    const limb = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    limb.position.y = yOffset;
    limb.castShadow = true;
    return limb;
  };

  const leftArm = new THREE.Group();
  leftArm.position.set(0.28, 1.36, 0);
  leftArm.add(buildLimb(0.12, 0.50, 0.12, jacketMat, -0.22));
  leftArm.add(buildLimb(0.10, 0.12, 0.10, skinMat, -0.49));
  group.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(-0.28, 1.36, 0);
  rightArm.add(buildLimb(0.12, 0.50, 0.12, jacketMat, -0.22));
  rightArm.add(buildLimb(0.10, 0.12, 0.10, skinMat, -0.49));

  let weaponGroup: THREE.Group | undefined;
  let muzzleFlash: THREE.Mesh | undefined;

  if (options?.includeWeapon !== false) {
    weaponGroup = new THREE.Group();
    weaponGroup.position.set(0.02, -0.36, 0.25);
    weaponGroup.visible = false;

    const gunMetal = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.25 });
    const gunWood = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.52), gunMetal);
    weaponGroup.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.42);
    weaponGroup.add(barrel);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.24), gunWood);
    stock.position.set(0, -0.02, -0.32);
    weaponGroup.add(stock);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.20, 0.08), gunMetal);
    mag.position.set(0, -0.14, 0.08);
    mag.rotation.x = 0.25;
    weaponGroup.add(mag);

    muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    muzzleFlash.position.set(0, 0.02, 0.66);
    muzzleFlash.visible = false;
    weaponGroup.add(muzzleFlash);

    rightArm.add(weaponGroup);
  }
  group.add(rightArm);

  // Articulated Legs + Sneakers
  const leftLeg = new THREE.Group();
  leftLeg.position.set(0.11, 0.84, 0);
  leftLeg.add(buildLimb(0.16, 0.72, 0.18, jeansMat, -0.36));
  leftLeg.add(buildLimb(0.17, 0.12, 0.24, shoeMat, -0.78));
  group.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(-0.11, 0.84, 0);
  rightLeg.add(buildLimb(0.16, 0.72, 0.18, jeansMat, -0.36));
  rightLeg.add(buildLimb(0.17, 0.12, 0.24, shoeMat, -0.78));
  group.add(rightLeg);

  return { group, leftLeg, rightLeg, leftArm, rightArm, weaponGroup, muzzleFlash };
}

// 3D SVETAFOR (Red / Yellow / Green Traffic Light Pole)
export function createTrafficLightMesh(): TrafficLightVisual {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.35 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.45 });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 5.4, 8), poleMat);
  mast.position.y = 2.7;
  group.add(mast);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 0.16), poleMat);
  arm.position.set(1.2, 5.2, 0);
  group.add(arm);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.45, 0.42), boxMat);
  housing.position.set(2.2, 4.7, 0);
  group.add(housing);

  const redMat = new THREE.MeshBasicMaterial({ color: 0x450a0a });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0x451a03 });
  const greenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });

  const bulbGeo = new THREE.SphereGeometry(0.14, 10, 8);
  const makeBulb = (y: number, mat: THREE.MeshBasicMaterial) => {
    for (const zOff of [0.18, -0.18]) {
      const b = new THREE.Mesh(bulbGeo, mat);
      b.position.set(2.2, y, zOff);
      group.add(b);
    }
  };
  makeBulb(5.15, redMat);
  makeBulb(4.70, yellowMat);
  makeBulb(4.25, greenMat);

  return { group, redMat, yellowMat, greenMat };
}

// Hostile Combat Target / Raider for Jang Maydoni (Battle Arena)
export function createArenaEnemyMesh(): THREE.Group {
  const g = new THREE.Group();
  const armorMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.65, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.4, 12), armorMat);
  body.position.y = 0.9;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), darkMat);
  head.position.y = 1.8;
  g.add(head);

  const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeGlowMat);
    eye.position.set(side * 0.11, 1.83, 0.28);
    g.add(eye);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.95, 20),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);

  return g;
}

// ========================================================
// O‘ZBEKISTON YPX / GAI PATRUL MOSHINASI (COBALT / MALIBU 2)
// ========================================================
export function createGaiPatrolCar(model: 'cobalt' | 'malibu2' = 'cobalt'): VehicleParts {
  const parts = createRealCar(model, 'white');

  // Enable flashing red/blue Migalka bar on roof!
  if (parts.migalkaGroup) {
    parts.migalkaGroup.visible = true;
  }

  // Add authentic Uzbekistan YPX / IIV patrol green & blue side stripes + YPX hood badge
  const ypxBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });
  const ypxGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });

  const width = model === 'malibu2' ? 1.86 : 1.76;
  const len = model === 'malibu2' ? 2.8 : 2.5;
  const stripeY = model === 'malibu2' ? 0.52 : 0.58;

  for (const side of [-1, 1]) {
    const blueStripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.11, len), ypxBlueMat);
    blueStripe.position.set(side * (width * 0.5 + 0.005), stripeY + 0.06, 0);
    parts.group.add(blueStripe);

    const greenStripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, len), ypxGreenMat);
    greenStripe.position.set(side * (width * 0.5 + 0.005), stripeY - 0.04, 0);
    parts.group.add(greenStripe);
  }

  // Hood YPX badge plate
  const hoodCanvas = document.createElement('canvas');
  hoodCanvas.width = 256;
  hoodCanvas.height = 128;
  const ctx = hoodCanvas.getContext('2d')!;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 86);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 86, 256, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YPX 01', 128, 48);

  const hoodTex = new THREE.CanvasTexture(hoodCanvas);
  hoodTex.colorSpace = THREE.SRGBColorSpace;
  const hoodDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.46),
    new THREE.MeshBasicMaterial({ map: hoodTex, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  hoodDecal.rotation.x = -Math.PI / 2;
  hoodDecal.position.set(0, model === 'malibu2' ? 0.72 : 0.84, model === 'malibu2' ? 1.75 : 1.52);
  parts.group.add(hoodDecal);

  return parts;
}

// ========================================================
// USTAXONA ISHCHISI (AVTOSERVIS USTASI) & ONLAYN O'YINCHI TAGI
// ========================================================
export function createUstaxonaWorkerMesh(
  overallColor: number = 0x1d4ed8
): PedestrianParts {
  const worker = createPedestrianCharacter({
    shirtColor: overallColor,
    pantsColor: 0x0f172a,
    includeWeapon: false,
  });

  // High-visibility safety vest & cap
  const vestMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.5,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.25,
  });
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.27), vestMat);
  vest.position.y = 1.15;
  worker.group.add(vest);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })
  );
  cap.position.y = 1.74;
  worker.group.add(cap);

  // Metal Wrench (Kalit) in right hand
  const wrench = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
  );
  wrench.position.set(0, -0.45, 0.22);
  worker.rightArm.add(wrench);

  return worker;
}

export function createRemotePlayerTag(name: string, plateNumber: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
  ctx.fillRect(6, 6, 308, 84);
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 308, 84);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '900 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🌐 ${name.slice(0, 16)}`, 160, 34);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 20px monospace';
  ctx.fillText(plateNumber || '01 Z 777 ZZ', 160, 68);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.2, 0.96, 1);
  sprite.position.set(0, 2.45, 0);
  return sprite;
}


