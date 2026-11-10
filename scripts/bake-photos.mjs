/**
 * Prepare the studio's photographs as plain files, and save a copy of what is
 * published, so the public site needs no image service and nothing it shows
 * counts against Convex's download allowance.
 *
 *   node scripts/bake-photos.mjs        # from the live deployment
 *
 * Run it after the studio adds or changes photographs, then commit and deploy.
 * Until then a new photograph is shown straight from Convex at full size.
 * Only photographs without prepared files are downloaded, once each.
 *
 * Writes public/media/live/<id>.w400.webp (every photograph, for thumbnails),
 * <id>.w800.webp and <id>.full.webp (the ones the site shows), <id>.og.jpg (each
 * project's share picture), src/lib/snapshot.json and src/lib/baked-photos.json.
 * The site's own images in public/media get the same three sizes beside them.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const LIVE = path.join(ROOT, "public/media/live");
const CACHE = path.join(ROOT, ".bake-cache");
const cli = path.join(ROOT, "node_modules/convex/bin/main.js");
const exec = (args) => execFileSync(process.execPath, [cli, ...args, "--prod"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64e6 });
const table = (name) => exec(["data", name, "--limit", "8000", "--format", "jsonLines"]).split("\n").filter(Boolean).map((l) => JSON.parse(l));
fs.mkdirSync(LIVE, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const projects = table("projects"), media = table("media"), spreads = table("spreads");
const testimonials = table("testimonials"), settings = table("settings");
const files = JSON.parse(exec(["run", "media:files", "{}"]));
const urlOf = new Map(files.map((f) => [f.id, f.url]));
const byId = new Map(media.map((m) => [m._id, m]));

const shown = new Set();
const resolve = (id) => {
  const m = id && byId.get(id);
  if (!m) return null;
  shown.add(m._id);
  const out = { _id: m._id, src: `/media/live/${m._id}.webp`, alt: m.alt, caption: m.caption, width: m.width, height: m.height, blurDataURL: m.blurDataURL };
  const n = m.nightId && byId.get(m.nightId);
  if (n) {
    shown.add(n._id);
    out.night = { src: `/media/live/${n._id}.webp`, width: n.width, height: n.height, blurDataURL: n.blurDataURL };
  }
  return out;
};
const published = (rows) => rows.filter((r) => r.published).sort((a, b) => a.order - b.order);
const strip = ({ _creationTime, published: _p, ...rest }) => (void _creationTime, void _p, rest);
const snapshot = {
  savedAt: new Date().toISOString(),
  projects: published(projects).map((p) => {
    const { coverId, galleryIds, ...rest } = strip(p);
    return { ...rest, cover: resolve(coverId), gallery: (galleryIds ?? []).map(resolve).filter(Boolean) };
  }),
  spreads: published(spreads).map((s) => {
    const { mediaId, mediaBId, ...rest } = strip(s);
    return { ...rest, media: resolve(mediaId), mediaB: resolve(mediaBId) };
  }),
  testimonials: published(testimonials).map(strip),
  settings: settings[0] ? (({ _creationTime, ...s }) => (void _creationTime, s))(settings[0]) : null,
};

/** The stored file, downloaded once and kept in .bake-cache. */
async function source(id) {
  const file = path.join(CACHE, id);
  if (fs.existsSync(file)) return file;
  const res = await fetch(urlOf.get(id));
  if (!res.ok) throw new Error(`Could not download ${id} (${res.status})`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}
const made = [];
/** Write a file only if it is not there yet; `build` returns a sharp pipeline. */
async function make(file, build) {
  if (fs.existsSync(file)) return;
  await (await build()).toFile(file);
  made.push(path.relative(ROOT, file));
}
const live = (id, tag) => path.join(LIVE, `${id}.${tag}`);
for (const m of media) {
  const wanted = [["w400.webp", 400, 62], ...(shown.has(m._id) ? [["w800.webp", 800, 66], ["full.webp", 0, 0]] : [])];
  for (const [tag, width, quality] of wanted) {
    await make(live(m._id, tag), async () => {
      const input = sharp(await source(m._id));
      return width
        ? input.resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 })
        : input.webp({ quality: 78, effort: 6 });
    });
  }
}
for (const p of snapshot.projects) {
  const id = (p.cover ?? p.gallery[0])?._id;
  if (!id) continue;
  await make(live(id, "og.jpg"), async () =>
    sharp(await source(id)).resize({ width: 1200, height: 630, fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }),
  );
}
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/media-manifest.json"), "utf8"));
for (const key of Object.keys(manifest)) {
  const original = path.join(ROOT, "public", key);
  if (!fs.existsSync(original)) continue;
  for (const [tag, width, quality] of [["w400", 400, 62], ["w800", 800, 66], ["full", 1600, 72]]) {
    const file = original.replace(/\.(jpe?g|png|webp)$/i, `.${tag}.webp`);
    await make(file, () => sharp(original).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 }));
  }
}

fs.writeFileSync(path.join(ROOT, "src/lib/snapshot.json"), JSON.stringify(snapshot));
const uuids = Object.fromEntries(files.filter((f) => f.url).map((f) => [new URL(f.url).pathname.split("/").pop(), f.id]));
fs.writeFileSync(path.join(ROOT, "src/lib/baked-photos.json"), JSON.stringify({ uuids, shown: [...shown] }));
console.log(`${snapshot.projects.length} projects, ${shown.size} photographs on the site, ${made.length} new files.`);
console.log("Now commit and deploy so the site uses them.");
