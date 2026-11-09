"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Chip, DeskHeader, Panel } from "./ui";

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

interface Section {
  href: string;
  label: string;
  /** Live: the public section shows the studio's own records. Sample: it still shows the sample content. */
  state?: "live" | "sample";
  summary: string;
  attention?: string;
}

export default function Overview() {
  const data = useQuery(api.studio.overview);

  const header = (
    <DeskHeader
      sheet="X-900"
      title="The desk"
      lead="Everything on the public site is edited from here. A section with nothing published yet keeps showing sample content."
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
      state: data.projects.onSite ? "live" : "sample",
      summary: `${count(data.projects.onSite, "project")} on the site · ${count(data.projects.drafts, "draft")}`,
      attention:
        data.projects.onSite === 0 && data.projects.drafts > 0
          ? `Every project is still a draft, so visitors see the sample projects instead. Open one and switch Draft to Live.`
          : data.projects.withoutPhotos
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
      state: data.reviews.onSite ? "live" : "sample",
      summary: `${count(data.reviews.onSite, "review")} on the site`,
    },
    {
      href: "/admin/monograph",
      label: "Monograph",
      state: data.spreads.onSite ? "live" : "sample",
      summary: `${count(data.spreads.onSite, "spread")} in the volume`,
      attention: data.spreads.withoutPlate
        ? `${count(data.spreads.withoutPlate, "published spread")} without a plate, so left out`
        : undefined,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      state: data.settingsSaved ? "live" : "sample",
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
          <p className="inked text-lead font-light text-accent">The site is still showing sample content.</p>
          <p className="mt-3 max-w-2xl text-sm text-on-surface-muted">
            Nothing is broken — every page shows sample content until the studio publishes its own. Start by
            uploading the photographs, then add the first project. Each section switches over as soon as it
            has something published.
          </p>
        </Panel>
      )}

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { value: data.projects.onSite, label: "Projects on the site" },
          { value: data.media.total, label: "Photographs" },
          { value: data.reviews.onSite, label: "Reviews on the site" },
          { value: data.spreads.onSite, label: "Spreads in the book" },
        ].map((stat) => (
          <Panel key={stat.label}>
            <p className="inked text-d3 leading-none font-light tabular-nums text-accent">
              {String(stat.value).padStart(2, "0")}
            </p>
            <p className="annotation mt-3 text-on-surface-faint">{stat.label}</p>
          </Panel>
        ))}
      </div>

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
                    {section.state === "live" ? "Live" : "Sample content"}
                  </Chip>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
