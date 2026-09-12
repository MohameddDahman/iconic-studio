"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Btn, Chip, DeskHeader, Empty, Notice, useRun } from "./ui";
import { cn } from "@/lib/utils";

interface Enquiry {
  _id: Id<"inquiries">;
  name: string;
  email: string;
  subject: string;
  space?: string;
  message: string;
  budget?: string;
  handled: boolean;
  createdAt: number;
}

type View = "waiting" | "answered" | "all";

const when = (ms: number) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));

export default function EnquiriesDesk() {
  const enquiries = useQuery(api.inquiries.list) as Enquiry[] | undefined;
  const setHandled = useMutation(api.inquiries.setHandled);
  const remove = useMutation(api.inquiries.remove);
  const action = useRun();
  const [view, setView] = useState<View>("waiting");
  const [copied, setCopied] = useState<Id<"inquiries"> | null>(null);

  const waiting = enquiries?.filter((e) => !e.handled) ?? [];
  const answered = enquiries?.filter((e) => e.handled) ?? [];
  const shown = view === "waiting" ? waiting : view === "answered" ? answered : (enquiries ?? []);

  const views: { id: View; label: string; count: number }[] = [
    { id: "waiting", label: "Waiting", count: waiting.length },
    { id: "answered", label: "Answered", count: answered.length },
    { id: "all", label: "All", count: enquiries?.length ?? 0 },
  ];

  const copy = async (enquiry: Enquiry) => {
    try {
      await navigator.clipboard.writeText(enquiry.email);
      setCopied(enquiry._id);
      setTimeout(() => setCopied((current) => (current === enquiry._id ? null : current)), 2000);
    } catch {
      // The clipboard can be blocked; the address is on screen to copy by hand.
    }
  };

  return (
    <>
      <DeskHeader
        sheet="X-960"
        title="Enquiries"
        lead={
          enquiries === undefined
            ? "Loading the inbox…"
            : `${waiting.length} waiting for a reply, ${enquiries.length} in total. Newest first.`
        }
      />

      {action.error && (
        <Notice tone="error" className="mb-6">
          {action.error}
        </Notice>
      )}

      {enquiries && enquiries.length > 0 && (
        <div role="group" aria-label="Show" className="mb-6 flex flex-wrap gap-2">
          {views.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
              className={cn(
                "annotation min-h-11 cursor-pointer border px-4 transition-colors",
                view === option.id ? "border-accent text-accent" : "border-rule text-on-surface-muted hover:text-on-surface",
              )}
            >
              {option.label} <span className="tabular-nums opacity-70">{option.count}</span>
            </button>
          ))}
        </div>
      )}

      {enquiries && enquiries.length === 0 && (
        <Empty title="Nothing yet" hint="Everything sent through the contact form lands here, newest first." />
      )}

      {enquiries && enquiries.length > 0 && shown.length === 0 && (
        <Empty
          title={view === "waiting" ? "Nothing waiting" : "Nothing here"}
          hint={view === "waiting" ? "Every enquiry has had a reply." : "No enquiries in this view."}
        />
      )}

      {shown.length > 0 && (
        <ul className="flex flex-col gap-4">
          {shown.map((enquiry) => (
            <li
              key={enquiry._id}
              className={cn("border p-6", enquiry.handled ? "border-rule" : "border-rule-strong")}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="annotation flex flex-wrap items-center gap-3 text-on-surface-faint">
                  <span className={cn(enquiry.handled ? "text-on-surface-muted" : "text-accent")}>{enquiry.name}</span>
                  <span>{when(enquiry.createdAt)}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {enquiry.space && <Chip>{enquiry.space}</Chip>}
                  {enquiry.budget && <Chip>{enquiry.budget}</Chip>}
                  {enquiry.handled && <Chip tone="accent">Answered</Chip>}
                </div>
              </div>

              <p className="inked mb-3 text-lead font-light">{enquiry.subject}</p>
              <p className="max-w-3xl text-sm whitespace-pre-line text-on-surface-muted">{enquiry.message}</p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <a
                  href={`mailto:${enquiry.email}?subject=${encodeURIComponent("Re: " + enquiry.subject)}`}
                  className="condensed inline-flex min-h-11 items-center border border-accent px-5 text-label tracking-[0.14em] text-accent uppercase transition-colors duration-300 hover:bg-accent hover:text-night"
                >
                  Reply by email
                </a>
                <Btn
                  type="button"
                  title="Copy the address"
                  className="tracking-normal normal-case"
                  onClick={() => void copy(enquiry)}
                >
                  {copied === enquiry._id ? "Copied" : enquiry.email}
                </Btn>
                <Btn
                  type="button"
                  onClick={() => void action.run(() => setHandled({ id: enquiry._id, handled: !enquiry.handled }))}
                >
                  {enquiry.handled ? "Mark as waiting" : "Mark answered"}
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Delete the enquiry from ${enquiry.name}? This cannot be undone.`)) {
                      void action.run(() => remove({ id: enquiry._id }));
                    }
                  }}
                >
                  Delete
                </Btn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
