"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SEED_SETTINGS } from "@/lib/seed";
import type { StudioSettings } from "@/lib/types";
import { Btn, DeskHeader, Field, Notice, Panel, inputClass, useLeaveWarning, useRun } from "./ui";

/** The address stays exactly as typed — new lines and all — until it is saved. */
type Draft = Omit<StudioSettings, "address"> & { address: string };

const draftFrom = (settings: StudioSettings): Draft => ({
  name: settings.name,
  tagline: settings.tagline,
  intro: settings.intro,
  email: settings.email,
  phone: settings.phone,
  address: settings.address.join("\n"),
  instagram: settings.instagram,
  instagramUrl: settings.instagramUrl,
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

  return (
    <>
      <DeskHeader
        sheet="X-970"
        title="Settings"
        lead="The studio’s own details, used in the footer, on the contact page and in the page titles."
      />

      {settings === null && (
        <Notice tone="warning" className="mb-6 max-w-3xl">
          These are the placeholder details the site is showing. Replace them with the studio’s own and save.
        </Notice>
      )}

      <form
        className="max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          void saving.run(async () => {
            await save({
              ...draft,
              address: draft.address
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
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
          <Field label="Email">
            <input type="email" className={inputClass} value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input type="tel" className={inputClass} value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Address" className="sm:col-span-2" hint="One line of the address per line.">
            <textarea
              rows={3}
              className={inputClass}
              value={draft.address}
              onChange={(e) => set("address", e.target.value)}
            />
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

        {saving.error && (
          <Notice tone="error" className="mt-6">
            {saving.error}
          </Notice>
        )}

        <div className="mt-6 flex items-center gap-4">
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
