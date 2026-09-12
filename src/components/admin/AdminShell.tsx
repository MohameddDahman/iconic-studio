"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { STUDIO } from "@/lib/routes";
import { describeError } from "./ui";

const DESK = [
  { href: "/admin", label: "Overview", sheet: "X-900" },
  { href: "/admin/projects", label: "Projects", sheet: "X-910" },
  { href: "/admin/media", label: "Photographs", sheet: "X-920" },
  { href: "/admin/reviews", label: "Reviews", sheet: "X-930" },
  { href: "/admin/monograph", label: "Monograph", sheet: "X-940" },
  { href: "/admin/walkthrough", label: "Rooms", sheet: "X-950" },
  { href: "/admin/enquiries", label: "Enquiries", sheet: "X-960" },
  { href: "/admin/settings", label: "Settings", sheet: "X-970" },
];

/** Must match the rule on the Convex deployment, in convex/auth.ts. */
const MIN_PASSWORD = 10;

type Flow = "signIn" | "signUp";

/** The auth library answers in codes; the desk answers in sentences. */
function signInMessage(error: unknown, flow: Flow) {
  const text = describeError(error);
  if (/InvalidAccountId/.test(text)) {
    return "There is no account for that address yet. Choose “Set up your account” to create one.";
  }
  if (/InvalidSecret/.test(text)) return "That password is not right.";
  if (/TooManyFailedAttempts/.test(text)) return "Too many attempts. Wait a few minutes and try again.";
  if (/already exists/.test(text)) return "That address already has an account. Sign in instead.";
  if (/Invalid password/.test(text)) return `Use at least ${MIN_PASSWORD} characters for the password.`;
  if (/does not have access|No studio accounts|at least \d+ characters/.test(text)) return text;
  return flow === "signUp"
    ? "The account could not be set up. Check the address and try again."
    : "Those details were not accepted. Check the address and password.";
}

const fieldClass =
  "min-h-12 border-b border-rule-strong bg-transparent py-3 outline-none transition-colors focus:border-accent";

const bigButtonClass =
  "min-h-12 cursor-pointer border border-rule-strong px-8 py-4 transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-50";

function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const settingUp = flow === "signUp";

  return (
    <div className="sheet flex min-h-dvh items-center justify-center py-24">
      <div className="w-full max-w-md">
        <p className="annotation mb-6 text-accent">X-900 — Studio desk</p>
        <h1 className="inked text-d2 leading-[0.94] font-light">{STUDIO.name}</h1>
        <p className="mt-4 text-on-surface-muted">
          {settingUp
            ? "Choose a password for your studio address. You only do this once."
            : "Sign in to add projects, upload photographs and answer enquiries."}
        </p>

        <div className="mt-10 grid grid-cols-2 border border-rule">
          {(["signIn", "signUp"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={flow === option}
              onClick={() => {
                setFlow(option);
                setError(null);
              }}
              className={cn(
                "condensed min-h-11 cursor-pointer px-3 text-label tracking-[0.14em] uppercase transition-colors duration-300",
                flow === option ? "bg-accent/15 text-accent" : "text-on-surface-muted hover:text-on-surface",
              )}
            >
              {option === "signIn" ? "Sign in" : "Set up your account"}
            </button>
          ))}
        </div>

        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (settingUp && data.get("password") !== data.get("confirm")) {
              setError("The two passwords are not the same.");
              return;
            }
            data.delete("confirm");
            data.set("flow", flow);
            setBusy(true);
            setError(null);
            try {
              await signIn("password", data);
            } catch (err) {
              setError(signInMessage(err, flow));
            } finally {
              setBusy(false);
            }
          }}
        >
          {error && (
            <p role="alert" className="border border-accent px-4 py-3 text-sm text-accent">
              {error}
            </p>
          )}

          <label className="flex flex-col gap-2">
            <span className="annotation text-on-surface-faint">Studio email</span>
            <input name="email" type="email" required autoComplete="username" className={fieldClass} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="annotation text-on-surface-faint">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={settingUp ? MIN_PASSWORD : undefined}
              autoComplete={settingUp ? "new-password" : "current-password"}
              className={fieldClass}
            />
            {settingUp && (
              <span className="text-xs text-on-surface-faint">At least {MIN_PASSWORD} characters.</span>
            )}
          </label>

          {settingUp && (
            <label className="flex flex-col gap-2">
              <span className="annotation text-on-surface-faint">Password again</span>
              <input name="confirm" type="password" required autoComplete="new-password" className={fieldClass} />
            </label>
          )}

          <button type="submit" disabled={busy} className={cn("mt-2", bigButtonClass)}>
            <span className="condensed text-label tracking-[0.18em] uppercase">
              {busy ? "Checking" : settingUp ? "Create the account" : "Sign in"}
            </span>
          </button>
        </form>

        <div className="mt-10 space-y-3 border-t border-rule pt-6 text-sm text-on-surface-faint">
          <p>
            Only the addresses listed in <code className="text-accent">ADMIN_EMAILS</code> on the Convex
            deployment can set up an account — there is no public sign-up — and taking an address off the list
            locks it out straight away.
          </p>
          <p>Forgotten the password? Ask the developer to clear the account, then set it up again.</p>
        </div>
      </div>
    </div>
  );
}

