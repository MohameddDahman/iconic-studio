"use client";

import { useMemo, useState } from "react";
import { scrollToTop } from "@/components/motion/ScrollSync";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import MediaLibrary, { type MediaRow } from "./MediaLibrary";
import {
  Btn,
  Chip,
  DeskHeader,
  Empty,
  Field,
  Notice,
  Panel,
  Thumb,
  Toggle,
  inputClass,
  useLeaveWarning,
  useRun,
} from "./ui";

interface SpreadRow {
  _id: Id<"spreads">;
  folio: number;
  kicker: string;
  title: string;
  body: string;
  projectSlug?: string;
  published: boolean;
  order: number;
  media: { _id: Id<"media">; src: string; alt: string } | null;
  mediaB: { _id: Id<"media">; src: string; alt: string } | null;
}

interface Draft {
  folio: string;
  kicker: string;
  title: string;
  body: string;
  projectSlug: string;
  published: boolean;
  mediaId?: Id<"media">;
  mediaBId?: Id<"media">;
}

const blank = (folio: number): Draft => ({
  folio: String(folio),
  kicker: `Apartment · ${new Date().getFullYear()}`,
  title: "",
  body: "",
  projectSlug: "",
  published: true,
});

const draftFrom = (spread: SpreadRow): Draft => ({
  folio: String(spread.folio),
  kicker: spread.kicker,
  title: spread.title,
  body: spread.body,
  projectSlug: spread.projectSlug ?? "",
  published: spread.published,
  mediaId: spread.media?._id,
  mediaBId: spread.mediaB?._id,
});

type Slot = "plate" | "inset";

