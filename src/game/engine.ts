// Merge + physics engine for The Gilded Octave.
// Pure simulation: no DOM, no rendering. The play screen drives it each frame
// and reads `bodies` / `score` / `danger` to draw. Win = forge the Mega Diamond.
// Lose = a settled gem rests above the danger line for too long.

import { GEMS, MEGA, MEGA_TIER, TOP_TIER, MERGE_PTS, MEGA_BONUS, SPAWN_POOL } from './gems';

export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tier: number; // 0..9 gem, 11 mega
  mega?: boolean;
  born?: number; // gameTime when created (for a brief pop animation)
}

export interface Well {
  left: number;
  right: number;
  top: number;
  floor: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
}

const G = 2100; // gravity px/s^2
const REST = 0.18; // restitution
const FRICTION = 0.86;
const DANGER_LIMIT = 2.0; // seconds over the line before the curtain falls
const FAIL_MARGIN = 8; // px below well.top where the danger line sits

export type EngineEvent =
  | { type: 'merge'; tier: number; x: number; y: number }
  | { type: 'win'; x: number; y: number }
  | { type: 'lose' };

export class MergeEngine {
  bodies: Body[] = [];
  particles: Particle[] = [];
  score = 0;
  gameTime = 0;
  danger = 0; // 0..1 fill of the danger meter
  live = false; // accepting drops / advancing time
  current: number | null = null; // tier queued at the top
  next: number = 0;
  aimX = 0;
  finished: 'win' | 'lose' | null = null;

  private idc = 1;
  private canDrop = true;
  private dropTimer = 4.0;
  private rng: () => number;
  private onEvent: (e: EngineEvent) => void;

  well: Well = { left: 30, right: 400, top: 78, floor: 900 };
  dangerY = 86;
  spawnY = 46;

  constructor(onEvent: (e: EngineEvent) => void, rng: () => number = Math.random) {
    this.onEvent = onEvent;
    this.rng = rng;
  }

  layout(w: number, h: number) {
    this.well = { left: 30, right: w - 30, top: 78, floor: h - 26 };
    this.dangerY = this.well.top + FAIL_MARGIN;
    this.spawnY = 46;
    this.aimX = w / 2;
  }

  reset() {
    this.bodies = [];
    this.particles = [];
    this.idc = 1;
    this.score = 0;
    this.gameTime = 0;
    this.danger = 0;
    this.canDrop = true;
    this.dropTimer = 4.0;
    this.live = false;
    this.finished = null;
    this.current = this.pickTier();
    this.next = this.pickTier();
  }

  start() {
    this.live = true;
  }

  /** Grant one more life: clear the failure, drain the danger meter, lift the
   *  threatening gems a touch so the player gets a real second chance. */
  revive() {
    this.finished = null;
    this.danger = 0;
    this.live = true;
    for (const o of this.bodies) {
      if (o.y - this.radOf(o) < this.dangerY + 30) o.y += 26;
    }
  }

  private pickTier(): number {
    return SPAWN_POOL[Math.floor(this.rng() * SPAWN_POOL.length)];
  }

  // ---- difficulty: the accelerando ----
  // Calm 15s opening at 4.0s, then the interval shortens 15% every 12s down to a 1.1s floor.
  intervalAt(t: number): number {
    return t < 15 ? 4.0 : Math.max(1.1, 4.0 * Math.pow(0.85, Math.floor((t - 15) / 12) + 1));
  }
  tempoName(iv: number): string {
    return iv >= 3.5 ? 'Adagio' : iv >= 2.6 ? 'Andante' : iv >= 1.9 ? 'Allegro' : iv >= 1.4 ? 'Vivace' : 'Presto';
  }

  radOf(o: { tier: number }): number {
    return o.tier >= MEGA_TIER ? MEGA.r : GEMS[o.tier].r;
  }

  /** Drop the queued gem at the current aim column. */
  drop(): boolean {
    if (!this.live || !this.canDrop || this.current == null) return false;
    const g = GEMS[this.current];
    const x = Math.max(this.well.left + g.r, Math.min(this.well.right - g.r, this.aimX));
    this.bodies.push({ id: this.idc++, x, y: this.spawnY, vx: 0, vy: 120, tier: this.current, born: this.gameTime });
    this.current = null;
    this.canDrop = false;
    this.dropTimer = this.intervalAt(this.gameTime);
    setTimeout(() => {
      this.canDrop = true;
      if (this.live) this.queueNext();
    }, 360);
    return true;
  }

