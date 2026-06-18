import './style.css';
import { Capacitor } from '@capacitor/core';
import { renderHub } from './ui/hub';
import { renderPlay } from './ui/play';
import { renderShop } from './ui/shop';
import { AdaptiveMusic } from './game/audio';

export type Route = 'hub' | 'play' | 'shop';

export interface AppCtx {
  go(route: Route): void;
  music: AdaptiveMusic;
  toast(msg: string): void;
}

const root = document.getElementById('app')!;
let cleanup: (() => void) | null = null;

const music = new AdaptiveMusic();

function toast(msg: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

const ctx: AppCtx = { go, music, toast };

function go(route: Route) {
  cleanup?.();
  cleanup = null;
  root.innerHTML = '';
  if (route === 'hub') cleanup = renderHub(root, ctx);
  else if (route === 'play') cleanup = renderPlay(root, ctx);
  else if (route === 'shop') cleanup = renderShop(root, ctx);
}

// hide the iOS status bar text over our dark stage where available
if (Capacitor.isNativePlatform()) {
  import('@capacitor/status-bar')
    .then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    })
    .catch(() => {});
}

// Honor ?screen= for capture / deep-link demo states.
const param = new URLSearchParams(location.search).get('screen');
if (param === 'play' || param === 'intro' || param === 'win' || param === 'over') go('play');
else if (param === 'shop') go('shop');
else go('hub');
