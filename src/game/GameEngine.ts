/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GameMode,
  CameraMode,
  ShipModel,
  ShipColor,
  PlayerStats,
  ControlInputState,
  WorldRegionId,
  CarCustomization,
  TurnSignalState,
  SirenMode,
  RadioStationId,
  RemotePlayerState,
} from '../types/game';
import {
  VEHICLES,
  WORLD_REGIONS,
  DEFAULT_CUSTOMIZATION,
  SIREN_MODES,
  RADIO_STATIONS,
} from '../data/constants';
import { soundEngine } from '../audio/soundEngine';
import { MultiplayerClient } from './multiplayer';
import {
  isSoftwareGl,
  createTrackTexture,
  createBoostPadTexture,
} from './materials';
import {
  createHovercraft,
  createCrystal,
  createShieldPickup,
  createBoostPadMesh,
  createLaserBarrier,
  createDroneHazard,
  createJumpRamp,
  createCitySpire,
  createTashkentTVTower,
  createKhivaKaltaMinor,
  createIchanQalaGate,
  createHighwayGantrySign,
  createStreetLightPole,
  createPedestrianCharacter,
  createArenaEnemyMesh,
  createRemotePlayerTag,
  VehicleParts,
  PedestrianParts,
} from './models';
import {
  buildGrandOpenWorld,
  buildHouseInteriorGroup,
  WorldPoi,
  WorldCollider,
  WorldRamp,
  WorldRoadBump,
  CITY_SPAWN_COORDS,
  TrafficLightNode,
  CrosswalkZone,
  ROAD_AXES,
  ALL_ROAD_AXES,
  PRAVA_XONA_COORDS,
  AVTODROM_CENTER,
  JANG_MAYDONI_CENTER,
  USTAXONA_COORDS,
  ISH_MARKAZI_COORDS,
  MY_HOME_COORDS,
} from './openWorld';

// Pre-allocated math helpers to eliminate GC pauses
const _v1 = new THREE.Vector3();

interface SpawnedEntity {
  type: 'crystal' | 'shield' | 'boost_pad' | 'laser' | 'drone' | 'ramp' | 'arch' | 'landmark';
  group: THREE.Object3D;
  hitboxRadius: number;
  hitboxHeight: number;
  z: number;
  x: number;
  active: boolean;
  extra?: unknown;
}

