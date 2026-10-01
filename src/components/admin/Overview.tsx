"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Chip, DeskHeader, Panel } from "./ui";
import { cn } from "@/lib/utils";

const when = (ms: number) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

interface Section {
  href: string;
  label: string;
  /** Live: the public section shows the studio's own records. Seed: it still shows the seed set. */
  state?: "live" | "seed";
  summary: string;
  attention?: string;
}

export default function Overview() {
  const data = useQuery(api.studio.overview);

  const header = (
    <DeskHeader
      sheet="X-900"
      title="The desk"
      lead="Everything on the public site is edited from here. A section with nothing published yet keeps showing the seed content."
    />
  );

  if (data === undefined) {
    return (
      <>
        {header}
        <p className="annotation text-on-surface-faint">Loading…</p>
      </>
    );
  }

  const sections: Section[] = [
    {
      href: "/admin/projects",
      label: "Projects",
      state: data.projects.onSite ? "live" : "seed",
      summary: `${count(data.projects.onSite, "project")} on the site · ${count(data.projects.drafts, "draft")}`,
      attention: data.projects.withoutPhotos
        ? `${count(data.projects.withoutPhotos, "published project")} without a photograph, so not shown`
        : undefined,
    },
    {
      href: "/admin/media",
      label: "Photographs",
      summary: `${count(data.media.total, "photograph")} · ${data.media.evening} with an evening version`,
      attention: data.media.needsDescription
        ? `${count(data.media.needsDescription, "photograph")} still without a description`
        : undefined,
    },
    {
      href: "/admin/reviews",
      label: "Reviews",
      state: data.reviews.onSite ? "live" : "seed",
      summary: `${count(data.reviews.onSite, "review")} on the site`,
    },
    {
      href: "/admin/monograph",
      label: "Monograph",
      state: data.spreads.onSite ? "live" : "seed",
      summary: `${count(data.spreads.onSite, "spread")} in the volume`,
      attention: data.spreads.withoutPlate
        ? `${count(data.spreads.withoutPlate, "published spread")} without a plate, so left out`
        : undefined,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      state: data.settingsSaved ? "live" : "seed",
      summary: data.settingsSaved
        ? "The studio’s own details are saved"
        : "The site still shows placeholder contact details",
    },
  ];

  const nothingLive = sections.every((section) => section.state !== "live");

  return (
    <>
      {header}

      {nothingLive && (
        <Panel className="mb-8 border-accent/50">
          <p className="inked text-lead font-light text-accent">The site is still running on the seed content.</p>
          <p className="mt-3 max-w-2xl text-sm text-on-surface-muted">
            Nothing is broken — every page shows the seed set until the studio publishes its own. Start by
            uploading the original photographs, then add the first project. Each section switches over as soon
            as it has something published.
          </p>
        </Panel>
      )}

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { value: data.projects.onSite, label: "Projects on the site" },
          { value: data.media.total, label: "Photographs" },
          { value: data.enquiries.waiting, label: "Enquiries waiting" },
          { value: data.reviews.onSite, label: "Reviews on the site" },
        ].map((stat) => (
          <Panel key={stat.label}>
            <p className="inked text-d3 leading-none font-light tabular-nums text-accent">
              {String(stat.value).padStart(2, "0")}
            </p>
            <p className="annotation mt-3 text-on-surface-faint">{stat.label}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-10 xl:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="desk-sections">
          <h2 id="desk-sections" className="annotation mb-4 text-accent">
            Sections
          </h2>
          <ul className="flex flex-col border-t border-rule">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="group grid gap-2 border-b border-rule py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-baseline sm:gap-6"
                >
                  <span className="inked text-lead font-light transition-colors duration-300 group-hover:text-accent">
                    {section.label}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-sm text-on-surface-muted">{section.summary}</span>
                    {section.attention && <span className="text-sm text-accent">{section.attention}</span>}
                  </span>
                  {section.state && (
                    <Chip tone={section.state === "live" ? "accent" : "muted"}>
                      {section.state === "live" ? "Live" : "Seed content"}
                    </Chip>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="desk-enquiries">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="desk-enquiries" className="annotation text-accent">
              Latest enquiries
            </h2>
            <Link href="/admin/enquiries" className="annotation text-on-surface-faint transition-colors hover:text-accent">
              All enquiries
            </Link>
          </div>

          {data.enquiries.latest.length === 0 ? (
            <p className="border border-dashed border-rule px-6 py-10 text-center text-sm text-on-surface-muted">
              Nothing yet. Everything sent through the contact form lands here.
            </p>
          ) : (
            <ul className="flex flex-col border-t border-rule">
              {data.enquiries.latest.map((enquiry) => (
                <li key={enquiry._id} className="flex flex-col gap-1.5 border-b border-rule py-4">
                  <p className="annotation flex flex-wrap items-center gap-3 text-on-surface-faint">
                    <span className={cn(enquiry.handled ? "text-on-surface-faint" : "text-accent")}>
                      {enquiry.handled ? "Answered" : "Waiting"}
                    </span>
                    <span>{when(enquiry.createdAt)}</span>
                    {enquiry.space && <span>{enquiry.space}</span>}
                  </p>
                  <p className="truncate text-sm">
                    <span className="text-on-surface">{enquiry.name}</span>{" "}
                    <span className="text-on-surface-muted">— {enquiry.subject}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
