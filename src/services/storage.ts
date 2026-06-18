// Local persistence: best score and the soft-currency wallet ("Ducats").
// localStorage works the same inside the Capacitor WKWebView, so no native
// plugin is needed for this.

const K_BEST = 'go.bestScore';
const K_DUCATS = 'go.ducats';

function read(key: string, fallback: number): number {
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const Scores = {
  best(): number {
    return read(K_BEST, 0);
  },
  submit(score: number): boolean {
    if (score > this.best()) {
      localStorage.setItem(K_BEST, String(Math.round(score)));
      return true; // new record
    }
    return false;
  },
};

export const Wallet = {
  balance(): number {
    return read(K_DUCATS, 20); // a small opening grant
  },
  add(n: number): number {
    const bal = this.balance() + n;
    localStorage.setItem(K_DUCATS, String(bal));
    return bal;
  },
  spend(n: number): boolean {
    const bal = this.balance();
    if (bal < n) return false;
    localStorage.setItem(K_DUCATS, String(bal - n));
    return true;
  },
};