  private queueNext() {
    if (this.current == null) {
      this.current = this.next;
      this.next = this.pickTier();
    }
  }

  step(dt: number) {
    if (dt > 0.05) dt = 0.05;
    if (this.live) {
      this.gameTime += dt;
      this.dropTimer -= dt;
      if (this.dropTimer <= 0 && this.canDrop && this.current != null) this.drop();
    }
    this.physics(dt);
    if (this.live) this.checkFail(dt);
  }

  private physics(dt: number) {
    const b = this.bodies;
    const W = this.well;
    for (const o of b) {
      o.vy += G * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx *= 0.995;
    }
    // constraint relaxation: walls, floor, gem-gem separation
    for (let it = 0; it < 6; it++) {
      for (const o of b) {
        const r = this.radOf(o);
        if (o.x - r < W.left) {
          o.x = W.left + r;
          o.vx = Math.abs(o.vx) * REST;
        }
        if (o.x + r > W.right) {
          o.x = W.right - r;
          o.vx = -Math.abs(o.vx) * REST;
        }
        if (o.y + r > W.floor) {
          o.y = W.floor - r;
          o.vy = -Math.abs(o.vy) * REST;
          o.vx *= FRICTION;
        }
      }
      for (let i = 0; i < b.length; i++) {
        for (let j = i + 1; j < b.length; j++) {
          const a = b[i];
          const c = b[j];
          const ra = this.radOf(a);
          const rc = this.radOf(c);
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = ra + rc;
          if (d < min && d > 0.0001) {
            const ov = (min - d) / 2;
            const nx = dx / d;
            const ny = dy / d;
            a.x -= nx * ov;
            a.y -= ny * ov;
            c.x += nx * ov;
            c.y += ny * ov;
            const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
            if (rv < 0) {
              const imp = rv * REST;
              a.vx += imp * nx;
              a.vy += imp * ny;
              c.vx -= imp * nx;
              c.vy -= imp * ny;
            }
          }
        }
      }
    }
    this.resolveMerges();
    for (const p of this.particles) {
      p.vy += 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private resolveMerges() {
    const b = this.bodies;
    const consumed = new Set<number>();
    const born: Body[] = [];
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) {
        const a = b[i];
        const c = b[j];
        if (consumed.has(a.id) || consumed.has(c.id)) continue;
        if (a.tier !== c.tier || a.tier > TOP_TIER) continue;
        const d = Math.hypot(c.x - a.x, c.y - a.y);
        if (d < (this.radOf(a) + this.radOf(c)) * 0.92) {
          if (a.tier === TOP_TIER) {
            this.makeMega((a.x + c.x) / 2, (a.y + c.y) / 2, a.id, c.id);
            return;
          }
          consumed.add(a.id);
          consumed.add(c.id);
          const nt = a.tier + 1;
          const mx = (a.x + c.x) / 2;
          const my = (a.y + c.y) / 2;
          born.push({ id: this.idc++, x: mx, y: my, vx: 0, vy: -160, tier: nt, born: this.gameTime });
          this.score += MERGE_PTS[nt + 1] || 0;
          this.burst(mx, my, nt);
          this.onEvent({ type: 'merge', tier: nt, x: mx, y: my });
        }
      }
    }
    if (consumed.size) {
      this.bodies = b.filter((o) => !consumed.has(o.id)).concat(born);
    }
  }

  private makeMega(x: number, y: number, id1: number, id2: number) {
    this.bodies = this.bodies.filter((o) => o.id !== id1 && o.id !== id2);
    const px = Math.max(this.well.left + MEGA.r, Math.min(this.well.right - MEGA.r, x));
    this.bodies.push({ id: this.idc++, x: px, y, vx: 0, vy: -120, tier: MEGA_TIER, mega: true, born: this.gameTime });
    this.score += MEGA_BONUS;
    this.burst(x, y, TOP_TIER);
    this.live = false;
    this.finished = 'win';
    this.onEvent({ type: 'win', x, y });
  }

