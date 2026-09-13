/**
 * Print the monograph into the PDF copy the monograph page hands out.
 *
 * It prints /monograph/print, every page of the volume laid flat at the
 * flipbook's own size, so the PDF is the book exactly as the site sets it. It
 * also writes the page count and file size to src/lib/monograph-pdf.json for the
 * page to show. The PDF is a snapshot: run this again after changing the
 * monograph or its projects at /admin, then deploy.
 *
 *   node scripts/build-monograph-pdf.mjs [base]
 *
 *   base   the site to print from (default: the live site), e.g.
 *          http://localhost:3000 for a dev server
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = (process.argv[2] ?? "https://iconic-architecture.vercel.app").replace(/\/$/, "");
const OUT = path.join("public", "monograph", "iconic-volume-i.pdf");
const MANIFEST = path.join("src", "lib", "monograph-pdf.json");

/** One flipbook page in CSS pixels, as .book-print-sheet sets it in globals.css. */
const SHEET_WIDTH = 540;
/** The printed page, in millimetres. */
const PAGE = { width: 240, height: 307 };
/** 240 mm is 907 CSS px; each 540px sheet is scaled up to fill it. */
const SCALE = ((PAGE.width / 25.4) * 96) / SHEET_WIDTH;
/** The long edge of each photograph in the PDF, and its JPEG quality. */
const PHOTO = { edge: 1600, quality: 78 };

sharp.cache(false);

const browser = await chromium.launch({ channel: "msedge" });
try {
  const page = await browser.newPage({
    viewport: { width: SHEET_WIDTH + 48, height: 1000 },
    deviceScaleFactor: 3,
  });

  // The site serves photographs as AVIF or WebP, which a PDF can only hold
  // uncompressed. The printer gets the same photographs as JPEGs instead.
  let photos = 0;
  const kept = [];
  await page.route(/\/_next\/image\?/, async (route) => {
    let response;
    try {
      response = await route.fetch();
      const body = await sharp(Buffer.from(await response.body()))
        .rotate()
        .resize({ width: PHOTO.edge, height: PHOTO.edge, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: PHOTO.quality, mozjpeg: true })
        .toBuffer();
      photos++;
      await route.fulfill({ status: 200, contentType: "image/jpeg", body });
    } catch (error) {
      // Leave that photograph as the site sent it, and say so at the end.
      kept.push(`${response ? response.status() : "no response"} ${route.request().url()}: ${String(error.message).split("\n")[0]}`);
      try {
        if (response) await route.fulfill({ response });
        else await route.continue();
      } catch {
        // The page has already moved on.
      }
    }
  });

  await page.goto(`${BASE}/monograph/print`, { waitUntil: "load", timeout: 120_000 });
  // A dev server's tools badge is fixed to a corner and would print on every page.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
      ),
    );
  });
  // Let the blurred placeholders clear once their photographs have landed.
  await page.waitForTimeout(800);

  const sheets = await page.locator(".book-print-sheet").count();
  if (sheets === 0) throw new Error(`There are no pages at ${BASE}/monograph/print`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: OUT,
    width: `${PAGE.width}mm`,
    height: `${PAGE.height}mm`,
    scale: SCALE,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  const bytes = fs.statSync(OUT).size;
  const printed = (fs.readFileSync(OUT, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (printed && printed !== sheets) {
    throw new Error(`The PDF came out with ${printed} pages, but the volume has ${sheets}.`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify({ pages: sheets, bytes }, null, 2) + "\n");
  console.log(
    `${OUT}: ${sheets} pages, ${photos} photographs, ${(bytes / 1024 / 1024).toFixed(1)} MB, printed from ${BASE}`,
  );
  for (const line of kept) console.log(`  not converted, kept as sent: ${line}`);
} finally {
  await browser.close();
}