export default function MonographDesk() {
  const spreads = useQuery(api.spreads.listAll) as SpreadRow[] | undefined;
  const library = useQuery(api.media.list) as MediaRow[] | undefined;
  const projects = useQuery(api.projects.options);
  const create = useMutation(api.spreads.create);
  const update = useMutation(api.spreads.update);
  const remove = useMutation(api.spreads.remove);
  const reorder = useMutation(api.spreads.reorder);
  const editor = useRun();
  const list = useRun();

  const [editing, setEditing] = useState<Id<"spreads"> | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(() => blank(8));
  const [initial, setInitial] = useState("");
  const [picker, setPicker] = useState<Slot | null>(null);

  const photos = useMemo(() => new Map((library ?? []).map((photo) => [photo._id, photo])), [library]);

  const dirty = editing !== null && JSON.stringify(draft) !== initial;
  useLeaveWarning(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const open = (spread?: SpreadRow) => {
    if (dirty && !confirm("Discard the changes to the spread you are editing?")) return;
    const nextFolio = spreads?.length ? Math.max(...spreads.map((s) => s.folio)) + 8 : 8;
    const next = spread ? draftFrom(spread) : blank(nextFolio);
    setDraft(next);
    setInitial(JSON.stringify(next));
    setPicker(null);
    setEditing(spread ? spread._id : "new");
    editor.clearError();
    // The form opens above the list, so a click low on the page would seem to do nothing.
    scrollToTop();
  };

  const close = () => {
    if (dirty && !confirm("Discard the changes to this spread?")) return;
    setPicker(null);
    setEditing(null);
    scrollToTop();
  };

  const save = async () => {
    await editor.run(async () => {
      const payload = {
        folio: Number(draft.folio) || 8,
        kicker: draft.kicker.trim(),
        title: draft.title.trim(),
        body: draft.body.trim(),
        projectSlug: draft.projectSlug || undefined,
        published: draft.published,
        mediaId: draft.mediaId,
        mediaBId: draft.mediaBId,
      };
      if (!payload.title) throw new Error("Give the spread a title.");
      if (editing === "new") await create(payload);
      else if (editing) await update({ id: editing, ...payload });
      setPicker(null);
      setEditing(null);
    });
    scrollToTop();
  };

  const move = (index: number, delta: number) => {
    if (!spreads) return;
    const ids = spreads.map((s) => s._id);
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void list.run(() => reorder({ ids }));
  };

  const slotId = (slot: Slot) => (slot === "plate" ? draft.mediaId : draft.mediaBId);
  const setSlot = (slot: Slot, id: Id<"media"> | undefined) => set(slot === "plate" ? "mediaId" : "mediaBId", id);

  return (
    <>
      <DeskHeader
        sheet="X-940"
        title="Monograph"
        lead="Volume I — the bound catalogue. Each entry is one printed spread: text on the left page, the plate on the right."
        action={
          <Btn type="button" variant="primary" onClick={() => open()}>
            Add a spread
          </Btn>
        }
      />

      <div className="mb-6 flex flex-col gap-3 empty:hidden">
        {list.error && <Notice tone="error">{list.error}</Notice>}
        {editor.done && !editing && <Notice tone="success">Saved.</Notice>}
      </div>

      {editing && (
        <Panel className="mb-8 flex flex-col gap-5">
          {editor.error && <Notice tone="error">{editor.error}</Notice>}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Folio" hint="The printed page number on the left page.">
              <input
                type="number"
                inputMode="numeric"
                className={inputClass}
                value={draft.folio}
                onChange={(e) => set("folio", e.target.value)}
              />
            </Field>
            <Field label="Kicker" hint="Type, stage and year, e.g. Apartment · Built · 2025">
              <input className={inputClass} value={draft.kicker} onChange={(e) => set("kicker", e.target.value)} />
            </Field>
            <Field label="Title" className="sm:col-span-2">
              <input className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Project" hint="Optional. The spread links to its case study." className="sm:col-span-2">
              <select
                className={inputClass}
                value={draft.projectSlug}
                onChange={(e) => set("projectSlug", e.target.value)}
              >
                <option value="">No project</option>
                {projects?.map((project) => (
                  <option key={project.slug} value={project.slug}>
                    {project.title}
                    {project.published ? "" : " (draft)"}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Caption" hint="Two or three sentences. This is the left page.">
            <textarea rows={4} className={inputClass} value={draft.body} onChange={(e) => set("body", e.target.value)} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            {(["plate", "inset"] as const).map((slot) => {
              const id = slotId(slot);
              const photo = id ? photos.get(id) : undefined;
              return (
                <div key={slot} className="flex flex-col gap-3">
                  <p className="annotation text-on-surface-faint">
                    {slot === "plate" ? "Plate — the whole right-hand page" : "Inset — a small second photograph, optional"}
                  </p>
                  {id ? (
                    <Thumb src={photo?.src} alt={photo?.alt} />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center border border-dashed border-rule text-xs text-on-surface-faint">
                      None chosen
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Btn type="button" onClick={() => setPicker(picker === slot ? null : slot)}>
                      {picker === slot ? "Close the library" : id ? "Change" : "Choose"}
                    </Btn>
                    {id && (
                      <Btn type="button" variant="danger" onClick={() => setSlot(slot, undefined)}>
                        Remove
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {draft.published && !draft.mediaId && (
            <Notice tone="warning">A spread needs its plate to appear in the book. Until it has one, it is left out.</Notice>
          )}

          {picker && (
            <div className="border-t border-rule pt-6">
              <h2 className="annotation mb-5 text-accent">
                {picker === "plate" ? "Choose the plate" : "Choose the inset"}
              </h2>
              <MediaLibrary
                mode="select"
                selected={slotId(picker) ? [slotId(picker) as Id<"media">] : []}
                onToggle={(id) => setSlot(picker, slotId(picker) === id ? undefined : id)}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-5">
            <Toggle
              checked={draft.published}
              onChange={(v) => set("published", v)}
              label={draft.published ? "Published" : "Hidden"}
            />
            <div className="flex gap-2">
              <Btn type="button" onClick={close}>
                {dirty ? "Discard" : "Cancel"}
              </Btn>
              <Btn type="button" variant="primary" disabled={editor.busy} onClick={() => void save()}>
                {editor.busy ? "Saving" : "Save"}
              </Btn>
            </div>
          </div>
        </Panel>
      )}

      {spreads === undefined && <p className="annotation text-on-surface-faint">Loading…</p>}

      {spreads && spreads.length === 0 && !editing && (
        <Empty title="The volume is empty" hint="The site shows sample spreads until the first one is added here." />
      )}

      {spreads && spreads.length > 0 && (
        <ul className="flex flex-col">
          {spreads.map((spread, i) => (
            <li
              key={spread._id}
              className="grid items-center gap-4 border-b border-rule py-4 sm:grid-cols-[5rem_1fr_auto]"
            >
              <Thumb src={spread.media?.src} className="w-20" />
              <div className="min-w-0">
                <p className="annotation mb-1.5 flex flex-wrap gap-3 text-on-surface-faint">
                  <span className="text-accent tabular-nums">{String(spread.folio).padStart(3, "0")}</span>
                  <span>{spread.kicker}</span>
                  {!spread.published && <span className="text-accent">Hidden</span>}
                </p>
                <p className="inked truncate text-lead font-light">{spread.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {spread.published && !spread.media && <Chip tone="warning">No plate — left out</Chip>}
                <Btn type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${spread.title} up`}>
                  ↑
                </Btn>
                <Btn
                  type="button"
                  disabled={i === spreads.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${spread.title} down`}
                >
                  ↓
                </Btn>
                <Btn type="button" onClick={() => open(spread)}>
                  Edit
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Remove the “${spread.title}” spread? This cannot be undone.`)) {
                      void list.run(() => remove({ id: spread._id }));
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
