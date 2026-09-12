import TransitionLink from "@/components/motion/TransitionLink";
import { cn } from "@/lib/utils";

/**
 * The one call-to-action style on the site. A pill whose label rolls over and
 * whose fill rises in brass on hover; the arrow tips toward where it goes.
 * Colours come from the surface it sits on, so it works on paper and on dark.
 */
export default function CtaLink({
  href,
  children,
  variant = "solid",
  size = "md",
  className,
}: {
  href: string;
  children: string;
  variant?: "solid" | "outline";
  size?: "sm" | "md";
  className?: string;
}) {
  const solid = variant === "solid";

  return (
    <TransitionLink
      href={href}
      className={cn(
        "group relative isolate inline-flex shrink-0 cursor-pointer items-center overflow-hidden rounded-full transition-[color,border-color] duration-500",
        size === "md" ? "h-13 gap-5 pr-1.5 pl-7" : "h-11 gap-4 pr-1 pl-5",
        solid
          ? "bg-on-surface text-surface hover:text-night"
          : "border border-rule-strong text-on-surface hover:border-transparent hover:text-night",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 translate-y-[101%] rounded-full bg-glow transition-transform duration-700 ease-cut group-hover:translate-y-0"
      />
      <span className="relative block overflow-hidden">
        <span className="eyebrow block transition-transform duration-500 ease-cut group-hover:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="eyebrow absolute inset-x-0 top-full block transition-transform duration-500 ease-cut group-hover:-translate-y-full"
        >
          {children}
        </span>
      </span>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center rounded-full transition-transform duration-500 ease-cut group-hover:-rotate-45",
          size === "md" ? "size-10" : "size-8",
          solid ? "bg-surface text-on-surface" : "bg-on-surface text-surface",
        )}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
          <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </span>
    </TransitionLink>
  );
}
