"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { STUDIO } from "@/lib/routes";
import { describeError } from "./ui";
import DeskChrome from "./DeskChrome";


/** The auth library answers in codes; the desk answers in sentences. */
function signInMessage(error: unknown) {
  const text = describeError(error);
  // Whether the address exists is not something a sign-in page should reveal.
  if (/InvalidAccountId|InvalidSecret/.test(text)) {
    return "That address and password do not match an account.";
  }
  if (/TooManyFailedAttempts/.test(text)) return "Too many attempts. Wait a few minutes and try again.";
  if (/does not have access|No studio accounts/.test(text)) return text;
  return "Those details were not accepted. Check the address and password.";
}

const fieldClass =
  "min-h-12 border-b border-rule-strong bg-transparent py-3 outline-none transition-colors focus:border-accent";

const bigButtonClass =
  "min-h-12 cursor-pointer border border-rule-strong px-8 py-4 transition-colors hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-50";

/** Sign in only. Accounts are made with scripts/create-desk-account.mjs. */
function SignIn() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="sheet flex min-h-dvh items-center justify-center py-24">
      <div className="w-full max-w-md">
        <p className="annotation mb-6 text-accent">X-900 — Studio desk</p>
        <h1 className="inked text-d2 leading-[0.94] font-light">{STUDIO.name}</h1>
        <p className="mt-4 text-on-surface-muted">
          Sign in to add projects, upload photographs and answer enquiries.
        </p>

        <form
          className="mt-10 flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            data.set("flow", "signIn");
            setBusy(true);
            setError(null);
            try {
              await signIn("password", data);
            } catch (err) {
              setError(signInMessage(err));
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
              autoComplete="current-password"
              className={fieldClass}
            />
          </label>

          <button type="submit" disabled={busy} className={cn("mt-2", bigButtonClass)}>
            <span className="condensed text-label tracking-[0.18em] uppercase">
              {busy ? "Checking" : "Sign in"}
            </span>
          </button>
        </form>

        <p className="mt-10 border-t border-rule pt-6 text-sm text-on-surface-faint">
          Forgotten your password? Ask your developer to reset it.
        </p>
      </div>
    </div>
  );
}

/**
 * The desk has never had an account, so nobody can sign in yet. This is shown
 * only while that is true — the moment a password is set it is replaced by the
 * plain sign-in form, for good.
 */
function FirstRun({ email }: { email: string }) {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div className="sheet flex min-h-dvh items-center justify-center py-24">
      <div className="w-full max-w-md">
        <p className="annotation mb-6 text-accent">X-900 — First run</p>
        <h1 className="inked text-d2 leading-[0.94] font-light">{STUDIO.name}</h1>
        <p className="mt-4 text-on-surface-muted">
          The desk has no account yet. Choose a password and you are in. This page
          then becomes a plain sign-in and never comes back.
        </p>

        <form
          className="mt-10 flex flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            data.set("flow", "signUp");
            setBusy(true);
            setError(null);
            try {
              await signIn("password", data);
            } catch (err) {
              setError(signInMessage(err));
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
            <input
              name="email"
              type="email"
              required
              defaultValue={email}
              readOnly={Boolean(email)}
              autoComplete="username"
              className={cn(fieldClass, email && "text-on-surface-muted")}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="annotation flex items-center justify-between text-on-surface-faint">
              Choose a password
              <button
                type="button"
                onClick={() => setShow((on) => !on)}
                className="cursor-pointer text-accent transition-opacity hover:opacity-70"
              >
                {show ? "Hide" : "Show"}
              </button>
            </span>
            <input
              name="password"
              type={show ? "text" : "password"}
              required
              minLength={10}
              autoComplete="new-password"
              className={fieldClass}
            />
            <span className="text-xs text-on-surface-faint">
              At least 10 characters. Show it to check it before you commit — there is no
              way to recover it later.
            </span>
          </label>

          <button type="submit" disabled={busy} className={cn("mt-2", bigButtonClass)}>
            <span className="condensed text-label tracking-[0.18em] uppercase">
              {busy ? "Setting up" : "Set password and sign in"}
            </span>
          </button>
        </form>

        <p className="mt-10 border-t border-rule pt-6 text-sm text-on-surface-faint">
          Do this now: until it is done, whoever opens this page first sets the password.
        </p>
      </div>
    </div>
  );
}

/** Sign in, unless the desk has never had an account at all. */
function Entry() {
  const first = useQuery(api.studio.firstRun);
  if (first === undefined) return <Checking />;
  return first.needed ? <FirstRun email={first.email} /> : <SignIn />;
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
          {email || "This address"} is no longer on the list of studio addresses. If that is a mistake, ask your
          developer to add it back.
        </p>
        <button type="button" onClick={() => void signOut()} className={cn("mt-8", bigButtonClass)}>
          <span className="condensed text-label tracking-[0.18em] uppercase">Sign out</span>
        </button>
      </div>
    </div>
  );
}

function DeskLayout({ email, children }: { email: string; children: ReactNode }) {
  const { signOut } = useAuthActions();

  return (
    <DeskChrome email={email} onSignOut={() => void signOut()}>
      {children}
    </DeskChrome>
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
        <Entry />
      </Unauthenticated>

      <Authenticated>
        <Desk>{children}</Desk>
      </Authenticated>
    </>
  );
}
