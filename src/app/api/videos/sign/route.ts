import crypto from "node:crypto";
import { isStudioRequest } from "@/lib/studio-auth";
import { CLOUD, VIDEO_FOLDER, eagerFor } from "@/lib/video";

/**
 * Lets the desk upload a clip straight to Cloudinary without the secret ever
 * leaving the server: it signs the upload's settings for a signed-in studio
 * account only. Cloudinary then refuses any upload whose settings differ.
 */
export async function POST(request: Request) {
  if (!(await isStudioRequest(request))) return Response.json({ ok: false }, { status: 401 });
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!key || !secret || !CLOUD) {
    return Response.json({ ok: false, error: "Video uploads are not set up yet." }, { status: 503 });
  }
  const { compressed = false } = (await request.json().catch(() => ({}))) as { compressed?: boolean };
  const params: Record<string, string> = {
    eager: eagerFor(compressed),
    eager_async: "true",
    folder: VIDEO_FOLDER,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const signed = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join("&");
  const signature = crypto.createHash("sha1").update(signed + secret).digest("hex");
  return Response.json({ ok: true, cloudName: CLOUD, apiKey: key, signature, params });
}
