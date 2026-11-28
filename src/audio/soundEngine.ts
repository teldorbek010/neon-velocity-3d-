/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Realistic Supercar Engine, Police Sirens, FM Radio & Sound Synthesizer via Web Audio API

import { SirenMode, RadioStationId } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Multi-cylinder engine simulation
  private oscSub: OscillatorNode | null = null;
  private oscLow: OscillatorNode | null = null;
  private oscMid: OscillatorNode | null = null;
  private oscHigh: OscillatorNode | null = null;
  private oscNoise: AudioBufferSourceNode | null = null;

  private engineShaper: WaveShaperNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineResonance: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Police / YPX Multi-Mode Siren (Wail / Yelp / Hi-Lo / Kryakalka)
  private sirenOscA: OscillatorNode | null = null;
  private sirenOscB: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenLfoGain: GainNode | null = null;
  private sirenMode: SirenMode = 'wail';
  private sirenStepInterval: number | null = null;
  private sirenHiLoToggle: boolean = false;
  private isSirenPlaying: boolean = false;

  // Turbocharger spool & blow-off valve
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Tire skid / drift screech
  private skidFilter: BiquadFilterNode | null = null;
  private skidGain: GainNode | null = null;

  // Volume & state
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private volume: number = 0.75;

  // Realistic Gearbox simulation
  private currentGear: number = 1;
  private currentRpm: number = 850; // 850 idle to 7800 RPM
  private lastGearShiftTime: number = 0;
  private lastHornAt: number = 0;
  private lastBoostAt: number = 0;

  // Synthwave & Multi-Station In-Car Uzbek Music & Subwoofer
  private musicInterval: number | null = null;
  private radioInterval: number | null = null;
  private radioStation: RadioStationId = 'off';
  private radioStep: number = 0;
  private bassIndex: number = 0;
  private subwooferLevel: 0 | 1 | 2 = 1;
  private lastBassPulseAt: number = 0;
  private lastBumpAt: number = 0;

  constructor() {
    // Context will initialize on first user gesture
  }

  public userGesture() {
    if (!this.ctx) {
      this.initContext();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private initContext() {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.initEngineAudio();
      this.initSirenAudio();
      this.initTurboAudio();
      this.initSkidAudio();
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  private createMufflerCurve(): Float32Array<ArrayBuffer> {
    const samples = 256;
    const buffer = new ArrayBuffer(samples * Float32Array.BYTES_PER_ELEMENT);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * 1.35);
    }
    return curve;
  }

  private initEngineAudio() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;

      // Sub-octave warm cabin bass
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'sine';
      this.oscSub.frequency.setValueAtTime(28, now);

      // Primary cylinder firing pulse
      this.oscLow = this.ctx.createOscillator();
      this.oscLow.type = 'sawtooth';
      this.oscLow.frequency.setValueAtTime(56, now);

      // Mid intake growl
      this.oscMid = this.ctx.createOscillator();
      this.oscMid.type = 'triangle';
      this.oscMid.frequency.setValueAtTime(84, now);

      // Upper exhaust harmonic (kept subtle so top speed stays warm)
      this.oscHigh = this.ctx.createOscillator();
      this.oscHigh.type = 'triangle';
      this.oscHigh.frequency.setValueAtTime(112, now);

      // Warm muffler wave-shaper saturation
      this.engineShaper = this.ctx.createWaveShaper();
      this.engineShaper.curve = this.createMufflerCurve();
      this.engineShaper.oversample = '2x';

      // Exhaust body resonance peak
      this.engineResonance = this.ctx.createBiquadFilter();
      this.engineResonance.type = 'peaking';
      this.engineResonance.frequency.setValueAtTime(150, now);
      this.engineResonance.Q.setValueAtTime(1.1, now);
      this.engineResonance.gain.setValueAtTime(2.5, now);

      // Exhaust lowpass muffler filter
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(190, now);
      this.engineFilter.Q.setValueAtTime(0.75, now);

      // Individual oscillator mix gains for authentic deep automotive tone
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.60, now);
      const lowGain = this.ctx.createGain();
      lowGain.gain.setValueAtTime(0.26, now);
      const midGain = this.ctx.createGain();
      midGain.gain.setValueAtTime(0.28, now);
      const highGain = this.ctx.createGain();
      highGain.gain.setValueAtTime(0.06, now);

      // Start silent until game is running
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, now);

      this.oscSub.connect(subGain);
      this.oscLow.connect(lowGain);
      this.oscMid.connect(midGain);
      this.oscHigh.connect(highGain);

      subGain.connect(this.engineShaper);
      lowGain.connect(this.engineShaper);
      midGain.connect(this.engineShaper);
      highGain.connect(this.engineShaper);

      this.engineShaper.connect(this.engineResonance);
      this.engineResonance.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.oscSub.start();
      this.oscLow.start();
      this.oscMid.start();
      this.oscHigh.start();
    } catch {
      // Ignore oscillator errors
    }
  }

  private initSirenAudio() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;

      this.sirenOscA = this.ctx.createOscillator();
      this.sirenOscA.type = 'sawtooth';
      this.sirenOscA.frequency.setValueAtTime(860, now);

      this.sirenOscB = this.ctx.createOscillator();
      this.sirenOscB.type = 'triangle';
      this.sirenOscB.frequency.setValueAtTime(865, now);

      const sirenFilter = this.ctx.createBiquadFilter();
      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.setValueAtTime(2200, now);

      this.sirenLfo = this.ctx.createOscillator();
      this.sirenLfo.type = 'sine';
      this.sirenLfo.frequency.setValueAtTime(1.45, now); // Wail sweep rate

      this.sirenLfoGain = this.ctx.createGain();
      this.sirenLfoGain.gain.setValueAtTime(320, now);

      this.sirenLfo.connect(this.sirenLfoGain);
      this.sirenLfoGain.connect(this.sirenOscA.frequency);
      this.sirenLfoGain.connect(this.sirenOscB.frequency);

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0, now);

      this.sirenOscA.connect(sirenFilter);
      this.sirenOscB.connect(sirenFilter);
      sirenFilter.connect(this.sirenGain);
      this.sirenGain.connect(this.masterGain);

      this.sirenOscA.start();
      this.sirenOscB.start();
      this.sirenLfo.start();
    } catch {
      // Ignore
    }
  }

  private clearSirenTimer() {
    if (this.sirenStepInterval !== null) {
      window.clearInterval(this.sirenStepInterval);
      this.sirenStepInterval = null;
    }
  }

  public setSirenMode(mode: SirenMode) {
    this.sirenMode = mode;
    if (this.isSirenPlaying) {
      this.setSiren(true, mode);
    }
  }

  public setSiren(active: boolean, mode?: SirenMode) {
    if (mode) this.sirenMode = mode;
    this.isSirenPlaying = active;
    if (active) {
      this.userGesture();
    }
    this.clearSirenTimer();

    if (!this.ctx || !this.sirenGain || !this.sirenOscA || !this.sirenOscB || !this.sirenLfo || !this.sirenLfoGain) {
      return;
    }

    const now = this.ctx.currentTime;
    const target = active && !this.isMuted ? 0.25 : 0;
    this.sirenGain.gain.setTargetAtTime(target, now, 0.035);

    if (!active) return;

    if (this.sirenMode === 'wail') {
      // Classic long sweeping YPX siren
      this.sirenOscA.type = 'sawtooth';
      this.sirenOscB.type = 'triangle';
      this.sirenOscA.frequency.setTargetAtTime(840, now, 0.04);
      this.sirenOscB.frequency.setTargetAtTime(848, now, 0.04);
      this.sirenLfo.frequency.setTargetAtTime(0.62, now, 0.04);
      this.sirenLfoGain.gain.setTargetAtTime(340, now, 0.04);
    } else if (this.sirenMode === 'yelp') {
      // Rapid tactical city pursuit sweep
      this.sirenOscA.type = 'sawtooth';
      this.sirenOscB.type = 'square';
      this.sirenOscA.frequency.setTargetAtTime(920, now, 0.03);
      this.sirenOscB.frequency.setTargetAtTime(926, now, 0.03);
      this.sirenLfo.frequency.setTargetAtTime(4.2, now, 0.03);
      this.sirenLfoGain.gain.setTargetAtTime(310, now, 0.03);
    } else if (this.sirenMode === 'hilo') {
      // Two-tone YPX / Euro alternating Hi-Lo
      this.sirenLfoGain.gain.setTargetAtTime(0, now, 0.02);
      this.sirenOscA.type = 'sawtooth';
      this.sirenOscB.type = 'triangle';
      this.sirenHiLoToggle = false;
      this.sirenOscA.frequency.setValueAtTime(660, now);
      this.sirenOscB.frequency.setValueAtTime(664, now);
      this.sirenStepInterval = window.setInterval(() => {
        if (!this.ctx || !this.sirenOscA || !this.sirenOscB || !this.isSirenPlaying) return;
        this.sirenHiLoToggle = !this.sirenHiLoToggle;
        const f = this.sirenHiLoToggle ? 890 : 655;
        const t = this.ctx.currentTime;
        this.sirenOscA.frequency.setTargetAtTime(f, t, 0.012);
        this.sirenOscB.frequency.setTargetAtTime(f + 4, t, 0.012);
      }, 360);
    } else {
      // Kryakalka / Heavy Police Airhorn Phaser
      this.sirenLfoGain.gain.setTargetAtTime(65, now, 0.02);
      this.sirenLfo.frequency.setTargetAtTime(16, now, 0.02);
      this.sirenOscA.type = 'sawtooth';
      this.sirenOscB.type = 'sawtooth';
      this.sirenHiLoToggle = false;
      this.sirenStepInterval = window.setInterval(() => {
        if (!this.ctx || !this.sirenOscA || !this.sirenOscB || !this.sirenGain || !this.isSirenPlaying || this.isMuted) return;
        this.sirenHiLoToggle = !this.sirenHiLoToggle;
        const t = this.ctx.currentTime;
        this.sirenOscA.frequency.setTargetAtTime(this.sirenHiLoToggle ? 460 : 340, t, 0.015);
        this.sirenOscB.frequency.setTargetAtTime(this.sirenHiLoToggle ? 472 : 349, t, 0.015);
        this.sirenGain.gain.setTargetAtTime(this.sirenHiLoToggle ? 0.28 : 0.11, t, 0.02);
      }, 150);
    }
  }

  public playMigalkaChirp() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Authentic YPX Kryakalka + Radio Quindar Squelch
    [0, 0.13].forEach((offset) => {
      const oscA = this.ctx!.createOscillator();
      const oscB = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();
      oscA.type = 'sawtooth';
      oscB.type = 'sawtooth';
      oscA.frequency.setValueAtTime(420, now + offset);
      oscA.frequency.exponentialRampToValueAtTime(760, now + offset + 0.09);
      oscB.frequency.setValueAtTime(432, now + offset);
      oscB.frequency.exponentialRampToValueAtTime(775, now + offset + 0.09);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150, now + offset);
      filter.Q.setValueAtTime(1.4, now + offset);
      gain.gain.setValueAtTime(0.24, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);
      oscA.start(now + offset);
      oscB.start(now + offset);
      oscA.stop(now + offset + 0.13);
      oscB.stop(now + offset + 0.13);
    });
  }

  public playPoliceDispatchRadio() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Police walkie-talkie roger chirp + subtle static burst
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1750, now);
    osc.frequency.setValueAtTime(1320, now + 0.06);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);

    const len = Math.floor(this.ctx.sampleRate * 0.09);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
    const n = this.ctx.createBufferSource();
    n.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2200, now + 0.12);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.11, now + 0.12);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
    n.connect(bp);
    bp.connect(ng);
    ng.connect(this.masterGain);
    n.start(now + 0.12);
    n.stop(now + 0.22);
  }

  private initTurboAudio() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.turboOsc = this.ctx.createOscillator();
      this.turboOsc.type = 'sine';
      this.turboOsc.frequency.setValueAtTime(1200, now);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0, now);

      this.turboOsc.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboOsc.start();
    } catch {
      // Ignore
    }
  }

  private initSkidAudio() {
    if (!this.ctx || !this.masterGain) return;
    try {
      // Continuous noise loop for tire screech
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.oscNoise = this.ctx.createBufferSource();
      this.oscNoise.buffer = buffer;
      this.oscNoise.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.oscNoise.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.masterGain);

      this.oscNoise.start();
    } catch {
      // Ignore
    }
  }

  public updateEngine(
    speedKmh: number,
    isBoosting: boolean,
    isDrifting: boolean = false,
    throttle: number = 0
  ) {
    if (!this.ctx || this.isMuted) {
      this.stopEngine();
      return;
    }

    const absSpeed = Math.abs(speedKmh);
    const maxKmh = 320;
    const speedRatio = Math.max(0, Math.min(1, absSpeed / maxKmh));

    // Calculate simulated 5-speed automatic transmission gear
    let gear = 1;
    let gearRatio = speedRatio;
    if (absSpeed < 2) {
      gear = 0; // Neutral / Idle
      gearRatio = 0;
    } else if (speedRatio < 0.16) {
      gear = 1;
      gearRatio = speedRatio / 0.16;
    } else if (speedRatio < 0.34) {
      gear = 2;
      gearRatio = (speedRatio - 0.16) / 0.18;
    } else if (speedRatio < 0.56) {
      gear = 3;
      gearRatio = (speedRatio - 0.34) / 0.22;
    } else if (speedRatio < 0.80) {
      gear = 4;
      gearRatio = (speedRatio - 0.56) / 0.24;
    } else {
      gear = 5;
      // In 5th highway gear, smoothly cap gearRatio so top speed keeps a steady deep tone
      gearRatio = Math.min(0.86, (speedRatio - 0.80) / 0.24);
    }

    if (gear > 0 && gear !== this.currentGear && this.ctx.currentTime - this.lastGearShiftTime > 0.38) {
      if (gear > this.currentGear && throttle > 0.1) {
        this.playGearShift();
      }
      this.currentGear = gear;
      this.lastGearShiftTime = this.ctx.currentTime;
    } else if (gear === 0) {
      this.currentGear = 1;
    }

    const isGas = throttle > 0.15;
    const isBrake = throttle < -0.15;

    // Realistic RPM curve capped cleanly so full speed sounds smooth, not screechy
    const rawTargetRpm =
      absSpeed < 2 && !isGas
        ? 850
        : 1050 + gearRatio * 4850 + (isGas ? 650 : 0) + (isBoosting ? 450 : 0);
    const targetRpm = Math.min(isBoosting ? 7100 : 6650, rawTargetRpm);
    this.currentRpm += (targetRpm - this.currentRpm) * 0.14;

    const now = this.ctx.currentTime;
    // Smooth capped firing frequency so top-speed motor hum stays rich & natural
    const firingFreq = Math.min(172, Math.max(24, (this.currentRpm / 60) * 1.52));

    if (
      this.oscSub &&
      this.oscLow &&
      this.oscMid &&
      this.oscHigh &&
      this.engineFilter &&
      this.engineGain
    ) {
      this.oscSub.frequency.setTargetAtTime(firingFreq * 0.5, now, 0.05);
      this.oscLow.frequency.setTargetAtTime(firingFreq * 1.0, now, 0.05);
      this.oscMid.frequency.setTargetAtTime(firingFreq * 1.5, now, 0.05);
      this.oscHigh.frequency.setTargetAtTime(firingFreq * 2.0, now, 0.05);

      // Warm muffler lowpass filter prevents harsh high-frequency buzz at max speed
      const rpmNorm = Math.min(1, this.currentRpm / 7200);
      const rawCutoff =
        135 +
        rpmNorm * 410 +
        (isGas ? 120 : 0) +
        (isBoosting ? 110 : 0) -
        (isBrake ? 55 : 0);
      const cutoff = Math.min(760, Math.max(115, rawCutoff));
      this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.07);

      const rawLoadGain =
        absSpeed < 2 && !isGas
          ? 0.045
          : 0.068 + rpmNorm * 0.075 + (isGas ? 0.028 : 0) + (isBoosting ? 0.022 : 0);
      const loadGain = Math.min(0.185, rawLoadGain);
      this.engineGain.gain.setTargetAtTime(loadGain, now, 0.06);
    }

    // Gentle turbo spooling sound when boosting (no harsh piercing whistle)
    if (this.turboOsc && this.turboGain) {
      if (isBoosting) {
        this.turboOsc.frequency.setTargetAtTime(1350 + speedRatio * 950, now, 0.08);
        this.turboGain.gain.setTargetAtTime(0.032, now, 0.08);
      } else {
        this.turboGain.gain.setTargetAtTime(0, now, 0.12);
      }
    }

    // Tire drift / hard braking screech
    if (this.skidGain && this.skidFilter) {
      if ((isDrifting && absSpeed > 35) || (isBrake && absSpeed > 85)) {
        this.skidFilter.frequency.setTargetAtTime(950 + speedRatio * 750, now, 0.05);
        this.skidGain.gain.setTargetAtTime(0.11, now, 0.05);
        this.triggerHaptic(12);
      } else {
        this.skidGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }

    // Re-sync siren volume if active
    if (this.sirenGain && this.isSirenPlaying) {
      this.sirenGain.gain.setTargetAtTime(0.24, now, 0.06);
    }
  }

  public getGear(): number {
    return this.currentGear;
  }

  public getRpm(): number {
    return Math.round(this.currentRpm);
  }

  private playGearShift() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Quick exhaust pop & turbo blow-off valve "pssh"
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.15);

    this.triggerHaptic(25);
  }

  public playCollectCrystal() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);

      gain.gain.setValueAtTime(0.08, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.2);
    });

    this.triggerHaptic(20);
  }

  public playBoost() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastBoostAt < 0.42) return;
    this.lastBoostAt = now;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.38);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.45);

    this.triggerHaptic(35);
  }

  public playJump() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.22);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.28);

    this.triggerHaptic(25);
  }

  public playHorn() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastHornAt < 0.35) return;
    this.lastHornAt = now;

    // Rich European/Supercar dual-tone horn (F4 + A4 harmony)
    const hornFrequencies = [349.23, 440.0];

    hornFrequencies.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.setValueAtTime(0.22, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.36);
    });

    this.triggerHaptic([45, 25, 45]);
  }

  public playCrash() {
    this.playAccident();
  }

  public playAccident() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.7);

    // Deep sub-bass metal impact boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(24, now + 0.45);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + 0.55);

    this.triggerHaptic([120, 80, 220]);
  }

  public playShieldPickup() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const chords = [392.0, 493.88, 587.33, 783.99];
    chords.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.42);
    });

    this.triggerHaptic([30, 20, 30]);
  }

  public playDoorToggle() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
    this.triggerHaptic(25);
  }

  public playEatOrRest() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      gain.gain.setValueAtTime(0.11, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.28);
    });
    this.triggerHaptic([20, 30, 40]);
  }

  public playGaiWhistle() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2650, now);
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(28, now);
    lfoGain.gain.setValueAtTime(140, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.setValueAtTime(0.14, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.36);
    lfo.stop(now + 0.36);
  }

  public playTurnSignalTick(isOn: boolean) {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isOn ? 880 : 620, now);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playGunshot() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Punchy gunshot noise crack
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.22);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.045));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(0.7, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.22);

    // Sub kick
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(190, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    subG.gain.setValueAtTime(0.45, now);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    sub.connect(subG);
    subG.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.12);

    this.triggerHaptic(30);
  }

  public playSleepSound() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.14);
      gain.gain.setValueAtTime(0.09, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.55);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.6);
    });
  }

  public playSuccessBell() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.14, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.38);
    });
    this.triggerHaptic([35, 30, 50]);
  }

  public playViolationBeep() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.16].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now + offset);
      gain.gain.setValueAtTime(0.14, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.13);
    });
  }

  public playRepairSound() {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Pneumatic impact wrench bursts + hydraulic lift hiss
    [0, 0.14, 0.28, 0.44].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240 + idx * 45, now + offset);
      osc.frequency.exponentialRampToValueAtTime(110, now + offset + 0.09);
      gain.gain.setValueAtTime(0.16, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
    this.triggerHaptic([35, 30, 50]);
  }

  private playRadioTuningStatic() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.14);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  public setSubwooferLevel(level: 0 | 1 | 2) {
    this.subwooferLevel = level;
    if (level > 0) {
      this.userGesture();
      this.triggerSubwooferHit(52, level === 2 ? 0.24 : 0.14);
    }
  }

  public getBassPulse(): number {
    if (this.subwooferLevel === 0) return 0;
    const elapsed = performance.now() - this.lastBassPulseAt;
    if (elapsed > 260) return 0;
    const norm = Math.max(0, 1 - elapsed / 260);
    return norm * (this.subwooferLevel === 2 ? 1.0 : 0.65);
  }

  public playSuspensionBump(intensity: number = 1) {
    this.userGesture();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBumpAt < 220) return;
    this.lastBumpAt = nowMs;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105 + intensity * 25, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
    g.gain.setValueAtTime(Math.min(0.32, 0.16 * intensity), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
    this.triggerHaptic(22);
  }

  private triggerSubwooferHit(freq: number = 48, power: number = 0.18) {
    this.lastBassPulseAt = performance.now();
    if (!this.ctx || !this.masterGain || this.isMuted || this.subwooferLevel === 0) return;
    const now = this.ctx.currentTime;
    const boostMult = this.subwooferLevel === 2 ? 1.65 : 1.0;
    const subOsc = this.ctx.createOscillator();
    const subFilter = this.ctx.createBiquadFilter();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 1.4, now);
    subOsc.frequency.exponentialRampToValueAtTime(Math.max(32, freq * 0.78), now + 0.19);
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(130, now);
    subGain.gain.setValueAtTime(Math.min(0.36, power * boostMult), now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.26);
  }

  private playSnareOrClap(isClap: boolean = false) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * (isClap ? 0.11 : 0.08));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (isClap ? 0.04 : 0.025)));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.setValueAtTime(isClap ? 1850 : 2800, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(isClap ? 0.095 : 0.055, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isClap ? 0.11 : 0.08));
    noise.connect(hp);
    hp.connect(g);
    g.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  public setRadioStation(station: RadioStationId) {
    this.userGesture();
    this.radioStation = station;
    this.radioStep = 0;

    if (this.radioInterval !== null) {
      window.clearInterval(this.radioInterval);
      this.radioInterval = null;
    }

    if (station === 'off') {
      if (!this.isMusicMuted) this.startMusic();
      return;
    }

    // Mute background synthwave while Uzbek Music Player is playing
    this.stopMusic();
    this.playRadioTuningStatic();

    const tempoMs =
      station === 'uz_rap_konsta'
        ? 160 // 94 BPM trap/boom-bap flow
        : station === 'uz_rap_minor'
        ? 138 // 108 BPM club rap
        : station === 'uz_pop_shohruhxon'
        ? 122 // 122 BPM dance estrada
        : station === 'uz_milliy_yalla'
        ? 130 // 116 BPM dutor/doira milliy groove
        : 114; // 132 BPM Samarqand 808 bass phonk

    this.radioInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isMuted || this.radioStation === 'off') return;
      const now = this.ctx.currentTime;
      const step = this.radioStep++ % 16;

      if (this.radioStation === 'uz_rap_konsta') {
        // Konsta / Toshkent Flow: soulful minor keys + deep 808 + crisp hi-hats & clap
        const chords = [220, 220, 261.63, 293.66, 246.94, 220, 196.0, 174.61];
        const sub808 = [55, 55, 65.41, 73.42, 61.74, 55, 49.0, 43.65];
        if (step === 0 || step === 6 || step === 10) {
          this.playRadioKick(now);
          this.triggerSubwooferHit(sub808[(step / 2) % sub808.length], 0.18);
        }
        if (step === 4 || step === 12) this.playSnareOrClap(true);
        if (step % 2 === 1) this.playSnareOrClap(false);
        if (step % 2 === 0) {
          this.playRadioVoice(chords[(step / 2) % chords.length], 'triangle', 0.052, 0.24, 1450);
        }
      } else if (this.radioStation === 'uz_rap_minor') {
        // Minor / Shaxriyor Club Rap: hard 808 + synth brass riff
        const riff = [146.83, 0, 174.61, 196.0, 146.83, 220.0, 196.0, 174.61];
        if (step % 4 === 0 || step === 14) {
          this.playRadioKick(now);
          this.triggerSubwooferHit(step < 8 ? 55 : 49, 0.2);
        }
        if (step === 4 || step === 12) this.playSnareOrClap(true);
        if (step % 2 === 0) this.playSnareOrClap(false);
        const note = riff[step % riff.length];
        if (note > 0) this.playRadioVoice(note * 2, 'sawtooth', 0.044, 0.12, 1300);
      } else if (this.radioStation === 'uz_pop_shohruhxon') {
        // Shohruhxon / Rayhon Pop: upbeat Uzbek Hijaz-inspired pop dance
        const melody = [329.63, 349.23, 440, 415.3, 349.23, 329.63, 293.66, 329.63];
        if (step % 4 === 0) {
          this.playRadioKick(now);
          this.triggerSubwooferHit(58, 0.15);
        }
        if (step === 4 || step === 12) this.playSnareOrClap(true);
        if (step % 2 === 0) {
          this.playRadioVoice(melody[(step / 2) % melody.length], 'triangle', 0.055, 0.16, 2200);
        }
        this.playRadioVoice(164.81, 'sine', 0.03, 0.12, 700);
      } else if (this.radioStation === 'uz_milliy_yalla') {
        // Yalla / Sevara / To'yona: Uzbek dutor pluck + doira rhythm
        const dutor = [293.66, 329.63, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66];
        if (step === 0 || step === 3 || step === 8 || step === 11) {
          this.playRadioKick(now);
          this.triggerSubwooferHit(62, 0.14);
        }
        if (step === 4 || step === 10 || step === 14) this.playSnareOrClap(true);
        this.playRadioVoice(dutor[step % dutor.length], 'sawtooth', 0.04, 0.09, 1700);
        if (step % 4 === 0) {
          this.playRadioVoice(146.83, 'triangle', 0.045, 0.25, 800);
        }
      } else if (this.radioStation === 'uz_bass_phonk') {
        // Samarqand 808 Mega Sombufer Mix
        const cowbell = [587.3, 0, 587.3, 698.5, 587.3, 0, 523.25, 659.25];
        if (step % 4 === 0 || step === 10) {
          this.playRadioKick(now);
          this.triggerSubwooferHit(step < 8 ? 46 : 52, 0.25);
        }
        if (step === 4 || step === 12) this.playSnareOrClap(true);
        const cb = cowbell[step % cowbell.length];
        if (cb > 0) this.playRadioVoice(cb, 'square', 0.035, 0.08, 2200);
      }
    }, tempoMs);
  }

  private playRadioVoice(
    freq: number,
    type: OscillatorType,
    vol: number,
    dur: number,
    cutoff: number
  ) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private playRadioKick(now: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public startMusic() {
    this.userGesture();
    if (this.radioStation !== 'off') return;
    if (this.musicInterval !== null || this.isMusicMuted) return;

    // Upbeat racing synthwave arpeggio
    const bassNotes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 123.47];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.isMusicMuted || this.isMuted) return;

      const now = this.ctx.currentTime;
      const freq = bassNotes[this.bassIndex % bassNotes.length];
      this.bassIndex++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.16);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);
    }, 170);
  }

  public stopEngine() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.04);
    }
    if (this.turboGain) {
      this.turboGain.gain.setTargetAtTime(0, now, 0.04);
    }
    if (this.skidGain) {
      this.skidGain.gain.setTargetAtTime(0, now, 0.04);
    }
    if (this.sirenGain) {
      this.sirenGain.gain.setTargetAtTime(0, now, 0.04);
    }
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public stopRadio() {
    if (this.radioInterval !== null) {
      window.clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopEngine();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (muted && this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    } else if (!muted && this.musicInterval === null && this.radioStation === 'off') {
      this.startMusic();
    }
  }

  public triggerHaptic(pattern: number | number[]) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors
    }
  }

  public dispose() {
    this.clearSirenTimer();
    this.stopEngine();
    this.stopMusic();
    this.stopRadio();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Ignore
      }
      this.ctx = null;
    }
    this.masterGain = null;
    this.compressor = null;
    this.oscSub = null;
    this.oscLow = null;
    this.oscMid = null;
    this.oscHigh = null;
    this.oscNoise = null;
    this.engineShaper = null;
    this.engineResonance = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.sirenOscA = null;
    this.sirenOscB = null;
    this.sirenLfo = null;
    this.sirenLfoGain = null;
    this.sirenGain = null;
    this.turboOsc = null;
    this.turboGain = null;
    this.skidFilter = null;
    this.skidGain = null;
  }
}

export const soundEngine = new SoundEngine();
