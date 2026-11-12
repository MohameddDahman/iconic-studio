import sharp from "sharp";

/**
 * A photograph uploaded from the desk but not yet prepared as plain files
 * (scripts/bake-photos.mjs) is sized here instead: /photo/<id>.w400.webp,
 * .w800.webp, .full.webp, or .og.jpg for share previews. Each answer is cached
 * by the CDN for a year, and the stored file is fetched from Convex once into
 * the data cache, so visitors never count against Convex's download allowance
 * and nothing uses Vercel's image resizing.
 */
const CONVEX = process.env.NEXT_PUBLIC_CONVEX_URL;
const NAME = /^([0-9a-f-]{36})\.(w400\.webp|w800\.webp|full\.webp|og\.jpg)$/;
const YEAR = 60 * 60 * 24 * 365;

export async function GET(_request: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const match = NAME.exec(file);
  if (!match || !CONVEX) return new Response("Not found", { status: 404 });
  const [, id, size] = match;

  const upstream = await fetch(`${CONVEX}/api/storage/${id}`, { next: { revalidate: YEAR, tags: ["photo-files"] } });
  if (!upstream.ok) return new Response("Not found", { status: 404 });
  const original = Buffer.from(await upstream.arrayBuffer());

  const image = sharp(original).rotate();
  const body =
    size === "w400.webp"
      ? await image.resize({ width: 400, withoutEnlargement: true }).webp({ quality: 62 }).toBuffer()
      : size === "w800.webp"
        ? await image.resize({ width: 800, withoutEnlargement: true }).webp({ quality: 66 }).toBuffer()
        : size === "og.jpg"
          ? await image.resize({ width: 1200, height: 630, fit: "cover" }).jpeg({ quality: 80 }).toBuffer()
          : await image.webp({ quality: 78 }).toBuffer();

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": size === "og.jpg" ? "image/jpeg" : "image/webp",
      "Cache-Control": `public, max-age=${YEAR}, s-maxage=${YEAR}, immutable`,
    },
  });
}
