// Capture real screenshots + demo frames by running the built app in a real
// browser engine at iPhone size, then assemble the GIF with ffmpeg.
//   node scripts/capture.mjs   (run after `npm run build`)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'screenshots');
const FRAMES = join(OUT, '_frames');
const PORT = 4178;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

function serve() {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      try {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p === '/') p = '/index.html';
        const file = join(DIST, p);
        const data = await readFile(file);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    srv.listen(PORT, () => resolve(srv));
  });
}

const URL_BASE = `http://localhost:${PORT}/`;

async function main() {
  if (!existsSync(DIST)) {
    console.error('dist/ missing — run `npm run build` first');
    process.exit(1);
  }
  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  mkdirSync(OUT, { recursive: true });

  const srv = await serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  const shot = async (name, query = '', waitMs = 900) => {
    await page.goto(URL_BASE + (query ? `?${query}` : ''), { waitUntil: 'networkidle' });
    await page.waitForTimeout(waitMs);
    const file = join(OUT, name);
    await page.screenshot({ path: file });
    console.log('shot', name);
  };

  // --- static screenshots (deterministic via ?screen= demo states) ---
  await shot('01-hub.png', '', 1100);
  await shot('02-intro.png', 'screen=intro', 650); // light-dim clearly mid-animation
  await shot('03-play.png', 'screen=play', 900);
  await shot('04-win.png', 'screen=win', 1100);
  await shot('05-over.png', 'screen=over', 900);
  await shot('06-shop.png', '', 700).catch(() => {});
  // shop needs navigation from hub
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.locator('[data-act="shop"]').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(OUT, '06-shop.png') });
  console.log('shot 06-shop.png');

  // --- demo GIF: drive a live game and grab frames ---
  await page.goto(URL_BASE + '?screen=', { waitUntil: 'networkidle' });
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  // start a real run
  await page.locator('[data-act="play"]').click();
  await page.waitForTimeout(1850); // let the light-dim intro play
  const canvas = page.locator('[data-canvas]');
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const topY = box.y + box.height * 0.18;
  let frame = 0;
  const dropX = [0.5, 0.5, 0.32, 0.68, 0.5, 0.4, 0.6, 0.5, 0.45, 0.55, 0.5, 0.38, 0.62, 0.5];
  for (let i = 0; i < dropX.length; i++) {
    const x = box.x + box.width * dropX[i];
    await page.mouse.move(x, topY);
    await page.mouse.click(x, topY);
    // capture a few frames of the fall/merge between drops
    for (let k = 0; k < 5; k++) {
      await page.waitForTimeout(60);
      await page.screenshot({ path: join(FRAMES, `f${String(frame++).padStart(3, '0')}.png`), animations: 'allow' });
    }
    await page.waitForTimeout(120);
  }
  // a few settle frames
  for (let k = 0; k < 12; k++) {
    await page.waitForTimeout(70);
    await page.screenshot({ path: join(FRAMES, `f${String(frame++).padStart(3, '0')}.png`) });
  }
  console.log('captured', frame, 'frames');

  await browser.close();
  srv.close();

  // --- assemble GIF with ffmpeg (palette for clean opera colors) ---
  const palette = join(FRAMES, 'palette.png');
  const fps = 14;
  const r1 = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(FRAMES, 'f%03d.png'), '-vf', 'scale=320:-1:flags=lanczos,palettegen=stats_mode=diff', palette], { stdio: 'inherit' });
  if (r1.status !== 0) { console.error('ffmpeg palettegen failed'); process.exit(1); }
  const r2 = spawnSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', join(FRAMES, 'f%03d.png'), '-i', palette, '-lavfi', 'scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3', '-loop', '0', join(OUT, 'demo.gif')], { stdio: 'inherit' });
  if (r2.status !== 0) { console.error('ffmpeg gif failed'); process.exit(1); }

  rmSync(FRAMES, { recursive: true, force: true });
  console.log('\nDone. Files in screenshots/:', readdirSync(OUT).join(', '));
}

main();
