"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Wordmark from "@/components/chrome/Wordmark";
import { cn } from "@/lib/utils";
import { confirmLeaving } from "./ui";

export const DESK = [
  { href: "/admin", label: "Overview", sheet: "X-900" },
  { href: "/admin/projects", label: "Projects", sheet: "X-910" },
  { href: "/admin/media", label: "Photographs", sheet: "X-920" },
  { href: "/admin/reviews", label: "Reviews", sheet: "X-930" },
  { href: "/admin/monograph", label: "Monograph", sheet: "X-940" },
  { href: "/admin/settings", label: "Settings", sheet: "X-970" },
];

const isCurrent = (href: string, pathname: string) =>
  href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

/**
 * The desk chrome. On a wide screen it is a sidebar; on a phone the same list
 * folds behind a Menu button, so a page starts at the top of the screen instead
 * of below a stack of navigation. It takes everything as props, so it can be
 * looked at without a session.
 */
export default function DeskChrome({
  email,
  onSignOut,
  children,
}: {
  email: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const here = DESK.find((item) => isCurrent(item.href, pathname));

  // The menu is a phone-sized thing; leaving it open into the sidebar
  // breakpoint would hide the page behind it.
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 64rem)");
    const close = () => setOpen(false);
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);

  const leave = (event: MouseEvent, href: string) => {
    if (href !== pathname && !confirmLeaving()) event.preventDefault();
    else setOpen(false);
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-rule bg-surface px-6 py-4 lg:hidden">
        <div className="min-w-0">
          <Link href="/" aria-label="Iconic — the public site" onClick={(e) => leave(e, "/")} className="-my-2 inline-block py-2">
            <Wordmark className="h-7 w-[4.67rem]" />
          </Link>
          <p className="annotation mt-1 truncate text-on-surface-faint">{here?.label ?? "Studio desk"}</p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="desk-menu"
          onClick={() => setOpen((was) => !was)}
          className="condensed flex min-h-11 cursor-pointer items-center gap-2 border border-rule-strong px-4 text-label tracking-[0.14em] uppercase transition-colors hover:border-accent hover:text-accent"
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <aside
        id="desk-menu"
        className={cn(
          "border-rule lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r",
          open ? "block border-b" : "hidden",
        )}
      >
        <div className="flex h-full flex-col gap-6 px-6 py-6 lg:gap-8 lg:py-7">
          <div className="hidden lg:block">
            <Link href="/" aria-label="Iconic — the public site" onClick={(e) => leave(e, "/")} className="-my-2 inline-block py-2">
              <Wordmark className="h-8 w-[5.33rem]" />
            </Link>
            <p className="annotation mt-2 text-on-surface-faint">Studio desk</p>
          </div>

          <nav aria-label="Studio desk" className="lg:flex-1">
            <ul className="flex flex-col gap-y-1">
              {DESK.map((item) => {
                const active = isCurrent(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => leave(e, item.href)}
                      className={cn(
                        "flex min-h-11 items-center gap-3 transition-colors duration-300",
                        active ? "text-accent" : "text-on-surface-muted hover:text-on-surface",
                      )}
                    >
                      <span className="annotation w-11 shrink-0 opacity-60">{item.sheet}</span>
                      <span className="condensed text-label tracking-wide uppercase">{item.label}</span>
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
              onClick={() => {
                if (confirmLeaving()) onSignOut();
              }}
              className="annotation flex min-h-11 cursor-pointer items-center text-on-surface-faint transition-colors hover:text-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-6 py-8 lg:px-12 lg:py-14">{children}</div>
    </div>
  );
}