function Checking() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="sheet flex min-h-dvh flex-col justify-center gap-4 py-24">
      <p className="annotation text-on-surface-faint">Checking your session…</p>
      {slow && (
        <p className="text-sm text-on-surface-muted">
          Taking longer than it should.{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer text-accent underline underline-offset-4"
          >
            Reload the desk
          </button>
          .
        </p>
      )}
    </div>
  );
}

function NoAccess({ email }: { email: string }) {
  const { signOut } = useAuthActions();
  return (
    <div className="sheet flex min-h-dvh items-center justify-center py-24">
      <div className="w-full max-w-md">
        <p className="annotation mb-6 text-accent">X-900 — No access</p>
        <h1 className="inked text-d3 leading-[0.96] font-light">This account cannot use the desk.</h1>
        <p className="mt-4 text-on-surface-muted">
          {email || "This address"} is no longer on the list of studio addresses. If that is a mistake, ask the
          developer to add it to <code className="text-accent">ADMIN_EMAILS</code> again.
        </p>
        <button type="button" onClick={() => void signOut()} className={cn("mt-8", bigButtonClass)}>
          <span className="condensed text-label tracking-[0.18em] uppercase">Sign out</span>
        </button>
      </div>
    </div>
  );
}

function DeskLayout({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const waiting = useQuery(api.inquiries.waiting);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-b border-rule lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-5 px-6 py-6 lg:gap-8 lg:py-7">
          <div>
            <Link href="/" className="inked text-lead tracking-[0.28em] uppercase">
              Iconic
            </Link>
            <p className="annotation mt-2 text-on-surface-faint">Studio desk</p>
          </div>

          <nav
            aria-label="Studio desk"
            className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:flex-1 lg:overflow-visible lg:px-0"
          >
            <ul className="flex gap-x-6 whitespace-nowrap lg:flex-col lg:gap-y-1">
              {DESK.map((item) => {
                const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
                const badge = item.href === "/admin/enquiries" ? (waiting ?? 0) : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 transition-colors duration-300",
                        active ? "text-accent" : "text-on-surface-muted hover:text-on-surface",
                      )}
                    >
                      <span className="annotation hidden w-11 shrink-0 opacity-60 lg:inline">{item.sheet}</span>
                      <span className="condensed text-label tracking-wide uppercase">{item.label}</span>
                      {badge > 0 && (
                        <span className="annotation min-w-6 bg-accent px-1.5 py-0.5 text-center text-night tabular-nums">
                          {badge}
                          <span className="sr-only"> waiting</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-wrap items-center gap-x-6 border-t border-rule pt-4 lg:flex-col lg:items-start lg:gap-2 lg:pt-5">
            <p className="annotation w-full truncate text-on-surface-faint" title={email}>
              {email}
            </p>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="annotation flex min-h-11 items-center text-on-surface-faint transition-colors hover:text-on-surface"
            >
              View the site
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="annotation flex min-h-11 cursor-pointer items-center text-on-surface-faint transition-colors hover:text-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-6 py-10 lg:px-12 lg:py-14">{children}</div>
    </div>
  );
}

/** Signed in is not enough: the address has to still be on the studio list. */
function Desk({ children }: { children: ReactNode }) {
  const viewer = useQuery(api.studio.viewer);
  // Null only for a moment, while a fresh session reaches the server.
  if (!viewer) return <Checking />;
  if (!viewer.allowed) return <NoAccess email={viewer.email} />;
  return <DeskLayout email={viewer.email}>{children}</DeskLayout>;
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <Checking />
      </AuthLoading>

      <Unauthenticated>
        <SignIn />
      </Unauthenticated>

      <Authenticated>
        <Desk>{children}</Desk>
      </Authenticated>
    </>
  );
}
