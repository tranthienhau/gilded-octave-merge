import type { AppCtx } from '../main';
import { IAP, IAP_PRODUCTS } from '../services/iap';
import { Wallet } from '../services/storage';

export function renderShop(root: HTMLElement, ctx: AppCtx): () => void {
  const el = document.createElement('div');
  el.className = 'screen';
  el.innerHTML = `
    <div class="sub">
      <div class="sub-head">
        <button class="iconbtn" data-act="back">&lsaquo;</button>
        <div class="caps" style="font-size:11px; letter-spacing:.26em;">THE BOX OFFICE</div>
        <div class="wallet-pill">&#9679; <span data-wallet>${Wallet.balance().toLocaleString('en-US')}</span></div>
      </div>
      <div class="sub-title">Ducat Packs</div>
      <div class="sub-lede">Consumable StoreKit purchases. Ducats fund instant revives so a great run never ends at the danger line.</div>
      <div data-packs></div>
      <div style="margin-top:18px; font-style:italic; color:#9c7a3e; font-size:13px;">
        Four consumable products, registered in App Store Connect. Purchases here are simulated on web &amp; simulator; on device they route through StoreKit.
      </div>
    </div>
  `;
  root.appendChild(el);

  const packsHost = el.querySelector<HTMLElement>('[data-packs]')!;
  const walletEl = el.querySelector<HTMLElement>('[data-wallet]')!;

  for (const p of IAP_PRODUCTS) {
    const card = document.createElement('div');
    card.className = 'pack' + (p.best ? ' best' : '');
    card.innerHTML = `
      ${p.best ? '<div class="pack-badge">BEST VALUE</div>' : ''}
      <div class="pack-coin">${p.ducats}</div>
      <div style="flex:1; min-width:0;">
        <div class="pack-t">${p.title}</div>
        <div class="pack-s">${p.blurb}</div>
      </div>
      <button class="pack-buy" data-buy>${p.price}</button>
    `;
    const btn = card.querySelector<HTMLButtonElement>('[data-buy]')!;
    btn.addEventListener('click', async () => {
      if (btn.classList.contains('busy')) return;
      btn.classList.add('busy');
      btn.textContent = '…';
      const res = await IAP.purchase(p);
      walletEl.textContent = res.newBalance.toLocaleString('en-US');
      btn.classList.remove('busy');
      btn.textContent = p.price;
      ctx.toast(`+${p.ducats} ducats${res.simulated ? ' (sandbox)' : ''}`);
    });
    packsHost.appendChild(card);
  }

  el.querySelector('[data-act="back"]')!.addEventListener('click', () => ctx.go('hub'));
  return () => {};
}
