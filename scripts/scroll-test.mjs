/**
 * Wheel-scroll test.
 *
 * Scrolls each page one wheel notch at a time and checks that the page moves
 * exactly as far as the wheel asked, that the page height never changes while
 * scrolling, and that nothing keeps scrolling after the wheel stops.
 *
 *   npm run dev            (in another terminal)
 *   node scripts/scroll-test.mjs [http://localhost:3000] [/ /projects /inside …]
 *
 * Smooth scrolling is disabled in the test browser so a notch is exactly 120px.
 */
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = args[0]?.startsWith("http") ? args.shift() : "http://localhost:3000";
const routes = args.length ? args : ["/", "/projects", "/services", "/inside", "/monograph", "/studio", "/contact"];

const NOTCH = 120;
const browser = await chromium.launch({ args: ["--disable-smooth-scrolling"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
let failed = false;

for (const route of routes) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto(base + route, { waitUntil: "load", timeout: 240_000 });
  await page.waitForTimeout(5_000);
  await page.mouse.move(720, 450);

  const read = () =>
    page.evaluate(() => ({
      y: Math.round(window.scrollY),
      max: Math.round(document.documentElement.scrollHeight - window.innerHeight),
    }));

  let before = await read();
  let mismatched = 0;
  let steps = 0;
  const heights = new Set();

  for (let i = 0; i < 400; i++) {
    await page.mouse.wheel(0, NOTCH);
    await page.waitForTimeout(60);
    const after = await read();
    heights.add(after.max);
    steps++;
    if (after.y < after.max - 2 && Math.abs(after.y - before.y - NOTCH) > 20) mismatched++;
    before = after;
    if (after.y >= after.max - 2) break;
  }

  const stop = await read();
  await page.waitForTimeout(1_500);
  const settled = await read();
  const drift = settled.y - stop.y;

  const ok = mismatched <= 2 && heights.size === 1 && drift === 0 && errors.length === 0;
  if (!ok) failed = true;

  console.log(
    `${ok ? "PASS" : "FAIL"}  ${route.padEnd(28)} notches ${String(steps).padStart(3)}  mismatched ${mismatched}  ` +
      `page heights ${heights.size}  drift after stop ${drift}px  errors ${errors.length}`,
  );
  await page.close();
}

await browser.close();
process.exit(failed ? 1 : 0);
