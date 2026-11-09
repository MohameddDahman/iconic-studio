import type { Metadata } from "next";
import Link from "next/link";
import Wordmark from "@/components/chrome/Wordmark";

export const metadata: Metadata = { title: "Page not found" };

const button =
  "condensed inline-flex min-h-11 items-center border border-white/25 px-6 py-3 text-label tracking-[0.18em] uppercase transition-colors duration-300 hover:border-glow hover:text-glow";

export default function NotFound() {
  return (
    <main id="main" data-surface="night" className="flex min-h-dvh items-center bg-night text-bone">
      <div className="sheet w-full py-24">
        <Link href="/" aria-label="Iconic home" className="mb-16 inline-block">
          <Wordmark className="h-9 w-[6rem]" />
        </Link>
        <p className="annotation mb-6 text-glow">404</p>
        <h1 className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
          This page is not <em>here.</em>
        </h1>
        <p className="mt-6 max-w-md text-bone/70">
          The link may be old, or the page may have moved. The studio&rsquo;s work is all in the portfolio.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/projects" className={button}>
            See the projects
          </Link>
          <Link href="/" className={button}>
            Back to the home page
          </Link>
        </div>
      </div>
    </main>
  );
}
