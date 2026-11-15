import crypto from "node:crypto";
import { isStudioRequest } from "@/lib/studio-auth";
import { CLOUD, VIDEO_FOLDER } from "@/lib/video";

/** Removes a clip, and everything made from it, from Cloudinary. Studio accounts only. */
export async function POST(request: Request) {
  if (!(await isStudioRequest(request))) return Response.json({ ok: false }, { status: 401 });
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  const { publicId } = (await request.json().catch(() => ({}))) as { publicId?: string };
  if (!key || !secret || !CLOUD) return Response.json({ ok: false, error: "Video uploads are not set up yet." }, { status: 503 });
  if (!publicId || !publicId.startsWith(`${VIDEO_FOLDER}/`)) return Response.json({ ok: false }, { status: 400 });

  const params: Record<string, string> = { invalidate: "true", public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
  const signed = Object.keys(params).sort().map((name) => `${name}=${params[name]}`).join("&");
  const body = new URLSearchParams({ ...params, api_key: key, signature: crypto.createHash("sha1").update(signed + secret).digest("hex") });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/video/destroy`, { method: "POST", body });
  const result = (await res.json().catch(() => ({}))) as { result?: string };
  // "not found" means it is already gone, which is what was asked for.
  const ok = res.ok && (result.result === "ok" || result.result === "not found");
  return Response.json({ ok, error: ok ? undefined : "Cloudinary did not remove the film. Try again." }, { status: ok ? 200 : 502 });
}
