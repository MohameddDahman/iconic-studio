/**
 * Films are stored on Cloudinary at 480p, to keep the free plan's storage and
 * downloads small. The desk compresses each clip in the browser before uploading
 * it (compressVideo.ts), so the stored file is already the web copy and is sent
 * to visitors as it is. A clip the browser could not compress is uploaded as it
 * came, and Cloudinary makes the 480p copy once, on upload. Either way the poster
 * is made on upload too, so a visitor never waits and the processing allowance
 * is spent once per clip.
 */
export const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
export const VIDEO_FOLDER = "iconic/videos";
// Both sides are capped, so an upright phone clip is reduced as much as a wide one.
const VIDEO_TRANSFORM = "w_854,h_854,c_limit,q_auto:eco,vc_h264";
const POSTER_TRANSFORM = "so_1,w_800,c_limit,q_auto";
/** What Cloudinary makes on upload; must match the addresses below exactly. */
export const eagerFor = (compressed: boolean) =>
  compressed ? `${POSTER_TRANSFORM}/jpg` : `${VIDEO_TRANSFORM}/mp4|${POSTER_TRANSFORM}/jpg`;

export const videoUrl = (publicId: string, compressed = false) =>
  `https://res.cloudinary.com/${CLOUD}/video/upload/${compressed ? "" : `${VIDEO_TRANSFORM}/`}${publicId}.mp4`;

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
  /** What the film shows, as the studio wrote it. Blank lines separate paragraphs. */
  description?: string;
}
