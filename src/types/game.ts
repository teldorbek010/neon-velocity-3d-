/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'uz' | 'en';

export type GameMode = 'world_tour' | 'open_world' | 'stunt_arena';

export type CameraMode = 'chase' | 'cockpit' | 'top_down' | 'cinematic';

export type ShipModel =
  | 'damas'
  | 'matiz'
  | 'spark'
  | 'nexia3'
  | 'gentra'
  | 'cobalt'
  | 'onix'
  | 'monza'
  | 'malibu2'
  | 'tracker2'
  | 'byd_uz'
  | 'gtr_supercar'
  | 'muscle_v8'
  | 'hyper_phantom'
  | 'falcon';

export type ShipColor =
  | 'white'
  | 'black'
  | 'silver'
  | 'cyan'
  | 'crimson'
  | 'violet'
  | 'gold'
  | 'emerald';

export type GameStatus = 'menu' | 'playing' | 'paused' | 'game_over';

export type WorldRegionId = 'tashkent' | 'khorezm' | 'samarkand' | 'm39_highway';

export interface WorldRegion {
  id: WorldRegionId;
  name: { uz: string; en: string };
  flag: string;
  country: { uz: string; en: string };
  city: { uz: string; en: string };
  description: { uz: string; en: string };
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  groundColor: number;
  roadColor: number;
  landmark: { uz: string; en: string };
}

export type SirenMode = 'wail' | 'yelp' | 'hilo' | 'megafon';

export type RadioStationId =
  | 'off'
  | 'uz_rap_konsta'
  | 'uz_rap_minor'
  | 'uz_pop_shohruhxon'
  | 'uz_milliy_yalla'
  | 'uz_bass_phonk';

export interface VehicleConfig {
  id: ShipModel;
  category: 'uzbek' | 'supercar';
  badge: string;
  price: number; // so'm (0 = boshlang'ich bepul moshina)
  name: { uz: string; en: string };
  description: { uz: string; en: string };
  type: 'car' | 'hover';
  topSpeed: number; // km/h
  acceleration: number;
  handling: number;
  shieldMax: number;
}

export interface ColorScheme {
  id: ShipColor;
  name: { uz: string; en: string };
  primary: number; // hex
  secondary: number;
  glow: number;
  cssGlow: string;
}

export type HeadlightStyleId = 'xenon' | 'halogen' | 'ice_blue' | 'violet';

export type TaillightStyleId = 'classic_red' | 'smoked' | 'amber' | 'neon_cyan';

export type TurnSignalState = 'none' | 'left' | 'right';

export interface CarCustomization {
  plateNumber: string;
  headlightStyle: HeadlightStyleId;
  taillightStyle: TaillightStyleId;
}

export type PoiKind =
  | 'none'
  | 'choyxona'
  | 'rest_park'
  | 'yotoq'
  | 'fuel'
  | 'gai_post'
  | 'prava_xona'
  | 'jang_maydoni'
  | 'ustaxona'
  | 'ish_markazi'
  | 'my_home';

export interface ActiveJobInfo {
  title: string;
  reward: number;
  targetX: number;
  targetZ: number;
  distanceLeft: number;
}

export interface RemotePlayerState {
  id: string;
  name: string;
  model: ShipModel;
  color: ShipColor;
  plateNumber: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  migalkaActive: boolean;
  headlightsOn: boolean;
  turnSignal: TurnSignalState;
  roomCode?: string;
  subwooferLevel?: 0 | 1 | 2;
}

export interface PlayerStats {
  score: number;
  highScore: number;
  distance: number;
  speed: number;
  maxSpeedReached: number;
  gear: number;
  rpm: number;
  crystals: number;
  multiplier: number;
  comboCount: number;
  shields: number;
  maxShields: number;
  nitro: number; // 0 to 100
  isNitroActive: boolean;
  lapTime: number;
  bestLapTime: number;
  stuntScore: number;
  lastStuntName: string;
  // O'zbekiston hududlari telemetriyasi
  currentRegion: WorldRegionId;
  regionName: string;
  regionProgress: number; // 0 to 100%
  worldX: number;
  worldZ: number;
  // Poyga reytingi (Raqib moshinalar)
  racePosition: number;
  totalRacers: number;
  // Ochiq dunyo, haydovchi, YPX/GAI, Prava va Jang holati
  isOnFoot: boolean;
  energy: number; // 0 to 100 (Uyqu / Dam olish)
  hunger: number; // 0 to 100 (Ovqat)
  fuel: number; // 0 to 100 (Yoqilg'i / Benzin / Metan)
  hp: number; // 0 to 100 (Salomatlik - Jang maydoni uchun)
  carCondition: number; // 0 to 100 (Moshina texnik holati - urilsa buziladi)
  money: number; // So'm balansi
  sirenActive: boolean;
  sirenMode: SirenMode;
  radioStation: RadioStationId;
  subwooferLevel: 0 | 1 | 2;
  migalkaActive: boolean;
  nearbyPoi: PoiKind;
  nearbyPoiLabel: string;
  nearCar: boolean;
  gaiAlert: number; // 0: tinch, 1: qoidabuzarlik, 2: GAI quvmoqda
  gaiFines: number;
  headlightsOn: boolean;
  turnSignal: TurnSignalState;
  turnSignalBlinkOn: boolean;
  hasPrava: boolean;
  hasDocuments: boolean;
  weaponEquipped: boolean;
  ammo: number;
  inBattleArena: boolean;
  arenaKills: number;
  pedestrianWarning: boolean;
  redLightWarning: boolean;
  examActive: boolean;
  examStepLabel: string;
  examProgress: number;
  examMistakes: number;
  // Ish joylari, GTA Xarita & Onlayn rejim
  playerHeading: number;
  customWaypoint: { x: number; z: number; label: string; distanceLeft: number } | null;
  respect: number;
  cashPickupsCollected: number;
  activeJob: ActiveJobInfo | null;
  jobsCompleted: number;
  onlineConnected: boolean;
  onlinePlayersCount: number;
  onlineEnabled: boolean;
  onlineRoomCode: string;
  onlineDriverName: string;
  onlinePeers: { id: string; name: string; model: ShipModel; x: number; z: number }[];
  wantedLevel: number;
  isInsideHouse?: boolean;
  housePoiAction?: 'none' | 'kitchen' | 'bed' | 'safe' | 'laptop' | 'exit';
}

export interface YouTubeTrack {
  videoId: string;
  title: string;
  channel: string;
  thumbnail?: string;
}

export interface InstaComment {
  id: string;
  username: string;
  text: string;
  createdAt: number;
}

export interface InstaPost {
  id: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  imageDataUrl: string;
  caption: string;
  location: string;
  likes: number;
  likedByMe?: boolean;
  comments: InstaComment[];
  createdAt: number;
  realInstaUrl?: string;
}

export interface InstaAccount {
  username: string;
  displayName: string;
  bio: string;
  avatarEmoji: string;
  realProfileLinked: boolean;
}

export interface ControlInputState {
  steer: number; // -1 (left) to 1 (right)
  throttle: number; // -1 (brake/reverse), 0 (coast), 1 (gas)
  boost: boolean;
  jump: boolean;
  drift: boolean;
  horn?: boolean;
  fire?: boolean;
}

export interface GameSettings {
  language: Language;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  touchControls: 'auto' | 'always' | 'never';
  touchStyle: 'joystick' | 'buttons';
  cameraMode: CameraMode;
  graphicsQuality: 'high' | 'medium' | 'low';
}
