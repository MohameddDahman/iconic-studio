import { revalidateTag } from "next/cache";
import { isStudioRequest } from "@/lib/studio-auth";

/**
 * Called by the desk after a change is saved. The public pages read Convex
 * once and keep the answer; this tells them to read it again, so a change shows
 * straight away while ordinary visits cost Convex nothing. Only a signed-in
 * studio account may ask.
 */
export async function POST(request: Request) {
  if (!(await isStudioRequest(request))) return Response.json({ ok: false }, { status: 401 });
  revalidateTag("content", { expire: 0 });
  return Response.json({ ok: true });
}
