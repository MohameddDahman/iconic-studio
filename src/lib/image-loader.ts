/**
 * Every photograph the site shows comes in three widths, as files named after
 * it: name.w400.webp, name.w800.webp and name.full.webp. Most are prepared
 * ahead of time under /media/ (scripts/bake-photos.mjs); a photograph uploaded
 * since is sized once by /photo/ and cached. Nothing is resized per visit, so
 * nothing counts against Vercel's image quota. Anything else is used as it is.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("/media/") && !src.startsWith("/photo/")) return src;
  const size = width <= 400 ? "w400" : width <= 800 ? "w800" : "full";
  return src.replace(/\.(jpe?g|png|webp)$/i, `.${size}.webp`);
}
