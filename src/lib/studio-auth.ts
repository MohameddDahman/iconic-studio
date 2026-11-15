import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

/** True when a request carries a desk session for an address still on the studio list. */
export async function isStudioRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!token || !url) return false;
  const client = new ConvexHttpClient(url);
  client.setAuth(token);
  const viewer = await client.query(api.studio.viewer, {}).catch(() => null);
  return Boolean(viewer?.allowed);
}
