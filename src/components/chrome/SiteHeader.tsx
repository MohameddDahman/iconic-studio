"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import TransitionLink from "@/components/motion/TransitionLink";
import { NAV_SHEETS, STUDIO } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Surface = "night" | "day";

/** The mark: an open doorway inside a square — the moment of walking into a room. */
export function IconicMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={className}>
      <rect x="1.5" y="1.5" width="25" height="25" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 26.5V13.2a5 5 0 0 1 10 0v13.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function RollLabel({ children }: { children: string }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-cut group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-full block text-accent transition-transform duration-500 ease-cut group-hover:-translate-y-full"
      >
        {children}
      </span>
    </span>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [surface, setSurface] = useState<Surface>("night");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /**
   * The header takes the colours of whatever section is passing beneath it,
   * steps out of the way while reading downwards, and returns the moment the
   * reader scrolls back up.
   */
  useGSAP(
    () => {
      const sections = gsap.utils
        .toArray<HTMLElement>("[data-surface]")
        .filter((el) => el.tagName !== "HTML" && !el.closest("header") && !el.closest('[role="dialog"]'));

      const triggers = sections.map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: "top 40px",
          end: "bottom 40px",
          onToggle: (self) => {
            if (self.isActive) setSurface((el.dataset.surface as Surface) ?? "night");
          },
        }),
      );

      const watcher = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          setScrolled(y > 40);
          if (y < 240) setHidden(false);
          else setHidden(self.direction === 1);
        },
      });

      return () => {
        triggers.forEach((t) => t.kill());
        watcher.kill();
      };
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  /* Reset on route change — adjusting during render avoids painting the old state once. */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
    if (hidden) setHidden(false);
  }

  /* Escape, focus trap, and scroll lock while the menu is open. */
  useEffect(() => {
    if (!menuOpen) return;
    const node = menuRef.current;
    if (!node) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter(
        (el) => el.offsetParent !== null,
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [toggleRef.current, ...focusables()].filter(Boolean) as HTMLElement[];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [menuOpen]);

  /* Menu entrance — the panel drops, then the rooms of the site arrive. */
  useGSAP(
    () => {
      if (!menuOpen || !menuRef.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline()
          .fromTo(
            menuRef.current!.querySelector("[data-menu-panel]"),
            { clipPath: "inset(0% 0% 100% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "cut" },
          )
          .fromTo(
            menuRef.current!.querySelectorAll("[data-menu-item]"),
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.8, ease: "settle", stagger: 0.05 },
            0.3,
          );
      });
      return () => mm.revert();
    },
    { dependencies: [menuOpen] },
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        data-surface={menuOpen ? "night" : surface}
        className={cn(
          "fixed inset-x-0 top-0 border-b text-on-surface transition-[transform,background-color,border-color] duration-700 ease-cut",
          menuOpen ? "z-[110] border-transparent" : "z-[80]",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
          scrolled && !menuOpen ? "border-rule bg-surface/95" : "border-transparent",
        )}
      >
        <div className="sheet flex h-[4.5rem] items-center justify-between gap-6 md:h-20">
          <TransitionLink href="/" className="group flex items-center gap-3" aria-label={`${STUDIO.name} — home`}>
            <IconicMark className="size-7 transition-transform duration-700 ease-cut group-hover:rotate-90" />
            <span className="flex flex-col leading-none">
              <span className="text-[1.02rem] font-[620] tracking-[0.42em] uppercase [font-variation-settings:'wdth'_125]">
                Iconic
              </span>
              <span className="eyebrow mt-1.5 hidden text-[0.5rem] tracking-[0.34em] whitespace-nowrap text-on-surface-faint sm:block">
                Architecture · Interiors · Alexandria
              </span>
            </span>
          </TransitionLink>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7 xl:gap-10">
              {NAV_SHEETS.map((sheet) => {
                const active = pathname === sheet.href || pathname.startsWith(sheet.href + "/");
                return (
                  <li key={sheet.key}>
                    <TransitionLink
                      href={sheet.href}
                      aria-current={active ? "page" : undefined}
                      className="group relative flex cursor-pointer items-start gap-1.5 py-2 text-[0.8125rem] font-[460] tracking-[0.02em]"
                    >
                      <RollLabel>{sheet.label}</RollLabel>
                      <span className="annotation text-[0.55rem] text-on-surface-faint">{sheet.sheet}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute bottom-0 left-0 h-px bg-current transition-[width] duration-500 ease-cut",
                          active ? "w-full" : "w-0",
                        )}
                      />
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-rule-strong pr-2 pl-4 lg:hidden"
            >
              <span className="eyebrow whitespace-nowrap">{menuOpen ? "Close" : "Menu"}</span>
              <span aria-hidden="true" className="grid size-7 place-items-center">
                <span className="flex h-3 w-4.5 flex-col justify-between">
                  <span
                    className={cn(
                      "block h-px w-full bg-current transition-transform duration-500 ease-cut",
                      menuOpen && "translate-y-[5.5px] rotate-45",
                    )}
                  />
                  <span
                    className={cn(
                      "block h-px w-full bg-current transition-transform duration-500 ease-cut",
                      menuOpen && "-translate-y-[5.5px] -rotate-45",
                    )}
                  />
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          id="site-menu"
          ref={menuRef}
          data-surface="night"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-[100] text-on-surface lg:hidden"
        >
          <div data-menu-panel className="cove absolute inset-0 bg-night-deep" />

          <div className="sheet relative flex h-full flex-col overflow-y-auto pt-28 pb-10">
            <nav aria-label="Primary" className="flex-1">
              <ul className="flex flex-col">
                {NAV_SHEETS.map((sheet) => (
                  <li key={sheet.key} className="overflow-hidden border-b border-rule">
                    <TransitionLink
                      href={sheet.href}
                      onClick={closeMenu}
                      data-menu-item
                      className="flex items-baseline justify-between gap-6 py-4"
                    >
                      <span className="inked text-[clamp(2.4rem,10vw,4.2rem)] leading-[1.02]">{sheet.label}</span>
                      <span className="annotation text-accent">{sheet.sheet}</span>
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div data-menu-item className="flex flex-wrap items-center justify-between gap-4 pt-10">
              <a
                href={STUDIO.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="eyebrow inline-flex min-h-11 items-center text-on-surface-muted"
              >
                Instagram ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
