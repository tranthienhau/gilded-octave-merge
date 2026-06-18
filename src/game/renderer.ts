// Canvas renderer for the merge stage: the opera "well", proscenium pillars,
// danger line, faceted gems, the aim guide, and merge particles.

import { GEMS, MEGA, MEGA_TIER } from './gems';
import type { Body, MergeEngine } from './engine';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  W = 0;
  H = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(): { w: number; h: number } {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 398;
    const h = rect.height || 620;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w;
    this.H = h;
    return { w, h };
  }

  draw(e: MergeEngine) {
    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;
    const wl = e.well;
    ctx.clearRect(0, 0, W, H);

    // warm stage glow
    const bg = ctx.createRadialGradient(W / 2, wl.top + 40, 20, W / 2, H * 0.55, H * 0.8);
    bg.addColorStop(0, 'rgba(90,30,24,0.5)');
    bg.addColorStop(1, 'rgba(10,4,6,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // proscenium pillars
    ctx.fillStyle = 'rgba(201,161,74,0.16)';
    ctx.fillRect(wl.left - 14, wl.top - 6, 8, wl.floor - wl.top + 12);
    ctx.fillRect(wl.right + 6, wl.top - 6, 8, wl.floor - wl.top + 12);

    // stage floor
    ctx.strokeStyle = 'rgba(201,161,74,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wl.left - 10, wl.floor + 1);
    ctx.lineTo(wl.right + 10, wl.floor + 1);
    ctx.stroke();

    // danger line (reddens as the meter fills)
    ctx.strokeStyle = `rgba(214,69,58,${0.3 + e.danger * 0.6})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(wl.left, e.dangerY);
    ctx.lineTo(wl.right, e.dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const o of e.bodies) this.drawGem(o, e.gameTime);

    for (const p of e.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // aim guide + queued gem
    if (e.live && e.current != null) {
      const g = GEMS[e.current];
      const x = Math.max(wl.left + g.r, Math.min(wl.right - g.r, e.aimX || W / 2));
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = 'rgba(240,217,138,0.6)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, e.spawnY + g.r);
      ctx.lineTo(x, wl.floor);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      this.drawGem({ id: -1, x, y: e.spawnY, vx: 0, vy: 0, tier: e.current }, e.gameTime);
    }
  }

  private drawGem(o: Body, now: number) {
    const ctx = this.ctx;
    const mega = o.tier >= MEGA_TIER;
    const gem = mega ? null : GEMS[o.tier];
    const r = mega ? MEGA.r : gem!.r;
    const x = o.x;
    const y = o.y;
    // brief pop on spawn/merge
    let scale = 1;
    if (o.born != null) {
      const age = now - o.born;
      if (age >= 0 && age < 0.22) scale = 1 + Math.sin((age / 0.22) * Math.PI) * 0.16;
    }
    ctx.save();
    if (scale !== 1) {
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
    }
    if (o.tier >= 7 || mega) {
      ctx.shadowColor = mega ? 'rgba(180,210,255,0.9)' : gem!.light;
      ctx.shadowBlur = mega ? 34 : 14;
    }
    const grd = ctx.createRadialGradient(x - r * 0.32, y - r * 0.4, r * 0.1, x, y, r);
    if (mega) {
      grd.addColorStop(0, '#ffffff');
      grd.addColorStop(0.4, '#dcebff');
      grd.addColorStop(0.72, '#9bc0ec');
      grd.addColorStop(1, '#5c87c4');
    } else {
      grd.addColorStop(0, gem!.light);
      grd.addColorStop(0.55, gem!.base);
      grd.addColorStop(1, gem!.dark);
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.28);
    ctx.fill();
    ctx.shadowBlur = 0;

    // facets
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    const facets = Math.min(8, 4 + Math.floor(r / 14));
    ctx.beginPath();
    for (let i = 0; i < facets; i++) {
      const a = (i / facets) * 6.28;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    const ir = r * 0.5;
    ctx.moveTo(x + ir, y);
    for (let i = 1; i <= facets; i++) {
      const a = (i / facets) * 6.28;
      ctx.lineTo(x + Math.cos(a) * ir, y + Math.sin(a) * ir);
    }
    ctx.stroke();

    // gold rim
    ctx.strokeStyle = 'rgba(201,161,74,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y, r - 0.7, 0, 6.28);
    ctx.stroke();

    // specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.34, y - r * 0.4, r * 0.18, r * 0.1, -0.6, 0, 6.28);
    ctx.fill();

    // note / star label
    if (!mega && r >= 18) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = Math.max(11, r * 0.5) + "px 'Marcellus', serif";
      ctx.fillText(gem!.note, x, y + 1);
    } else if (mega) {
      ctx.fillStyle = 'rgba(60,90,150,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "24px 'Marcellus', serif";
      ctx.fillText('★', x, y + 2);
    }
    ctx.restore();
  }
}
