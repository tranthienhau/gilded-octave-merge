import type { AppCtx } from '../main';
import { MergeEngine } from '../game/engine';
import type { EngineEvent } from '../game/engine';
import { Renderer } from '../game/renderer';
import { Scores, Wallet } from '../services/storage';
import { Ads } from '../services/ads';
import { Buzz } from '../services/haptics';

const REVIVE_COST = 10; // ducats per paid revive

export function renderPlay(root: HTMLElement, ctx: AppCtx): () => void {
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="play-hud">
      <button class="iconbtn" data-act="back">&lsaquo;</button>
      <div style="flex:1;">
        <div class="hud-k">SCORE</div>
        <div class="hud-score" data-score>0</div>
      </div>
      <div style="text-align:center;">
        <div class="hud-k">TEMPO</div>
        <div class="hud-tempo" data-tempo>Adagio</div>
        <div class="hud-tempo-sub" data-tempo-sub>every 4.0s</div>
      </div>
      <button class="iconbtn" data-act="mute">${ctx.music.muted ? '&#128263;' : '&#9834;'}</button>
    </div>

    <div class="danger-meter"><div class="danger-fill" data-danger></div></div>

    <div class="stage">
      <canvas data-canvas></canvas>
      <div class="overlay intro" data-intro hidden>
        <div class="iris"></div>
        <div class="beam"></div>
        <div class="words" style="text-align:center;">
          <div class="ov-tag">THE HOUSE LIGHTS DIM</div>
          <div style="font-family:var(--display); font-style:italic; font-size:22px; color:var(--cream); margin-top:8px;">Maestro, when you're ready&hellip;</div>
        </div>
      </div>
      <div data-overlay></div>
    </div>
  `;
  root.appendChild(el);

  const canvas = el.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const scoreEl = el.querySelector<HTMLElement>('[data-score]')!;
  const tempoEl = el.querySelector<HTMLElement>('[data-tempo]')!;
  const tempoSub = el.querySelector<HTMLElement>('[data-tempo-sub]')!;
  const dangerEl = el.querySelector<HTMLElement>('[data-danger]')!;
  const introEl = el.querySelector<HTMLElement>('[data-intro]')!;
  const overlayHost = el.querySelector<HTMLElement>('[data-overlay]')!;

  const renderer = new Renderer(canvas);
  let raf = 0;
  let last = performance.now();
  let running = true;
  let frozen = false; // demo tableau: draw but don't advance physics
  let revivedByAd = false;

  const onEvent = (e: EngineEvent) => {
    if (e.type === 'merge') {
      ctx.music.playNote(e.tier);
      Buzz.merge();
    } else if (e.type === 'win') {
      ctx.music.playWinChord();
      Buzz.win();
      finish('win');
    } else if (e.type === 'lose') {
      ctx.music.playLoseSting();
      Buzz.lose();
      finish('lose');
    }
  };

  const engine = new MergeEngine(onEvent);

  function layout() {
    const { w, h } = renderer.resize();
    engine.layout(w, h);
  }
  layout();
  const onResize = () => layout();
  window.addEventListener('resize', onResize);

  // input: aim + drop
  const px = (clientX: number) => {
    const r = canvas.getBoundingClientRect();
    return clientX - r.left;
  };
  canvas.addEventListener('pointermove', (ev) => {
    engine.aimX = px(ev.clientX);
  });
  canvas.addEventListener('pointerdown', (ev) => {
    ctx.music.ensure();
    ctx.music.resume();
    engine.aimX = px(ev.clientX);
    if (engine.drop()) Buzz.tap();
  });

  // ---- demo mode (capture / press shots): ?screen=play|intro|win|over ----
  const demo = new URLSearchParams(location.search).get('screen');
  let introTimer = 0;

  function beginRun() {
    engine.reset();
    introEl.hidden = false;
    clearTimeout(introTimer);
    introTimer = window.setTimeout(() => {
      introEl.hidden = true;
      engine.start();
    }, 1700);
  }

  if (demo === 'play' || demo === 'win' || demo === 'over') {
    engine.reset();
    engine.buildDemo(demo);
    engine.live = false;
    frozen = true;
    if (demo === 'win') showWin(false);
    if (demo === 'over') showOver(false);
  } else if (demo === 'intro') {
    engine.reset();
    introEl.hidden = false;
  } else {
    beginRun();
  }

  function loop(t: number) {
    if (!running) return;
    const dt = (t - last) / 1000;
    last = t;
    if (!frozen) engine.step(dt);
    renderer.draw(engine);
    // hud
    const iv = engine.intervalAt(engine.gameTime);
    scoreEl.textContent = engine.fmtScore();
    tempoEl.textContent = engine.tempoName(iv);
    tempoSub.textContent = 'every ' + iv.toFixed(1) + 's';
    dangerEl.style.width = Math.round(engine.danger * 100) + '%';
    ctx.music.setIntensity(engine.bodies.length, engine.danger);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  function clearOverlay() {
    overlayHost.innerHTML = '';
  }

  function finish(kind: 'win' | 'lose') {
    const isRecord = Scores.submit(engine.score);
    if (kind === 'win') showWin(isRecord);
    else showOver(isRecord);
  }

  function showWin(isRecord: boolean) {
    overlayHost.innerHTML = `
      <div class="overlay ov-win">
        <div class="mega-orb"></div>
        <div class="ov-tag" style="margin-top:22px;">BRAVISSIMO</div>
        <div class="ov-title" style="font-size:34px;">The Mega Diamond</div>
        <div class="ov-desc">You forged the end-goal jewel. The opera reaches its triumphant chord.</div>
        <div class="ov-score">Final Score ${engine.fmtScore()}${isRecord ? ' &middot; <span style="color:var(--gold-bright)">New Best!</span>' : ''}</div>
        <div class="ov-actions">
          <button class="btn btn-gold" data-act="encore">Encore &middot; Play Again</button>
          <button class="btn btn-ghost" data-act="hub">Return to the Programme</button>
        </div>
      </div>`;
    wireEndButtons();
  }

  function showOver(isRecord: boolean) {
    const ducats = Wallet.balance();
    const canAd = !revivedByAd;
    const canDucat = ducats >= REVIVE_COST;
    overlayHost.innerHTML = `
      <div class="overlay ov-over">
        <div class="curtain"></div>
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <div class="ov-tag">THE CURTAIN FALLS</div>
          <div class="ov-title" style="font-size:40px;">Fin</div>
          <div class="ov-desc" style="color:#f0dcb4;">The well overflowed past the danger line.</div>
          <div class="ov-score">Score ${engine.fmtScore()}${isRecord ? ' &middot; <span style="color:var(--gold-bright)">New Best!</span>' : ''}</div>
          <div class="ov-actions">
            ${canAd ? `<button class="btn btn-revive" data-act="ad-revive">Watch Ad &middot; +1 Life <small>free</small></button>` : ''}
            ${canDucat ? `<button class="btn btn-gold" data-act="ducat-revive">Revive <small>${REVIVE_COST} ducats</small></button>` : ''}
            <button class="btn btn-ghost" data-act="encore">Encore &middot; Restart</button>
            <button class="btn btn-ghost" data-act="hub">Return to the Programme</button>
          </div>
        </div>
      </div>`;
    wireEndButtons();
  }

  function doRevive() {
    clearOverlay();
    engine.revive();
  }

  function wireEndButtons() {
    overlayHost.querySelector('[data-act="encore"]')?.addEventListener('click', restart);
    overlayHost.querySelector('[data-act="hub"]')?.addEventListener('click', () => ctx.go('hub'));
    overlayHost.querySelector('[data-act="ad-revive"]')?.addEventListener('click', async () => {
      const rewarded = await Ads.showRewarded();
      if (rewarded) {
        revivedByAd = true;
        ctx.toast('+1 Life granted');
        doRevive();
      }
    });
    overlayHost.querySelector('[data-act="ducat-revive"]')?.addEventListener('click', () => {
      if (Wallet.spend(REVIVE_COST)) {
        ctx.toast(`Revived &middot; ${Wallet.balance()} ducats left`.replace('&middot;', '·'));
        doRevive();
      } else {
        ctx.toast('Not enough ducats');
      }
    });
  }

  function restart() {
    clearOverlay();
    revivedByAd = false;
    beginRun();
  }

  el.querySelector('[data-act="back"]')!.addEventListener('click', () => ctx.go('hub'));
  el.querySelector('[data-act="mute"]')!.addEventListener('click', (ev) => {
    ctx.music.ensure();
    ctx.music.setMuted(!ctx.music.muted);
    (ev.currentTarget as HTMLElement).innerHTML = ctx.music.muted ? '&#128263;' : '&#9834;';
  });

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(introTimer);
    window.removeEventListener('resize', onResize);
  };
}
