// Adaptive orchestral score, synthesised with the Web Audio API (no asset files).
// Three layers fade in with on-board intensity:
//   - a low string pad (always present once playing)
//   - a mid "viola" layer that swells as the well fills
//   - a high shimmer that only appears under real pressure
// Each merge fires a per-tier note sample; the Mega Diamond resolves a major chord.

import { GEMS } from './gems';

export class AdaptiveMusic {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private padLow!: GainNode;
  private padMid!: GainNode;
  private padHi!: GainNode;
  muted = false;
  private started = false;

  /** Must be called from a user gesture (iOS autoplay policy). */
  ensure() {
    if (this.ctx || this.muted) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);

    this.padLow = this.layer([130.81, 196.0], 'sine', 0); // C3 + G3 drone
    this.padMid = this.layer([261.63, 329.63], 'triangle', 0); // C4 + E4 violas
    this.padHi = this.layer([523.25, 659.25], 'sine', 0); // C5 + E5 shimmer
  }

  private layer(freqs: number[], type: OscillatorType, gain: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.value = gain;
    g.connect(this.master);
    for (const f of freqs) {
      const o = this.ctx!.createOscillator();
      o.type = type;
      o.frequency.value = f;
      // gentle detune chorus for body
      const det = this.ctx!.createOscillator();
      det.type = type;
      det.frequency.value = f * 1.005;
      o.connect(g);
      det.connect(g);
      o.start();
      det.start();
    }
    return g;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.started = true;
  }

  /** Drive the layering from current board intensity (0..1-ish). */
  setIntensity(bodies: number, danger: number) {
    if (!this.ctx || this.muted || !this.started) return;
    const t = this.ctx.currentTime;
    const i = Math.min(1, bodies / 18);
    this.padLow.gain.linearRampToValueAtTime(0.05 + i * 0.05, t + 0.4);
    this.padMid.gain.linearRampToValueAtTime(Math.min(0.09, i * 0.12), t + 0.4);
    this.padHi.gain.linearRampToValueAtTime(Math.min(0.07, danger * 0.1), t + 0.3);
  }

  /** Per-merge note sample for the resulting tier. */
  playNote(tier: number) {
    if (!this.ctx || this.muted) return;
    const g = GEMS[Math.min(tier, GEMS.length - 1)];
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = g.freq;
    o.connect(env);
    env.connect(this.master);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.start(t);
    o.stop(t + 0.95);
  }

  /** Triumphant resolved chord for the Mega Diamond win. */
  playWinChord() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const e = this.ctx!.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(e);
      e.connect(this.master);
      const st = t + i * 0.07;
      e.gain.setValueAtTime(0.0001, st);
      e.gain.exponentialRampToValueAtTime(0.3, st + 0.03);
      e.gain.exponentialRampToValueAtTime(0.0001, st + 1.6);
      o.start(st);
      o.stop(st + 1.7);
    });
  }

  /** Falling minor cadence when the curtain drops. */
  playLoseSting() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [392.0, 311.13, 261.63].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const e = this.ctx!.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(e);
      e.connect(this.master);
      const st = t + i * 0.16;
      e.gain.setValueAtTime(0.0001, st);
      e.gain.exponentialRampToValueAtTime(0.22, st + 0.04);
      e.gain.exponentialRampToValueAtTime(0.0001, st + 0.9);
      o.start(st);
      o.stop(st + 0.95);
    });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.6, this.ctx.currentTime + 0.1);
    }
  }

  close() {
    if (this.ctx) this.ctx.close();
    this.ctx = null;
  }
}
