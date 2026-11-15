/**
 * Films are stored on Cloudinary. The desk compresses each clip to 720p in the
 * browser before uploading it (compressVideo.ts), so the stored file is already
 * the web copy and is sent to visitors as it is. A clip the browser could not
 * compress is uploaded as it came, and Cloudinary makes the 720p copy once, on
 * upload. Phones get a 480p copy, about half the size, also made once on
 * upload. Either way the poster is made on upload too, so a visitor never waits
 * and the free plan's processing allowance is spent once per clip.
 */
export const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const VIDEO_FOLDER = "iconic/videos";
// Both sides are capped, so an upright phone clip is reduced as much as a wide one.
const VIDEO_TRANSFORM = "w_1280,h_1280,c_limit,q_auto:eco,vc_h264";
const PHONE_TRANSFORM = "w_854,h_854,c_limit,q_auto:eco,vc_h264";
const POSTER_TRANSFORM = "so_1,w_800,c_limit,q_auto";
/** What Cloudinary makes on upload; must match the addresses below exactly. */
export const eagerFor = (compressed: boolean) =>
  compressed
    ? `${PHONE_TRANSFORM}/mp4|${POSTER_TRANSFORM}/jpg`
    : `${VIDEO_TRANSFORM}/mp4|${PHONE_TRANSFORM}/mp4|${POSTER_TRANSFORM}/jpg`;

export const videoUrl = (publicId: string, compressed = false) =>
  `https://res.cloudinary.com/${CLOUD}/video/upload/${compressed ? "" : `${VIDEO_TRANSFORM}/`}${publicId}.mp4`;
/** The 480p copy, for phones. */
export const phoneVideoUrl = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUD}/video/upload/${PHONE_TRANSFORM}/${publicId}.mp4`;

/** A phone, held either way: its shorter side is under 600 CSS pixels. Tablets and laptops are not. */
export const isPhone = () => typeof window !== "undefined" && Math.min(window.screen.width, window.screen.height) < 600;

export const posterUrl = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUD}/video/upload/${POSTER_TRANSFORM}/${publicId}.jpg`;

export const runtime = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export interface Video {
  id: string;
  publicId: string;
  title: string;
  projectSlug?: string;
  duration: number;
  width: number;
  height: number;
  compressed?: boolean;
}
