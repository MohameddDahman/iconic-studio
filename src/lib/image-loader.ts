/**
 * Every photograph the site shows is prepared ahead of time in three widths, as
 * plain files beside its name: name.w400.webp, name.w800.webp and name.full.webp
 * (see scripts/bake-photos.mjs). Nothing is resized on request, so pages never
 * wait on an image service and nothing counts against a quota. Anything else,
 * such as a fresh upload not prepared yet, is used as it is.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("/media/")) return src;
  const size = width <= 400 ? "w400" : width <= 800 ? "w800" : "full";
  return src.replace(/\.(jpe?g|png|webp)$/i, `.${size}.webp`);
}
