/**
 * Move the seed content into Convex, so the studio desk can edit it.
 *
 * The photographs live in `public/media` on this machine, so they are uploaded
 * from here; the records that use them are built inside Convex from the same
 * seed the site falls back to (see `convex/seedImport.ts`).
 *
 *   node scripts/import-seed.mjs [--prod] [--replace]
 *
 *   --prod      import into the production deployment instead of the dev one
 *   --replace   clear what is already in the database first
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const prod = args.includes("--prod");
const replace = args.includes("--replace");
const cli = path.join(process.cwd(), "node_modules", "convex", "bin", "main.js");

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/** Run a Convex function through the CLI, which is what may call internal ones. */
function run(name, functionArgs = {}) {
  const output = execFileSync(
    process.execPath,
    [cli, "run", ...(prod ? ["--prod"] : []), name, JSON.stringify(functionArgs)],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const lines = output.split("\n");
  const start = lines.findIndex((line) => /^\s*[[{"]|^\s*null\s*$/.test(line));
  if (start < 0) throw new Error(`${name} returned nothing readable:\n${output}`);
  try {
    return JSON.parse(lines.slice(start).join("\n"));
  } catch {
    throw new Error(`${name} returned something unreadable:\n${output}`);
  }
}

const files = run("seedImport:neededFiles");
console.log(`${files.length} photographs to upload to the ${prod ? "production" : "dev"} deployment`);

const uploads = [];
const BATCH = 20;
for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  const urls = run("seedImport:uploadUrls", { count: batch.length });
  await Promise.all(
    batch.map(async (file, k) => {
      const onDisk = path.join(process.cwd(), "public", file.src.replace(/^\//, ""));
      if (!fs.existsSync(onDisk)) {
        console.warn(`  missing on disk, skipped: ${file.src}`);
        return;
      }
      const body = fs.readFileSync(onDisk);
      const contentType = CONTENT_TYPES[path.extname(onDisk).toLowerCase()] ?? "application/octet-stream";
      const response = await fetch(urls[k], { method: "POST", headers: { "Content-Type": contentType }, body });
      if (!response.ok) throw new Error(`${file.src}: upload failed (${response.status})`);
      const { storageId } = await response.json();
      uploads.push({ src: file.src, storageId, bytes: body.byteLength, contentType });
    }),
  );
  console.log(`  uploaded ${Math.min(i + BATCH, files.length)}/${files.length}`);
}

const result = run("seedImport:apply", { uploads, replace });
console.log("imported:", JSON.stringify(result, null, 2));
