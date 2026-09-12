import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { isStudioEmail, studioEmails } from "./access";

/** The desk publishes to the live site, so passwords have to resist guessing. */
const MIN_PASSWORD = 10;

/**
 * The studio desk is not a public sign-up. An account can only be set up — and
 * only signed in to — for an address listed in ADMIN_EMAILS on the Convex
 * deployment. Anything else is rejected before a user row is ever written.
 */
function assertAllowed(email: string) {
  if (studioEmails().length === 0) {
    throw new ConvexError(
      "No studio accounts are configured yet. Set ADMIN_EMAILS on the Convex deployment.",
    );
  }
  if (!isStudioEmail(email)) {
    throw new ConvexError("That address does not have access to the studio desk.");
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "").toLowerCase().trim();
        assertAllowed(email);
        return { email, name: String(params.name ?? email.split("@")[0]) };
      },
      validatePasswordRequirements(password) {
        if (password.length < MIN_PASSWORD) {
          throw new ConvexError(`Use at least ${MIN_PASSWORD} characters for the password.`);
        }
      },
    }),
  ],
});