  private checkFail(dt: number) {
    let danger = false;
    for (const o of this.bodies) {
      const r = this.radOf(o);
      if (o.y - r < this.dangerY && Math.abs(o.vy) < 26 && o.y > this.spawnY + 10) {
        danger = true;
        break;
      }
    }
    // accumulate when overflowing, drain faster when safe
    this.dangerTime = danger ? this.dangerTime + dt : Math.max(0, this.dangerTime - dt * 1.6);
    this.danger = Math.min(1, this.dangerTime / DANGER_LIMIT);
    if (this.dangerTime >= DANGER_LIMIT) {
      this.live = false;
      this.finished = 'lose';
      this.onEvent({ type: 'lose' });
    }
  }
  private dangerTime = 0;

  private burst(x: number, y: number, tier: number) {
    const col = GEMS[Math.min(tier, TOP_TIER)].light;
    for (let i = 0; i < 14; i++) {
      const a = this.rng() * 6.28;
      const s = 80 + this.rng() * 220;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.5 + this.rng() * 0.4, col });
    }
  }

  fmtScore(): string {
    return Math.round(this.score).toLocaleString('en-US');
  }

  /** Build a settled, representative board for capture / press screenshots.
   *  Not used in normal play — only when the app is opened with ?screen=… */
  buildDemo(kind: 'play' | 'win' | 'over') {
    this.bodies = [];
    this.particles = [];
    this.idc = 1;
    this.live = false;
    const W = this.well;
    const span = W.right - W.left;
    const tierSet =
      kind === 'over'
        ? [6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 2, 1, 3, 0, 1, 2, 0, 1, 0]
        : [6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 1];
    let yy = this.spawnY + 44;
    for (const t of tierSet) {
      const g = GEMS[t];
      const x = W.left + g.r + this.rng() * (span - 2 * g.r);
      this.bodies.push({ id: this.idc++, x, y: yy, vx: (this.rng() - 0.5) * 40, vy: 0, tier: t });
      yy += kind === 'over' ? 24 : 30;
      if (yy > W.floor - 140) yy = this.spawnY + 44;
    }
    for (let s = 0; s < 280; s++) this.settleStep(1 / 60);
    if (kind === 'win') {
      this.bodies = this.bodies.slice(0, 7);
      for (let s = 0; s < 120; s++) this.settleStep(1 / 60);
      this.bodies.push({ id: this.idc++, x: (W.left + W.right) / 2, y: W.floor - MEGA.r, vx: 0, vy: 0, tier: MEGA_TIER, mega: true });
      for (let s = 0; s < 90; s++) this.settleStep(1 / 60);
    }
    this.score = kind === 'win' ? 4820 : kind === 'over' ? 3160 : 1240;
    this.gameTime = kind === 'over' ? 92 : kind === 'win' ? 70 : 34;
    this.current = 2;
    this.danger = kind === 'over' ? 0.88 : kind === 'win' ? 0 : 0.34;
    this.aimX = (W.left + W.right) / 2;
  }

  private settleStep(dt: number) {
    const b = this.bodies;
    const W = this.well;
    for (const o of b) {
      o.vy += G * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.vx *= 0.995;
    }
    for (let it = 0; it < 6; it++) {
      for (const o of b) {
        const r = this.radOf(o);
        if (o.x - r < W.left) {
          o.x = W.left + r;
          o.vx = Math.abs(o.vx) * REST;
        }
        if (o.x + r > W.right) {
          o.x = W.right - r;
          o.vx = -Math.abs(o.vx) * REST;
        }
        if (o.y + r > W.floor) {
          o.y = W.floor - r;
          o.vy = -Math.abs(o.vy) * REST;
          o.vx *= FRICTION;
        }
      }
      for (let i = 0; i < b.length; i++) {
        for (let j = i + 1; j < b.length; j++) {
          const a = b[i];
          const c = b[j];
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d = Math.hypot(dx, dy);
          const min = this.radOf(a) + this.radOf(c);
          if (d < min && d > 0.0001) {
            const ov = (min - d) / 2;
            const nx = dx / d;
            const ny = dy / d;
            a.x -= nx * ov;
            a.y -= ny * ov;
            c.x += nx * ov;
            c.y += ny * ov;
            const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
            if (rv < 0) {
              const imp = rv * REST;
              a.vx += imp * nx;
              a.vy += imp * ny;
              c.vx -= imp * nx;
              c.vy -= imp * ny;
            }
          }
        }
      }
    }
  }
}
