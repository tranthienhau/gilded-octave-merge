# In-App Purchases (StoreKit) - Consumables

Register these four **consumable** products in App Store Connect. The product ids
match `src/services/iap.ts`. Each grants Ducats, the soft currency that funds
instant revives.

| Reference name | Product ID | Type | Price tier | Grants |
|----------------|-----------|------|-----------|--------|
| Aria Purse | com.tranthienhau.gildedoctave.aria | Consumable | $0.99 | 12 Ducats |
| Sonata Coffer | com.tranthienhau.gildedoctave.sonata | Consumable | $2.99 | 45 Ducats |
| Concerto Chest | com.tranthienhau.gildedoctave.concerto | Consumable | $5.99 | 120 Ducats |
| Symphony Vault | com.tranthienhau.gildedoctave.symphony | Consumable | $12.99 | 300 Ducats |

## Review notes for IAP screenshots
Capture each product in the in-app Box Office (`06-shop.png` shows the storefront).
The reviewer flow:
1. Launch -> The Box Office (from the hub menu).
2. Tap a pack -> StoreKit sheet -> sandbox purchase -> Ducat balance updates.
3. Lose a run -> game-over -> "Revive (10 Ducats)" spends the consumable currency.

## Device integration
On device the purchase routes through a StoreKit bridge (e.g.
`@capacitor-community/in-app-purchases` or `cordova-plugin-purchase`):
order -> verify receipt -> finish transaction -> grant Ducats. On the
simulator / web the round-trip is simulated so the flow stays demoable.
