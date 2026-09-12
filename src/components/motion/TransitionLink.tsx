"use client";

import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useRouteTransition } from "./TransitionProvider";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** Skip the transition for in-page anchors or downloads. */
  plain?: boolean;
};

const isModified = (e: MouseEvent<HTMLAnchorElement>) =>
  e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

/**
 * A real anchor — crawlable, middle-clickable, copyable — that hands plain
 * left-clicks to the section-cut transition instead of the browser.
 */
const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, plain, onClick, onPointerEnter, onFocus, children, ...rest },
  ref,
) {
  const { navigate, prefetch } = useRouteTransition();
  const external = /^([a-z]+:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
  const internal = !external && !plain && !href.startsWith("#");

  return (
    <a
      ref={ref}
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : null)}
      onPointerEnter={(e) => {
        if (internal) prefetch(href);
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        if (internal) prefetch(href);
        onFocus?.(e);
      }}
      onClick={(e) => {
        onClick?.(e);
        if (!internal || e.defaultPrevented || isModified(e)) return;
        e.preventDefault();
        navigate(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
});

export default TransitionLink;
