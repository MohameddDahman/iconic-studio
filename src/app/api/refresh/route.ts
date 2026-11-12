import { revalidateTag } from "next/cache";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

/**
 * Called by the desk after a change is saved. The public pages read Convex
 * once and keep the answer; this tells them to read it again, so a change shows
 * straight away while ordinary visits cost Convex nothing. Only a signed-in
 * studio account may ask.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!token || !url) return Response.json({ ok: false }, { status: 401 });
  const client = new ConvexHttpClient(url);
  client.setAuth(token);
  const viewer = await client.query(api.studio.viewer, {}).catch(() => null);
  if (!viewer?.allowed) return Response.json({ ok: false }, { status: 401 });
  revalidateTag("content", { expire: 0 });
  return Response.json({ ok: true });
}
