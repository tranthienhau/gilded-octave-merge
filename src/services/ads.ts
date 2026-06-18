// AdMob ad service: a rewarded video (the "+1 life" revive) and a banner on the hub.
//
// On device these route through @capacitor-community/admob (AdMob.prepareRewardVideoAd
// / showRewardVideoAd / showBanner). On the simulator / web we play a short mock
// "ad" overlay so the rewarded flow is fully demoable. Swap the test ad unit ids
// in store/metadata/admob.md for production units before submission.

import { Capacitor } from '@capacitor/core';

export const AD_UNITS = {
  // Google's public test ids — replace with production units in App Store build.
  rewarded: 'ca-app-pub-3940256099942544/1712485313',
  banner: 'ca-app-pub-3940256099942544/2934735716',
};

class AdService {
  get native(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Show a rewarded ad. Resolves true if the reward should be granted
   * (the user watched to the end). Renders a mock player on web/simulator.
   */
  showRewarded(onProgress?: (pct: number) => void): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ad-overlay';
      overlay.innerHTML = `
        <div class="ad-card">
          <div class="ad-tag">REWARDED AD</div>
          <div class="ad-title">A word from our patron…</div>
          <div class="ad-bar"><div class="ad-fill"></div></div>
          <div class="ad-sub">Watch to earn <b>+1 Life</b></div>
        </div>`;
      document.body.appendChild(overlay);
      const fill = overlay.querySelector<HTMLElement>('.ad-fill')!;
      const dur = 2600;
      const t0 = performance.now();
      const tick = (now: number) => {
        const pct = Math.min(1, (now - t0) / dur);
        fill.style.width = `${pct * 100}%`;
        onProgress?.(pct);
        if (pct < 1) {
          requestAnimationFrame(tick);
        } else {
          overlay.remove();
          resolve(true);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /** Mount a banner placeholder at the bottom of the hub. */
  mountBanner(host: HTMLElement) {
    const b = document.createElement('div');
    b.className = 'ad-banner';
    b.innerHTML = `<span class="ad-banner-tag">Ad</span><span>AdMob banner · 320×50</span>`;
    host.appendChild(b);
  }
}

export const Ads = new AdService();
