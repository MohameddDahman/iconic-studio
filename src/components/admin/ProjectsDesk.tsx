"use client";

import { useMemo, useState } from "react";
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
import { cn, drawingNumber, slugify } from "@/lib/utils";

const TYPOLOGIES = [
  "Apartment",
  "Villa",
  "Duplex",
  "Penthouse",
  "Chalet",
  "Office",
  "Hospitality",
  "Retail",
  "Healthcare",
  "Commercial",
] as const;
const STAGES = ["Built", "On site", "Design stage"] as const;

interface Photo {
  _id: Id<"media">;
  src: string;
  alt: string;
  night?: { src: string };
}

interface ProjectRow {
  _id: Id<"projects">;
  slug: string;
  title: string;
  reference: string;
  year: number;
  location: string;
  typology: (typeof TYPOLOGIES)[number];
  stage: (typeof STAGES)[number];
  brief: string;
  statement: string[];
  materials: string[];
  facts: { label: string; value: string }[];
  featured: boolean;
  published: boolean;
  /** Built from stock photography — replace or remove before launch. */
  placeholder?: boolean;
  order: number;
  cover: Photo | null;
  gallery: Photo[];
}

/**
 * What the editor holds. Long text stays exactly as typed — blank lines and
 * all — and is only split into paragraphs and lines when it is saved.
 */
interface Draft {
  title: string;
  slug: string;
  reference: string;
  year: string;
  location: string;
  typology: ProjectRow["typology"];
  stage: ProjectRow["stage"];
  brief: string;
  statement: string;
  materials: string;
  facts: { label: string; value: string }[];
  featured: boolean;
  published: boolean;
  placeholder: boolean;
  coverId?: Id<"media">;
  galleryIds: Id<"media">[];
}

const BLANK_FACTS = ["Area", "Ceiling", "Scope", "Handover"].map((label) => ({ label, value: "" }));

const blank = (): Draft => ({
  title: "",
  slug: "",
  reference: drawingNumber(new Date().getFullYear(), 1, "ID"),
  year: String(new Date().getFullYear()),
  location: "",
  typology: "Apartment",
  stage: "Design stage",
  brief: "",
  statement: "",
  materials: "",
  facts: BLANK_FACTS,
  featured: false,
  published: false,
  placeholder: false,
  coverId: undefined,
  galleryIds: [],
});

const toLines = (v: string) => v.split("\n").map((s) => s.trim()).filter(Boolean);
const toParas = (v: string) => v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

const draftFrom = (row: ProjectRow): Draft => ({
  title: row.title,
  slug: row.slug,
  reference: row.reference,
  year: String(row.year),
  location: row.location,
  typology: row.typology,
  stage: row.stage,
  brief: row.brief,
  statement: row.statement.join("\n\n"),
  materials: row.materials.join("\n"),
  facts: row.facts.length ? row.facts : BLANK_FACTS,
  featured: row.featured,
  published: row.published,
  placeholder: Boolean(row.placeholder),
  coverId: row.cover?._id,
  galleryIds: row.gallery.map((g) => g._id),
});

const miniButton =
  "annotation flex min-h-9 min-w-9 cursor-pointer items-center justify-center text-on-surface-muted transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-30";

