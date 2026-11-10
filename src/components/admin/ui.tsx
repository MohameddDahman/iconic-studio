"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ConvexError } from "convex/values";
import baked from "@/lib/baked-photos.json";
import { cn } from "@/lib/utils";

export function DeskHeader({
  sheet,
  title,
  lead,
  action,
}: {
  sheet: string;
  title: string;
  lead?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-6">
      <div>
        <p className="annotation mb-4 text-accent">{sheet}</p>
        <h1 className="inked text-d3 leading-[0.96] font-light">{title}</h1>
        {lead && <p className="mt-3 max-w-xl text-sm text-on-surface-muted">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

export const inputClass =
  "min-h-11 w-full min-w-0 border border-rule bg-surface-raised px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="annotation text-on-surface-faint">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-on-surface-faint">{hint}</span>}
      {error && <span className="text-xs text-accent">{error}</span>}
    </label>
  );
}

export function Btn({
  children,
  variant = "ghost",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button
      {...rest}
      className={cn(
        "condensed inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border px-5 py-2.5 text-label tracking-[0.14em] uppercase transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "border-accent text-accent hover:bg-accent hover:text-night",
        variant === "ghost" && "border-rule text-on-surface-muted hover:border-rule-strong hover:text-on-surface",
        variant === "danger" && "border-rule text-on-surface-faint hover:border-red-500/70 hover:text-red-400",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border border-rule bg-surface-raised p-6", className)}>{children}</div>
  );
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="border border-dashed border-rule px-8 py-16 text-center">
      <p className="inked text-lead font-light">{title}</p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-on-surface-muted">{hint}</p>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 cursor-pointer items-center gap-3"
    >
      <span
        className={cn(
          "relative block h-5 w-9 border transition-colors duration-300",
          checked ? "border-accent bg-accent/25" : "border-rule",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 block h-3 w-3 -translate-y-1/2 transition-all duration-300",
            checked ? "left-[calc(100%-0.9rem)] bg-accent" : "left-1 bg-on-surface-faint",
          )}
        />
      </span>
      <span className="condensed text-label tracking-wide uppercase">{label}</span>
    </button>
  );
}

/** A line of status: what went wrong, what needs attention, or that it worked. */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warning" | "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border px-4 py-3 text-sm",
        tone === "info" && "border-rule text-on-surface-muted",
        tone === "warning" && "border-accent/60 text-accent",
        tone === "error" && "border-red-500/60 text-red-300",
        tone === "success" && "border-rule-strong text-on-surface",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** A small state label: Live, Draft, Evening, Sample content. */
export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent" | "warning";
}) {
  return (
    <span
      className={cn(
        "annotation inline-flex shrink-0 items-center border px-2 py-1 whitespace-nowrap",
        tone === "muted" && "border-rule text-on-surface-faint",
        tone === "accent" && "border-accent/60 text-accent",
        tone === "warning" && "border-red-500/50 text-red-300",
      )}
    >
      {children}
    </span>
  );
}

const PREPARED = (baked as { uuids: Record<string, string> }).uuids;

/**
 * Photographs already prepared as plain files are drawn from their 400px copy,
 * so browsing the library costs nothing against the Convex download allowance.
 * A photograph uploaded since is drawn from Convex as it is.
 */
const deskLoader = ({ src }: { src: string; width: number }) => {
  const uuid = src.match(/\/api\/storage\/([0-9a-f-]{36})/)?.[1];
  const id = uuid ? PREPARED[uuid] : undefined;
  return id ? `/media/live/${id}.w400.webp` : src;
};

/** A photograph on the desk, filling its positioned parent. */
export function DeskPhoto({ src, alt, sizes = "260px" }: { src: string; alt: string; sizes?: string }) {
  return <Image src={src} alt={alt} fill sizes={sizes} loader={deskLoader} className="object-cover" />;
}

/** A photograph thumbnail, with an optional label in its corner. */
export function Thumb({
  src,
  alt = "",
  badge,
  className,
  sizes,
}: {
  src?: string | null;
  alt?: string;
  badge?: ReactNode;
  className?: string;
  /** How wide it is drawn, so the smallest copy that looks sharp is fetched. */
  sizes?: string;
}) {
  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden border border-rule bg-surface-raised", className)}>
      {src && <DeskPhoto src={src} alt={alt} sizes={sizes} />}
      {badge && (
        <span className="annotation absolute top-1.5 left-1.5 bg-night/85 px-1.5 py-0.5 text-accent">
          {badge}
        </span>
      )}
    </div>
  );
}

/** The sentence a person should see when a desk action fails. */
export function describeError(error: unknown) {
  if (error instanceof ConvexError) {
    return typeof error.data === "string" ? error.data : "That was not accepted.";
  }
  if (error instanceof Error) {
    const uncaught = error.message.match(/Uncaught (?:Convex)?Error: ([^\n]+)/);
    if (uncaught) return uncaught[1].trim();
    // Convex keeps the real reason from the browser on a live deployment, and
    // "[Request ID: 1a2b] Server Error" tells nobody what to do next.
    if (/Server Error/.test(error.message)) return "That didn’t go through. Check your connection and try again.";
    return error.message.split("\n")[0].trim();
  }
  return "Something went wrong. Try again.";
}

/**
 * Run a desk action and keep its state: busy while it runs, the reason if it
 * failed, and a short-lived "done" once it worked.
 */
export function useRun() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const pending = timer;
    return () => clearTimeout(pending.current);
  }, []);

  const run = useCallback(async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setDone(false);
    clearTimeout(timer.current);
    try {
      await task();
      setDone(true);
      timer.current = setTimeout(() => setDone(false), 2600);
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { run, busy, error, done, clearError };
}

/** How many editors on the page are holding changes that have not been saved. */
let unsaved = 0;

/**
 * Before moving to another section of the desk. Those moves swap the page
 * without a reload, so the browser's own warning never fires for them. True when
 * there is nothing to lose, or the person has agreed to lose it.
 */
export function confirmLeaving() {
  return unsaved === 0 || window.confirm("You have unsaved changes. Leave without saving them?");
}

/** Ask before the tab is closed, reloaded or moved to another desk section with unsaved changes. */
export function useLeaveWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    unsaved += 1;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      unsaved -= 1;
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);
}
