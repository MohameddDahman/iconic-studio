"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SEED_SETTINGS } from "@/lib/seed";
import type { StudioLink, StudioSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Btn, DeskHeader, Field, Notice, Panel, inputClass, useLeaveWarning, useRun } from "./ui";

type Added = "whatsapp" | "mapUrl" | "links";

/** A row saved before WhatsApp, the map and the links existed has none of them. */
type Saved = Omit<StudioSettings, Added> & Partial<Pick<StudioSettings, Added>>;

/** The address stays exactly as typed — new lines and all — until it is saved. */
type Draft = Omit<StudioSettings, "address"> & { address: string };

const draftFrom = (settings: Saved): Draft => ({
  name: settings.name,
  tagline: settings.tagline,
  intro: settings.intro,
  email: settings.email,
  phone: settings.phone,
  whatsapp: settings.whatsapp ?? "",
  address: settings.address.join("\n"),
  instagram: settings.instagram,
  instagramUrl: settings.instagramUrl,
  mapUrl: settings.mapUrl ?? "",
  links: (settings.links ?? []).map((link) => ({ label: link.label, url: link.url })),
});

export default function SettingsDesk() {
  const settings = useQuery(api.settings.get);
  const save = useMutation(api.settings.save);
  const saving = useRun();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(SEED_SETTINGS));
  const [initial, setInitial] = useState(() => JSON.stringify(draftFrom(SEED_SETTINGS)));

  // Seed from the saved row once it arrives — not on every live update, which
  // would overwrite edits in progress.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (settings && settings._id !== seededFor) {
    setSeededFor(settings._id);
    const next = draftFrom(settings);
    setDraft(next);
    setInitial(JSON.stringify(next));
  }

  const dirty = JSON.stringify(draft) !== initial;
  useLeaveWarning(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setLink = (i: number, patch: Partial<StudioLink>) =>
    set(
      "links",
      draft.links.map((link, k) => (k === i ? { ...link, ...patch } : link)),
    );

  const header = (
    <DeskHeader
      sheet="X-970"
      title="Settings"
      lead="The studio’s own details, used in the footer, on the contact page and in the page titles."
    />
  );

  // Until the saved details arrive, the form would show the placeholders instead.
  if (settings === undefined) {
    return (
      <>
        {header}
        <p className="annotation text-on-surface-faint">Loading…</p>
      </>
    );
  }

  return (
    <>
      {header}

      {settings === null && (
        <Notice tone="warning" className="mb-6 max-w-3xl">
          These are the placeholder details the site is showing. Replace them with the studio’s own and save.
        </Notice>
      )}

      <form
        className="flex max-w-3xl flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          void saving.run(async () => {
            await save({
              ...draft,
              address: draft.address
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
              links: draft.links.filter((link) => link.label.trim() || link.url.trim()),
            });
            setInitial(JSON.stringify(draft));
          });
        }}
      >
        <Panel className="grid gap-5 sm:grid-cols-2">
          <Field label="Studio name" hint="The wordmark. Short.">
            <input className={inputClass} value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className={inputClass} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Introduction" className="sm:col-span-2" hint="Two sentences at most.">
            <textarea rows={3} className={inputClass} value={draft.intro} onChange={(e) => set("intro", e.target.value)} />
          </Field>
        </Panel>

        <Panel className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone">
            <input type="tel" className={inputClass} value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp" hint="The full number with the country code. Empty hides the WhatsApp link.">
            <input
              type="tel"
              className={inputClass}
              value={draft.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>
          <Field label="Email" className="sm:col-span-2" hint="Empty keeps email off the site.">
            <input type="email" className={inputClass} value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field
            label="Address"
            className="sm:col-span-2"
            hint="One line of the address per line."
          >
            <textarea
              rows={4}
              className={inputClass}
              value={draft.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field
            label="Google Maps link"
            className="sm:col-span-2"
            hint="The share link from the studio’s Google Maps listing. The contact page’s map pins the place it points to."
          >
            <input type="url" className={inputClass} value={draft.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
          </Field>
          <Field label="Instagram handle" hint="Without the @.">
            <input className={inputClass} value={draft.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </Field>
          <Field label="Instagram link">
            <input
              type="url"
              className={inputClass}
              value={draft.instagramUrl}
              onChange={(e) => set("instagramUrl", e.target.value)}
            />
          </Field>
        </Panel>

        <Panel className="flex flex-col gap-4">
          <div>
            <p className="annotation text-on-surface-faint">Links</p>
            <p className="mt-1.5 text-sm text-on-surface-muted">
              Everywhere else the studio is online — shown on the contact page and in the footer, in this order.
            </p>
          </div>

          {draft.links.length > 0 && (
            <ul className="flex flex-col gap-3">
              {draft.links.map((link, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]"
                >
                  <input
                    aria-label={`Link ${i + 1} name`}
                    placeholder="Facebook"
                    className={cn(inputClass, "col-span-2 sm:col-span-1")}
                    value={link.label}
                    onChange={(e) => setLink(i, { label: e.target.value })}
                  />
                  <input
                    aria-label={`Link ${i + 1} address`}
                    type="url"
                    placeholder="https://"
                    className={inputClass}
                    value={link.url}
                    onChange={(e) => setLink(i, { url: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${link.label || `link ${i + 1}`}`}
                    onClick={() =>
                      set(
                        "links",
                        draft.links.filter((_, k) => k !== i),
                      )
                    }
                    className="annotation flex min-h-11 cursor-pointer items-center justify-center border border-rule px-3 text-on-surface-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <Btn type="button" onClick={() => set("links", [...draft.links, { label: "", url: "" }])}>
              Add a link
            </Btn>
          </div>
        </Panel>

        {saving.error && <Notice tone="error">{saving.error}</Notice>}

        <div className="flex items-center gap-4">
          <Btn type="submit" variant="primary" disabled={saving.busy || (!dirty && settings !== null)}>
            {saving.busy ? "Saving" : "Save settings"}
          </Btn>
          <p role="status" className="annotation text-on-surface-faint">
            {saving.done && !dirty ? <span className="text-accent">Saved</span> : dirty ? "Unsaved changes" : null}
          </p>
        </div>
      </form>
    </>
  );
}