export interface RivalRacer {
  id: string;
  name: string;
  parts: VehicleParts;
  model: ShipModel;
  color: ShipColor;
  pos: THREE.Vector3;
  speed: number;
  targetLaneX: number;
  laneChangeTimer: number;
  wheelRotationAngle: number;
  yaw: number;
  isPassed: boolean;
}

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  private container: HTMLElement;
  private animationFrameId: number = 0;
  private clock: THREE.Clock;

  // Game config & state
  public mode: GameMode = 'open_world';
  public cameraMode: CameraMode = 'chase';
  public shipModel: ShipModel = 'damas';
  public shipColor: ShipColor = 'white';
  public customization: CarCustomization = { ...DEFAULT_CUSTOMIZATION };

  // World Tour Navigation & Biomes
  public currentRegion: WorldRegionId = 'tashkent';
  private targetSkyColor: THREE.Color = new THREE.Color(0x3b82b6);
  private targetFogColor: THREE.Color = new THREE.Color(0xf4a261);

  // Stats
  public stats: PlayerStats = {
    score: 0,
    highScore: 0,
    distance: 0,
    speed: 0,
    maxSpeedReached: 0,
    gear: 1,
    rpm: 900,
    crystals: 0,
    multiplier: 1,
    comboCount: 0,
    shields: 4,
    maxShields: 4,
    nitro: 100,
    isNitroActive: false,
    lapTime: 0,
    bestLapTime: 0,
    stuntScore: 0,
    lastStuntName: '',
    currentRegion: 'tashkent',
    regionName: 'Katta Ochiq Dunyo • O‘zbekiston',
    regionProgress: 0,
    worldX: 0,
    worldZ: 0,
    racePosition: 1,
    totalRacers: 6,
    isOnFoot: false,
    energy: 100,
    hunger: 100,
    fuel: 100,
    hp: 100,
    carCondition: 100,
    money: 250000,
    sirenActive: false,
    sirenMode: 'wail',
    radioStation: 'off',
    subwooferLevel: 1,
    migalkaActive: false,
    nearbyPoi: 'none',
    nearbyPoiLabel: '',
    nearCar: true,
    gaiAlert: 0,
    gaiFines: 0,
    headlightsOn: true,
    turnSignal: 'none',
    turnSignalBlinkOn: false,
    hasPrava: false,
    hasDocuments: false,
    weaponEquipped: false,
    ammo: 120,
    inBattleArena: false,
    arenaKills: 0,
    pedestrianWarning: false,
    redLightWarning: false,
    examActive: false,
    examStepLabel: '',
    examProgress: 0,
    examMistakes: 0,
    // Ish joylari, GTA Xarita & Onlayn rejim
    playerHeading: 0,
    customWaypoint: null,
    respect: 0,
    cashPickupsCollected: 0,
    activeJob: null,
    jobsCompleted: 0,
    onlineConnected: false,
    onlinePlayersCount: 0,
    onlineEnabled: true,
    onlineRoomCode: 'UZB-01',
    onlineDriverName: 'Haydovchi',
    onlinePeers: [],
    wantedLevel: 0,
    isInsideHouse: false,
    housePoiAction: 'none',
  };

  public isRunning: boolean = false;
  public isGameOver: boolean = false;

  // Controls input (starts neutral so car only drives when Gaz is pressed)
  public input: ControlInputState = {
    steer: 0,
    throttle: 0,
    boost: false,
    jump: false,
    drift: false,
    fire: false,
  };

  public onStatsUpdate: ((stats: PlayerStats) => void) | null = null;
  public onGameOver: ((stats: PlayerStats) => void) | null = null;
  public onRegionChange: ((region: WorldRegionId) => void) | null = null;
  public onMilitsiyaStop: ((reason: string) => void) | null = null;
  public onOpenPravaXona: (() => void) | null = null;
  public onOpenJobs: (() => void) | null = null;
  public onOpenHome: (() => void) | null = null;
  public onCareerUpdate: ((data: { money: number; hasPrava: boolean; hasDocuments: boolean }) => void) | null = null;

  // Player 3D Vehicle & Wheel Parts
  private playerGroup: THREE.Group = new THREE.Group();
  private playerParts: VehicleParts | null = null;
  private wheelRotationAngle: number = 0;

  // Turn Signals (Povorotniklar)
  private turnSignalTimer: number = 0;
  private turnSignalStartHeading: number = 0;

  // On-foot Pedestrian & Park/Choyxona/Combat state
  private isOnFoot: boolean = false;
  private pedestrian: PedestrianParts | null = null;
  private pedestrianPos = new THREE.Vector3(0, 0, 0);
  private pedestrianHeading: number = 0;
  private pedestrianVelocityY: number = 0;
  private pedestrianGrounded: boolean = true;
  private pedestrianWalkCycle: number = 0;
  private poiTriggerCooldown: number = 0;
  private lastAutoPoiId: string = '';

  // Headlights (Faralar), Migalka / Sirena & GAI YPX Patrol state
  private headlightsOn: boolean = true;
  private migalkaActive: boolean = false;
  private sirenActive: boolean = false;
  private gaiGraceCooldown: number = 0;
  private pendingMilitsiyaReason: string = 'Belgilangan tezlikni oshirdingiz!';
  private isMilitsiyaModalPaused: boolean = false;
  private redLightCooldown: number = 0;
  private zebraViolationCooldown: number = 0;
  private gaiBeaconPairs: { red: THREE.Mesh; blue: THREE.Mesh }[] = [];
  private gaiPatrols: {
    parts: VehicleParts;
    pos: THREE.Vector3;
    heading: number;
    speed: number;
    chasing: boolean;
    patrolAxis: 'z' | 'x';
    patrolLane: number;
    patrolDir: number;
  }[] = [];

  // Open World City, Colliders, Workers, Jobs, Multiplayer & Avtodrom Exam
  private openWorldGroup: THREE.Group = new THREE.Group();
  private openWorldBuilt: boolean = false;
  private openWorldPois: WorldPoi[] = [];
  private worldColliders: WorldCollider[] = [];
  private worldRamps: WorldRamp[] = [];
  private worldRoadBumps: WorldRoadBump[] = [];
  private roadBumpRoll: number = 0;
  private wantedDecayTimer: number = 0;
  private ustaxonaWorkers: PedestrianParts[] = [];
  private trafficLights: TrafficLightNode[] = [];
  private crosswalks: CrosswalkZone[] = [];
  private avtodromCones: { x: number; z: number }[] = [];
  private lastLightCyclePhase: number = -1;
  private currentNsState: 'green' | 'yellow' | 'red' = 'green';
  private currentEwState: 'green' | 'yellow' | 'red' = 'red';
  private colliderCooldown: number = 0;
  private smokeEmitAccum: number = 0;
  private jobMarkerGroup: THREE.Group | null = null;
  private waypointMarkerGroup: THREE.Group | null = null;
  private gpsArrowGroup: THREE.Group | null = null;
  private streetCashPickups: {
    mesh: THREE.Group;
    pos: THREE.Vector3;
    amount: number;
    respawnTimer: number;
    active: boolean;
  }[] = [];
  private activeJobStage: number = 0;

  // Real-time WebSocket Online Multiplayer
  private mpClient: MultiplayerClient | null = null;
  private remotePlayers: Map<
    string,
    {
      state: RemotePlayerState;
      parts: VehicleParts;
      tag: THREE.Sprite;
      targetPos: THREE.Vector3;
      targetHeading: number;
      wheelRot: number;
    }
  > = new Map();
  private onlineDriverName: string = `Haydovchi-${Math.floor(100 + Math.random() * 900)}`;

  private civilianCars: {
    model: ShipModel;
    color: ShipColor;
    parts: VehicleParts;
    pos: THREE.Vector3;
    axis: 'ns' | 'ew';
    roadCoord: number;
    dir: 1 | -1;
    baseSpeed: number;
    speed: number;
    wheelRot: number;
  }[] = [];

  private sidewalkPeds: {
    parts: PedestrianParts;
    pos: THREE.Vector3;
    axis: 'ns' | 'ew';
    roadCoord: number;
    sideOffset: number;
    dir: 1 | -1;
    speed: number;
    walkCycle: number;
  }[] = [];

  private crosswalkPeds: {
    parts: PedestrianParts;
    cwIndex: number;
    t: number; // -0.6 to 0.6 across road
    dir: 1 | -1;
    speed: number;
    crossing: boolean;
    waitTimer: number;
    walkCycle: number;
    rewarded: boolean;
  }[] = [];

  private arenaEnemies: {
    group: THREE.Group;
    pos: THREE.Vector3;
    hp: number;
    patrolAngle: number;
    radius: number;
    fireTimer: number;
    respawnTimer: number;
    alive: boolean;
  }[] = [];

  private bullets: {
    mesh: THREE.Mesh;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    fromPlayer: boolean;
    life: number;
  }[] = [];
  private lastFireMs: number = 0;
  private muzzleFlashTimer: number = 0;

  private examStage: number = 0;
  private examMarkerGroup: THREE.Group | null = null;
  private examConeHitCooldown: number = 0;

  // Player physics
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerHeading: number = 0; // heading angle in radians for open world
  private playerYaw: number = 0; // visual yaw turning angle
  private playerVelocityY: number = 0;
  private isGrounded: boolean = true;
  private playerRoll: number = 0;
  private playerPitch: number = 0;
  private currentSpeed: number = 0;
  private forwardDistance: number = 0;
  private airTime: number = 0;
  private lastHornTriggerMs: number = 0;
  private lastBoostSoundMs: number = 0;

  // Rival Competitor Racers
  private rivalRacers: RivalRacer[] = [];

  // Track & procedural world
  private trackSegments: THREE.Mesh[] = [];
  private trackTexture: THREE.CanvasTexture;
  private boostPadTexture: THREE.CanvasTexture;
  private activeEntities: SpawnedEntity[] = [];
  private nextSpawnZ: number = 60;
  private trackWidth: number = 18; // Wide 4-lane international highway

  // Particles
  private speedParticles: THREE.Points | null = null;
  private sparkParticles: THREE.Points | null = null;
  private sparkGeo: THREE.BufferGeometry | null = null;
  private sparkCount = 80;
  private sparkPositions: Float32Array = new Float32Array(this.sparkCount * 3);
  private sparkVelocities: Float32Array = new Float32Array(this.sparkCount * 3);
  private sparkLifetimes: Float32Array = new Float32Array(this.sparkCount);

  // Tire smoke pool
  private smokeParticles: THREE.Points | null = null;
  private smokeGeo: THREE.BufferGeometry | null = null;
  private smokeCount = 60;
  private smokePositions: Float32Array = new Float32Array(this.smokeCount * 3);
  private smokeLifetimes: Float32Array = new Float32Array(this.smokeCount);
  private nextSmokeIdx = 0;

  // Lighting & Scenery
  private dirLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private sceneryGroup: THREE.Group = new THREE.Group();
  private worldFloorMesh: THREE.Mesh | null = null;
  private skyDome: THREE.Mesh | null = null;

  // Walk-Inside 3D House Interior ("Uyga kirish kerak")
  private houseInteriorGroup: THREE.Group | null = null;
  private isInsideHouse: boolean = false;
  private savedOutdoorCarPos = new THREE.Vector3(MY_HOME_COORDS.x, 0.02, MY_HOME_COORDS.z - 16);
  private savedOutdoorHeading: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. WebGL Renderer with Software WebGL Guard (Three.js Skill Standard)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Fog (Golden-hour sunset cover atmosphere)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3b82b6);
    this.scene.fog = new THREE.FogExp2(0xf4a261, 0.0014);

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );
    this.camera.position.set(0, 3.2, -5.8);

    // 4. Procedural Studio Reflection Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(),
        0.04
      ).texture;
      pmremGenerator.dispose();
    } catch {}

    // 5. Procedural Textures
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.trackTexture = createTrackTexture(maxAniso);
    this.boostPadTexture = createBoostPadTexture();

    // 6. Setup Scene Components
    this.setupLighting();
    this.setupScenery();
    this.setupTrack();
    this.setupPlayer();
    this.setupPedestrian();
    this.setupParticles();
    this.scene.add(this.openWorldGroup);
    this.openWorldGroup.visible = false;
    this.initMultiplayerClient();

    window.addEventListener('resize', this.onWindowResize);

    if (!isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private initMultiplayerClient() {
    this.mpClient = new MultiplayerClient({
      onInit: (_selfId, players, count) => {
        this.stats.onlineConnected = true;
        this.stats.onlinePlayersCount = count;
        const incomingIds = new Set(players.map((p) => p.id));
        for (const id of Array.from(this.remotePlayers.keys())) {
          if (!incomingIds.has(id)) {
            this.removeRemotePlayer(id);
          }
        }
        for (const p of players) {
          this.upsertRemotePlayer(p);
        }
      },
      onPlayerUpdate: (player) => {
        this.upsertRemotePlayer(player);
      },
      onPlayerLeft: (id, count) => {
        this.stats.onlinePlayersCount = count;
        this.removeRemotePlayer(id);
      },
      onStatusChange: (connected, count) => {
        this.stats.onlineConnected = connected;
        if (connected && count > 0) {
          this.stats.onlinePlayersCount = count;
        } else if (!connected) {
          this.stats.onlinePlayersCount = 0;
          for (const id of Array.from(this.remotePlayers.keys())) {
            this.removeRemotePlayer(id);
          }
        }
      },
    });
    if (this.stats.onlineEnabled) {
      this.mpClient.connect();
    }
  }

  private upsertRemotePlayer(p: RemotePlayerState) {
    const existing = this.remotePlayers.get(p.id);
    if (existing) {
      const modelChanged = existing.state.model !== p.model || existing.state.color !== p.color;
      if (modelChanged) {
        this.removeRemotePlayer(p.id);
      } else {
        existing.state = p;
        existing.targetPos.set(p.x, p.y, p.z);
        existing.targetHeading = p.heading;
        if (existing.parts.migalkaGroup) {
          existing.parts.migalkaGroup.visible = p.migalkaActive;
        }
        return;
      }
    }

    const safeModel: ShipModel = VEHICLES[p.model] ? p.model : 'damas';
    const parts = createHovercraft(safeModel, p.color || 'white', {
      plateNumber: p.plateNumber || '01 O 777 OO',
      headlightStyle: 'xenon',
      taillightStyle: 'classic_red',
    });
    const tag = createRemotePlayerTag(p.name || 'Haydovchi', p.plateNumber || '01 O 777 OO');
    parts.group.add(tag);
    parts.group.position.set(p.x, p.y, p.z);
    parts.group.rotation.y = p.heading;
    if (parts.migalkaGroup) parts.migalkaGroup.visible = p.migalkaActive;
    this.scene.add(parts.group);

    this.remotePlayers.set(p.id, {
      state: p,
      parts,
      tag,
      targetPos: new THREE.Vector3(p.x, p.y, p.z),
      targetHeading: p.heading,
      wheelRot: 0,
    });
  }

  private removeRemotePlayer(id: string) {
    const entry = this.remotePlayers.get(id);
    if (!entry) return;
    this.scene.remove(entry.parts.group);
    this.remotePlayers.delete(id);
  }

  public toggleOnlineMode() {
    this.stats.onlineEnabled = !this.stats.onlineEnabled;
    if (this.stats.onlineEnabled) {
      this.mpClient?.connect();
      this.stats.lastStuntName = '🌐 ONLAYN REJIM YOQILDI! SERVERGA ULANMOQDA...';
    } else {
      this.mpClient?.disconnect();
      this.stats.lastStuntName = '📴 OFLAYN REJIMGA O‘TILDI';
    }
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  private createGoldenHourSkyDome(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Smooth vertical golden-hour sky gradient (cerulean upper -> warm peach/amber horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, '#1e4b8a');
    skyGrad.addColorStop(0.28, '#3b82b6');
    skyGrad.addColorStop(0.52, '#8cb8cc');
    skyGrad.addColorStop(0.68, '#f4b678');
    skyGrad.addColorStop(0.80, '#fb923c');
    skyGrad.addColorStop(1.0, '#fde68a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Warm golden sun orb glowing at horizon ahead
    const sunX = 512;
    const sunY = 345;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 175);
    sunGlow.addColorStop(0.0, 'rgba(255, 252, 224, 1.0)');
    sunGlow.addColorStop(0.18, 'rgba(254, 215, 130, 0.85)');
    sunGlow.addColorStop(0.5, 'rgba(251, 146, 60, 0.35)');
    sunGlow.addColorStop(1.0, 'rgba(251, 146, 60, 0.0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 140, 1024, 372);

    // Soft sunlit clouds
    for (let i = 0; i < 24; i++) {
      const cx = (i * 137 + 45) % 1024;
      const cy = 120 + (i % 5) * 32;
      const rx = 55 + (i % 4) * 28;
      const ry = 14 + (i % 3) * 6;
      const cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
      cg.addColorStop(0, 'rgba(255, 237, 213, 0.48)');
      cg.addColorStop(1, 'rgba(255, 237, 213, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.SphereGeometry(680, 28, 18);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  private setupLighting() {
    this.skyDome = this.createGoldenHourSkyDome();
    this.scene.add(this.skyDome);

    this.dirLight = new THREE.DirectionalLight(0xffd9a0, 2.55);
    this.dirLight.position.set(45, 36, 110);
    this.dirLight.castShadow = !isSoftwareGl;
    if (this.dirLight.castShadow) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 1;
      this.dirLight.shadow.camera.far = 160;
      const d = 42;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0005;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x6b5344, 1.15);
    this.scene.add(this.hemiLight);

    const ambient = new THREE.AmbientLight(0x523b28, 0.55);
    this.scene.add(ambient);
  }

  private setupScenery() {
    this.scene.add(this.sceneryGroup);

    // Massive 1,000m x 1,000m continuous open world terrain
    const floorGeo = new THREE.PlaneGeometry(1200, 1200, 40, 40);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050814,
      metalness: 0.8,
      roughness: 0.6,
      wireframe: true,
    });
    this.worldFloorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.worldFloorMesh.position.y = -0.05;
    this.scene.add(this.worldFloorMesh);

    // Initial scenery spawn
    this.spawnInitialScenery();
  }

  private spawnInitialScenery() {
    // 1. Tashkent TV Tower visible in the distance
    const tvTower = createTashkentTVTower();
    tvTower.position.set(-58, 0, 150);
    this.sceneryGroup.add(tvTower);

    // 2. Modern Tashkent City Skyscrapers
    for (let i = 0; i < 20; i++) {
      const height = 45 + Math.random() * 85;
      const width = 8 + Math.random() * 12;
      const spire = createCitySpire(height, width);
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (34 + Math.random() * 75);
      const z = Math.random() * 500 - 50;
      spire.position.set(x, 0, z);
      this.sceneryGroup.add(spire);
    }

    // 3. Street Light Poles along the avenue shoulders
    for (let z = -20; z < 320; z += 45) {
      const leftLight = createStreetLightPole();
      leftLight.position.set(-11, 0, z);
      this.sceneryGroup.add(leftLight);

      const rightLight = createStreetLightPole();
      rightLight.position.set(11, 0, z);
      rightLight.rotation.y = Math.PI;
      this.sceneryGroup.add(rightLight);
    }

    // 4. Initial Overhead Street Sign for Tashkent
    const initialSign = createHighwayGantrySign('TOSHKENT SHAHRI', 'AMIR TEMUR SHOH KO‘CHASI');
    initialSign.position.set(0, 0, 85);
    this.sceneryGroup.add(initialSign);
  }

  private setupTrack() {
    // 6 wide international highway segments that cycle seamlessly
    const segmentLength = 120;
    const trackGeo = new THREE.PlaneGeometry(this.trackWidth, segmentLength);
    trackGeo.rotateX(-Math.PI / 2);

    const trackMat = new THREE.MeshStandardMaterial({
      map: this.trackTexture,
      metalness: 0.65,
      roughness: 0.25,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(trackGeo, trackMat);
      mesh.position.set(0, 0, i * segmentLength);
      mesh.receiveShadow = !isSoftwareGl;
      this.scene.add(mesh);
      this.trackSegments.push(mesh);
    }
  }

  public setupPlayer() {
    const keepTransform = this.isRunning && !this.isGameOver;
    const savedPos = this.playerPos.clone();
    const savedHeading = this.playerHeading;

    if (this.playerGroup.parent) {
      this.scene.remove(this.playerGroup);
    }

    const parts = createHovercraft(this.shipModel, this.shipColor, this.customization);
    this.playerParts = parts;
    this.playerGroup = parts.group;

    const shadowGeo = new THREE.PlaneGeometry(2.8, 4.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.02;
    this.playerGroup.add(shadowMesh);

    if (keepTransform) {
      this.playerPos.set(savedPos.x, parts.isCar ? 0.02 : 0.45, savedPos.z);
      this.playerGroup.rotation.y = savedHeading;
    } else {
      this.playerPos.set(0, parts.isCar ? 0.02 : 0.45, 0);
    }
    this.playerGroup.position.copy(this.playerPos);
    this.scene.add(this.playerGroup);

    const cfg = VEHICLES[this.shipModel];
    this.stats.maxShields = cfg.shieldMax;
    this.stats.shields = cfg.shieldMax;
    if (this.playerParts?.migalkaGroup) {
      this.playerParts.migalkaGroup.visible = this.migalkaActive;
    }
    if (this.playerParts?.driverGroup) {
      this.playerParts.driverGroup.visible = !this.isOnFoot;
    }
    this.applyHeadlightsVisual();
    this.applyTurnSignalVisuals();
  }

  private applyHeadlightsVisual() {
    if (!this.playerParts) return;
    if (this.playerParts.headlightBeams) {
      this.playerParts.headlightBeams.visible = this.headlightsOn;
    }
    if (this.playerParts.headlightSpot) {
      this.playerParts.headlightSpot.intensity = this.headlightsOn ? 8.5 : 0;
    }
    if (this.playerParts.headlightMat) {
      const onColor = this.playerParts.headlightOnHex ?? 0xf8fafc;
      this.playerParts.headlightMat.color.setHex(this.headlightsOn ? onColor : 0x334155);
    }
  }

  private applyTurnSignalVisuals() {
    if (!this.playerParts) return;
    const on = this.stats.turnSignalBlinkOn;
    if (this.playerParts.leftTurnMat) {
      this.playerParts.leftTurnMat.color.setHex(
        this.stats.turnSignal === 'left' && on ? 0xffaa00 : 0x3b2306
      );
    }
    if (this.playerParts.rightTurnMat) {
      this.playerParts.rightTurnMat.color.setHex(
        this.stats.turnSignal === 'right' && on ? 0xffaa00 : 0x3b2306
      );
    }
  }

  private setupPedestrian() {
    if (this.pedestrian) {
      this.scene.remove(this.pedestrian.group);
    }
    this.pedestrian = createPedestrianCharacter({ includeWeapon: true });
    this.pedestrian.group.visible = false;
    this.scene.add(this.pedestrian.group);
  }

  private ensureOpenWorldBuilt() {
    if (this.openWorldBuilt) return;
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const res = buildGrandOpenWorld(this.openWorldGroup, maxAniso);
    this.openWorldPois = res.pois;
    this.gaiBeaconPairs = res.beaconPairs;
    this.trafficLights = res.trafficLights;
    this.crosswalks = res.crosswalks;
    this.avtodromCones = res.avtodromCones;
    this.worldColliders = res.colliders;
    this.worldRamps = res.ramps;
    this.worldRoadBumps = res.roadBumps;
    this.ustaxonaWorkers = res.workers;
    this.openWorldBuilt = true;

    this.setupOpenWorldLivingEntities();
  }

  private setupOpenWorldLivingEntities() {
    // Clear previous dynamic open-world actors
    this.civilianCars.forEach((c) => this.openWorldGroup.remove(c.parts.group));
    this.civilianCars = [];
    this.sidewalkPeds.forEach((p) => this.openWorldGroup.remove(p.parts.group));
    this.sidewalkPeds = [];
    this.crosswalkPeds.forEach((p) => this.openWorldGroup.remove(p.parts.group));
    this.crosswalkPeds = [];
    this.arenaEnemies.forEach((e) => this.openWorldGroup.remove(e.group));
    this.arenaEnemies = [];
    this.streetCashPickups.forEach((c) => this.openWorldGroup.remove(c.mesh));
    this.streetCashPickups = [];

    // 1. 22 Civilian Traffic Cars cruising along expanded city avenues (cover stars Damas & Matiz featured prominently)
    const civModels: { model: ShipModel; color: ShipColor }[] = [
      { model: 'damas', color: 'white' },
      { model: 'matiz', color: 'emerald' },
      { model: 'cobalt', color: 'white' },
      { model: 'gentra', color: 'black' },
      { model: 'nexia3', color: 'silver' },
      { model: 'spark', color: 'cyan' },
      { model: 'onix', color: 'white' },
      { model: 'byd_uz', color: 'silver' },
      { model: 'malibu2', color: 'black' },
      { model: 'tracker2', color: 'crimson' },
      { model: 'monza', color: 'white' },
      { model: 'damas', color: 'white' },
      { model: 'matiz', color: 'emerald' },
      { model: 'cobalt', color: 'silver' },
      { model: 'gentra', color: 'white' },
      { model: 'tracker2', color: 'black' },
      { model: 'nexia3', color: 'white' },
      { model: 'monza', color: 'crimson' },
      { model: 'spark', color: 'white' },
      { model: 'damas', color: 'silver' },
      { model: 'matiz', color: 'cyan' },
      { model: 'malibu2', color: 'white' },
    ];
    const primaryAxes = [-160, -80, 0, 80, 160];

    civModels.forEach((cm, idx) => {
      const parts = createHovercraft(cm.model, cm.color);
      const axis: 'ns' | 'ew' = idx % 2 === 0 ? 'ns' : 'ew';
      const roadCoord = primaryAxes[idx % primaryAxes.length];
      const dir: 1 | -1 = idx % 4 < 2 ? 1 : -1;
      // Car faces +Z when heading=0: Driver's RIGHT is -X when dir=+1, +X when dir=-1
      const laneOffset = dir === 1 ? -4.5 : 4.5;
      const startAlong = -360 + idx * 42;
      const pos =
        axis === 'ns'
          ? new THREE.Vector3(roadCoord + laneOffset, 0.02, startAlong)
          : new THREE.Vector3(startAlong, 0.02, roadCoord - laneOffset);
      const heading =
        axis === 'ns'
          ? dir === 1
            ? 0
            : Math.PI
          : dir === 1
          ? Math.PI / 2
          : -Math.PI / 2;

      parts.group.position.copy(pos);
      parts.group.rotation.y = heading;
      this.openWorldGroup.add(parts.group);

      this.civilianCars.push({
        model: cm.model,
        color: cm.color,
        parts,
        pos,
        axis,
        roadCoord,
        dir,
        baseSpeed: 13 + (idx % 4) * 2.5,
        speed: 13,
        wheelRot: 0,
      });
    });

    // 2. 28 Lively Sidewalk Pedestrians + 4 Chorsu Bazaar Shoppers with varied outfits, doppi/caps & backpacks
    const shirtPalette = [0x0284c7, 0xd97706, 0x16a34a, 0xe11d48, 0x7c3aed, 0x0f766e, 0xea580c];
    const skinPalette = [0xf6caa2, 0xe5b182, 0xfad7b8, 0xd49c6e];
    const hatOptions: ('none' | 'doppi' | 'cap')[] = ['doppi', 'none', 'cap', 'none'];
    for (let i = 0; i < 28; i++) {
      const parts = createPedestrianCharacter({
        shirtColor: shirtPalette[i % shirtPalette.length],
        pantsColor: i % 2 === 0 ? 0x1e293b : 0x334155,
        skinColor: skinPalette[i % skinPalette.length],
        hatStyle: hatOptions[i % hatOptions.length],
        withBag: i % 3 === 0,
        includeWeapon: false,
      });
      const roadCoord = primaryAxes[i % primaryAxes.length];
      const sideOffset = i % 2 === 0 ? 11.4 : -11.4;
      const dir: 1 | -1 = i % 3 === 0 ? -1 : 1;
      const zPos = -340 + i * 26;
      const pos = new THREE.Vector3(roadCoord + sideOffset, 0, zPos);
      parts.group.position.copy(pos);
      parts.group.rotation.y = dir === 1 ? 0 : Math.PI;
      this.openWorldGroup.add(parts.group);

      this.sidewalkPeds.push({
        parts,
        pos,
        axis: 'ns',
        roadCoord,
        sideOffset,
        dir,
        speed: 2.1 + (i % 3) * 0.45,
        walkCycle: i * 0.9,
      });
    }

    // 4 Chorsu Bazaar shoppers strolling around (-40, -40)
    for (let b = 0; b < 4; b++) {
      const parts = createPedestrianCharacter({
        shirtColor: shirtPalette[(b + 3) % shirtPalette.length],
        pantsColor: 0x0f172a,
        skinColor: skinPalette[b % skinPalette.length],
        hatStyle: b % 2 === 0 ? 'doppi' : 'cap',
        withBag: true,
        includeWeapon: false,
      });
      const pos = new THREE.Vector3(-40 + (b - 1.5) * 6, 0, -21.5);
      parts.group.position.copy(pos);
      parts.group.rotation.y = b % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
      this.openWorldGroup.add(parts.group);
      this.sidewalkPeds.push({
        parts,
        pos,
        axis: 'ew',
        roadCoord: -21.5,
        sideOffset: 0,
        dir: b % 2 === 0 ? 1 : -1,
        speed: 1.7 + b * 0.25,
        walkCycle: b * 1.4,
      });
    }

    // 3. Zebra Crosswalk Pedestrians (walking across painted crosswalks!)
    this.crosswalks.forEach((cw, idx) => {
      const parts = createPedestrianCharacter({
        shirtColor: shirtPalette[(idx + 2) % shirtPalette.length],
        pantsColor: 0x0f172a,
        includeWeapon: false,
      });
      const startT = idx % 2 === 0 ? -0.52 : 0.52;
      const dir: 1 | -1 = startT < 0 ? 1 : -1;
      const posX = cw.axis === 'ns' ? cw.x + startT * cw.width : cw.x;
      const posZ = cw.axis === 'ns' ? cw.z : cw.z + startT * cw.width;
      parts.group.position.set(posX, 0, posZ);
      this.openWorldGroup.add(parts.group);

      this.crosswalkPeds.push({
        parts,
        cwIndex: idx,
        t: startT,
        dir,
        speed: 0.16,
        crossing: idx < 4, // start first 4 immediately so user sees active crossings
        waitTimer: idx * 1.5,
        walkCycle: 0,
        rewarded: false,
      });
    });

    // 4. Jang Maydoni (Battle Arena) Hostile Combat Targets
    for (let i = 0; i < 5; i++) {
      const mesh = createArenaEnemyMesh();
      const angle = (i / 5) * Math.PI * 2;
      const radius = 11 + (i % 2) * 8;
      const pos = new THREE.Vector3(
        JANG_MAYDONI_CENTER.x + Math.cos(angle) * radius,
        0,
        JANG_MAYDONI_CENTER.z + Math.sin(angle) * radius
      );
      mesh.position.copy(pos);
      this.openWorldGroup.add(mesh);
      this.arenaEnemies.push({
        group: mesh,
        pos,
        hp: 100,
        patrolAngle: angle,
        radius,
        fireTimer: 1.5 + i * 0.4,
        respawnTimer: 0,
        alive: true,
      });
    }

    // 5. Glowing 3D Avtodrom Exam Waypoint Marker Ring
    if (!this.examMarkerGroup) {
      this.examMarkerGroup = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 3.3, 32),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      this.examMarkerGroup.add(ring);

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 6.5, 10),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.55 })
      );
      beacon.position.y = 3.25;
      this.examMarkerGroup.add(beacon);
      this.examMarkerGroup.visible = false;
      this.openWorldGroup.add(this.examMarkerGroup);
    }

    // 6. Glowing 3D City Delivery / Taxi Job Beacon Marker (tall 65m sky beam)
    if (!this.jobMarkerGroup) {
      this.jobMarkerGroup = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.4, 4.6, 32),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      this.jobMarkerGroup.add(ring);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 65, 12),
        new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.42 })
      );
      beam.position.y = 32.5;
      this.jobMarkerGroup.add(beam);
      this.jobMarkerGroup.visible = false;
      this.openWorldGroup.add(this.jobMarkerGroup);
    }

    // 7. GTA Custom Map Waypoint Marker (Violet Sky Beam)
    if (!this.waypointMarkerGroup) {
      this.waypointMarkerGroup = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.0, 4.1, 32),
        new THREE.MeshBasicMaterial({ color: 0xe879f9, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      this.waypointMarkerGroup.add(ring);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 60, 12),
        new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.42 })
      );
      beam.position.y = 30;
      this.waypointMarkerGroup.add(beam);
      this.waypointMarkerGroup.visible = false;
      this.openWorldGroup.add(this.waypointMarkerGroup);
    }

    // 8. GTA 3D Floating Directional GPS Arrow above player
    if (!this.gpsArrowGroup) {
      this.gpsArrowGroup = new THREE.Group();
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.8), arrowMat);
      shaft.position.z = -0.22;
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.6, 4), arrowMat);
      head.rotation.x = Math.PI / 2;
      head.rotation.y = Math.PI / 4;
      head.position.z = 0.42;
      this.gpsArrowGroup.add(shaft, head);
      this.gpsArrowGroup.visible = false;
      this.openWorldGroup.add(this.gpsArrowGroup);
    }

    // 9. GTA Street Cash Pickups (22 rotating cash bundles around town)
    const cashSpots: [number, number, number][] = [
      [12, 32, 25000],
      [-12, -25, 25000],
      [-40, -24, 35000],
      [40, 26, 30000],
      [78, 12, 30000],
      [-78, -12, 30000],
      [12, 130, 35000],
      [-12, -135, 35000],
      [155, 12, 40000],
      [-155, -12, 40000],
      [80, 80, 35000],
      [-80, 80, 35000],
      [80, -80, 35000],
      [-80, -80, 35000],
      [160, 160, 50000],
      [-160, 160, 50000],
      [240, 12, 40000],
      [-240, -12, 40000],
      [315, -260, 50000],
      [-315, -260, 50000],
      [0, 210, 45000],
      [0, -210, 45000],
    ];
    for (const [cx, cz, amount] of cashSpots) {
      const cashGrp = new THREE.Group();
      const billMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.65,
        roughness: 0.3,
      });
      const stack = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 0.65), billMat);
      stack.position.y = 0.85;
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.48, 0.68),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      band.position.y = 0.85;
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.15, 20),
        new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide })
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.06;
      cashGrp.add(stack, band, halo);
      cashGrp.position.set(cx, 0, cz);
      this.openWorldGroup.add(cashGrp);

      this.streetCashPickups.push({
        mesh: cashGrp,
        pos: new THREE.Vector3(cx, 0, cz),
        amount,
        respawnTimer: 0,
        active: true,
      });
    }
  }

  private setupGaiPatrols() {
    // Militsiya cars removed per user request
    this.gaiPatrols.forEach((g) => this.scene.remove(g.parts.group));
    this.gaiPatrols = [];
    this.stats.gaiAlert = 0;
  }

  private setupParticles() {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 14;
      positions[i * 3 + 2] = Math.random() * 160 - 20;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.15,
      transparent: true,
      opacity: 0.4,
    });
    this.speedParticles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.speedParticles);

    // Sparks
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.sparkPositions, 3)
    );
    const sparkMat = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    this.sparkParticles = new THREE.Points(this.sparkGeo, sparkMat);
    this.scene.add(this.sparkParticles);

    // Tire smoke
    this.smokeGeo = new THREE.BufferGeometry();
    for (let i = 0; i < this.smokeCount * 3; i++) {
      this.smokePositions[i] = -100;
    }
    this.smokeGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.smokePositions, 3)
    );
    const smokeMat = new THREE.PointsMaterial({
      color: 0xcbd5e1,
      size: 0.45,
      transparent: true,
      opacity: 0.6,
    });
    this.smokeParticles = new THREE.Points(this.smokeGeo, smokeMat);
    this.scene.add(this.smokeParticles);
  }

  public emitSparks(origin: THREE.Vector3, colorHex: number = 0xf43f5e) {
    if (!this.sparkParticles || !this.sparkGeo) return;
    (this.sparkParticles.material as THREE.PointsMaterial).color.setHex(colorHex);

    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkPositions[i * 3] = origin.x;
      this.sparkPositions[i * 3 + 1] = origin.y + 0.3;
      this.sparkPositions[i * 3 + 2] = origin.z;

      this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 14;
      this.sparkVelocities[i * 3 + 1] = Math.random() * 12 + 2;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 14;
      this.sparkLifetimes[i] = 0.4 + Math.random() * 0.4;
    }
    const posAttr = this.sparkGeo.attributes.position;
    if (posAttr) {
      posAttr.needsUpdate = true;
    }
  }

  private emitTireSmoke(x: number, z: number) {
    if (!this.smokeGeo) return;
    const idx = this.nextSmokeIdx;
    this.nextSmokeIdx = (this.nextSmokeIdx + 1) % this.smokeCount;

    this.smokePositions[idx * 3] = x + (Math.random() - 0.5) * 0.4;
    this.smokePositions[idx * 3 + 1] = 0.2 + Math.random() * 0.3;
    this.smokePositions[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
    this.smokeLifetimes[idx] = 0.55;

    const posAttr = this.smokeGeo.attributes.position;
    if (posAttr) {
      posAttr.needsUpdate = true;
    }
  }

  public startGame(mode: GameMode = 'open_world', initialRegion?: WorldRegionId) {
    this.mode = mode;
    this.isRunning = true;
    this.isGameOver = false;

    const cfg = VEHICLES[this.shipModel];
    const startRegion: WorldRegionId = initialRegion || this.currentRegion || 'tashkent';
    this.stats.score = 0;
    this.stats.distance = 0;
    this.stats.speed = 0;
    this.stats.maxSpeedReached = 0;
    this.stats.gear = 1;
    this.stats.rpm = 900;
    this.stats.crystals = 0;
    this.stats.multiplier = 1;
    this.stats.comboCount = 0;
    this.stats.shields = cfg.shieldMax;
    this.stats.maxShields = cfg.shieldMax;
    this.stats.nitro = 100;
    this.stats.isNitroActive = false;
    this.stats.lapTime = 0;
    this.stats.stuntScore = 0;
    this.stats.lastStuntName = '';
    this.stats.energy = 100;
    this.stats.hunger = 100;
    this.stats.fuel = 100;
    this.stats.hp = 100;
    this.stats.carCondition = 100;
    this.stats.isOnFoot = false;
    this.stats.weaponEquipped = false;
    this.stats.inBattleArena = false;
    this.stats.pedestrianWarning = false;
    this.stats.redLightWarning = false;
    this.stats.turnSignal = 'none';
    this.stats.turnSignalBlinkOn = false;
    this.stats.examActive = false;
    this.stats.examStepLabel = '';
    this.stats.examProgress = 0;
    this.stats.examMistakes = 0;
    this.stats.nearCar = true;
    this.stats.nearbyPoi = 'none';
    this.stats.nearbyPoiLabel = '';
    this.stats.gaiAlert = 0;
    this.stats.gaiFines = 0;
    this.stats.headlightsOn = this.headlightsOn;
    this.colliderCooldown = 0;
    this.smokeEmitAccum = 0;

    this.isOnFoot = false;
    this.isMilitsiyaModalPaused = false;
    this.poiTriggerCooldown = 0;
    this.gaiGraceCooldown = 0;
    this.redLightCooldown = 0;
    this.zebraViolationCooldown = 0;
    this.examStage = 0;
    if (this.examMarkerGroup) this.examMarkerGroup.visible = false;
    this.lastAutoPoiId = '';
    if (this.pedestrian) {
      this.pedestrian.group.visible = false;
      if (this.pedestrian.weaponGroup) this.pedestrian.weaponGroup.visible = false;
    }
    if (this.playerParts?.driverGroup) {
      this.playerParts.driverGroup.visible = true;
    }
    this.applyHeadlightsVisual();
    this.applyTurnSignalVisuals();

    this.currentRegion = startRegion;
    this.stats.currentRegion = startRegion;
    this.applyRegionAtmosphere(startRegion);

    const isCar = this.playerParts?.isCar ?? true;
    const spawnCoords = CITY_SPAWN_COORDS[startRegion] || CITY_SPAWN_COORDS.tashkent;
    this.playerPos.set(
      mode === 'open_world' ? spawnCoords.x : 0,
      isCar ? 0.02 : 0.45,
      mode === 'open_world' ? spawnCoords.z : 0
    );
    this.playerHeading = mode === 'open_world' ? spawnCoords.heading : 0;
    this.playerVelocityY = 0;
    this.isGrounded = true;
    this.playerRoll = 0;
    this.playerPitch = 0;
    // Start parked at 0 — moves ONLY when GAZ pedal is pressed!
    this.currentSpeed = 0;
    const regionsOrder: WorldRegionId[] = ['tashkent', 'm39_highway', 'khorezm', 'samarkand'];
    this.forwardDistance =
      mode === 'world_tour' ? Math.max(0, regionsOrder.indexOf(startRegion)) * 900 : 0;
    this.airTime = 0;
    this.playerYaw = 0;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.set(0, this.playerHeading, 0);

    // Snap camera immediately behind vehicle
    this.camera.position.set(
      this.playerPos.x - Math.sin(this.playerHeading) * 6.4,
      this.playerPos.y + 2.6,
      this.playerPos.z - Math.cos(this.playerHeading) * 6.4
    );

    this.clearEntities();

    if (mode === 'open_world') {
      this.isInsideHouse = false;
      this.stats.isInsideHouse = false;
      this.stats.housePoiAction = 'none';
      if (this.houseInteriorGroup) this.houseInteriorGroup.visible = false;
      this.ensureOpenWorldBuilt();
      this.openWorldGroup.visible = true;
      this.sceneryGroup.visible = false;
      this.trackSegments.forEach((s) => (s.visible = false));
      if (this.worldFloorMesh) this.worldFloorMesh.visible = false;
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).density = 0.0014;
      }
      this.stats.regionName = WORLD_REGIONS[startRegion].name.uz;
      this.stats.racePosition = 1;
      this.stats.totalRacers = 1;
      this.rivalRacers.forEach((r) => this.scene.remove(r.parts.group));
      this.rivalRacers = [];
      this.setupGaiPatrols();
    } else {
      this.openWorldGroup.visible = false;
      this.sceneryGroup.visible = true;
      this.trackSegments.forEach((s, i) => {
        s.visible = true;
        s.position.set(0, 0, i * 120);
      });
      if (this.worldFloorMesh) {
        this.worldFloorMesh.visible = true;
        this.worldFloorMesh.position.z = 0;
      }
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).density = 0.007;
      }
      this.stats.regionName = WORLD_REGIONS[startRegion].name.uz;
      this.stats.racePosition = 6;
      this.stats.totalRacers = 6;
      this.setupRivalRacers();
      this.setupGaiPatrols();
      this.nextSpawnZ = 50;
      for (let i = 0; i < 14; i++) {
        this.spawnWorldRoadContent();
      }
    }

    soundEngine.userGesture();
    soundEngine.setSiren(this.sirenActive);
    soundEngine.startMusic();
  }

  public restartGame() {
    this.startGame(this.mode, this.currentRegion);
  }

  // Fast Travel / Teleport to any Uzbekistan city or highway in BOTH Open World & World Tour!
  public teleportToRegion(regionId: WorldRegionId) {
    this.currentRegion = regionId;
    this.stats.currentRegion = regionId;
    this.stats.regionName = WORLD_REGIONS[regionId].name.uz;
    this.applyRegionAtmosphere(regionId);

    if (this.mode === 'open_world') {
      this.ensureOpenWorldBuilt();
      this.openWorldGroup.visible = true;
      const target = CITY_SPAWN_COORDS[regionId] || CITY_SPAWN_COORDS.tashkent;
      this.playerPos.set(target.x, this.playerParts?.isCar ? 0.02 : 0.45, target.z);
      this.playerHeading = target.heading;
      this.currentSpeed = 0;
      this.playerGroup.position.copy(this.playerPos);
      this.playerGroup.rotation.set(0, this.playerHeading, 0);

      if (this.isOnFoot && this.pedestrian) {
        this.pedestrianPos.set(target.x + 1.65, 0, target.z);
        this.pedestrianHeading = target.heading;
        this.pedestrian.group.position.copy(this.pedestrianPos);
        this.pedestrian.group.rotation.y = this.pedestrianHeading;
      }

      // Snap camera to new city immediately
      const focus = this.isOnFoot ? this.pedestrianPos : this.playerPos;
      this.camera.position.set(
        focus.x - Math.sin(this.playerHeading) * 6.4,
        focus.y + 2.6,
        focus.z - Math.cos(this.playerHeading) * 6.4
      );
    } else {
      // Update forwardDistance to match selected region milestone so update() stays on chosen city
      const regionsOrder: WorldRegionId[] = ['tashkent', 'm39_highway', 'khorezm', 'samarkand'];
      const idx = Math.max(0, regionsOrder.indexOf(regionId));
      const baseMilestone = Math.floor(this.forwardDistance / 3600) * 3600;
      this.forwardDistance = baseMilestone + idx * 900 + 20;

      this.clearEntities();
      this.repositionRivalRacersAhead();
      this.nextSpawnZ = this.playerPos.z + 20;
      for (let i = 0; i < 12; i++) {
        this.spawnWorldRoadContent();
      }
    }

    this.stats.lastStuntName = `✈️ ${WORLD_REGIONS[regionId].city.uz.toUpperCase()}GA SAYOHAT QILINDI!`;
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }
    if (this.onRegionChange) {
      this.onRegionChange(regionId);
    }
  }

  private applyRegionAtmosphere(regionId: WorldRegionId) {
    const reg = WORLD_REGIONS[regionId];
    if (!reg) return;

    this.targetSkyColor.setHex(reg.skyColor);
    this.targetFogColor.setHex(reg.fogColor);

    if (this.hemiLight) {
      this.hemiLight.color.setHex(reg.skyColor);
      this.hemiLight.groundColor.setHex(reg.groundColor);
    }
    if (this.worldFloorMesh) {
      (this.worldFloorMesh.material as THREE.MeshStandardMaterial).color.setHex(reg.groundColor);
    }
  }

  private clearEntities() {
    this.activeEntities.forEach((ent) => {
      this.scene.remove(ent.group);
    });
    this.activeEntities = [];
  }

  // Setup 5 Iconic Uzbek Rival Competitors for intense highway racing
  private setupRivalRacers() {
    this.rivalRacers.forEach((r) => {
      this.scene.remove(r.parts.group);
    });
    this.rivalRacers = [];

    const configs: {
      id: string;
      name: string;
      model: ShipModel;
      color: ShipColor;
      offsetZ: number;
      laneX: number;
      speed: number;
    }[] = [
      {
        id: 'rival_1',
        name: 'Oq Damas Turbo',
        model: 'damas',
        color: 'white',
        offsetZ: 25,
        laneX: -3.6,
        speed: 48,
      },
      {
        id: 'rival_2',
        name: 'Qora Gentra',
        model: 'gentra',
        color: 'black',
        offsetZ: 58,
        laneX: 3.6,
        speed: 56,
      },
      {
        id: 'rival_3',
        name: 'Kumush Cobalt',
        model: 'cobalt',
        color: 'silver',
        offsetZ: 92,
        laneX: -1.8,
        speed: 62,
      },
      {
        id: 'rival_4',
        name: 'BYD Chazor',
        model: 'byd_uz',
        color: 'cyan',
        offsetZ: 130,
        laneX: 1.8,
        speed: 68,
      },
      {
        id: 'rival_5',
        name: 'Malibu 2 Turbo',
        model: 'malibu2',
        color: 'crimson',
        offsetZ: 170,
        laneX: 5.5,
        speed: 74,
      },
    ];

    configs.forEach((cfg) => {
      const parts = createHovercraft(cfg.model, cfg.color);
      const pos = new THREE.Vector3(cfg.laneX, 0.02, this.playerPos.z + cfg.offsetZ);
      parts.group.position.copy(pos);
      this.scene.add(parts.group);

      this.rivalRacers.push({
        id: cfg.id,
        name: cfg.name,
        parts,
        model: cfg.model,
        color: cfg.color,
        pos,
        speed: cfg.speed,
        targetLaneX: cfg.laneX,
        laneChangeTimer: 2 + Math.random() * 3,
        wheelRotationAngle: 0,
        yaw: 0,
        isPassed: false,
      });
    });
  }

  private repositionRivalRacersAhead() {
    const lanes = [-5.5, -3.6, -1.8, 1.8, 3.6, 5.5];
    this.rivalRacers.forEach((rival, i) => {
      rival.pos.z = this.playerPos.z + 30 + i * 40;
      rival.pos.x = lanes[i % lanes.length];
      rival.targetLaneX = rival.pos.x;
      rival.isPassed = false;
      rival.parts.group.position.copy(rival.pos);
    });
  }

  private updateRivalRacers(delta: number) {
    const pX = this.playerPos.x;
    const pZ = this.playerPos.z;

    for (const rival of this.rivalRacers) {
      // 1. Advance along highway
      rival.pos.z += rival.speed * delta;

      // 2. AI lane switching
      rival.laneChangeTimer -= delta;
      if (rival.laneChangeTimer <= 0) {
        rival.laneChangeTimer = 2.5 + Math.random() * 4.5;
        const lanes = [-5.5, -3.8, -1.8, 1.8, 3.8, 5.5];
        rival.targetLaneX = lanes[Math.floor(Math.random() * lanes.length)];
      }

      const dx = rival.targetLaneX - rival.pos.x;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), delta * 4.5);
      rival.pos.x += step;

      const targetRivalYaw = Math.sign(dx) * (Math.abs(dx) > 0.1 ? 0.16 : 0);
      rival.yaw = THREE.MathUtils.damp(rival.yaw, targetRivalYaw, 8, delta);
      rival.parts.group.rotation.y = rival.yaw;

      rival.parts.frontSteerPivots.forEach((pivot) => {
        pivot.rotation.y = Math.sign(dx) * 0.35;
      });

      // 3D wheels spinning
      const wheelCircumference = 2 * Math.PI * 0.36;
      rival.wheelRotationAngle -= (rival.speed / wheelCircumference) * Math.PI * 2 * delta;
      rival.parts.wheels.forEach((w) => {
        w.rotation.x = rival.wheelRotationAngle;
      });

      rival.parts.group.position.copy(rival.pos);

      // 3. Overtake bonus
      if (pZ > rival.pos.z && !rival.isPassed) {
        rival.isPassed = true;
        this.stats.score += 600;
        this.stats.stuntScore += 600;
        this.stats.lastStuntName = `QUVI O‘TISH! (${rival.name})`;
        this.emitSparks(rival.pos, 0x10b981);
      }

      // 4. Reposition ahead if fallen far behind
      if (rival.pos.z < pZ - 50) {
        rival.pos.z = pZ + 85 + Math.random() * 55;
        const lanes = [-5.5, -3.8, -1.8, 1.8, 3.8, 5.5];
        rival.pos.x = lanes[Math.floor(Math.random() * lanes.length)];
        rival.targetLaneX = rival.pos.x;
        rival.isPassed = false;
        rival.speed = 52 + Math.random() * 18;
      } else if (rival.pos.z > pZ + 250) {
        rival.speed = Math.max(45, this.currentSpeed * 0.92);
      }

      // 5. AVARIYA (ACCIDENT): Touching rival car causes instant major crash accident!
      const distZ = Math.abs(pZ - rival.pos.z);
      const distX = Math.abs(pX - rival.pos.x);
      if (distZ < 4.0 && distX < 2.1) {
        this.stats.shields = 0;
        this.stats.comboCount = 0;
        this.stats.multiplier = 1;
        this.currentSpeed = 0;
        this.stats.lastStuntName = '💥 KATTA AVARIYA! RAQIB MOSHINA BILAN TO‘QNASHDİ!';

        // Sound: Metal crunch & explosion
        soundEngine.playAccident();

        // Massive sparks & smoke
        this.emitSparks(this.playerPos, 0xff0033);
        this.emitSparks(rival.pos, 0xff5500);
        this.emitTireSmoke(this.playerPos.x - 0.5, this.playerPos.z);
        this.emitTireSmoke(this.playerPos.x + 0.5, this.playerPos.z);
        this.emitTireSmoke(rival.pos.x, rival.pos.z);

        // Avariya dramatic spin & flip physics
        this.playerVelocityY = 14;
        this.playerRoll += Math.PI * 1.25;
        this.playerYaw += 3.2;
        this.playerPitch += 0.8;
        this.isGrounded = false;

        // Rival car also skids in the accident
        rival.speed = 10;
        rival.yaw += 1.8;

        this.triggerGameOver();
        return;
      }
    }

    // 6. Calculate Race Position
    const rivalsAhead = this.rivalRacers.filter((r) => r.pos.z > pZ).length;
    this.stats.racePosition = rivalsAhead + 1;
    this.stats.totalRacers = this.rivalRacers.length + 1;
  }

  // Real Supercar Horn / Signal
  public triggerHorn() {
    if (!this.isRunning || this.isGameOver) return;
    const nowMs = performance.now();
    if (nowMs - this.lastHornTriggerMs < 380) return;
    this.lastHornTriggerMs = nowMs;

    soundEngine.playHorn();

    this.stats.lastStuntName = '📢 BIP-BIP! (SIGNAL CHALINDI)';

    // Visual sound wave sparks in front of headlights
    this.emitSparks(
      new THREE.Vector3(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z + 2.5),
      0x38bdf8
    );

    // AI reaction: nearby rivals in front hear horn and yield/swerve to open lane!
    const pZ = this.playerPos.z;
    const pX = this.playerPos.x;
    this.rivalRacers.forEach((rival) => {
      if (rival.pos.z > pZ && rival.pos.z < pZ + 65 && Math.abs(rival.pos.x - pX) < 3.8) {
        rival.targetLaneX = rival.pos.x > pX ? 5.8 : -5.8;
        rival.laneChangeTimer = 3.5;
        this.emitSparks(rival.pos, 0xfacc15);
      }
    });
  }

  // Procedural World Tour Content (Spawns regional landmarks)
  private spawnWorldRoadContent() {
    const z = this.nextSpawnZ;
    this.nextSpawnZ += 28 + Math.random() * 20;

    const laneOptions = [-6.0, -3.8, -1.8, 0, 1.8, 3.8, 6.0];
    const rand = Math.random();

    // 1. REGIONAL LANDMARKS ON THE ROAD & HORIZON
    if (this.currentRegion === 'khorezm') {
      // Ancient Khiva Kalta Minor & Ichan Qala Fortress Gate
      if (Math.random() < 0.26) {
        const minaret = createKhivaKaltaMinor();
        const side = Math.random() > 0.5 ? 1 : -1;
        minaret.position.set(side * (22 + Math.random() * 25), 0, z + 15);
        this.scene.add(minaret);
        this.activeEntities.push({
          type: 'landmark',
          group: minaret,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 15,
          x: minaret.position.x,
          active: false,
        });
      }

      if (Math.random() < 0.22) {
        const fortressGate = createIchanQalaGate();
        fortressGate.position.set(0, 0, z + 20);
        this.scene.add(fortressGate);
        this.activeEntities.push({
          type: 'arch',
          group: fortressGate,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 20,
          x: 0,
          active: false,
        });
      }

      if (Math.random() < 0.16) {
        const sign = createHighwayGantrySign('XORAZM VILOYATI', 'XIVA ICHAN QAL‘A ➔');
        sign.position.set(0, 0, z + 10);
        this.scene.add(sign);
        this.activeEntities.push({
          type: 'arch',
          group: sign,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 10,
          x: 0,
          active: false,
        });
      }
    } else if (this.currentRegion === 'm39_highway') {
      // A-380 International Highway linking Tashkent and Khorezm
      if (Math.random() < 0.25) {
        const signText =
          Math.random() > 0.5
            ? 'A-380 XALQARO MAGISTRAL'
            : 'TOSHKENT ➔ BUXORO ➔ XIVA';
        const kmText =
          Math.random() > 0.5
            ? 'URGANCH 450 km • XIVA 480 km'
            : 'TEZLIKNI OSHIRMANG • 100 km/h';
        const sign = createHighwayGantrySign(signText, kmText);
        sign.position.set(0, 0, z + 12);
        this.scene.add(sign);
        this.activeEntities.push({
          type: 'arch',
          group: sign,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 12,
          x: 0,
          active: false,
        });
      }

      // Highway street light poles on shoulder
      const leftLight = createStreetLightPole();
      leftLight.position.set(-11, 0, z);
      this.scene.add(leftLight);
      this.activeEntities.push({
        type: 'landmark',
        group: leftLight,
        hitboxRadius: 0,
        hitboxHeight: 0,
        z,
        x: -11,
        active: false,
      });

      const rightLight = createStreetLightPole();
      rightLight.position.set(11, 0, z);
      rightLight.rotation.y = Math.PI;
      this.scene.add(rightLight);
      this.activeEntities.push({
        type: 'landmark',
        group: rightLight,
        hitboxRadius: 0,
        hitboxHeight: 0,
        z,
        x: 11,
        active: false,
      });
    } else if (this.currentRegion === 'samarkand') {
      // Samarkand Registan Silk Road
      if (Math.random() < 0.22) {
        const arch = createIchanQalaGate();
        arch.position.set(0, 0, z + 18);
        this.scene.add(arch);
        this.activeEntities.push({
          type: 'arch',
          group: arch,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 18,
          x: 0,
          active: false,
        });
      }

      if (Math.random() < 0.16) {
        const sign = createHighwayGantrySign('SAMARQAND VILOYATI', 'REGISTON MAYDONI ➔');
        sign.position.set(0, 0, z + 10);
        this.scene.add(sign);
        this.activeEntities.push({
          type: 'arch',
          group: sign,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 10,
          x: 0,
          active: false,
        });
      }
    } else {
      // Tashkent: TV Tower, Modern Tashkent City Skyscrapers, Avenue Signs & Street Lights
      if (Math.random() < 0.18) {
        const tvTower = createTashkentTVTower();
        const side = Math.random() > 0.5 ? 1 : -1;
        tvTower.position.set(side * (52 + Math.random() * 40), 0, z + 35);
        this.scene.add(tvTower);
        this.activeEntities.push({
          type: 'landmark',
          group: tvTower,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 35,
          x: tvTower.position.x,
          active: false,
        });
      }

      // Modern Tashkent City skyscrapers
      if (Math.random() < 0.45) {
        const height = 45 + Math.random() * 85;
        const width = 8 + Math.random() * 12;
        const spire = createCitySpire(height, width);
        const side = Math.random() > 0.5 ? 1 : -1;
        spire.position.set(side * (28 + Math.random() * 50), 0, z);
        this.scene.add(spire);
        this.activeEntities.push({
          type: 'landmark',
          group: spire,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z,
          x: spire.position.x,
          active: false,
        });
      }

      // Overhead street signs
      if (Math.random() < 0.18) {
        const signText =
          Math.random() > 0.5
            ? 'TOSHKENT SHAHRI'
            : 'TASHKENT CITY XALQARO MARKAZI';
        const subText =
          Math.random() > 0.5
            ? 'AMIR TEMUR SHOH KO‘CHASI'
            : 'ISLOM KARIMOV KO‘CHASI';
        const sign = createHighwayGantrySign(signText, subText);
        sign.position.set(0, 0, z + 12);
        this.scene.add(sign);
        this.activeEntities.push({
          type: 'arch',
          group: sign,
          hitboxRadius: 0,
          hitboxHeight: 0,
          z: z + 12,
          x: 0,
          active: false,
        });
      }

      // Street light poles
      const light = createStreetLightPole();
      const side = Math.random() > 0.5 ? 1 : -1;
      light.position.set(side * 11, 0, z);
      if (side > 0) light.rotation.y = Math.PI;
      this.scene.add(light);
      this.activeEntities.push({
        type: 'landmark',
        group: light,
        hitboxRadius: 0,
        hitboxHeight: 0,
        z,
        x: side * 11,
        active: false,
      });
    }

    // 2. ROAD RACING COLLECTIBLES & HAZARDS
    if (rand < 0.42) {
      // Crystals stream
      const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      for (let k = 0; k < 3; k++) {
        const crystalGroup = createCrystal();
        crystalGroup.position.set(lane, 0, z + k * 4.5);
        this.scene.add(crystalGroup);
        this.activeEntities.push({
          type: 'crystal',
          group: crystalGroup,
          hitboxRadius: 1.2,
          hitboxHeight: 1.4,
          z: z + k * 4.5,
          x: lane,
          active: true,
        });
      }
    } else if (rand < 0.58) {
      // Laser Barrier
      const { group } = createLaserBarrier();
      const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      group.position.set(lane, 0, z);
      this.scene.add(group);
      this.activeEntities.push({
        type: 'laser',
        group,
        hitboxRadius: 2.8,
        hitboxHeight: 2.0,
        z,
        x: lane,
        active: true,
      });
    } else if (rand < 0.76) {
      // Drone Traffic Hazard
      const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      const drone = createDroneHazard();
      drone.position.set(lane, 0, z);
      this.scene.add(drone);
      this.activeEntities.push({
        type: 'drone',
        group: drone,
        hitboxRadius: 1.2,
        hitboxHeight: 1.8,
        z,
        x: lane,
        active: true,
      });
    } else if (rand < 0.88) {
      // Speed Boost Pad
      const pad = createBoostPadMesh(this.boostPadTexture);
      const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      pad.position.set(lane, 0.03, z);
      this.scene.add(pad);
      this.activeEntities.push({
        type: 'boost_pad',
        group: pad,
        hitboxRadius: 1.8,
        hitboxHeight: 0.5,
        z,
        x: lane,
        active: true,
      });
    } else if (rand < 0.95) {
      // Mega Jump Ramp
      const ramp = createJumpRamp();
      const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      ramp.position.set(lane, 0, z);
      this.scene.add(ramp);
      this.activeEntities.push({
        type: 'ramp',
        group: ramp,
        hitboxRadius: 1.6,
        hitboxHeight: 1.2,
        z,
        x: lane,
        active: true,
      });

      const airCrystal = createCrystal();
      airCrystal.position.set(lane, 3.2, z + 8);
      this.scene.add(airCrystal);
      this.activeEntities.push({
        type: 'crystal',
        group: airCrystal,
        hitboxRadius: 1.2,
        hitboxHeight: 1.5,
        z: z + 8,
        x: lane,
        active: true,
      });
    } else {
      // Shield Health Pickup
      const shield = createShieldPickup();
      const lane = laneOptions[Math.floor(Math.random() * laneOptions.length)];
      shield.position.set(lane, 0, z);
      this.scene.add(shield);
      this.activeEntities.push({
        type: 'shield',
        group: shield,
        hitboxRadius: 1.2,
        hitboxHeight: 1.5,
        z,
        x: lane,
        active: true,
      });
    }
  }

  // Toggle Headlights (Faralarni yoqish / o'chirish)
  public toggleHeadlights() {
    soundEngine.userGesture();
    this.headlightsOn = !this.headlightsOn;
    this.stats.headlightsOn = this.headlightsOn;
    this.applyHeadlightsVisual();
    soundEngine.playDoorToggle();
    this.stats.lastStuntName = this.headlightsOn
      ? '💡 FARALAR YOQILDI!'
      : '🌑 FARALAR O‘CHIRILDI';
  }

  // Toggle Left/Right Turn Signals (Povorotniklar Q / E)
  public toggleTurnSignal(dir: 'left' | 'right') {
    if (!this.isRunning || this.isGameOver || this.isOnFoot) return;
    soundEngine.userGesture();
    const next: TurnSignalState = this.stats.turnSignal === dir ? 'none' : dir;
    this.stats.turnSignal = next;
    this.stats.turnSignalBlinkOn = next !== 'none';
    this.turnSignalTimer = 0;
    this.turnSignalStartHeading = this.playerHeading;
    soundEngine.playTurnSignalTick(next !== 'none');
    this.applyTurnSignalVisuals();
    this.stats.lastStuntName =
      next === 'left'
        ? '◀ CHAP POVOROTNIK YOQILDI'
        : next === 'right'
        ? '▶ O‘NG POVOROTNIK YOQILDI'
        : 'POVOROTNIK O‘CHIRILDI';
  }

  // Toggle flashing roof Migalka + multi-mode Police Sirena
  public toggleMigalkaAndSiren() {
    soundEngine.userGesture();
    this.migalkaActive = !this.migalkaActive;
    this.sirenActive = this.migalkaActive;
    this.stats.migalkaActive = this.migalkaActive;
    this.stats.sirenActive = this.sirenActive;

    if (this.playerParts?.migalkaGroup) {
      this.playerParts.migalkaGroup.visible = this.migalkaActive;
    }
    if (this.migalkaActive) {
      soundEngine.playMigalkaChirp();
      soundEngine.playPoliceDispatchRadio();
    }
    soundEngine.setSiren(this.sirenActive, this.stats.sirenMode);
    const modeLabel = SIREN_MODES.find((m) => m.id === this.stats.sirenMode)?.label.uz || 'Klassik';
    this.stats.lastStuntName = this.migalkaActive
      ? `🚨 MIGALKA & SIRENA: ${modeLabel.toUpperCase()}`
      : '🔕 MIGALKA VA SIRENA O‘CHIRILDI';
  }

  public setSirenMode(mode: SirenMode) {
    soundEngine.userGesture();
    this.stats.sirenMode = mode;
    soundEngine.setSirenMode(mode);
    const label = SIREN_MODES.find((m) => m.id === mode)?.label.uz || mode;
    this.stats.lastStuntName = `🚨 SIRENA REJIMI: ${label.toUpperCase()}`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public cycleSirenMode() {
    const idx = SIREN_MODES.findIndex((m) => m.id === this.stats.sirenMode);
    const next = SIREN_MODES[(idx + 1) % SIREN_MODES.length].id;
    this.setSirenMode(next);
    if (!this.sirenActive) {
      this.toggleMigalkaAndSiren();
    }
  }

  public triggerMegafonChirp() {
    soundEngine.userGesture();
    soundEngine.playMigalkaChirp();
    soundEngine.playPoliceDispatchRadio();
    this.stats.lastStuntName = '📢 YPX KRYAKALKA / MEGAFON!';
  }

  public setRadioStation(station: RadioStationId) {
    soundEngine.userGesture();
    this.stats.radioStation = station;
    soundEngine.setRadioStation(station);
    const st = RADIO_STATIONS.find((s) => s.id === station);
    this.stats.lastStuntName =
      station === 'off'
        ? '🎵 MUSIQA O‘CHIRILDI'
        : `🎵 ${st?.artist.toUpperCase()} — ${st?.name.uz.toUpperCase()}`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public cycleRadioStation() {
    const idx = RADIO_STATIONS.findIndex((s) => s.id === this.stats.radioStation);
    const next = RADIO_STATIONS[(idx + 1) % RADIO_STATIONS.length].id;
    this.setRadioStation(next);
  }

  public setSubwooferLevel(level: 0 | 1 | 2) {
    soundEngine.userGesture();
    this.stats.subwooferLevel = level;
    soundEngine.setSubwooferLevel(level);
    if (level > 0 && this.stats.radioStation === 'off') {
      this.setRadioStation('uz_rap_konsta');
    }
    const labels = ['SOMBUFER O‘CHIQ', 'SOMBUFER: STANDART', 'SOMBUFER: MEGA BASS 🔥'];
    this.stats.lastStuntName = `🔊 ${labels[level]}`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public cycleSubwooferLevel() {
    const next = ((this.stats.subwooferLevel + 1) % 3) as 0 | 1 | 2;
    this.setSubwooferLevel(next);
  }

  public joinOnlineRoom(roomCode: string) {
    const clean = (roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)) || 'UZB-01';
    this.stats.onlineRoomCode = clean;
    this.stats.onlineEnabled = true;
    this.mpClient?.joinRoom(clean);
    this.mpClient?.connect();
    this.stats.lastStuntName = `🌐 DO‘STLAR XONASI: ${clean} GA ULANDI!`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public setDriverName(name: string) {
    const clean = name.trim().slice(0, 18) || this.onlineDriverName;
    this.onlineDriverName = clean;
    this.stats.onlineDriverName = clean;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public teleportToFriend(peerId: string) {
    const entry = this.remotePlayers.get(peerId);
    if (!entry) return;
    if (this.mode !== 'open_world') {
      this.startGame('open_world', 'tashkent');
    }
    if (this.isOnFoot && this.pedestrian) {
      this.pedestrian.group.visible = false;
      this.isOnFoot = false;
      this.stats.isOnFoot = false;
      if (this.playerParts?.driverGroup) this.playerParts.driverGroup.visible = true;
    }
    const tx = entry.targetPos.x + 5.5;
    const tz = entry.targetPos.z + 2;
    this.playerPos.set(tx, this.playerParts?.isCar ? 0.02 : 0.45, tz);
    this.playerHeading = entry.targetHeading;
    this.currentSpeed = 0;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.set(0, this.playerHeading, 0);
    this.stats.lastStuntName = `🌐 DO‘STINGIZ ${entry.state.name.toUpperCase()} OLDIGA KELDINGIZ!`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public summonCarToMe() {
    if (!this.isOnFoot) return;
    const sinH = Math.sin(this.pedestrianHeading);
    const cosH = Math.cos(this.pedestrianHeading);
    this.playerPos.set(
      this.pedestrianPos.x + sinH * 4.5,
      this.playerParts?.isCar ? 0.02 : 0.45,
      this.pedestrianPos.z + cosH * 4.5
    );
    this.playerHeading = this.pedestrianHeading + Math.PI / 2;
    this.currentSpeed = 0;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.set(0, this.playerHeading, 0);
    soundEngine.playHorn();
    this.stats.lastStuntName = '🚗 MOSHINANGIZ YONINGIZGA YETKAZILDI!';
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public performHomeAction(action: 'eat' | 'rest' | 'repair' | 'ammo') {
    soundEngine.userGesture();
    if (action === 'eat') {
      this.stats.hunger = 100;
      this.stats.hp = Math.min(100, this.stats.hp + 35);
      soundEngine.playEatOrRest();
      this.stats.lastStuntName = '🥣 UYDA MAZZALI OSH YEDINGIZ! QUVVAT 100%';
    } else if (action === 'rest') {
      this.stats.energy = 100;
      this.stats.hp = 100;
      this.stats.shields = this.stats.maxShields;
      this.stats.wantedLevel = 0;
      soundEngine.playSleepSound();
      this.stats.lastStuntName = '🛏️ UYDA DAM OLDINGIZ! KUCH VA JON 100%';
    } else if (action === 'repair') {
      this.stats.carCondition = 100;
      this.stats.shields = this.stats.maxShields;
      this.stats.fuel = 100;
      this.stats.nitro = 100;
      soundEngine.playRepairSound();
      this.stats.lastStuntName = '🔧 UY GARAJIDA MOSHINA 100% TUZATILDI VA TO‘LDIRILDI!';
    } else if (action === 'ammo') {
      this.stats.ammo = 150;
      this.stats.weaponEquipped = true;
      if (this.pedestrian?.weaponGroup) this.pedestrian.weaponGroup.visible = true;
      soundEngine.playShieldPickup();
      this.stats.lastStuntName = '🔫 SEYFDAN MILTIQ VA 150 O‘Q OLINDI!';
    }
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  // Equip/Holster Miltiq (Rifle) — automatically exits car if driving!
  public toggleWeapon() {
    if (!this.isRunning || this.isGameOver || !this.pedestrian) return;
    soundEngine.userGesture();
    if (!this.isOnFoot) {
      this.toggleExitEnterCar();
    }
    this.stats.weaponEquipped = !this.stats.weaponEquipped;
    if (this.pedestrian.weaponGroup) {
      this.pedestrian.weaponGroup.visible = this.stats.weaponEquipped;
    }
    soundEngine.playDoorToggle();
    this.stats.lastStuntName = this.stats.weaponEquipped
      ? '🔫 MILTIQ QO‘LGA OLINDI! (OTISH: SPACE)'
      : '🔫 MILTIQ JOYIGA SOLINDI';
  }

  // Fire Miltiq rifle along pedestrian aiming direction
  public fireWeapon() {
    if (!this.isRunning || this.isGameOver || !this.isOnFoot || !this.stats.weaponEquipped) {
      return;
    }
    if (this.stats.ammo <= 0) {
      this.stats.lastStuntName = '⚠️ O‘Q TUGADI! JANG MAYDONI QUTISIDAN OLING (G)';
      return;
    }
    const nowMs = performance.now();
    if (nowMs - this.lastFireMs < 180) return;
    this.lastFireMs = nowMs;

    this.stats.ammo--;
    soundEngine.playGunshot();

    if (this.pedestrian?.muzzleFlash) {
      this.pedestrian.muzzleFlash.visible = true;
      this.muzzleFlashTimer = 0.06;
    }

    const sinH = Math.sin(this.pedestrianHeading);
    const cosH = Math.cos(this.pedestrianHeading);
    const spawnPos = new THREE.Vector3(
      this.pedestrianPos.x + sinH * 0.9,
      this.pedestrianPos.y + 1.25,
      this.pedestrianPos.z + cosH * 0.9
    );
    const bulletMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    bulletMesh.position.copy(spawnPos);
    this.scene.add(bulletMesh);

    this.bullets.push({
      mesh: bulletMesh,
      pos: spawnPos,
      vel: new THREE.Vector3(sinH * 65, 0, cosH * 65),
      fromPlayer: true,
      life: 1.4,
    });
  }

  // Exit or Enter the car anytime (moshinadan tushish / minish)
  public toggleExitEnterCar() {
    if (!this.isRunning || this.isGameOver || !this.pedestrian) return;
    soundEngine.userGesture();

    if (this.isInsideHouse) {
      this.exitHouseInterior();
      return;
    }

    if (!this.isOnFoot) {
      // Step out on the left-hand driver side (+X in car local frame)
      this.currentSpeed = 0;
      const sinH = Math.sin(this.playerHeading);
      const cosH = Math.cos(this.playerHeading);
      const sideOffset = 1.65;
      this.pedestrianPos.set(
        this.playerPos.x + cosH * sideOffset,
        0,
        this.playerPos.z - sinH * sideOffset
      );
      this.pedestrianHeading = this.playerHeading;
      this.pedestrianVelocityY = 0;
      this.pedestrianGrounded = true;
      this.pedestrian.group.position.copy(this.pedestrianPos);
      this.pedestrian.group.rotation.y = this.pedestrianHeading;
      this.pedestrian.group.visible = true;
      if (this.pedestrian.weaponGroup) {
        this.pedestrian.weaponGroup.visible = this.stats.weaponEquipped;
      }

      if (this.playerParts?.driverGroup) {
        this.playerParts.driverGroup.visible = false;
      }

      this.isOnFoot = true;
      this.stats.isOnFoot = true;
      this.stats.speed = 0;
      this.stats.gear = 1;
      this.stats.rpm = 0;
      this.stats.nearCar = true;
      soundEngine.stopEngine();
      soundEngine.playDoorToggle();
      this.stats.lastStuntName = '🚶 MOSHINADAN TUSHDINGIZ • CHOYXONA / YOTOQ / JANG MAYDONIGA KIRING';
    } else {
      // Check proximity to parked car OR nearby street civilian car (GTA style)
      const distToCar = Math.hypot(
        this.pedestrianPos.x - this.playerPos.x,
        this.pedestrianPos.z - this.playerPos.z
      );

      let nearestCiv: (typeof this.civilianCars)[number] | null = null;
      let nearestCivDist = Infinity;
      for (const civ of this.civilianCars) {
        const d = Math.hypot(
          this.pedestrianPos.x - civ.pos.x,
          this.pedestrianPos.z - civ.pos.z
        );
        if (d < 5.5 && d < nearestCivDist) {
          nearestCivDist = d;
          nearestCiv = civ;
        }
      }

      if (nearestCiv && (distToCar > 3.5 || nearestCivDist < distToCar)) {
        // GTA Street Car Entry!
        this.playerPos.copy(nearestCiv.pos);
        this.playerHeading = nearestCiv.parts.group.rotation.y;
        this.shipModel = nearestCiv.model;
        this.shipColor = nearestCiv.color;
        this.setupPlayer();
        this.playerGroup.position.copy(this.playerPos);
        this.playerGroup.rotation.y = this.playerHeading;

        // Relocate the civilian car elsewhere on the road
        nearestCiv.pos.set(
          nearestCiv.axis === 'ns' ? nearestCiv.roadCoord + (nearestCiv.dir === 1 ? -4.5 : 4.5) : -480,
          0.02,
          nearestCiv.axis === 'ns' ? -480 : nearestCiv.roadCoord - (nearestCiv.dir === 1 ? -4.5 : 4.5)
        );

        this.pedestrian.group.visible = false;
        if (this.playerParts?.driverGroup) {
          this.playerParts.driverGroup.visible = true;
        }
        this.isOnFoot = false;
        this.stats.isOnFoot = false;
        this.stats.nearCar = true;
        this.stats.respect += 15;
        soundEngine.playDoorToggle();
        this.stats.lastStuntName = '🚘 KO‘CHA MOSHINASIGA O‘TIRIB OLDINGIZ! (+15 OBRO‘)';
        return;
      }

      if (distToCar > 9.0) {
        this.stats.lastStuntName = '⚠️ MOSHINANGIZ UZOQDA! YAQINROQ KELING';
        return;
      }

      this.pedestrian.group.visible = false;
      if (this.playerParts?.driverGroup) {
        this.playerParts.driverGroup.visible = true;
      }
      this.isOnFoot = false;
      this.stats.isOnFoot = false;
      this.stats.nearCar = true;
      soundEngine.playDoorToggle();
      this.stats.lastStuntName = '🚘 MOSHINAGA O‘TIRDINGIZ • GAZNI BOSING!';
    }
  }

  // Interact with nearby Choyxona / Yotoq / Park / Zapravka / Prava Xona / Jang Maydoni
  public interactNearbyPoi() {
    if (!this.isRunning || this.isGameOver) return;
    soundEngine.userGesture();

    if (this.isInsideHouse) {
      this.interactHouseSpot();
      return;
    }

    if (this.stats.nearbyPoi === 'none') {
      return;
    }

    if (this.stats.nearbyPoi === 'choyxona') {
      this.stats.hunger = 100;
      this.stats.energy = Math.min(100, this.stats.energy + 45);
      this.stats.hp = Math.min(100, this.stats.hp + 25);
      this.stats.score += 500;
      this.stats.lastStuntName = '🥣 MILLIY CHOYXONA: OSH YEDINGIZ! QUVVAT 100%';
      soundEngine.playEatOrRest();
      this.emitSparks(this.isOnFoot ? this.pedestrianPos : this.playerPos, 0xf59e0b);
    } else if (this.stats.nearbyPoi === 'yotoq') {
      this.stats.energy = 100;
      this.stats.hp = 100;
      this.stats.shields = this.stats.maxShields;
      this.stats.score += 450;
      this.stats.lastStuntName = '🛏️ YOTOQ JOY: TINIQIB UXLADINGIZ! KUCH VA JON 100%';
      soundEngine.playSleepSound();
      this.emitSparks(this.isOnFoot ? this.pedestrianPos : this.playerPos, 0xa78bfa);
    } else if (this.stats.nearbyPoi === 'rest_park') {
      this.stats.energy = 100;
      this.stats.shields = this.stats.maxShields;
      this.stats.hp = Math.min(100, this.stats.hp + 40);
      this.stats.score += 400;
      this.stats.lastStuntName = '🌳 DAM OLISH BOG‘I: KUCH VA QALQON TIKLANDI!';
      soundEngine.playEatOrRest();
      this.emitSparks(this.isOnFoot ? this.pedestrianPos : this.playerPos, 0x10b981);
    } else if (this.stats.nearbyPoi === 'fuel') {
      this.stats.fuel = 100;
      this.stats.nitro = 100;
      this.stats.score += 250;
      this.stats.lastStuntName = '⛽ ZAPRAVKA: BENZIN VA NITRO 100% TO‘LDI!';
      soundEngine.playEatOrRest();
      this.emitSparks(this.isOnFoot ? this.pedestrianPos : this.playerPos, 0x06b6d4);
    } else if (this.stats.nearbyPoi === 'prava_xona') {
      this.currentSpeed = 0;
      this.isRunning = false;
      soundEngine.stopEngine();
      this.onOpenPravaXona?.();
    } else if (this.stats.nearbyPoi === 'jang_maydoni') {
      this.stats.ammo = 120;
      this.stats.hp = 100;
      if (!this.isOnFoot) {
        this.toggleExitEnterCar();
      }
      this.stats.weaponEquipped = true;
      if (this.pedestrian?.weaponGroup) {
        this.pedestrian.weaponGroup.visible = true;
      }
      soundEngine.playShieldPickup();
      this.emitSparks(this.pedestrianPos, 0xef4444);
      this.stats.lastStuntName = '⚔️ JANG MAYDONI: MILTIQ & 120 O‘Q OLINDI! (SPACE — OTISH)';
    } else if (this.stats.nearbyPoi === 'ustaxona') {
      if (this.stats.carCondition < 99 || this.stats.shields < this.stats.maxShields) {
        this.repairCarAtUstaxona();
      } else {
        this.workUstaxonaShift();
      }
    } else if (this.stats.nearbyPoi === 'ish_markazi') {
      if (this.onOpenJobs) {
        this.currentSpeed = 0;
        this.isRunning = false;
        soundEngine.stopEngine();
        this.onOpenJobs();
      } else {
        this.startCityJob();
      }
    } else if (this.stats.nearbyPoi === 'my_home') {
      this.enterHouseInterior();
    }
  }

  public enterHouseInterior() {
    if (!this.houseInteriorGroup) {
      this.houseInteriorGroup = buildHouseInteriorGroup();
      this.scene.add(this.houseInteriorGroup);
    }

    if (!this.isInsideHouse) {
      this.savedOutdoorCarPos.copy(this.playerPos);
      this.savedOutdoorHeading = this.playerHeading;
    }

    this.isInsideHouse = true;
    this.stats.isInsideHouse = true;
    this.isOnFoot = true;
    this.stats.isOnFoot = true;
    this.currentSpeed = 0;
    this.stats.speed = 0;

    this.openWorldGroup.visible = false;
    this.playerGroup.visible = false;
    if (this.skyDome) this.skyDome.visible = false;
    this.houseInteriorGroup.visible = true;

    this.pedestrianPos.set(0, 0, -4.4);
    this.pedestrianHeading = 0;
    if (this.pedestrian) {
      this.pedestrian.group.visible = true;
      this.pedestrian.group.position.copy(this.pedestrianPos);
      this.pedestrian.group.rotation.y = 0;
    }

    this.camera.position.set(0, 2.0, -6.5);
    soundEngine.playDoorToggle();
    this.stats.lastStuntName = '🏠 UYGA KIRIDINGIZ! OSHXONA, YOTOQ VA SEYFGA YURING';
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public exitHouseInterior() {
    if (!this.isInsideHouse) return;
    this.isInsideHouse = false;
    this.stats.isInsideHouse = false;
    this.stats.housePoiAction = 'none';

    if (this.houseInteriorGroup) this.houseInteriorGroup.visible = false;
    this.openWorldGroup.visible = true;
    this.playerGroup.visible = true;
    if (this.skyDome) this.skyDome.visible = true;

    // Place player right on the porch outside the front door near their parked car
    this.isOnFoot = true;
    this.stats.isOnFoot = true;
    this.pedestrianPos.set(MY_HOME_COORDS.x + 2.5, 0, MY_HOME_COORDS.z - 2.2);
    this.pedestrianHeading = Math.PI;
    if (this.pedestrian) {
      this.pedestrian.group.visible = true;
      this.pedestrian.group.position.copy(this.pedestrianPos);
      this.pedestrian.group.rotation.y = Math.PI;
    }

    this.playerPos.copy(this.savedOutdoorCarPos);
    this.playerHeading = this.savedOutdoorHeading;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.set(0, this.playerHeading, 0);

    this.camera.position.set(this.pedestrianPos.x, 2.2, this.pedestrianPos.z + 4.5);
    soundEngine.playDoorToggle();
    this.stats.lastStuntName = '🚪 KO‘CHAGA CHIQDINGIZ! MOSHINANGIZ HOVLIDA';
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public interactHouseSpot(spot?: 'kitchen' | 'bed' | 'safe' | 'laptop' | 'exit') {
    const active = spot || this.stats.housePoiAction || 'none';
    if (active === 'exit') {
      this.exitHouseInterior();
      return;
    }
    if (active === 'kitchen') {
      this.stats.hunger = 100;
      this.stats.hp = Math.min(100, this.stats.hp + 35);
      soundEngine.playEatOrRest();
      this.stats.lastStuntName = '🥣 UYDA ISSIQ OSH & CHOY ICHDINGIZ! QUVVAT 100%';
    } else if (active === 'bed') {
      this.stats.energy = 100;
      this.stats.hp = 100;
      this.stats.shields = this.stats.maxShields;
      soundEngine.playSleepSound();
      this.stats.lastStuntName = '🛏️ YOTOQDA TINIQIB DAM OLDINGIZ! ENERGIYA 100%';
    } else if (active === 'safe') {
      this.stats.weaponEquipped = true;
      this.stats.ammo = 150;
      if (this.pedestrian?.weaponGroup) this.pedestrian.weaponGroup.visible = true;
      soundEngine.playShieldPickup();
      this.stats.lastStuntName = '🔫 SEYFDAN MILTIQ VA 150 O‘Q OLINDI!';
    } else if (active === 'laptop') {
      this.currentSpeed = 0;
      this.isRunning = false;
      soundEngine.stopEngine();
      this.onOpenHome?.();
    }
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/jpeg', 0.84);
  }

  public repairCarAtUstaxona() {
    soundEngine.userGesture();
    const cost = this.stats.money >= 30000 ? 30000 : 0;
    if (cost > 0) this.stats.money -= cost;
    this.stats.carCondition = 100;
    this.stats.shields = this.stats.maxShields;
    soundEngine.playRepairSound();
    this.emitSparks(this.playerPos, 0xfacc15);
    this.stats.lastStuntName =
      cost > 0
        ? '🔧 USTAXONA ISHCHILARI MOSHINANI 100% TUZATDI! (-30,000 so‘m)'
        : '🔧 USTAXONA: BEPUL TA‘MIRLASH 100% BAJARILDI!';
    this.onCareerUpdate?.({
      money: this.stats.money,
      hasPrava: this.stats.hasPrava,
      hasDocuments: this.stats.hasDocuments,
    });
  }

  public workUstaxonaShift() {
    soundEngine.userGesture();
    const wage = 75000;
    this.stats.money += wage;
    this.stats.jobsCompleted += 1;
    this.stats.score += 400;
    this.stats.energy = Math.max(0, this.stats.energy - 12);
    soundEngine.playRepairSound();
    soundEngine.playSuccessBell();
    this.emitSparks(this.isOnFoot ? this.pedestrianPos : this.playerPos, 0x10b981);
    this.stats.lastStuntName = `💼 USTADA ISH BAJARILDI! +${wage.toLocaleString()} so‘m`;
    this.onCareerUpdate?.({
      money: this.stats.money,
      hasPrava: this.stats.hasPrava,
      hasDocuments: this.stats.hasDocuments,
    });
  }

  public startSpecificCityJob(picked: {
    title: string;
    x: number;
    z: number;
    reward: number;
  }) {
    if (this.mode !== 'open_world') {
      this.startGame('open_world', 'tashkent');
    } else {
      this.ensureOpenWorldBuilt();
      this.openWorldGroup.visible = true;
      this.isRunning = true;
      this.isGameOver = false;
    }

    const distLeft = Math.round(
      Math.hypot(picked.x - this.playerPos.x, picked.z - this.playerPos.z)
    );
    this.stats.activeJob = {
      title: picked.title,
      reward: picked.reward,
      targetX: picked.x,
      targetZ: picked.z,
      distanceLeft: distLeft,
    };

    if (this.jobMarkerGroup) {
      this.jobMarkerGroup.position.set(picked.x, 0, picked.z);
      this.jobMarkerGroup.visible = true;
    }

    soundEngine.playCollectCrystal();
    this.stats.lastStuntName = `💼 YANGI ISH: ${picked.title.toUpperCase()} (+${picked.reward.toLocaleString()} so‘m)`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public startCityJob() {
    const routes = [
      { title: 'Choyxonaga Issiq Osh Yetkazish', x: 14, z: 75, reward: 95000 },
      { title: 'Toshkent Saroyga VIP Taksi', x: 14, z: -105, reward: 110000 },
      { title: 'A-380 Zapravkaga Ehtiyot Qism', x: -13, z: 245, reward: 125000 },
      { title: 'Samarqand Registon Buyurtmasi', x: 324, z: -260, reward: 165000 },
      { title: 'Xiva Ichan Qal‘aga Sayyoh Taksi', x: -315, z: -260, reward: 165000 },
      { title: 'Prava Xonaga Hujjat Yetkazish', x: PRAVA_XONA_COORDS.x - 11, z: PRAVA_XONA_COORDS.z, reward: 120000 },
    ];
    const picked = routes[this.activeJobStage % routes.length];
    this.activeJobStage++;
    this.startSpecificCityJob(picked);
  }

  public setCustomWaypoint(x: number, z: number, label: string = 'Xarita nuqtasi') {
    if (this.mode !== 'open_world') {
      this.startGame('open_world', 'tashkent');
    } else {
      this.ensureOpenWorldBuilt();
      this.openWorldGroup.visible = true;
    }

    const actor = this.isOnFoot ? this.pedestrianPos : this.playerPos;
    const dist = Math.round(Math.hypot(x - actor.x, z - actor.z));
    this.stats.customWaypoint = { x, z, label, distanceLeft: dist };

    if (this.waypointMarkerGroup) {
      this.waypointMarkerGroup.position.set(x, 0, z);
      this.waypointMarkerGroup.visible = true;
    }
    soundEngine.playCollectCrystal();
    this.stats.lastStuntName = `📍 GPS BELGILANDI: ${label.toUpperCase()} (${dist} m)`;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public clearCustomWaypoint() {
    this.stats.customWaypoint = null;
    if (this.waypointMarkerGroup) {
      this.waypointMarkerGroup.visible = false;
    }
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  // Start Live 3D Avtodrom Yezda Practical Driving Exam
  public startYezdaExam() {
    if (this.mode !== 'open_world') {
      this.startGame('open_world', 'tashkent');
    } else {
      this.isRunning = true;
      this.isGameOver = false;
      this.ensureOpenWorldBuilt();
      this.openWorldGroup.visible = true;
    }

    if (this.isOnFoot && this.pedestrian) {
      this.pedestrian.group.visible = false;
      this.isOnFoot = false;
      this.stats.isOnFoot = false;
      if (this.playerParts?.driverGroup) this.playerParts.driverGroup.visible = true;
    }

    this.playerPos.set(
      AVTODROM_CENTER.x - 24,
      this.playerParts?.isCar ? 0.02 : 0.45,
      AVTODROM_CENTER.z
    );
    this.playerHeading = Math.PI / 2;
    this.currentSpeed = 0;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.set(0, this.playerHeading, 0);

    this.examStage = 1;
    this.examConeHitCooldown = 0;
    this.stats.examActive = true;
    this.stats.examMistakes = 0;
    this.stats.examProgress = 10;
    this.stats.examStepLabel = '1/4: Povorotnik (Q/E) yoqib 1-halqaga yuring';

    if (this.examMarkerGroup) {
      this.examMarkerGroup.position.set(AVTODROM_CENTER.x - 10, 0, AVTODROM_CENTER.z);
      this.examMarkerGroup.visible = true;
    }

    this.camera.position.set(
      this.playerPos.x - 6.4,
      this.playerPos.y + 2.8,
      this.playerPos.z
    );
    this.stats.lastStuntName = '🏁 AVTODROM 3D YEZDA IMTIHONI BOSHLANDI!';
  }

  // Quick GPS Fast Travel directly to key city facilities
  public navigateToZone(
    zone: 'prava_xona' | 'jang_maydoni' | 'yotoq' | 'choyxona' | 'fuel' | 'ustaxona' | 'ish_markazi' | 'my_home'
  ) {
    if (this.isInsideHouse) {
      this.exitHouseInterior();
    }
    if (this.mode !== 'open_world') {
      this.startGame('open_world', 'tashkent');
    } else {
      this.ensureOpenWorldBuilt();
      this.openWorldGroup.visible = true;
      this.isRunning = true;
      this.isGameOver = false;
    }

    if (this.isOnFoot && this.pedestrian) {
      this.pedestrian.group.visible = false;
      this.isOnFoot = false;
      this.stats.isOnFoot = false;
      if (this.playerParts?.driverGroup) this.playerParts.driverGroup.visible = true;
    }

    const targets: Record<typeof zone, { x: number; z: number; h: number; label: string }> = {
      prava_xona: { x: PRAVA_XONA_COORDS.x - 11, z: PRAVA_XONA_COORDS.z, h: Math.PI / 2, label: '🎓 PRAVA XONAGA YETIB KELDINGIZ!' },
      jang_maydoni: { x: JANG_MAYDONI_CENTER.x + 28, z: JANG_MAYDONI_CENTER.z, h: -Math.PI / 2, label: '⚔️ JANG MAYDONI DARVOZASIDASIZ!' },
      yotoq: { x: 14, z: -105, h: 0, label: '🛏️ MEHMONXONA YOTOQ JOYGA KELDINGIZ!' },
      choyxona: { x: 13, z: 75, h: 0, label: '🥣 MILLIY CHOYXONAGA YETIB KELDINGIZ!' },
      fuel: { x: -13, z: 245, h: 0, label: '⛽ ZAPRAVKAGA YETIB KELDINGIZ!' },
      ustaxona: { x: USTAXONA_COORDS.x - 8, z: USTAXONA_COORDS.z, h: Math.PI / 2, label: '🔧 MOSHINA USTAXONASIGA KELDINGIZ!' },
      ish_markazi: { x: ISH_MARKAZI_COORDS.x + 8, z: ISH_MARKAZI_COORDS.z, h: -Math.PI / 2, label: '💼 ISH MARKAZIGA YETIB KELDINGIZ!' },
      my_home: { x: MY_HOME_COORDS.x, z: MY_HOME_COORDS.z - 16, h: 0, label: '🏠 MENING UYIMGA YETIB KELDINGIZ!' },
    };

    const dest = targets[zone];
    this.playerPos.set(dest.x, this.playerParts?.isCar ? 0.02 : 0.45, dest.z);
    this.playerHeading = dest.h;
    this.currentSpeed = 0;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.set(0, dest.h, 0);
    this.camera.position.set(
      dest.x - Math.sin(dest.h) * 6.4,
      2.6,
      dest.z - Math.cos(dest.h) * 6.4
    );
    this.stats.lastStuntName = dest.label;
    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public resolveMilitsiyaStop(action: 'pay' | 'escape', fineAmount: number = 150000) {
    this.isMilitsiyaModalPaused = false;
    this.isRunning = true;
    soundEngine.userGesture();

    if (action === 'pay') {
      this.stats.money = Math.max(0, this.stats.money - fineAmount);
      this.stats.gaiFines += 1;
      this.stats.gaiAlert = 0;
      this.gaiGraceCooldown = 14;
      this.gaiPatrols.forEach((g) => (g.chasing = false));
      this.stats.lastStuntName = `👮‍♂️ JARIMA TO‘LANDI (-${fineAmount.toLocaleString()} so‘m)`;
      this.onCareerUpdate?.({
        money: this.stats.money,
        hasPrava: this.stats.hasPrava,
        hasDocuments: this.stats.hasDocuments,
      });
    } else {
      this.gaiGraceCooldown = 4;
      this.stats.gaiAlert = 2;
      this.stats.lastStuntName = '💨 YPX DAN QOCHMOQDASIZ! GAZNI BOSING!';
    }
  }

  public grantPravaAndDocuments() {
    this.stats.hasPrava = true;
    this.stats.hasDocuments = true;
    this.stats.money += 200000;
    this.onCareerUpdate?.({
      money: this.stats.money,
      hasPrava: true,
      hasDocuments: true,
    });
  }

  public setCareerProgress(data: {
    money?: number;
    hasPrava?: boolean;
    hasDocuments?: boolean;
  }) {
    if (data.money !== undefined) this.stats.money = data.money;
    if (data.hasPrava !== undefined) this.stats.hasPrava = data.hasPrava;
    if (data.hasDocuments !== undefined) this.stats.hasDocuments = data.hasDocuments;
  }

  public setCustomization(c: CarCustomization) {
    this.customization = { ...c };
    this.setupPlayer();
  }

  private triggerMilitsiyaViolation(_reason: string) {
    // Police patrol car chases removed
    this.stats.gaiAlert = 0;
  }

  private animateFlashingBeacons(timeSec: number) {
    const redOn = Math.floor(timeSec * 9) % 2 === 0;

    if (this.playerParts?.migalkaRed && this.playerParts?.migalkaBlue) {
      this.playerParts.migalkaRed.visible = this.migalkaActive && redOn;
      this.playerParts.migalkaBlue.visible = this.migalkaActive && !redOn;
    }

    for (const gai of this.gaiPatrols) {
      if (gai.parts.migalkaRed && gai.parts.migalkaBlue) {
        gai.parts.migalkaRed.visible = redOn;
        gai.parts.migalkaBlue.visible = !redOn;
      }
    }

    for (const pair of this.gaiBeaconPairs) {
      pair.red.visible = redOn;
      pair.blue.visible = !redOn;
    }
  }

  private updateNearbyPoiStatus(actorPos: THREE.Vector3) {
    if (this.mode !== 'open_world') {
      this.stats.nearbyPoi = 'none';
      this.stats.nearbyPoiLabel = '';
      return;
    }

    let found: WorldPoi | null = null;
    let minDist = Infinity;
    for (const poi of this.openWorldPois) {
      if (poi.type === 'gai_post') continue;
      const d = Math.hypot(poi.x - actorPos.x, poi.z - actorPos.z);
      if (d <= poi.radius && d < minDist) {
        minDist = d;
        found = poi;
      }
    }

    if (found) {
      this.stats.nearbyPoi = found.type;
      this.stats.nearbyPoiLabel = found.name;

      // Auto-trigger eat/rest cleanly if walking directly inside inner circle on foot
      if (
        this.isOnFoot &&
        minDist < 4.8 &&
        found.type !== 'prava_xona' &&
        found.type !== 'my_home' &&
        this.poiTriggerCooldown <= 0 &&
        this.lastAutoPoiId !== found.id
      ) {
        this.lastAutoPoiId = found.id;
        this.poiTriggerCooldown = 6;
        this.interactNearbyPoi();
      }
    } else {
      this.stats.nearbyPoi = 'none';
      this.stats.nearbyPoiLabel = '';
      this.lastAutoPoiId = '';
    }
  }

  private updateGaiPatrols(delta: number, _speedKmh: number) {
    if (this.gaiGraceCooldown > 0) this.gaiGraceCooldown -= delta;
    this.stats.gaiAlert = 0;
    soundEngine.setSiren(this.sirenActive);
  }

  private updateTrafficLights(timeSec: number, speedKmh: number) {
    if (this.mode !== 'open_world' || this.trafficLights.length === 0) {
      this.stats.redLightWarning = false;
      return;
    }

    const cycle = timeSec % 30;
    let phase = 0;
    if (cycle < 12) {
      this.currentNsState = 'green';
      this.currentEwState = 'red';
      phase = 0;
    } else if (cycle < 15) {
      this.currentNsState = 'yellow';
      this.currentEwState = 'red';
      phase = 1;
    } else if (cycle < 27) {
      this.currentNsState = 'red';
      this.currentEwState = 'green';
      phase = 2;
    } else {
      this.currentNsState = 'red';
      this.currentEwState = 'yellow';
      phase = 3;
    }

    if (phase !== this.lastLightCyclePhase) {
      this.lastLightCyclePhase = phase;
      const paint = (
        lights: TrafficLightNode['nsLights'],
        state: 'green' | 'yellow' | 'red'
      ) => {
        for (const l of lights) {
          l.redMat.color.setHex(state === 'red' ? 0xff1e38 : 0x450a0a);
          l.yellowMat.color.setHex(state === 'yellow' ? 0xfacc15 : 0x451a03);
          l.greenMat.color.setHex(state === 'green' ? 0x22c55e : 0x052e16);
        }
      };
      for (const node of this.trafficLights) {
        paint(node.nsLights, this.currentNsState);
        paint(node.ewLights, this.currentEwState);
      }
    }

    if (this.isOnFoot) {
      this.stats.redLightWarning = false;
      return;
    }

    // Check if player is approaching or running a red traffic light
    const px = this.playerPos.x;
    const pz = this.playerPos.z;
    const isNsAxis = Math.abs(Math.cos(this.playerHeading)) >= Math.abs(Math.sin(this.playerHeading));
    const myLightState = isNsAxis ? this.currentNsState : this.currentEwState;

    let redWarn = false;
    if (myLightState === 'red') {
      for (const node of this.trafficLights) {
        const dx = Math.abs(px - node.x);
        const dz = Math.abs(pz - node.z);
        const dist = Math.hypot(dx, dz);
        if (dist < 26 && ((isNsAxis && dx < 12) || (!isNsAxis && dz < 12))) {
          redWarn = true;
          if (dx < 9 && dz < 9 && speedKmh > 24 && this.redLightCooldown <= 0) {
            this.redLightCooldown = 8;
            this.triggerMilitsiyaViolation('Qizil svetafor chirog‘idan o‘tdingiz!');
          }
          break;
        }
      }
    }
    this.stats.redLightWarning = redWarn;
  }

  private updateOpenWorldTrafficAndPeds(delta: number, speedKmh: number) {
    if (this.mode !== 'open_world') {
      this.stats.pedestrianWarning = false;
      return;
    }

    // 1. Update Zebra Crosswalk Pedestrians & check player yielding!
    let pedWarning = false;
    const px = this.playerPos.x;
    const pz = this.playerPos.z;

    for (const cp of this.crosswalkPeds) {
      const cw = this.crosswalks[cp.cwIndex];
      if (!cw) continue;

      if (cp.crossing) {
        cp.t += cp.dir * cp.speed * delta;
        cp.walkCycle += delta * 9;
        const swing = Math.sin(cp.walkCycle) * 0.55;
        cp.parts.leftLeg.rotation.x = swing;
        cp.parts.rightLeg.rotation.x = -swing;
        cp.parts.leftArm.rotation.x = -swing * 0.6;
        cp.parts.rightArm.rotation.x = swing * 0.6;

        if ((cp.dir > 0 && cp.t >= 0.52) || (cp.dir < 0 && cp.t <= -0.52)) {
          cp.crossing = false;
          cp.dir = cp.dir > 0 ? -1 : 1;
          cp.waitTimer = 3.5 + Math.random() * 4.5;
          cp.rewarded = false;
        }
      } else {
        cp.waitTimer -= delta;
        cp.parts.leftLeg.rotation.x = THREE.MathUtils.damp(cp.parts.leftLeg.rotation.x, 0, 8, delta);
        cp.parts.rightLeg.rotation.x = THREE.MathUtils.damp(cp.parts.rightLeg.rotation.x, 0, 8, delta);
        if (cp.waitTimer <= 0) {
          cp.crossing = true;
        }
      }

      const cx = cw.axis === 'ns' ? cw.x + cp.t * cw.width : cw.x;
      const cz = cw.axis === 'ns' ? cw.z : cw.z + cp.t * cw.width;
      cp.parts.group.position.set(cx, 0, cz);
      cp.parts.group.rotation.y =
        cw.axis === 'ns'
          ? cp.dir > 0
            ? Math.PI / 2
            : -Math.PI / 2
          : cp.dir > 0
          ? 0
          : Math.PI;

      // Is pedestrian actively on asphalt?
      if (!this.isOnFoot && cp.crossing && Math.abs(cp.t) < 0.48) {
        const dist = Math.hypot(px - cw.x, pz - cw.z);
        if (dist < 32) {
          pedWarning = true;
          if (!cp.rewarded && dist > 6 && dist < 21 && speedKmh < 7) {
            cp.rewarded = true;
            this.stats.score += 150;
            this.stats.money += 10000;
            this.stats.lastStuntName = '👍 PIYODAGA YO‘L BERDINGIZ! +10,000 so‘m';
            this.onCareerUpdate?.({
              money: this.stats.money,
              hasPrava: this.stats.hasPrava,
              hasDocuments: this.stats.hasDocuments,
            });
          } else if (dist < 6.2 && speedKmh > 22 && this.zebraViolationCooldown <= 0) {
            this.zebraViolationCooldown = 8;
            this.triggerMilitsiyaViolation('Zebra o‘tish joyida piyodaga yo‘l bermadingiz!');
          }
        }
      }
    }
    this.stats.pedestrianWarning = pedWarning;

    // 2. Update Sidewalk Pedestrians
    for (const sp of this.sidewalkPeds) {
      sp.pos.z += sp.dir * sp.speed * delta;
      if (sp.pos.z > 380) sp.dir = -1;
      if (sp.pos.z < -380) sp.dir = 1;
      sp.walkCycle += delta * 8.5;
      const swing = Math.sin(sp.walkCycle) * 0.52;
      sp.parts.leftLeg.rotation.x = swing;
      sp.parts.rightLeg.rotation.x = -swing;
      sp.parts.leftArm.rotation.x = -swing * 0.6;
      sp.parts.rightArm.rotation.x = swing * 0.6;
      sp.parts.group.position.copy(sp.pos);
      sp.parts.group.rotation.y = sp.dir > 0 ? 0 : Math.PI;
    }

    // 3. Update Ambient Civilian Traffic Cars (stopping for red lights & crossing pedestrians!)
    for (const civ of this.civilianCars) {
      let targetSpeed = civ.baseSpeed;
      const lightState = civ.axis === 'ns' ? this.currentNsState : this.currentEwState;

      // Stop at red or yellow traffic lights just ahead
      if (lightState !== 'green') {
        for (const inter of ALL_ROAD_AXES) {
          const along = civ.axis === 'ns' ? civ.pos.z : civ.pos.x;
          const distAhead = (inter - along) * civ.dir;
          if (distAhead > 11 && distAhead < 24) {
            targetSpeed = 0;
            break;
          }
        }
      }

      // Stop for active crosswalk pedestrians
      for (const cp of this.crosswalkPeds) {
        if (!cp.crossing || Math.abs(cp.t) > 0.48) continue;
        const cw = this.crosswalks[cp.cwIndex];
        if (!cw || cw.axis !== civ.axis) continue;
        const along = civ.axis === 'ns' ? civ.pos.z : civ.pos.x;
        const cwAlong = civ.axis === 'ns' ? cw.z : cw.x;
        const perpDist = Math.abs((civ.axis === 'ns' ? civ.pos.x - cw.x : civ.pos.z - cw.z));
        const distAhead = (cwAlong - along) * civ.dir;
        if (perpDist < 12 && distAhead > 3 && distAhead < 18) {
          targetSpeed = 0;
          break;
        }
      }

      // Yield if player car is directly blocking lane
      const distPlayer = Math.hypot(civ.pos.x - px, civ.pos.z - pz);
      if (!this.isOnFoot && distPlayer < 9.5) {
        targetSpeed = 0;
      }

      civ.speed = THREE.MathUtils.damp(civ.speed, targetSpeed, 5, delta);
      if (civ.axis === 'ns') {
        civ.pos.z += civ.dir * civ.speed * delta;
        if (civ.pos.z > 570) civ.pos.z = -570;
        if (civ.pos.z < -570) civ.pos.z = 570;
      } else {
        civ.pos.x += civ.dir * civ.speed * delta;
        if (civ.pos.x > 570) civ.pos.x = -570;
        if (civ.pos.x < -570) civ.pos.x = 570;
      }

      civ.parts.group.position.copy(civ.pos);
      const wheelCirc = 2 * Math.PI * 0.35;
      civ.wheelRot -= (civ.speed / wheelCirc) * Math.PI * 2 * delta;
      civ.parts.wheels.forEach((w) => {
        w.rotation.x = civ.wheelRot;
      });

      // Minor fender-bender collision response in Open World (damages car!)
      if (!this.isOnFoot && distPlayer < 2.65 && Math.abs(this.currentSpeed) > 6) {
        const dmg = Math.min(35, Math.max(8, Math.round(Math.abs(this.currentSpeed) * 0.65)));
        this.applyCarCollisionDamage(dmg, 'FUQARO MOSHINASIGA URILDINGIZ');
        this.currentSpeed *= -0.3;
      }
    }
  }

  private applyCarCollisionDamage(amount: number, objectLabel: string) {
    if (this.colliderCooldown > 0) return;
    this.colliderCooldown = 0.45;
    soundEngine.playAccident();
    this.emitSparks(this.playerPos, 0xfacc15);
    this.emitTireSmoke(this.playerPos.x, this.playerPos.z);

    this.stats.carCondition = Math.max(0, this.stats.carCondition - amount);
    if (this.stats.carCondition <= 0) {
      this.stats.shields = Math.max(0, this.stats.shields - 1);
      this.stats.lastStuntName = `🔧 MOSHINA BUZILDI (${objectLabel})! USTAXONAGA BORING!`;
    } else {
      this.stats.lastStuntName = `💥 ${objectLabel.toUpperCase()}GA TEGDINGIZ! HOLAT: ${this.stats.carCondition}%`;
    }
  }

  private resolveBuildingCollisions(prevX: number, prevZ: number) {
    if (this.mode !== 'open_world' || this.isOnFoot) return;
    const carR = 1.45;
    for (const c of this.worldColliders) {
      const dx = this.playerPos.x - c.x;
      const dz = this.playerPos.z - c.z;
      const limitX = c.rx + carR;
      const limitZ = c.rz + carR;
      if (Math.abs(dx) < limitX && Math.abs(dz) < limitZ) {
        // Push player car cleanly outside collider along least penetration axis
        const penX = limitX - Math.abs(dx);
        const penZ = limitZ - Math.abs(dz);
        if (penX < penZ) {
          this.playerPos.x = c.x + Math.sign(dx || prevX - c.x || 1) * (limitX + 0.12);
        } else {
          this.playerPos.z = c.z + Math.sign(dz || prevZ - c.z || 1) * (limitZ + 0.12);
        }

        const impactSpeed = Math.abs(this.currentSpeed);
        if (impactSpeed > 4) {
          const dmg = Math.min(48, Math.max(7, Math.round(impactSpeed * 0.8)));
          this.applyCarCollisionDamage(dmg, c.label);
        }
        this.currentSpeed = -Math.sign(this.currentSpeed || 1) * Math.min(6, impactSpeed * 0.25);
        break;
      }
    }
  }

  private updateWorkersJobsAndMultiplayer(delta: number, timeSec: number) {
    // 1. Animate Ustaxona Mechanic Workers & Ish Markazi Dispatcher
    if (this.mode === 'open_world') {
      this.ustaxonaWorkers.forEach((w, idx) => {
        w.rightArm.rotation.x = -0.65 + Math.sin(timeSec * 5.2 + idx * 1.4) * 0.38;
        w.leftArm.rotation.x = -0.25 + Math.cos(timeSec * 3.1 + idx) * 0.15;
      });
    }

    // 2. Update Active City Delivery / Taxi Job Beacon, Waypoint, 3D GPS Arrow & GTA Cash Pickups
    const actor = this.isOnFoot ? this.pedestrianPos : this.playerPos;
    this.stats.playerHeading = this.isOnFoot ? this.pedestrianHeading : this.playerHeading;

    if (this.stats.activeJob && this.mode === 'open_world') {
      const d = Math.hypot(
        this.stats.activeJob.targetX - actor.x,
        this.stats.activeJob.targetZ - actor.z
      );
      this.stats.activeJob.distanceLeft = Math.round(d);
      if (this.jobMarkerGroup) {
        this.jobMarkerGroup.rotation.y += delta * 2.5;
      }
      if (d < 10.5) {
        const earned = this.stats.activeJob.reward;
        this.stats.money += earned;
        this.stats.jobsCompleted += 1;
        this.stats.respect += 100;
        this.stats.score += 800;
        this.stats.lastStuntName = `🏆 TOPSHIRIQ BAJARILDI! +${earned.toLocaleString()} so‘m`;
        this.stats.activeJob = null;
        if (this.jobMarkerGroup) this.jobMarkerGroup.visible = false;
        soundEngine.playSuccessBell();
        this.emitSparks(actor, 0x10b981);
        this.onCareerUpdate?.({
          money: this.stats.money,
          hasPrava: this.stats.hasPrava,
          hasDocuments: this.stats.hasDocuments,
        });
      }
    }

    if (this.stats.customWaypoint && this.mode === 'open_world') {
      const wd = Math.hypot(
        this.stats.customWaypoint.x - actor.x,
        this.stats.customWaypoint.z - actor.z
      );
      this.stats.customWaypoint.distanceLeft = Math.round(wd);
      if (this.waypointMarkerGroup) {
        this.waypointMarkerGroup.rotation.y -= delta * 2.2;
      }
      if (wd < 11.5) {
        const label = this.stats.customWaypoint.label;
        this.stats.customWaypoint = null;
        if (this.waypointMarkerGroup) this.waypointMarkerGroup.visible = false;
        soundEngine.playSuccessBell();
        this.emitSparks(actor, 0xe879f9);
        this.stats.lastStuntName = `📍 BELGILANGAN JOY: ${label.toUpperCase()}!`;
      }
    }

    // GTA 3D Directional GPS Arrow pointing toward active job or custom waypoint
    if (this.gpsArrowGroup) {
      const gpsTarget =
        this.mode === 'open_world' && this.stats.activeJob
          ? { x: this.stats.activeJob.targetX, z: this.stats.activeJob.targetZ }
          : this.mode === 'open_world' && this.stats.customWaypoint
          ? { x: this.stats.customWaypoint.x, z: this.stats.customWaypoint.z }
          : null;

      if (gpsTarget) {
        this.gpsArrowGroup.visible = true;
        this.gpsArrowGroup.position.set(
          actor.x,
          actor.y + (this.isOnFoot ? 2.45 : 2.35) + Math.sin(timeSec * 5) * 0.08,
          actor.z
        );
        this.gpsArrowGroup.rotation.y = Math.atan2(
          gpsTarget.x - actor.x,
          gpsTarget.z - actor.z
        );
      } else {
        this.gpsArrowGroup.visible = false;
      }
    }

    // GTA Street Cash Pickups rotation & collection
    if (this.mode === 'open_world') {
      for (const cash of this.streetCashPickups) {
        if (!cash.active) {
          cash.respawnTimer -= delta;
          if (cash.respawnTimer <= 0) {
            cash.active = true;
            cash.mesh.visible = true;
          }
          continue;
        }
        cash.mesh.rotation.y += delta * 2.2;
        const dCash = Math.hypot(cash.pos.x - actor.x, cash.pos.z - actor.z);
        if (dCash < 3.4) {
          cash.active = false;
          cash.mesh.visible = false;
          cash.respawnTimer = 45;
          this.stats.money += cash.amount;
          this.stats.respect += 20;
          this.stats.cashPickupsCollected += 1;
          this.stats.score += 250;
          soundEngine.playCollectCrystal();
          this.emitSparks(cash.pos, 0x10b981);
          this.stats.lastStuntName = `💵 PUL TOPILDI: +${cash.amount.toLocaleString()} so‘m!`;
          this.onCareerUpdate?.({
            money: this.stats.money,
            hasPrava: this.stats.hasPrava,
            hasDocuments: this.stats.hasDocuments,
          });
        }
      }
    }

    // 3. Emit engine smoke if car is damaged (< 50%)
    if (!this.isOnFoot && this.stats.carCondition < 50) {
      this.smokeEmitAccum += delta;
      const interval = this.stats.carCondition <= 0 ? 0.09 : 0.22;
      if (this.smokeEmitAccum >= interval) {
        this.smokeEmitAccum = 0;
        const sinH = Math.sin(this.playerHeading);
        const cosH = Math.cos(this.playerHeading);
        this.emitTireSmoke(this.playerPos.x + sinH * 1.6, this.playerPos.z + cosH * 1.6);
      }
    }

    // 4. Broadcast local state & smoothly interpolate Online Remote Players + Subwoofer Beat
    this.stats.onlineDriverName = this.onlineDriverName;
    if (this.stats.wantedLevel > 0) {
      this.wantedDecayTimer += delta;
      if (this.wantedDecayTimer > 18) {
        this.wantedDecayTimer = 0;
        this.stats.wantedLevel = Math.max(0, this.stats.wantedLevel - 1);
      }
    }

    const bassPulse = soundEngine.getBassPulse();
    if (this.playerParts?.subwooferGroup) {
      this.playerParts.subwooferGroup.visible = this.stats.subwooferLevel > 0;
      if (this.playerParts.subwooferCones) {
        this.playerParts.subwooferCones.forEach((cone) => {
          cone.position.z = -0.125 - bassPulse * 0.032;
          const s = 1 + bassPulse * 0.14;
          cone.scale.set(s, 1, s);
        });
      }
      if (this.playerParts.subwooferRings) {
        this.playerParts.subwooferRings.forEach((ring) => {
          const mat = ring.material as THREE.MeshBasicMaterial;
          mat.color.setHex(
            this.stats.subwooferLevel === 2 && bassPulse > 0.35
              ? 0xf43f5e
              : bassPulse > 0.25
              ? 0x38bdf8
              : 0x0e7490
          );
        });
      }
    }

    if (this.stats.onlineEnabled && this.mpClient) {
      const activePos = this.isOnFoot ? this.pedestrianPos : this.playerPos;
      this.mpClient.sendState({
        name: this.onlineDriverName,
        model: this.shipModel,
        color: this.shipColor,
        plateNumber: this.customization.plateNumber,
        x: activePos.x,
        y: activePos.y,
        z: activePos.z,
        heading: this.isOnFoot ? this.pedestrianHeading : this.playerHeading,
        speed: this.stats.speed,
        migalkaActive: this.migalkaActive,
        headlightsOn: this.headlightsOn,
        turnSignal: this.stats.turnSignal,
        roomCode: this.stats.onlineRoomCode,
        subwooferLevel: this.stats.subwooferLevel,
      });
    }

    const peerSummaries: PlayerStats['onlinePeers'] = [];
    for (const [peerId, remote] of this.remotePlayers.entries()) {
      remote.parts.group.position.lerp(remote.targetPos, Math.min(1, delta * 10));
      let hDiff = remote.targetHeading - remote.parts.group.rotation.y;
      while (hDiff > Math.PI) hDiff -= Math.PI * 2;
      while (hDiff < -Math.PI) hDiff += Math.PI * 2;
      remote.parts.group.rotation.y += hDiff * Math.min(1, delta * 10);

      const wheelCirc = 2 * Math.PI * 0.35;
      const speedUnits = (remote.state.speed || 0) / 2.8;
      remote.wheelRot -= (speedUnits / wheelCirc) * Math.PI * 2 * delta;
      remote.parts.wheels.forEach((w) => (w.rotation.x = remote.wheelRot));

      if (remote.parts.migalkaRed && remote.parts.migalkaBlue) {
        const redOn = Math.floor(timeSec * 9) % 2 === 0;
        remote.parts.migalkaRed.visible = remote.state.migalkaActive && redOn;
        remote.parts.migalkaBlue.visible = remote.state.migalkaActive && !redOn;
      }

      peerSummaries.push({
        id: peerId,
        name: remote.state.name || 'Do‘st',
        model: (VEHICLES[remote.state.model] ? remote.state.model : 'damas') as ShipModel,
        x: Math.round(remote.targetPos.x),
        z: Math.round(remote.targetPos.z),
      });
    }
    this.stats.onlinePeers = peerSummaries;
  }

  private updateBattleArenaAndBullets(delta: number, actorPos: THREE.Vector3) {
    if (this.mode !== 'open_world') {
      this.stats.inBattleArena = false;
      return;
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0 && this.pedestrian?.muzzleFlash) {
        this.pedestrian.muzzleFlash.visible = false;
      }
    }

    if (this.isOnFoot && this.input.fire) {
      this.fireWeapon();
    }

    const distToArena = Math.hypot(
      actorPos.x - JANG_MAYDONI_CENTER.x,
      actorPos.z - JANG_MAYDONI_CENTER.z
    );
    this.stats.inBattleArena = distToArena < 42;

    // Update Arena Enemies
    for (const enemy of this.arenaEnemies) {
      if (!enemy.alive) {
        enemy.respawnTimer -= delta;
        if (enemy.respawnTimer <= 0) {
          enemy.alive = true;
          enemy.hp = 100;
          enemy.group.visible = true;
        }
        continue;
      }

      enemy.patrolAngle += delta * 0.65;
      enemy.pos.x = JANG_MAYDONI_CENTER.x + Math.cos(enemy.patrolAngle) * enemy.radius;
      enemy.pos.z = JANG_MAYDONI_CENTER.z + Math.sin(enemy.patrolAngle) * enemy.radius;
      enemy.group.position.copy(enemy.pos);

      const dToPlayer = Math.hypot(actorPos.x - enemy.pos.x, actorPos.z - enemy.pos.z);
      if (this.stats.inBattleArena && this.isOnFoot && dToPlayer < 32) {
        enemy.group.rotation.y = Math.atan2(actorPos.x - enemy.pos.x, actorPos.z - enemy.pos.z);
        enemy.fireTimer -= delta;
        if (enemy.fireTimer <= 0) {
          enemy.fireTimer = 2.1 + Math.random() * 1.1;
          const dirX = (actorPos.x - enemy.pos.x) / Math.max(0.1, dToPlayer);
          const dirZ = (actorPos.z - enemy.pos.z) / Math.max(0.1, dToPlayer);
          const bMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff2244 })
          );
          const bPos = new THREE.Vector3(enemy.pos.x, 1.3, enemy.pos.z);
          bMesh.position.copy(bPos);
          this.scene.add(bMesh);
          this.bullets.push({
            mesh: bMesh,
            pos: bPos,
            vel: new THREE.Vector3(dirX * 26, 0, dirZ * 26),
            fromPlayer: false,
            life: 1.6,
          });
        }
      } else {
        enemy.group.rotation.y = -enemy.patrolAngle;
      }
    }

    // Update Active Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= delta;
      b.pos.addScaledVector(b.vel, delta);
      b.mesh.position.copy(b.pos);

      let hit = false;
      if (b.fromPlayer) {
        for (const enemy of this.arenaEnemies) {
          if (!enemy.alive) continue;
          const d = Math.hypot(b.pos.x - enemy.pos.x, b.pos.z - enemy.pos.z);
          if (d < 1.35) {
            hit = true;
            enemy.hp -= 50;
            this.emitSparks(enemy.pos, 0xfacc15);
            if (enemy.hp <= 0) {
              enemy.alive = false;
              enemy.group.visible = false;
              enemy.respawnTimer = 6.5;
              this.stats.arenaKills += 1;
              this.stats.respect += 40;
              this.stats.money += 50000;
              this.stats.score += 300;
              soundEngine.playCollectCrystal();
              this.stats.lastStuntName = '🎯 DUSHMAN YO‘Q QILINDI! +50,000 so‘m';
              this.onCareerUpdate?.({
                money: this.stats.money,
                hasPrava: this.stats.hasPrava,
                hasDocuments: this.stats.hasDocuments,
              });
            }
            break;
          }
        }
      } else if (this.isOnFoot) {
        const d = Math.hypot(b.pos.x - this.pedestrianPos.x, b.pos.z - this.pedestrianPos.z);
        if (d < 1.05) {
          hit = true;
          this.stats.hp = Math.max(0, this.stats.hp - 12);
          this.emitSparks(this.pedestrianPos, 0xff2244);
          if (this.stats.hp <= 0) {
            this.stats.hp = 100;
            this.pedestrianPos.set(JANG_MAYDONI_CENTER.x + 40, 0, JANG_MAYDONI_CENTER.z);
            this.stats.lastStuntName = '🏥 TIBBIY YORDAM: JANGDAN TASHQARIGA CHIQARILDINGIZ';
          }
        }
      }

      if (hit || b.life <= 0) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateYezdaExam(delta: number, speedKmh: number) {
    if (!this.stats.examActive || this.isOnFoot) return;
    if (this.examConeHitCooldown > 0) this.examConeHitCooldown -= delta;

    if (this.examMarkerGroup) {
      this.examMarkerGroup.rotation.y += delta * 2.2;
    }

    // Check cone collisions
    if (this.examConeHitCooldown <= 0) {
      for (const cone of this.avtodromCones) {
        if (Math.hypot(this.playerPos.x - cone.x, this.playerPos.z - cone.z) < 1.55) {
          this.examConeHitCooldown = 1.6;
          this.stats.examMistakes += 1;
          soundEngine.playViolationBeep();
          this.emitSparks(this.playerPos, 0xf97316);
          this.stats.lastStuntName = `⚠️ KONUSGA TEGDINGIZ! Xato: ${this.stats.examMistakes}/3`;
          if (this.stats.examMistakes >= 3) {
            this.stats.examActive = false;
            if (this.examMarkerGroup) this.examMarkerGroup.visible = false;
            this.stats.lastStuntName = '❌ IMTIHON TOPSHIRILMADI (3 TA KONUS YIQILDI)! Qayta urining';
            return;
          }
          break;
        }
      }
    }

    const px = this.playerPos.x;
    const pz = this.playerPos.z;

    if (this.examStage === 1) {
      const d = Math.hypot(px - (AVTODROM_CENTER.x - 10), pz - AVTODROM_CENTER.z);
      if (d < 5.2) {
        this.examStage = 2;
        this.stats.examProgress = 35;
        this.stats.examStepLabel = '2/4: Slalom konuslari o‘rtasidan ehtiyotkor o‘ting';
        soundEngine.playCollectCrystal();
        if (this.examMarkerGroup) {
          this.examMarkerGroup.position.set(AVTODROM_CENTER.x + 4, 0, AVTODROM_CENTER.z - 2);
        }
      }
    } else if (this.examStage === 2) {
      const d = Math.hypot(px - (AVTODROM_CENTER.x + 4), pz - (AVTODROM_CENTER.z - 2));
      if (d < 5.2) {
        this.examStage = 3;
        this.stats.examProgress = 65;
        this.stats.examStepLabel = '3/4: Povorotnik yoqib parkovka zonasiga buriling';
        soundEngine.playCollectCrystal();
        if (this.examMarkerGroup) {
          this.examMarkerGroup.position.set(AVTODROM_CENTER.x + 14, 0, AVTODROM_CENTER.z + 3);
        }
      }
    } else if (this.examStage === 3) {
      const d = Math.hypot(px - (AVTODROM_CENTER.x + 14), pz - (AVTODROM_CENTER.z + 3));
      if (d < 5.2) {
        this.examStage = 4;
        this.stats.examProgress = 85;
        this.stats.examStepLabel = '4/4: OQ PARKOVKA KATAGIGA KIRIB TO‘LIQ TO‘XTANG!';
        soundEngine.playCollectCrystal();
        if (this.examMarkerGroup) {
          this.examMarkerGroup.position.set(AVTODROM_CENTER.x + 22, 0, AVTODROM_CENTER.z);
        }
      }
    } else if (this.examStage === 4) {
      const d = Math.hypot(px - (AVTODROM_CENTER.x + 22), pz - AVTODROM_CENTER.z);
      if (d < 4.8 && speedKmh < 5) {
        this.stats.examActive = false;
        this.stats.examProgress = 100;
        this.stats.examStepLabel = '✅ B-TOIFA PRAVA MUVAFFAQIYATLI TOPSHIRILDI!';
        if (this.examMarkerGroup) this.examMarkerGroup.visible = false;
        this.grantPravaAndDocuments();
        this.stats.score += 1500;
        soundEngine.playSuccessBell();
        this.emitSparks(this.playerPos, 0x10b981);
        this.stats.lastStuntName = '🎓 TABRIKLAYMIZ! PRAVA & HUJJATLAR OLINDI! +200,000 so‘m';
      }
    }
  }

  public update(delta: number) {
    const time = this.clock.getElapsedTime();
    this.animateFlashingBeacons(time);

    if (!this.isRunning || this.isGameOver) {
      const isCar = this.playerParts?.isCar ?? true;
      if (!isCar) {
        this.playerGroup.position.y = 0.45 + Math.sin(time * 3) * 0.05;
      }
      if (!this.isMilitsiyaModalPaused) {
        this.playerGroup.rotation.y = Math.sin(time * 1.5) * 0.05;
      }
      this.render();
      return;
    }

    if (this.poiTriggerCooldown > 0) this.poiTriggerCooldown -= delta;
    if (this.redLightCooldown > 0) this.redLightCooldown -= delta;
    if (this.zebraViolationCooldown > 0) this.zebraViolationCooldown -= delta;
    if (this.colliderCooldown > 0) this.colliderCooldown -= delta;

    // Povorotnik blinker relay update
    if (this.stats.turnSignal !== 'none') {
      this.turnSignalTimer += delta;
      if (this.turnSignalTimer >= 0.42) {
        this.turnSignalTimer = 0;
        this.stats.turnSignalBlinkOn = !this.stats.turnSignalBlinkOn;
        soundEngine.playTurnSignalTick(this.stats.turnSignalBlinkOn);
        this.applyTurnSignalVisuals();
      }
      // Auto-cancel signal once sustained turn (>65 deg) completes
      let hDiff = Math.abs(this.playerHeading - this.turnSignalStartHeading);
      if (hDiff > Math.PI) hDiff = Math.PI * 2 - hDiff;
      if (hDiff > 1.15) {
        this.stats.turnSignal = 'none';
        this.stats.turnSignalBlinkOn = false;
        this.applyTurnSignalVisuals();
      }
    }

    const cfg = VEHICLES[this.shipModel];
    const isCar = this.playerParts?.isCar ?? true;

    // 1. World Region Progression (World Tour vs Open World District Names)
    if (this.mode === 'world_tour') {
      const regionsList: WorldRegionId[] = ['tashkent', 'm39_highway', 'khorezm', 'samarkand'];
      const regionIndex = Math.floor(this.forwardDistance / 900) % regionsList.length;
      const expectedRegion = regionsList[regionIndex];
      const progressInRegion = Math.round(((this.forwardDistance % 900) / 900) * 100);

      if (expectedRegion !== this.currentRegion) {
        this.currentRegion = expectedRegion;
        this.applyRegionAtmosphere(expectedRegion);
        if (this.onRegionChange) {
          this.onRegionChange(expectedRegion);
        }
      }

      this.stats.currentRegion = this.currentRegion;
      this.stats.regionName = WORLD_REGIONS[this.currentRegion].name.uz;
      this.stats.regionProgress = progressInRegion;
    } else {
      // Open World dynamic city detection based on closest Uzbekistan city hub
      let nearestRegion: WorldRegionId = 'tashkent';
      let nearestDist = Infinity;
      (Object.keys(CITY_SPAWN_COORDS) as WorldRegionId[]).forEach((rid) => {
        const c = CITY_SPAWN_COORDS[rid];
        const d = Math.hypot(this.playerPos.x - c.x, this.playerPos.z - c.z);
        if (d < nearestDist) {
          nearestDist = d;
          nearestRegion = rid;
        }
      });

      if (nearestRegion !== this.currentRegion) {
        this.currentRegion = nearestRegion;
        this.applyRegionAtmosphere(nearestRegion);
        if (this.onRegionChange) {
          this.onRegionChange(nearestRegion);
        }
      }
      this.stats.currentRegion = nearestRegion;
      this.stats.regionName = WORLD_REGIONS[nearestRegion].name.uz;
      this.stats.regionProgress = Math.min(100, Math.round((Math.hypot(this.playerPos.x, this.playerPos.z) / 520) * 100));
    }

    // Smooth lerp fog and background towards regional atmosphere
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.lerp(this.targetFogColor, delta * 1.5);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(this.targetSkyColor, delta * 1.5);
    }

    // Gradual Hunger & Energy consumption
    this.stats.hunger = Math.max(0, this.stats.hunger - delta * (this.isOnFoot ? 0.55 : 0.35));
    this.stats.energy = Math.max(0, this.stats.energy - delta * (this.isOnFoot ? 0.45 : 0.25));

    // Keep Golden-Hour SkyDome centered horizontally around camera outside
    if (this.skyDome) {
      this.skyDome.visible = !this.isInsideHouse;
      this.skyDome.position.set(this.camera.position.x, -40, this.camera.position.z);
    }

    // ==================================================
    // WALK-INSIDE 3D HOUSE INTERIOR MODE ("UYGA KIRISH KERAK")
    // ==================================================
    if (this.isInsideHouse && this.pedestrian) {
      this.pedestrianHeading -= this.input.steer * delta * 2.8;
      const moveInput = this.input.throttle;
      const walkSpeed = this.input.boost ? 7.5 : 4.8;

      if (Math.abs(moveInput) > 0.1) {
        const v = moveInput * walkSpeed;
        this.pedestrianPos.x += Math.sin(this.pedestrianHeading) * v * delta;
        this.pedestrianPos.z += Math.cos(this.pedestrianHeading) * v * delta;
        this.pedestrianWalkCycle += delta * 10;
        const swing = Math.sin(this.pedestrianWalkCycle) * 0.6;
        this.pedestrian.leftLeg.rotation.x = swing;
        this.pedestrian.rightLeg.rotation.x = -swing;
        this.pedestrian.leftArm.rotation.x = -swing * 0.7;
        this.pedestrian.rightArm.rotation.x = swing * 0.7;
      } else {
        this.pedestrian.leftLeg.rotation.x = THREE.MathUtils.damp(this.pedestrian.leftLeg.rotation.x, 0, 10, delta);
        this.pedestrian.rightLeg.rotation.x = THREE.MathUtils.damp(this.pedestrian.rightLeg.rotation.x, 0, 10, delta);
        this.pedestrian.leftArm.rotation.x = THREE.MathUtils.damp(this.pedestrian.leftArm.rotation.x, 0, 10, delta);
        this.pedestrian.rightArm.rotation.x = THREE.MathUtils.damp(this.pedestrian.rightArm.rotation.x, 0, 10, delta);
      }

      this.pedestrianPos.x = Math.max(-8.1, Math.min(8.1, this.pedestrianPos.x));
      this.pedestrianPos.z = Math.max(-6.1, Math.min(6.0, this.pedestrianPos.z));
      this.pedestrian.group.position.copy(this.pedestrianPos);
      this.pedestrian.group.rotation.y = this.pedestrianHeading;

      // Detect active room interactive spot
      let spot: 'none' | 'kitchen' | 'bed' | 'safe' | 'laptop' | 'exit' = 'none';
      let spotLabel = '';
      if (Math.hypot(this.pedestrianPos.x - 0, this.pedestrianPos.z + 5.7) < 2.2) {
        spot = 'exit';
        spotLabel = '🚪 KO‘CHAGA CHIQISH';
      } else if (Math.hypot(this.pedestrianPos.x + 5.6, this.pedestrianPos.z - 2.0) < 2.6) {
        spot = 'kitchen';
        spotLabel = '🥣 OSHXONA • OVQAT & CHOY';
      } else if (Math.hypot(this.pedestrianPos.x - 5.6, this.pedestrianPos.z - 2.2) < 2.7) {
        spot = 'bed';
        spotLabel = '🛏️ YOTOQXONA • DAM OLISH';
      } else if (Math.hypot(this.pedestrianPos.x + 6.2, this.pedestrianPos.z + 3.2) < 2.3) {
        spot = 'safe';
        spotLabel = '🔫 QUROL SEYFI';
      } else if (Math.hypot(this.pedestrianPos.x - 6.0, this.pedestrianPos.z + 3.2) < 2.4) {
        spot = 'laptop';
        spotLabel = '💻 NOUTBUK & UY MENYUSI';
      }

      this.stats.housePoiAction = spot;
      this.stats.nearbyPoiLabel = spotLabel;
      this.stats.speed = Math.round(Math.abs(moveInput) * walkSpeed * 3.0);

      // Cozy indoor camera inside walls
      const camTargetX = THREE.MathUtils.clamp(
        this.pedestrianPos.x - Math.sin(this.pedestrianHeading) * 3.1,
        -7.8,
        7.8
      );
      const camTargetZ = THREE.MathUtils.clamp(
        this.pedestrianPos.z - Math.cos(this.pedestrianHeading) * 3.1,
        -6.3,
        6.3
      );
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camTargetX, 10, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 1.95, 10, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, camTargetZ, 10, delta);
      _v1.set(
        this.pedestrianPos.x + Math.sin(this.pedestrianHeading) * 4,
        1.25,
        this.pedestrianPos.z + Math.cos(this.pedestrianHeading) * 4
      );
      this.camera.lookAt(_v1);

      if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
      this.render();
      return;
    }

    // ==================================================
    // ON-FOOT PEDESTRIAN WALKING MODE
    // ==================================================
    if (this.isOnFoot && this.pedestrian) {
      this.pedestrianHeading -= this.input.steer * delta * 2.8;
      const moveInput = this.input.throttle; // +1 forward, -1 backward, 0 stop
      const walkSpeed = (this.input.boost ? 11.5 : 6.5) * (this.stats.energy < 15 ? 0.7 : 1);

      if (Math.abs(moveInput) > 0.1) {
        const v = moveInput * walkSpeed;
        this.pedestrianPos.x += Math.sin(this.pedestrianHeading) * v * delta;
        this.pedestrianPos.z += Math.cos(this.pedestrianHeading) * v * delta;
        this.pedestrianWalkCycle += delta * (this.input.boost ? 14 : 9);

        const swing = Math.sin(this.pedestrianWalkCycle) * 0.65;
        this.pedestrian.leftLeg.rotation.x = swing;
        this.pedestrian.rightLeg.rotation.x = -swing;
        this.pedestrian.leftArm.rotation.x = -swing * 0.7;
        this.pedestrian.rightArm.rotation.x = swing * 0.7;
      } else {
        this.pedestrian.leftLeg.rotation.x = THREE.MathUtils.damp(this.pedestrian.leftLeg.rotation.x, 0, 10, delta);
        this.pedestrian.rightLeg.rotation.x = THREE.MathUtils.damp(this.pedestrian.rightLeg.rotation.x, 0, 10, delta);
        this.pedestrian.leftArm.rotation.x = THREE.MathUtils.damp(this.pedestrian.leftArm.rotation.x, 0, 10, delta);
        this.pedestrian.rightArm.rotation.x = THREE.MathUtils.damp(this.pedestrian.rightArm.rotation.x, 0, 10, delta);
      }

      if (this.input.jump && this.pedestrianGrounded) {
        this.pedestrianVelocityY = 7.5;
        this.pedestrianGrounded = false;
      }
      if (!this.pedestrianGrounded) {
        this.pedestrianVelocityY -= 22 * delta;
        this.pedestrianPos.y += this.pedestrianVelocityY * delta;
        if (this.pedestrianPos.y <= 0) {
          this.pedestrianPos.y = 0;
          this.pedestrianVelocityY = 0;
          this.pedestrianGrounded = true;
        }
      }

      if (this.mode === 'open_world') {
        this.pedestrianPos.x = Math.max(-720, Math.min(720, this.pedestrianPos.x));
        this.pedestrianPos.z = Math.max(-720, Math.min(720, this.pedestrianPos.z));
      } else {
        this.pedestrianPos.x = Math.max(-9, Math.min(9, this.pedestrianPos.x));
      }

      this.pedestrian.group.position.copy(this.pedestrianPos);
      this.pedestrian.group.rotation.y = this.pedestrianHeading;

      const distToCar = Math.hypot(
        this.pedestrianPos.x - this.playerPos.x,
        this.pedestrianPos.z - this.playerPos.z
      );
      this.stats.nearCar = distToCar <= 6.5;
      this.stats.speed = Math.round(Math.abs(moveInput) * walkSpeed * 3.2);
      this.stats.worldX = Math.round(this.pedestrianPos.x);
      this.stats.worldZ = Math.round(this.pedestrianPos.z);

      this.updateNearbyPoiStatus(this.pedestrianPos);
      this.updateTrafficLights(time, 0);
      this.updateOpenWorldTrafficAndPeds(delta, 0);
      this.updateBattleArenaAndBullets(delta, this.pedestrianPos);
      this.updateGaiPatrols(delta, 0);
      this.updateParticles(delta);
      this.updateCamera(delta, false);

      if (this.onStatsUpdate) {
        this.onStatsUpdate({ ...this.stats });
      }
      this.render();
      return;
    }

    // ==================================================
    // 2. MANUAL GAZ & TORMOZ VEHICLE PHYSICS + FUEL
    // ==================================================
    const isBoosting =
      this.input.boost &&
      this.stats.nitro > 5 &&
      this.stats.fuel > 2 &&
      this.input.throttle >= 0;

    if (Math.abs(this.currentSpeed) > 1.5 && this.mode === 'open_world') {
      const fuelBurn =
        (0.24 + (Math.abs(this.currentSpeed) / 70) * 0.42 + (isBoosting ? 0.45 : 0)) * delta;
      this.stats.fuel = Math.max(0, this.stats.fuel - fuelBurn);
    }

    const outOfFuel = this.mode === 'open_world' && this.stats.fuel <= 0.1;
    const isBrokenDown = this.stats.carCondition <= 0;
    const damageCapFactor =
      isBrokenDown ? 0.11 : this.stats.carCondition < 40 ? 0.65 : 1.0;
    const tireFatigueFactor = this.stats.hunger < 10 || this.stats.energy < 10 ? 0.78 : 1.0;
    const maxForwardUnits = outOfFuel
      ? 9.5
      : (cfg.topSpeed / 2.8) * tireFatigueFactor * damageCapFactor;
    const maxNitroUnits = (cfg.topSpeed * 0.42) * tireFatigueFactor * damageCapFactor;

    if (isBoosting) {
      this.stats.nitro = Math.max(0, this.stats.nitro - delta * 26);
      this.stats.isNitroActive = true;
      const nowMs = performance.now();
      if (nowMs - this.lastBoostSoundMs > 450) {
        this.lastBoostSoundMs = nowMs;
        soundEngine.playBoost();
      }
    } else {
      this.stats.isNitroActive = false;
      this.stats.nitro = Math.min(100, this.stats.nitro + delta * 8);
    }

    const accelPower = (18 + cfg.acceleration * 4.2) * tireFatigueFactor;

    if (isBoosting) {
      // Nitro surges forward rapidly
      this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, maxNitroUnits, 3.2, delta);
    } else if (this.input.throttle > 0.1) {
      // GAZ pressed: smoothly accelerate toward vehicle top speed
      const targetFwd = maxForwardUnits * Math.min(1, this.input.throttle);
      if (this.currentSpeed < targetFwd) {
        this.currentSpeed = Math.min(targetFwd, this.currentSpeed + accelPower * delta);
      } else {
        this.currentSpeed = THREE.MathUtils.damp(this.currentSpeed, targetFwd, 2.5, delta);
      }
    } else if (this.input.throttle < -0.1) {
      // TORMOZ pressed: firm braking down to 0, then reverse if still held
      if (this.currentSpeed > 0.8) {
        this.currentSpeed = Math.max(0, this.currentSpeed - 64 * delta);
      } else {
        const targetRev = -18; // ~50 km/h reverse
        this.currentSpeed = Math.max(targetRev, this.currentSpeed - 22 * delta);
      }
    } else {
      // Neutral coasting: engine braking gently brings vehicle to a complete stop
      if (Math.abs(this.currentSpeed) < 0.25) {
        this.currentSpeed = 0;
      } else {
        const drag = this.currentSpeed > 0 ? 11.5 : 14;
        const sign = Math.sign(this.currentSpeed);
        this.currentSpeed -= sign * drag * delta;
        if (Math.sign(this.currentSpeed) !== sign) this.currentSpeed = 0;
      }
    }

    const speedKmh = Math.round(Math.abs(this.currentSpeed) * 2.8);
    this.stats.speed = speedKmh;
    if (speedKmh > this.stats.maxSpeedReached) {
      this.stats.maxSpeedReached = speedKmh;
    }

    const isDrifting =
      this.input.drift || (Math.abs(this.input.steer) > 0.7 && speedKmh > 100);

    soundEngine.updateEngine(speedKmh, isBoosting, isDrifting, this.input.throttle);
    this.stats.gear = this.currentSpeed < -0.5 ? -1 : soundEngine.getGear();
    this.stats.rpm = soundEngine.getRpm();

    // 3. Lateral Car Steering & Open World Roaming
    // Steer turns car realistically only proportional to speed (or small turn factor when moving slowly)
    const moveScale = Math.min(1, Math.max(0.25, Math.abs(this.currentSpeed) / 14));
    const steerSign = this.currentSpeed < -0.5 ? -1 : 1; // Reverse steering direction when backing up
    const steerSpeed = cfg.handling * (isDrifting ? 13 : 9.0) * moveScale;

    if (this.mode === 'open_world') {
      const prevX = this.playerPos.x;
      const prevZ = this.playerPos.z;
      if (Math.abs(this.currentSpeed) > 0.1) {
        this.playerHeading -= this.input.steer * steerSign * delta * 2.35 * moveScale;
      }
      this.playerPos.x += Math.sin(this.playerHeading) * this.currentSpeed * delta;
      this.playerPos.z += Math.cos(this.playerHeading) * this.currentSpeed * delta;
      this.resolveBuildingCollisions(prevX, prevZ);
      this.playerGroup.rotation.y = this.playerHeading;

      // Bound within massive 1500m x 1500m open city
      this.playerPos.x = Math.max(-720, Math.min(720, this.playerPos.x));
      this.playerPos.z = Math.max(-720, Math.min(720, this.playerPos.z));
    } else {
      if (Math.abs(this.currentSpeed) > 0.1) {
        this.playerPos.x -= this.input.steer * steerSpeed * delta;
      }
      const maxBound = (this.trackWidth - 2.5) / 2;
      if (this.playerPos.x > maxBound) this.playerPos.x = maxBound;
      if (this.playerPos.x < -maxBound) this.playerPos.x = -maxBound;

      const targetYaw =
        Math.abs(this.currentSpeed) > 0.3
          ? -this.input.steer * (isDrifting ? 0.36 : 0.24)
          : 0;
      this.playerYaw = THREE.MathUtils.damp(this.playerYaw, targetYaw, 12, delta);
      this.playerGroup.rotation.y = this.playerYaw;

      const targetRoll =
        Math.abs(this.currentSpeed) > 2
          ? this.input.steer * (isDrifting ? 0.28 : 0.12)
          : 0;
      this.playerRoll = THREE.MathUtils.damp(this.playerRoll, targetRoll, 10, delta);
      this.playerGroup.rotation.z = this.playerRoll;
    }

    if (this.input.horn) {
      this.triggerHorn();
    }

    // 4. Suspension, Tramplin Ramps & Jump Physics
    const baseHeight = isCar ? 0.02 : 0.45;
    if (this.mode === 'open_world' && this.isGrounded && Math.abs(this.currentSpeed) > 10) {
      for (const r of this.worldRamps) {
        const halfW = (r.axis === 'ns' ? r.width : r.length) * 0.52;
        const halfL = (r.axis === 'ns' ? r.length : r.width) * 0.52;
        if (
          Math.abs(this.playerPos.x - r.x) < halfW &&
          Math.abs(this.playerPos.z - r.z) < halfL
        ) {
          this.playerVelocityY = Math.max(10.5, Math.abs(this.currentSpeed) * 0.42);
          this.isGrounded = false;
          this.stats.score += 150;
          this.stats.lastStuntName = '🚀 TRAMPLIN SAKRASH! +150';
          soundEngine.playBoost();
          soundEngine.playJump();
          break;
        }
      }
    }

    if (this.input.jump && this.isGrounded) {
      this.playerVelocityY = 12.5;
      this.isGrounded = false;
      soundEngine.playJump();
    }

    if (!this.isGrounded) {
      this.airTime += delta;
      this.playerVelocityY -= 32 * delta;
      this.playerPos.y += this.playerVelocityY * delta;

      if (this.playerPos.y <= baseHeight) {
        this.playerPos.y = baseHeight;
        this.playerVelocityY = 0;
        this.isGrounded = true;

        if (this.airTime > 0.6) {
          const airPoints = Math.round(this.airTime * 250);
          this.stats.stuntScore += airPoints;
          this.stats.score += airPoints;
          this.stats.lastStuntName = 'DUNYOVIY SAKRASH (WORLD AIR)';
        }
        this.airTime = 0;
      }
    } else {
      let bumpOffset = 0;
      let targetBumpRoll = 0;
      if (this.mode === 'open_world' && speedKmh > 5) {
        for (const bmp of this.worldRoadBumps) {
          if (
            Math.abs(this.playerPos.x - bmp.x) < bmp.rx &&
            Math.abs(this.playerPos.z - bmp.z) < bmp.rz
          ) {
            const phase = (this.playerPos.x + this.playerPos.z) * 1.45;
            bumpOffset = (Math.sin(phase) * 0.11 + 0.08) * bmp.intensity;
            targetBumpRoll = Math.cos(phase * 1.3) * 0.055 * bmp.intensity;
            this.currentSpeed *= 0.994;
            soundEngine.playSuspensionBump(bmp.intensity);
            if (!this.stats.lastStuntName.includes('O‘MPAQ')) {
              this.stats.lastStuntName = `⚠️ ${bmp.label.toUpperCase()} — SEKINROQ!`;
            }
            break;
          }
        }
      }
      this.roadBumpRoll = THREE.MathUtils.damp(this.roadBumpRoll, targetBumpRoll, 16, delta);

      if (isCar) {
        const subVibe =
          this.stats.subwooferLevel === 2 ? soundEngine.getBassPulse() * 0.012 : 0;
        this.playerPos.y =
          baseHeight +
          bumpOffset +
          subVibe +
          (speedKmh > 5 ? (Math.random() - 0.5) * 0.004 : 0);
      } else {
        const hoverOsc = Math.sin(this.forwardDistance * 0.15) * 0.06;
        this.playerPos.y = baseHeight + bumpOffset + hoverOsc;
      }
    }

    const targetPitch = !this.isGrounded
      ? this.playerVelocityY * 0.03
      : isBoosting
      ? -0.05
      : this.input.throttle < -0.1 && this.currentSpeed > 2
      ? 0.045
      : 0;
    this.playerPitch = THREE.MathUtils.damp(this.playerPitch, targetPitch, 8, delta);
    this.playerGroup.rotation.x = this.playerPitch;
    if (this.mode === 'open_world') {
      this.playerGroup.rotation.z = this.roadBumpRoll;
    }

    this.playerGroup.position.copy(this.playerPos);

    // 5. 3D Wheels Spinning, Front Steering & Interior Steering Wheel
    if (this.playerParts && this.playerParts.isCar) {
      const wheelCircumference = 2 * Math.PI * 0.36;
      const wheelRotSpeed = (this.currentSpeed / wheelCircumference) * Math.PI * 2;
      this.wheelRotationAngle -= wheelRotSpeed * delta;

      this.playerParts.wheels.forEach((w) => {
        w.rotation.x = this.wheelRotationAngle;
      });

      const frontSteerAngle = -this.input.steer * 0.44;
      this.playerParts.frontSteerPivots.forEach((pivot) => {
        pivot.rotation.y = frontSteerAngle;
      });

      if (this.playerParts.steeringWheel) {
        this.playerParts.steeringWheel.rotation.z = -this.input.steer * 0.78;
      }

      if (this.playerParts.taillightMat) {
        const isBraking = this.input.throttle < -0.1;
        this.playerParts.taillightMat.color.setHex(
          isBraking
            ? (this.playerParts.taillightBrakeHex ?? 0xff1e38)
            : (this.playerParts.taillightOffHex ?? 0x26090c)
        );
      }

      if (isDrifting && this.isGrounded && speedKmh > 40) {
        this.emitTireSmoke(this.playerPos.x - 0.9, this.playerPos.z - 1.4);
        this.emitTireSmoke(this.playerPos.x + 0.9, this.playerPos.z - 1.4);
      }
    }

    // Exhaust flames (only visible when Nitro/Boost is active on cars)
    const flameScale = 1 + (isBoosting ? 1.6 : (speedKmh / 360) * 0.8) + Math.random() * 0.2;
    this.playerParts?.thrusters.forEach((t) => {
      t.visible = isBoosting || !this.playerParts?.isCar;
      t.scale.set(1, flameScale, 1);
    });

    // 6. Advance World Distance
    const forwardStep = Math.abs(this.currentSpeed) * delta;
    this.forwardDistance += forwardStep;
    if (this.mode !== 'open_world') {
      this.playerPos.z += this.currentSpeed * delta;
    }
    this.stats.distance = Math.round(this.forwardDistance);
    this.stats.score += Math.round(forwardStep * this.stats.multiplier * 0.4);
    this.stats.worldX = Math.round(this.playerPos.x);
    this.stats.worldZ = Math.round(this.playerPos.z);
    this.stats.nearCar = true;

    // Track cycling in World Tour
    if (this.mode !== 'open_world') {
      const segmentLength = 120;
      this.trackSegments.forEach((mesh) => {
        if (mesh.position.z < this.playerPos.z - segmentLength) {
          mesh.position.z += segmentLength * this.trackSegments.length;
        }
      });

      if (this.nextSpawnZ < this.playerPos.z + 260) {
        this.spawnWorldRoadContent();
      }
    }

    // Light follows player
    if (this.dirLight) {
      this.dirLight.position.x = this.playerPos.x + 25;
      this.dirLight.position.z = this.playerPos.z + 35;
      this.dirLight.target.position.copy(this.playerPos);
      this.dirLight.target.updateMatrixWorld();
    }

    if (this.worldFloorMesh) {
      this.worldFloorMesh.position.z = this.playerPos.z;
    }

    if (this.speedParticles) {
      this.speedParticles.position.x = this.playerPos.x;
      this.speedParticles.position.z = this.playerPos.z;
    }

    // 7. Check POIs, Traffic Lights, Crosswalks, Exam, Arena, Workers, Jobs, Multiplayer & Collisions
    this.updateNearbyPoiStatus(this.playerPos);
    this.updateTrafficLights(time, speedKmh);
    this.updateOpenWorldTrafficAndPeds(delta, speedKmh);
    this.updateBattleArenaAndBullets(delta, this.playerPos);
    this.updateYezdaExam(delta, speedKmh);
    this.updateWorkersJobsAndMultiplayer(delta, time);
    if (this.mode !== 'open_world') {
      this.updateEntitiesAndCollisions(delta);
      this.updateRivalRacers(delta);
    }
    this.updateGaiPatrols(delta, speedKmh);

    // 9. Update Particles
    this.updateParticles(delta);

    // 10. Update Camera
    this.updateCamera(delta, isBoosting);

    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats });
    }

    this.render();
  }

  private updateEntitiesAndCollisions(delta: number) {
    const pZ = this.playerPos.z;
    const pX = this.playerPos.x;
    const pY = this.playerPos.y;

    for (let i = this.activeEntities.length - 1; i >= 0; i--) {
      const ent = this.activeEntities[i];

      if (ent.z < pZ - 35) {
        this.scene.remove(ent.group);
        this.activeEntities.splice(i, 1);
        continue;
      }

      if (ent.type === 'crystal' || ent.type === 'shield') {
        ent.group.rotation.y += delta * 2.5;
      } else if (ent.type === 'drone') {
        ent.group.rotation.y += delta * 1.5;
        ent.group.position.y = 1.0 + Math.sin(pZ * 0.1 + ent.x) * 0.4;
      }

      if (!ent.active) continue;

      const dz = Math.abs(ent.z - pZ);
      const dx = Math.abs(ent.x - pX);

      if (dz < ent.hitboxRadius && dx < ent.hitboxRadius) {
        const dy = Math.abs(pY - ent.group.position.y);

        if (ent.type === 'crystal') {
          ent.active = false;
          this.scene.remove(ent.group);
          this.stats.crystals++;
          this.stats.comboCount++;
          if (this.stats.comboCount % 5 === 0 && this.stats.multiplier < 5) {
            this.stats.multiplier++;
          }
          this.stats.score += 100 * this.stats.multiplier;
          soundEngine.playCollectCrystal();
          this.emitSparks(ent.group.position, 0x06b6d4);
        } else if (ent.type === 'shield') {
          ent.active = false;
          this.scene.remove(ent.group);
          if (this.stats.shields < this.stats.maxShields) {
            this.stats.shields++;
          }
          this.stats.score += 250;
          soundEngine.playShieldPickup();
          this.emitSparks(ent.group.position, 0x10b981);
        } else if (ent.type === 'boost_pad') {
          this.stats.nitro = 100;
          this.currentSpeed = VEHICLES[this.shipModel].topSpeed * 0.42;
          soundEngine.playBoost();
          this.emitSparks(ent.group.position, 0x10b981);
        } else if (ent.type === 'ramp') {
          if (dy < 1.6) {
            this.playerVelocityY = 17;
            this.isGrounded = false;
            soundEngine.playJump();
          }
        } else if (ent.type === 'laser' || ent.type === 'drone') {
          if (pY > ent.hitboxHeight + 0.3) {
            this.stats.score += 250;
            this.stats.lastStuntName = 'TO‘SIQ USTIDAN SAKRASH (DODGE)';
          } else {
            // INSTANT DEATH: Bir narsaga tegishi bilanoq moshina portlaydi va o'ladi!
            ent.active = false;
            this.stats.shields = 0;
            this.stats.comboCount = 0;
            this.stats.multiplier = 1;
            this.currentSpeed = 0;

            soundEngine.playCrash();
            this.emitSparks(this.playerPos, 0xff0033);
            this.emitTireSmoke(this.playerPos.x - 0.5, this.playerPos.z);
            this.emitTireSmoke(this.playerPos.x + 0.5, this.playerPos.z);

            // Dramatic crash flip
            this.playerVelocityY = 10;
            this.playerRoll += Math.PI * 0.75;
            this.playerPitch += 0.4;
            this.isGrounded = false;

            this.triggerGameOver();
            return;
          }
        }
      }
    }
  }

  private updateParticles(delta: number) {
    if (this.sparkGeo) {
      for (let i = 0; i < this.sparkCount; i++) {
        if (this.sparkLifetimes[i] > 0) {
          this.sparkLifetimes[i] -= delta;
          this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * delta;
          this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * delta;
          this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * delta;
          this.sparkVelocities[i * 3 + 1] -= 25 * delta;
        } else {
          this.sparkPositions[i * 3 + 1] = -100;
        }
      }
      const sparkAttr = this.sparkGeo.attributes.position;
      if (sparkAttr) {
        sparkAttr.needsUpdate = true;
      }
    }

    if (this.smokeGeo) {
      for (let i = 0; i < this.smokeCount; i++) {
        if (this.smokeLifetimes[i] > 0) {
          this.smokeLifetimes[i] -= delta;
          this.smokePositions[i * 3 + 1] += 0.8 * delta;
        } else {
          this.smokePositions[i * 3 + 1] = -100;
        }
      }
      const smokeAttr = this.smokeGeo.attributes.position;
      if (smokeAttr) {
        smokeAttr.needsUpdate = true;
      }
    }
  }

  private updateCamera(delta: number, isBoosting: boolean) {
    const focusPos = this.isOnFoot ? this.pedestrianPos : this.playerPos;
    const focusHeading = this.isOnFoot ? this.pedestrianHeading : this.playerHeading;
    const pX = focusPos.x;
    const pY = focusPos.y;
    const pZ = focusPos.z;

    const aspect = this.camera.aspect || 1;
    const portraitBoost = aspect < 1 ? Math.min(26, (1 - aspect) * 38) : 0;
    const targetFov = (isBoosting ? 78 : 65) + portraitBoost;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'chase' || this.isOnFoot) {
      const isOpen = this.mode === 'open_world' || this.isOnFoot;
      const baseDist = this.isOnFoot ? 4.4 : 6.4;
      const followDist = aspect < 1 ? baseDist * 1.24 : baseDist;
      const followHeight = this.isOnFoot ? 2.2 : aspect < 1 ? 2.95 : 2.6;
      const targetCamX = isOpen
        ? pX - Math.sin(focusHeading) * followDist
        : pX * 0.75;
      const targetCamY = pY + followHeight;
      const targetCamZ = isOpen
        ? pZ - Math.cos(focusHeading) * followDist
        : pZ - (aspect < 1 ? 7.2 : 5.8);

      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        targetCamX,
        12,
        delta
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        targetCamY,
        10,
        delta
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        targetCamZ,
        20,
        delta
      );

      if (isOpen) {
        _v1.set(
          pX + Math.sin(focusHeading) * 8,
          pY + 1.15,
          pZ + Math.cos(focusHeading) * 8
        );
      } else {
        _v1.set(pX * 0.4, pY + 1.1, pZ + 8);
      }
      this.camera.lookAt(_v1);
    } else if (this.cameraMode === 'cockpit') {
      const sinH = this.mode === 'open_world' ? Math.sin(focusHeading) : 0;
      const cosH = this.mode === 'open_world' ? Math.cos(focusHeading) : 1;
      // Left-hand drive seat offset inside cabin
      this.camera.position.set(pX + cosH * 0.34, pY + 1.05, pZ - sinH * 0.34);
      _v1.set(pX + sinH * 25, pY + 1.0, pZ + cosH * 25);
      this.camera.lookAt(_v1);
    } else if (this.cameraMode === 'top_down') {
      this.camera.position.set(pX, pY + 18, pZ - 10);
      _v1.set(pX, pY, pZ + 10);
      this.camera.lookAt(_v1);
    } else {
      this.camera.position.set(pX + 5.5, pY + 2.6, pZ - 3);
      _v1.set(pX, pY + 0.5, pZ + 6);
      this.camera.lookAt(_v1);
    }
  }

  private triggerGameOver() {
    this.isRunning = false;
    this.isGameOver = true;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
    }
    soundEngine.stopEngine();
    soundEngine.stopMusic();
    if (this.onGameOver) {
      this.onGameOver({ ...this.stats });
    }
  }

  public setShipModel(model: ShipModel) {
    this.shipModel = model;
    this.setupPlayer();
  }

  public setShipColor(color: ShipColor) {
    this.shipColor = color;
    this.setupPlayer();
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public startAnimationLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.update(delta);

      if (isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.animationFrameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animationFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animationFrameId = window.setTimeout(cb, 80);
      }
    };
    this.animationFrameId = window.setTimeout(poll, 5);
  }

  public onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    cancelAnimationFrame(this.animationFrameId);
    clearTimeout(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);

    this.mpClient?.disconnect();
    for (const id of Array.from(this.remotePlayers.keys())) {
      this.removeRemotePlayer(id);
    }

    soundEngine.dispose();
    this.clearEntities();
    this.rivalRacers.forEach((r) => this.scene.remove(r.parts.group));
    this.rivalRacers = [];
    this.gaiPatrols.forEach((g) => this.scene.remove(g.parts.group));
    this.gaiPatrols = [];
    this.bullets.forEach((b) => this.scene.remove(b.mesh));
    this.bullets = [];
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
