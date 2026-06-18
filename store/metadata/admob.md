# AdMob

Two placements, integrated through `@capacitor-community/admob` on device.
Ad unit ids live in `src/services/ads.ts` (`AD_UNITS`). The values shipped in
source are Google's **public test units** - replace with production unit ids
before the App Store build.

| Placement | Format | Where | Reward |
|-----------|--------|-------|--------|
| Revive | Rewarded video | Game-over overlay -> "Watch Ad · +1 Life" | One extra life (clears the danger meter) |
| Hub banner | Banner 320×50 | Bottom of the hub | - |

## Device flow
```
AdMob.initialize()
AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded })
AdMob.showRewardVideoAd()  // resolves with the reward -> engine.revive()
AdMob.showBanner({ adId: AD_UNITS.banner, position: BOTTOM_CENTER })
```

## App Store privacy
Declare AdMob's data collection (Identifiers / Usage Data) in App Privacy and
present the App Tracking Transparency prompt before requesting personalized ads.

On the simulator / web a short mock rewarded player and a banner placeholder
stand in, so the rewarded "+1 life" flow is fully demoable without the SDK.