export default function ProjectsDesk() {
  const projects = useQuery(api.projects.listAll) as ProjectRow[] | undefined;
  const library = useQuery(api.media.list) as MediaRow[] | undefined;
  const create = useMutation(api.projects.create);
  const update = useMutation(api.projects.update);
  const remove = useMutation(api.projects.remove);
  const reorder = useMutation(api.projects.reorder);
  const setPublished = useMutation(api.projects.setPublished);
  const editor = useRun();
  const register = useRun();

  const [editingId, setEditingId] = useState<Id<"projects"> | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [initial, setInitial] = useState("");
  const [picker, setPicker] = useState<"cover" | "gallery" | null>(null);

  const photos = useMemo(() => new Map((library ?? []).map((photo) => [photo._id, photo])), [library]);
  const editing = projects?.find((p) => p._id === editingId);

  /*
   * Seed the form once per project opened. Keying this on the row object would
   * be wrong: Convex hands back a fresh object on every live update, so a
   * reorder — or a save from another tab — would wipe whatever was being
   * typed. Keyed on the id and adjusted during render, it seeds exactly once.
   */
  const seedKey = editingId === "new" ? "new" : editing ? String(editing._id) : null;
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    const next = seedKey === "new" ? blank() : editing ? draftFrom(editing) : null;
    if (next) {
      setDraft(next);
      setInitial(JSON.stringify(next));
    }
  }

  const dirty = editingId !== null && JSON.stringify(draft) !== initial;
  useLeaveWarning(dirty);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const open = (id: Id<"projects"> | "new") => {
    editor.clearError();
    setPicker(null);
    setEditingId(id);
  };

  const close = () => {
    if (dirty && !confirm("Discard the changes to this project?")) return;
    setPicker(null);
    setEditingId(null);
  };

  const save = () =>
    editor.run(async () => {
      const payload = {
        title: draft.title,
        slug: draft.slug || slugify(draft.title),
        reference: draft.reference,
        year: Number(draft.year) || new Date().getFullYear(),
        location: draft.location,
        typology: draft.typology,
        stage: draft.stage,
        brief: draft.brief,
        statement: toParas(draft.statement),
        materials: toLines(draft.materials),
        facts: draft.facts.filter((f) => f.label.trim() && f.value.trim()),
        coverId: draft.coverId,
        galleryIds: draft.galleryIds,
        featured: draft.featured,
        published: draft.published,
        placeholder: draft.placeholder || undefined,
      };
      if (editingId === "new") await create(payload);
      else if (editingId) await update({ id: editingId, ...payload });
      setPicker(null);
      setEditingId(null);
    });

  const destroy = () => {
    if (!editingId || editingId === "new") return;
    if (!confirm(`Delete “${draft.title || "this project"}” permanently? This cannot be undone.`)) return;
    const id = editingId;
    void editor.run(async () => {
      await remove({ id });
      setPicker(null);
      setEditingId(null);
    });
  };

  const move = (index: number, delta: number) => {
    if (!projects) return;
    const ids = projects.map((p) => p._id);
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void register.run(() => reorder({ ids }));
  };

  const moveGallery = (index: number, delta: number) => {
    const ids = [...draft.galleryIds];
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    set("galleryIds", ids);
  };

  const setFact = (index: number, patch: Partial<Draft["facts"][number]>) =>
    set(
      "facts",
      draft.facts.map((fact, i) => (i === index ? { ...fact, ...patch } : fact)),
    );

  /* ---- Editor ---------------------------------------------------------- */
  if (editingId) {
    const cover = draft.coverId ? photos.get(draft.coverId) : undefined;
    const noPhotos = !draft.coverId && draft.galleryIds.length === 0;

    return (
      <>
        <DeskHeader
          sheet={editingId === "new" ? "X-910 / NEW" : draft.reference || "X-910"}
          title={editingId === "new" ? "New project" : draft.title || "Untitled"}
          lead="Everything here appears on the public case study. Leave it as a draft until it reads the way you want."
          action={
            <div className="flex flex-wrap items-center gap-2">
              {editing?.published && (
                <a
                  href={`/projects/${editing.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="annotation mr-3 flex min-h-11 items-center text-on-surface-muted transition-colors hover:text-accent"
                >
                  View on the site
                </a>
              )}
              <Btn type="button" onClick={close}>
                {dirty ? "Discard" : "Close"}
              </Btn>
              <Btn
                type="button"
                variant="primary"
                disabled={editor.busy || !draft.title.trim()}
                onClick={() => void save()}
              >
                {editor.busy ? "Saving" : "Save"}
              </Btn>
            </div>
          }
        />

        <div className="mb-6 flex flex-col gap-3 empty:hidden">
          {editor.error && <Notice tone="error">{editor.error}</Notice>}
          {draft.published && noPhotos && (
            <Notice tone="warning">
              Published, but there is no photograph yet — the project stays off the site until it has one.
            </Notice>
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <div className="flex flex-col gap-6 xl:col-span-2">
            <Panel className="grid gap-5 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <input className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
              <Field label="Reference" hint="The job number, e.g. ID-25-014.">
                <input
                  className={inputClass}
                  value={draft.reference}
                  onChange={(e) => set("reference", e.target.value)}
                />
              </Field>
              <Field label="Web address" hint={`/projects/${draft.slug || slugify(draft.title) || "…"}`}>
                <input
                  className={inputClass}
                  value={draft.slug}
                  placeholder={slugify(draft.title)}
                  onChange={(e) => set("slug", e.target.value)}
                />
              </Field>
              <Field label="Location">
                <input
                  className={inputClass}
                  value={draft.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </Field>
              <Field label="Year">
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                  value={draft.year}
                  onChange={(e) => set("year", e.target.value)}
                />
              </Field>
              <Field label="Property type">
                <select
                  className={inputClass}
                  value={draft.typology}
                  onChange={(e) => set("typology", e.target.value as Draft["typology"])}
                >
                  {TYPOLOGIES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Stage" hint="Say plainly whether this is built or still a render.">
                <select
                  className={inputClass}
                  value={draft.stage}
                  onChange={(e) => set("stage", e.target.value as Draft["stage"])}
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="One-line brief" hint="Used on the cards and in the index." className="sm:col-span-2">
                <input className={inputClass} value={draft.brief} onChange={(e) => set("brief", e.target.value)} />
              </Field>
            </Panel>

            <Panel className="flex flex-col gap-5">
              <Field
                label="Statement"
                hint="Leave a blank line between paragraphs. Write about decisions, not adjectives."
              >
                <textarea
                  rows={10}
                  className={inputClass}
                  value={draft.statement}
                  onChange={(e) => set("statement", e.target.value)}
                />
              </Field>

              <Field label="Specified materials" hint="One per line.">
                <textarea
                  rows={5}
                  className={inputClass}
                  value={draft.materials}
                  onChange={(e) => set("materials", e.target.value)}
                />
              </Field>

              <fieldset>
                <legend className="annotation mb-3 text-on-surface-faint">Facts</legend>
                <div className="flex flex-col gap-2">
                  {draft.facts.map((fact, i) => (
                    <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                      <input
                        aria-label={`Fact ${i + 1} label`}
                        className={inputClass}
                        value={fact.label}
                        placeholder="Area"
                        onChange={(e) => setFact(i, { label: e.target.value })}
                      />
                      <input
                        aria-label={`Fact ${i + 1} value`}
                        className={inputClass}
                        value={fact.value}
                        placeholder="38 m²"
                        onChange={(e) => setFact(i, { value: e.target.value })}
                      />
                      <Btn
                        type="button"
                        variant="danger"
                        aria-label={`Remove fact ${i + 1}`}
                        onClick={() => set("facts", [...draft.facts.slice(0, i), ...draft.facts.slice(i + 1)])}
                      >
                        ×
                      </Btn>
                    </div>
                  ))}
                </div>
                <Btn
                  type="button"
                  className="mt-3"
                  onClick={() => set("facts", [...draft.facts, { label: "", value: "" }])}
                >
                  Add a fact
                </Btn>
              </fieldset>
            </Panel>
          </div>

          <div className="flex flex-col gap-6">
            <Panel className="flex flex-col gap-3">
              <Toggle
                checked={draft.published}
                onChange={(v) => set("published", v)}
                label={draft.published ? "Published" : "Draft"}
              />
              <Toggle
                checked={draft.featured}
                onChange={(v) => set("featured", v)}
                label="Show on the home page"
              />
              <Toggle
                checked={draft.placeholder}
                onChange={(v) => set("placeholder", v)}
                label="Stock placeholder"
              />
              {draft.placeholder && (
                <p className="text-xs text-on-surface-faint">
                  Built from stock photography, not the studio&rsquo;s own work. Replace or remove it before launch.
                </p>
              )}
            </Panel>

            <Panel className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="annotation text-on-surface-faint">Cover photograph</p>
                {draft.coverId && (
                  <button
                    type="button"
                    onClick={() => set("coverId", undefined)}
                    className="annotation cursor-pointer text-on-surface-faint transition-colors hover:text-accent"
                  >
                    Remove
                  </button>
                )}
              </div>
              {draft.coverId ? (
                <Thumb src={cover?.src} alt={cover?.alt} badge={cover?.night ? "Evening" : undefined} />
              ) : (
                <p className="text-sm text-on-surface-muted">
                  None chosen — the first photograph in the gallery is used.
                </p>
              )}
              <Btn type="button" onClick={() => setPicker(picker === "cover" ? null : "cover")}>
                {picker === "cover" ? "Close the library" : draft.coverId ? "Change the cover" : "Choose a cover"}
              </Btn>
            </Panel>

            <Panel className="flex flex-col gap-4">
              <p className="annotation text-on-surface-faint">
                Gallery — {draft.galleryIds.length} {draft.galleryIds.length === 1 ? "photograph" : "photographs"}
              </p>
              {draft.galleryIds.length > 0 ? (
                <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {draft.galleryIds.map((id, i) => {
                    const photo = photos.get(id);
                    return (
                      <li key={id} className="flex flex-col gap-1">
                        <Thumb src={photo?.src} alt={photo?.alt} badge={String(i + 1).padStart(2, "0")} />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            aria-label={`Move photograph ${i + 1} earlier`}
                            disabled={i === 0}
                            onClick={() => moveGallery(i, -1)}
                            className={miniButton}
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            aria-label={`Take photograph ${i + 1} out of the gallery`}
                            onClick={() => set("galleryIds", draft.galleryIds.filter((g) => g !== id))}
                            className={miniButton}
                          >
                            ×
                          </button>
                          <button
                            type="button"
                            aria-label={`Move photograph ${i + 1} later`}
                            disabled={i === draft.galleryIds.length - 1}
                            onClick={() => moveGallery(i, 1)}
                            className={miniButton}
                          >
                            →
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-sm text-on-surface-muted">
                  Open the library and click photographs in the order they should appear.
                </p>
              )}
              <Btn type="button" onClick={() => setPicker(picker === "gallery" ? null : "gallery")}>
                {picker === "gallery" ? "Close the library" : "Add photographs"}
              </Btn>
            </Panel>

            {editingId !== "new" && (
              <Btn type="button" variant="danger" onClick={destroy}>
                Delete project
              </Btn>
            )}
          </div>
        </div>

        {picker && (
          <section className="mt-10 border-t border-rule pt-8">
            <h2 className="annotation mb-6 text-accent">
              {picker === "cover"
                ? "Choose the cover"
                : "Click photographs to add or remove them — they join the gallery in the order you click"}
            </h2>
            <MediaLibrary
              mode="select"
              selected={picker === "cover" ? (draft.coverId ? [draft.coverId] : []) : draft.galleryIds}
              onToggle={(id) => {
                if (picker === "cover") {
                  set("coverId", draft.coverId === id ? undefined : id);
                } else {
                  set(
                    "galleryIds",
                    draft.galleryIds.includes(id)
                      ? draft.galleryIds.filter((g) => g !== id)
                      : [...draft.galleryIds, id],
                  );
                }
              }}
            />
          </section>
        )}
      </>
    );
  }

  /* ---- Register -------------------------------------------------------- */
  return (
    <>
      <DeskHeader
        sheet="X-910"
        title="Projects"
        lead="The register, in the order it appears on the site."
        action={
          <Btn type="button" variant="primary" onClick={() => open("new")}>
            New project
          </Btn>
        }
      />

      <div className="mb-6 flex flex-col gap-3 empty:hidden">
        {register.error && <Notice tone="error">{register.error}</Notice>}
        {editor.done && <Notice tone="success">Saved.</Notice>}
      </div>

      {projects === undefined && <p className="annotation text-on-surface-faint">Loading the register…</p>}

      {projects && projects.length === 0 && (
        <Empty
          title="No projects yet"
          hint="The site shows the seed set until the first project with a photograph is published here."
        />
      )}

      {projects && projects.length > 0 && (
        <ul className="flex flex-col">
          {projects.map((project, i) => {
            const thumb = project.cover ?? project.gallery[0];
            return (
              <li
                key={project._id}
                className="grid items-center gap-4 border-b border-rule py-4 sm:grid-cols-[5rem_1fr_auto]"
              >
                <Thumb src={thumb?.src} className="w-20" />

                <div className="min-w-0">
                  <p className="annotation mb-1.5 flex flex-wrap items-center gap-3 text-on-surface-faint">
                    <span className="text-accent">{project.reference}</span>
                    <span>{project.typology}</span>
                    <span>{project.stage}</span>
                    {project.featured && <span className="text-accent">Home page</span>}
                    {project.placeholder && <span>Stock placeholder</span>}
                  </p>
                  <p className="inked truncate text-lead font-light">{project.title}</p>
                  <p className="truncate text-sm text-on-surface-muted">{project.brief}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {project.published && !thumb && <Chip tone="warning">No photograph — not shown</Chip>}
                  <Btn
                    type="button"
                    title={project.published ? "Live — click to take it off the site" : "Draft — click to publish"}
                    onClick={() =>
                      void register.run(() => setPublished({ id: project._id, published: !project.published }))
                    }
                    className={cn(project.published && "border-accent text-accent")}
                  >
                    {project.published ? "Live" : "Draft"}
                  </Btn>
                  <Btn type="button" aria-label={`Move ${project.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </Btn>
                  <Btn
                    type="button"
                    aria-label={`Move ${project.title} down`}
                    disabled={i === projects.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </Btn>
                  <Btn type="button" variant="primary" onClick={() => open(project._id)}>
                    Edit
                  </Btn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
