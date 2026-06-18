# Build & TestFlight Pipeline

Capacitor wraps the built web app (`dist/`) in a native iOS shell (`ios/App`).
The release path is web build -> Capacitor copy -> Xcode archive -> App Store
Connect -> TestFlight -> App Store.

## One-time setup
- Apple Developer Program membership + App ID `com.tranthienhau.gildedoctave`.
- App record created in App Store Connect (see `metadata/app_store_listing.md`).
- Register the four consumables (`metadata/iap_products.md`) and AdMob units.

## Each release
```bash
npm run build          # tsc + vite -> dist/
npx cap sync ios       # copy dist into ios/App + update native deps
npx cap open ios       # open the workspace in Xcode
```
In Xcode: select a release scheme -> Product › Archive -> Distribute App ->
App Store Connect -> Upload.

## Fastlane (optional, automated)
```ruby
# ios/fastlane/Fastfile
platform :ios do
  lane :beta do
    build_app(workspace: "App.xcworkspace", scheme: "App")
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end
end
```
`bundle exec fastlane beta` archives and ships to TestFlight in one step.

## TestFlight smoke test (before submitting for review)
1. Win - merge two Diamonds into the Mega Diamond -> win overlay + chord.
2. Lose - let the well overflow the danger line -> curtain falls.
3. Revive - watch the rewarded ad for +1 life; revive again with Ducats.
4. Each IAP - buy all four packs in the sandbox; confirm Ducats credited.
5. Audio - verify the adaptive layering and per-merge notes on a physical device.
6. Intro - confirm the light-dim overture is clearly visible on device.
