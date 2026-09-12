/**
 * Who may use the studio desk: the addresses in ADMIN_EMAILS on the Convex
 * deployment, comma separated. It is read on every check, so taking an address
 * off the list locks that person out at once — even in the middle of a session.
 */
export function studioEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isStudioEmail(email: string | null | undefined) {
  return Boolean(email) && studioEmails().includes(String(email).trim().toLowerCase());
}
