/**
 * Capture one route at several scroll depths, so pinned sections can be checked
 * where they actually happen.
 *
 *   node scripts/shot-scroll.mjs inside 0.2 0.45 0.7
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const [route, ...stops] = process.argv.slice(2);
const fractions = (stops.length ? stops : ["0.25", "0.5", "0.75"]).map(Number);
const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), ".shots");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(`${BASE}/${route === "home" ? "" : route}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5200);

for (const f of fractions) {
  await page.evaluate(async (fraction) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max * fraction;
    // Ease into position so Lenis and every ScrollTrigger stay in step; a
    // single jump can leave scrubbed timelines behind.
    const from = window.scrollY;
    const steps = 26;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, from + ((target - from) * i) / steps);
      await new Promise((r) => setTimeout(r, 40));
    }
  }, f);
  await page.waitForTimeout(1400);
  const name = `${route}@${String(Math.round(f * 100)).padStart(2, "0")}.png`;
  await page.screenshot({ path: path.join(outDir, name) });
  console.log(name);
}

await browser.close();
