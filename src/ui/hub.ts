import type { AppCtx } from '../main';
import { Scores, Wallet } from '../services/storage';
import { Ads } from '../services/ads';

export function renderHub(root: HTMLElement, ctx: AppCtx): () => void {
  const el = document.createElement('div');
  el.className = 'screen hub';
  el.innerHTML = `
    <div class="hub-head">
      <div class="kicker">Wiener Edition</div>
      <div class="rule"></div>
      <div class="hub-title">The Gilded<br>Octave</div>
      <div class="hub-sub">A MERGE OPERA &middot; VIENNA</div>
    </div>

    <button class="stage-btn" data-act="play">
      <div class="shimmer"></div>
      <div class="lbl">TONIGHT'S PERFORMANCE</div>
      <div class="big">&#9654;&nbsp; Take the Stage</div>
      <div class="desc">Drop jewels, merge the scale, forge the Mega&nbsp;Diamond before the well overflows.</div>
    </button>

    <div class="stat-row">
      <div class="stat">
        <div class="k">BEST SCORE</div>
        <div class="v" data-best>${Scores.best().toLocaleString('en-US')}</div>
      </div>
      <div class="stat">
        <div class="k">DUCATS</div>
        <div class="v" data-ducats>${Wallet.balance().toLocaleString('en-US')}</div>
      </div>
    </div>

    <button class="hub-menu-item" data-act="shop">
      <span class="num">&#9733;</span>
      <span style="flex:1;"><span class="t">The Box Office</span><br><span class="s">Ducat packs to fund your encores</span></span>
      <span class="chev">&rsaquo;</span>
    </button>
    <button class="hub-menu-item" data-act="mute">
      <span class="num" data-muteicon>${ctx.music.muted ? '&#128263;' : '&#9834;'}</span>
      <span style="flex:1;"><span class="t">Orchestra</span><br><span class="s" data-mutetxt>${ctx.music.muted ? 'Silent' : 'Adaptive score on'}</span></span>
      <span class="chev">&rsaquo;</span>
    </button>

    <div class="ad-host"></div>

    <div style="text-align:center; padding:6px 0 40px; font-style:italic; color:#7a5f33; font-size:13px;">
      Single launch mode &middot; iPhone &middot; Capacitor + HTML5 canvas
    </div>
  `;
  root.appendChild(el);

  Ads.mountBanner(el.querySelector<HTMLElement>('.ad-host')!);

  el.querySelector('[data-act="play"]')!.addEventListener('click', () => {
    ctx.music.ensure();
    ctx.music.resume();
    ctx.go('play');
  });
  el.querySelector('[data-act="shop"]')!.addEventListener('click', () => ctx.go('shop'));
  el.querySelector('[data-act="mute"]')!.addEventListener('click', () => {
    ctx.music.ensure();
    ctx.music.setMuted(!ctx.music.muted);
    el.querySelector('[data-muteicon]')!.innerHTML = ctx.music.muted ? '&#128263;' : '&#9834;';
    el.querySelector('[data-mutetxt]')!.textContent = ctx.music.muted ? 'Silent' : 'Adaptive score on';
  });

  return () => {};
}
