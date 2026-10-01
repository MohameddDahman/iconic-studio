/**
 * Screenshot the running dev server at real viewport sizes.
 *
 *   node scripts/shots.mjs                      # every route, desktop
 *   node scripts/shots.mjs /projects --mobile   # one route, 390px
 *   node scripts/shots.mjs /projects --full     # full-page capture
 *
 * Animations are given time to settle and reduced-motion is NOT forced, so what
 * comes out is what a visitor sees.
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

const args = process.argv.slice(2);
const routes = args.filter((a) => a.startsWith("/"));
const mobile = args.includes("--mobile");
const full = args.includes("--full");
const outDir = path.join(process.cwd(), ".shots");

const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
const ROUTES = routes.length
  ? routes
  : ["/", "/projects", "/monograph", "/studio", "/reviews", "/contact"];

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

for (const route of ROUTES) {
  const url = BASE + route;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  }
  // The boot overlay reveals on document.fonts.ready + a beat; the hero timeline
  // runs for about three seconds after that.
  await page.waitForTimeout(5200);

  if (full) {
    // Scroll the whole page first so every ScrollTrigger has fired and no
    // lazy image is still blank, then return to the top.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.75;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 260));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
  }

  const name = (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-")) +
    (mobile ? ".mobile" : "") + (full ? ".full" : "") + ".png";
  await page.screenshot({ path: path.join(outDir, name), fullPage: full });
  console.log(name);
}

await browser.close();
