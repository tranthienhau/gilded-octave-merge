# Screenshot & Demo Regeneration

How the committed images in `screenshots/` are produced. Not needed to run the
game - only to regenerate the media.

## What it does
`scripts/capture.mjs` serves the production build, opens it in a real Chromium
engine at iPhone size (430×932 @2x), and captures:

- Deterministic screenshots via the `?screen=` demo states (`hub`, `intro`,
  `play`, `win`, `over`, plus the shop reached by navigation).
- A live gameplay run for the GIF: it starts a real game, waits out the
  light-dim intro, then dispatches pointer drops and grabs frames between each
  drop. ffmpeg assembles the frames into `screenshots/demo.gif` with a
  generated palette for clean opera colors.

The `?screen=` deep links build a settled, representative board (`engine.buildDemo`)
so captures are stable - they are not part of normal play.

## Run it
```bash
npm install
npx playwright install chromium   # one-time: capture browser engine
npm run build                     # produce dist/
npm run shots                     # -> screenshots/*.png + demo.gif
```
Requires `ffmpeg` on PATH for the GIF step.

## Capturing on the iOS Simulator instead
The same build runs as a native app, which you can screen-record directly:
```bash
npm run build && npx cap sync ios
xcrun simctl boot "iPhone 16 Pro Max"
npx cap run ios --target "iPhone 16 Pro Max"
xcrun simctl io booted screenshot screenshots/device.png
xcrun simctl io booted recordVideo screenshots/device.mov   # ^C to stop
ffmpeg -i screenshots/device.mov -vf "fps=14,scale=320:-1" screenshots/demo.gif
```
