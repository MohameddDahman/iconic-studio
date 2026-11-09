"use client";

import { useState } from "react";
import { scrollToTop } from "@/components/motion/ScrollSync";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Btn, DeskHeader, Empty, Field, Notice, Panel, Toggle, inputClass, useLeaveWarning, useRun } from "./ui";

interface Review {
  _id: Id<"testimonials">;
  quote: string;
  author: string;
  role: string;
  lang?: "en" | "ar";
  translation?: string;
  source?: string;
  date?: string;
  projectSlug?: string;
  published: boolean;
  order: number;
}

interface Draft {
  quote: string;
  author: string;
  role: string;
  lang: "en" | "ar";
  translation: string;
  source: string;
  date: string;
  projectSlug: string;
  published: boolean;
}

const blank = (): Draft => ({
  quote: "",
  author: "",
  role: "Private residence",
  lang: "en",
  translation: "",
  source: "Facebook recommendation",
  date: "",
  projectSlug: "",
  published: true,
});

const draftFrom = (review: Review): Draft => ({
  quote: review.quote,
  author: review.author,
  role: review.role,
  lang: review.lang ?? "en",
  translation: review.translation ?? "",
  source: review.source ?? "",
  date: review.date ?? "",
  projectSlug: review.projectSlug ?? "",
  published: review.published,
});

/**
 * Reviews arrive in Arabic as often as English. Both are stored as written, and
 * an Arabic one carries an English rendering shown beneath it on the site —
 * replacing somebody's words with a translation is not the same as quoting them.
 */
export default function ReviewsDesk() {
  const reviews = useQuery(api.testimonials.listAll) as Review[] | undefined;
  const projects = useQuery(api.projects.options);
  const create = useMutation(api.testimonials.create);
  const update = useMutation(api.testimonials.update);
  const remove = useMutation(api.testimonials.remove);
  const reorder = useMutation(api.testimonials.reorder);
  const editor = useRun();
  const list = useRun();

  const [editing, setEditing] = useState<Id<"testimonials"> | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [initial, setInitial] = useState("");

  const dirty = editing !== null && JSON.stringify(draft) !== initial;
  useLeaveWarning(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const open = (review?: Review) => {
    if (dirty && !confirm("Discard the changes to the review you are editing?")) return;
    const next = review ? draftFrom(review) : blank();
    setDraft(next);
    setInitial(JSON.stringify(next));
    setEditing(review ? review._id : "new");
    editor.clearError();
    // The form opens above the list, so a click low on the page would seem to do nothing.
    scrollToTop();
  };

  const close = () => {
    if (dirty && !confirm("Discard the changes to this review?")) return;
    setEditing(null);
    scrollToTop();
  };

  const save = async () => {
    await editor.run(async () => {
      const payload = {
        quote: draft.quote.trim(),
        author: draft.author.trim(),
        role: draft.role.trim(),
        lang: draft.lang,
        translation: draft.lang === "ar" ? draft.translation.trim() || undefined : undefined,
        source: draft.source.trim() || undefined,
        date: draft.date.trim() || undefined,
        projectSlug: draft.projectSlug || undefined,
        published: draft.published,
      };
      if (!payload.quote || !payload.author) {
        throw new Error("Add the review and the name of the person who wrote it.");
      }
      if (editing === "new") await create(payload);
      else if (editing) await update({ id: editing, ...payload });
      setEditing(null);
    });
    scrollToTop();
  };

  const move = (index: number, delta: number) => {
    if (!reviews) return;
    const ids = reviews.map((r) => r._id);
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void list.run(() => reorder({ ids }));
  };

  const projectTitle = (slug?: string) => (slug ? projects?.find((p) => p.slug === slug)?.title : undefined);

  return (
    <>
      <DeskHeader
        sheet="X-930"
        title="Reviews"
        lead="What clients wrote, in the language they wrote it in, in the order the site shows them."
        action={
          <Btn type="button" variant="primary" onClick={() => open()}>
            Add a review
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
            <Field label="Name">
              <input className={inputClass} value={draft.author} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="Which kind of project" hint="Kept vague on purpose — clients value privacy.">
              <input className={inputClass} value={draft.role} onChange={(e) => set("role", e.target.value)} />
            </Field>
            <Field label="Language">
              <select
                className={inputClass}
                value={draft.lang}
                onChange={(e) => set("lang", e.target.value as Draft["lang"])}
              >
                <option value="en">English</option>
                <option value="ar">العربية — Arabic</option>
              </select>
            </Field>
            <Field label="Where it was left">
              <input className={inputClass} value={draft.source} onChange={(e) => set("source", e.target.value)} />
            </Field>
            <Field label="Date" hint="As shown on the review. Optional.">
              <input className={inputClass} value={draft.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Project" hint="Optional. Links the review to a project on the site.">
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

          <Field label="The review, exactly as written">
            <textarea
              rows={4}
              dir={draft.lang === "ar" ? "rtl" : "ltr"}
              lang={draft.lang}
              className={inputClass}
              value={draft.quote}
              onChange={(e) => set("quote", e.target.value)}
            />
          </Field>

          {draft.lang === "ar" && (
            <Field label="English rendering" hint="Shown in smaller type beneath the Arabic. Keep it faithful.">
              <textarea
                rows={3}
                className={inputClass}
                value={draft.translation}
                onChange={(e) => set("translation", e.target.value)}
              />
            </Field>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
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

      {reviews === undefined && <p className="annotation text-on-surface-faint">Loading…</p>}

      {reviews && reviews.length === 0 && !editing && (
        <Empty
          title="No reviews yet"
          hint="The site shows the recommendations from the studio’s Facebook page until these are added."
        />
      )}

      {reviews && reviews.length > 0 && (
        <ul className="flex flex-col">
          {reviews.map((review, i) => (
            <li key={review._id} className="flex flex-col gap-3 border-b border-rule py-5">
              <p className="annotation flex flex-wrap items-center gap-3 text-on-surface-faint">
                <span className="text-accent">{review.author}</span>
                <span>{review.role}</span>
                {review.lang === "ar" && <span>Arabic</span>}
                {projectTitle(review.projectSlug) && <span>{projectTitle(review.projectSlug)}</span>}
                {!review.published && <span className="text-accent">Hidden</span>}
              </p>
              <p
                dir={review.lang === "ar" ? "rtl" : "ltr"}
                lang={review.lang}
                className="max-w-3xl text-sm text-on-surface-muted"
              >
                {review.quote}
              </p>
              <div className="flex flex-wrap gap-2">
                <Btn type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move the review from ${review.author} up`}>
                  ↑
                </Btn>
                <Btn
                  type="button"
                  disabled={i === reviews.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move the review from ${review.author} down`}
                >
                  ↓
                </Btn>
                <Btn type="button" onClick={() => open(review)}>
                  Edit
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Delete the review from ${review.author}? This cannot be undone.`)) {
                      void list.run(() => remove({ id: review._id }));
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
