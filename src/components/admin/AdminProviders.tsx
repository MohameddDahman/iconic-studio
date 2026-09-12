"use client";

import type { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

/**
 * The public site is server-rendered from Convex, but the desk needs live
 * updates and a session, so it gets the reactive client. If the deployment is
 * not configured yet the desk says so plainly rather than throwing.
 */
let client: ConvexReactClient | null = null;

/** Created once, so a remount joins the session already in progress. */
function convexClient(url: string) {
  client ??= new ConvexReactClient(url);
  return client;
}

export default function AdminProviders({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = url ? convexClient(url) : null;

  if (!client) {
    return (
      <div className="sheet flex min-h-dvh flex-col justify-center py-24">
        <p className="annotation mb-6 text-accent">X-900 — Setup</p>
        <h1 className="inked max-w-2xl text-d2 leading-[0.94] font-light">
          The studio desk is not connected yet.
        </h1>
        <div className="mt-8 max-w-xl space-y-4 text-on-surface-muted">
          <p>
            Run <code className="text-accent">npx convex dev</code> in the project once
            to create the deployment. It writes{" "}
            <code className="text-accent">NEXT_PUBLIC_CONVEX_URL</code> into{" "}
            <code className="text-accent">.env.local</code> for you.
          </p>
          <p>
            Then set <code className="text-accent">ADMIN_EMAILS</code> on the Convex
            deployment to the addresses allowed to sign in, and restart the dev server.
          </p>
          <p>
            Until then the site runs on the seed content in{" "}
            <code className="text-accent">src/lib/seed.ts</code>, so nothing is broken —
            it just cannot be edited from here.
          </p>
        </div>
      </div>
    );
  }

  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
