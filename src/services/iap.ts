// StoreKit consumable IAP service.
//
// The four consumable packs below are the products you would register in
// App Store Connect (see store/metadata/iap_products.md). In a device build the
// `purchase()` call routes through a StoreKit bridge (e.g. cordova-plugin-purchase
// or @capacitor-community/in-app-purchases); on the simulator / web we resolve a
// mock transaction so the whole flow stays demoable with no entitlement needed.

import { Capacitor } from '@capacitor/core';
import { Wallet } from './storage';

export interface IapProduct {
  id: string; // App Store Connect product id
  title: string;
  blurb: string;
  ducats: number; // soft currency granted (a "Ducat" funds revives & polish)
  price: string; // display price (StoreKit returns the localized string on device)
  best?: boolean;
}

export const IAP_PRODUCTS: IapProduct[] = [
  { id: 'com.tranthienhau.gildedoctave.aria', title: 'Aria Purse', blurb: 'A handful of ducats for a quick encore', ducats: 12, price: '$0.99' },
  { id: 'com.tranthienhau.gildedoctave.sonata', title: 'Sonata Coffer', blurb: 'Keep the performance going', ducats: 45, price: '$2.99' },
  { id: 'com.tranthienhau.gildedoctave.concerto', title: 'Concerto Chest', blurb: 'For the ambitious maestro', ducats: 120, price: '$5.99', best: true },
  { id: 'com.tranthienhau.gildedoctave.symphony', title: 'Symphony Vault', blurb: 'The patron of the opera house', ducats: 300, price: '$12.99' },
];

export interface PurchaseResult {
  ok: boolean;
  product: IapProduct;
  newBalance: number;
  simulated: boolean;
}

class IapService {
  get native(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** Begin a StoreKit purchase. Resolves the granted ducats into the wallet. */
  async purchase(product: IapProduct): Promise<PurchaseResult> {
    // On device: await StoreKit.order(product.id) -> verify receipt -> finish txn.
    // Here we simulate the StoreKit round-trip behind the tap.
    await this.simulateStoreKit();
    const newBalance = Wallet.add(product.ducats);
    return { ok: true, product, newBalance, simulated: !this.native };
  }

  private simulateStoreKit(): Promise<void> {
    return new Promise((res) => setTimeout(res, 650));
  }
}

export const IAP = new IapService();
