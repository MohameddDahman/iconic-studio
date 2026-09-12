"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useMediaUpload } from "./useMediaUpload";
import { Btn, Empty, Field, Notice, Thumb, inputClass, useLeaveWarning, useRun } from "./ui";
import { cn } from "@/lib/utils";

export interface MediaRow {
  _id: Id<"media">;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  night?: { src: string; width: number; height: number; blurDataURL?: string };
  nightId?: Id<"media">;
  bytes?: number;
  createdAt: number;
}

/** No description, or one that is still the filename. */
export const needsDescription = (alt: string) => !alt.trim() || /\.(jpe?g|png|webp|avif)$/i.test(alt);

const fileSize = (bytes?: number) =>
  bytes === undefined
    ? null
    : bytes >= 1_000_000
      ? `${(bytes / 1_000_000).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1000))} KB`;

const added = (ms: number) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ms));

export function DropZone({
  onFiles,
  busy,
  hint = "Drop photographs here, or choose files",
}: {
  onFiles: (files: FileList | File[]) => void;
  busy?: boolean;
  hint?: string;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "border border-dashed px-6 py-10 text-center transition-colors duration-200",
        over ? "border-accent bg-accent/5" : "border-rule",
      )}
    >
      <p className="text-sm text-on-surface-muted">{hint}</p>
      <p className="annotation mt-2 text-on-surface-faint">JPEG, PNG, WebP or AVIF · measured automatically</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Btn
        type="button"
        variant="primary"
        className="mt-6"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading" : "Choose files"}
      </Btn>
    </div>
  );
}

export function UploadQueue({ items }: { items: ReturnType<typeof useMediaUpload>["items"] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2" aria-live="polite">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-4 border border-rule px-4 py-2.5 text-sm"
        >
          <span className="truncate">{item.name}</span>
          <span
            className={cn(
              "annotation shrink-0",
              item.status === "error" ? "text-red-400" : "text-on-surface-faint",
            )}
          >
            {item.status === "error" ? item.error : item.status}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Filter = "all" | "describe" | "evening" | "unused";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "describe", label: "Needs a description" },
  { id: "evening", label: "Day & evening" },
  { id: "unused", label: "Not used" },
];

/**
 * The photograph library.
 *
 * In `select` mode it is the picker the other desks open; in `manage` mode it
 * is the full library, with descriptions, evening versions, where each
 * photograph is used, and deletion. Descriptions are treated as required
 * content — a portfolio that is invisible to a screen reader has a hole in it —
 * so anything still carrying its filename is flagged.
 */
export default function MediaLibrary({
  mode = "manage",
  selected = [],
  onToggle,
  exclude = [],
}: {
  mode?: "manage" | "select";
  selected?: Id<"media">[];
  onToggle?: (id: Id<"media">) => void;
  /** Photographs not to offer — for instance the one an evening version is being chosen for. */
  exclude?: Id<"media">[];
}) {
  const media = useQuery(api.media.list) as MediaRow[] | undefined;
  const usage = useQuery(api.media.usage, mode === "manage" ? {} : "skip");
  const { upload, items } = useMediaUpload();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Id<"media"> | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const uses = useMemo(() => new Map((usage ?? []).map((entry) => [entry.id, entry.uses])), [usage]);
  const evenings = useMemo(
    () => new Set((media ?? []).flatMap((photo) => (photo.nightId ? [photo.nightId] : []))),
    [media],
  );

  const handleFiles = async (files: FileList | File[]) => {
    setBusy(true);
    await upload(files);
    setBusy(false);
  };

  const needle = search.trim().toLowerCase();
  const visible = (media ?? []).filter((photo) => {
    if (exclude.includes(photo._id)) return false;
    if (needle && !`${photo.alt} ${photo.caption ?? ""}`.toLowerCase().includes(needle)) return false;
    if (filter === "describe") return needsDescription(photo.alt);
    if (filter === "evening") return Boolean(photo.nightId) || evenings.has(photo._id);
    if (filter === "unused") return !uses.has(photo._id);
    return true;
  });

  const editingPhoto = editing ? media?.find((photo) => photo._id === editing) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <DropZone onFiles={handleFiles} busy={busy} />
      <UploadQueue items={items} />

      {media === undefined && <p className="annotation text-on-surface-faint">Loading the library…</p>}

      {media && media.length === 0 && (
        <Empty
          title="Nothing uploaded yet"
          hint="Drop in the original photographs. The site runs on the seed set until you do."
        />
      )}

      {media && media.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the descriptions"
              aria-label="Search photographs by description"
              className={cn(inputClass, "max-w-xs")}
            />
            {mode === "manage" && (
              <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
                {FILTERS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={filter === option.id}
                    onClick={() => setFilter(option.id)}
                    className={cn(
                      "annotation min-h-11 cursor-pointer border px-3 transition-colors",
                      filter === option.id
                        ? "border-accent text-accent"
                        : "border-rule text-on-surface-muted hover:text-on-surface",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <p className="annotation ml-auto text-on-surface-faint tabular-nums">
              {visible.length} of {media.length}
            </p>
          </div>

          {visible.length === 0 ? (
            <p className="border border-dashed border-rule px-6 py-10 text-center text-sm text-on-surface-muted">
              Nothing matches.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((photo) => {
                const isSelected = selected.includes(photo._id);
                const position = selected.indexOf(photo._id);
                const used = uses.get(photo._id)?.length ?? 0;

                return (
                  <li key={photo._id} className="flex flex-col gap-2">
                    <div
                      className={cn(
                        "relative aspect-[4/3] overflow-hidden border bg-surface-raised",
                        isSelected || editing === photo._id ? "border-accent" : "border-rule",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.src} alt={photo.alt} loading="lazy" className="h-full w-full object-cover" />

                      {mode === "select" && (
                        <button
                          type="button"
                          onClick={() => onToggle?.(photo._id)}
                          aria-pressed={isSelected}
                          className="absolute inset-0 cursor-pointer bg-night/0 transition-colors hover:bg-night/25"
                        >
                          <span className="sr-only">
                            {isSelected ? "Remove" : "Choose"}: {photo.alt}
                          </span>
                          {isSelected && (
                            <span className="annotation absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center bg-accent px-1.5 text-night">
                              {selected.length > 1 ? position + 1 : "Chosen"}
                            </span>
                          )}
                        </button>
                      )}

                      <span className="pointer-events-none absolute right-2 bottom-2 flex gap-1">
                        {photo.night && (
                          <span className="annotation bg-night/85 px-2 py-1 text-accent">Evening</span>
                        )}
                        {needsDescription(photo.alt) && (
                          <span
                            title="This photograph still needs a description"
                            className="annotation bg-night/85 px-2 py-1 text-accent"
                          >
                            Alt?
                          </span>
                        )}
                      </span>
                    </div>

                    <p className="annotation flex flex-wrap gap-x-3 text-on-surface-faint tabular-nums">
                      <span>
                        {photo.width}×{photo.height}
                      </span>
                      {fileSize(photo.bytes) && <span>{fileSize(photo.bytes)}</span>}
                      {mode === "manage" && <span>{used ? `Used ${used}×` : "Not used"}</span>}
                    </p>

                    {mode === "manage" && (
                      <Btn
                        type="button"
                        onClick={() => setEditing(photo._id)}
                        className={cn(editing === photo._id && "border-accent text-accent")}
                      >
                        Edit
                      </Btn>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {mode === "manage" && editingPhoto && (
            <PhotoEditor
              key={editingPhoto._id}
              photo={editingPhoto}
              library={media}
              uses={uses.get(editingPhoto._id) ?? []}
              onClose={() => setEditing(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * One photograph, in a drawer over the library: its description and caption,
 * its evening version, where it is used, and deletion.
 */
function PhotoEditor({
  photo,
  library,
  uses,
  onClose,
}: {
  photo: MediaRow;
  library: MediaRow[];
  uses: string[];
  onClose: () => void;
}) {
  const updateMedia = useMutation(api.media.update);
  const removeMedia = useMutation(api.media.remove);
  const saving = useRun();
  const [alt, setAlt] = useState(photo.alt);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [choosingEvening, setChoosingEvening] = useState(false);

  const dirty = alt !== photo.alt || caption !== (photo.caption ?? "");
  useLeaveWarning(dirty);

  const evening = photo.nightId ? library.find((m) => m._id === photo.nightId) : undefined;
  const shape = photo.width / photo.height;
  const mismatched = evening ? Math.abs(evening.width / evening.height - shape) > shape * 0.02 : false;

  const requestClose = () => {
    if (dirty && !confirm("Discard the unsaved description?")) return;
    onClose();
  };

  const setEvening = (nightId: Id<"media"> | null) => {
    setChoosingEvening(false);
    void saving.run(() => updateMedia({ id: photo._id, nightId }));
  };

  const destroy = () => {
    const list = uses.length ? `\n\nIt will be taken out of:\n${uses.map((use) => `• ${use}`).join("\n")}` : "";
    if (!confirm(`Delete this photograph permanently?${list}`)) return;
    void saving.run(async () => {
      await removeMedia({ id: photo._id });
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close the photograph"
        onClick={requestClose}
        className="absolute inset-0 cursor-default bg-night/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit photograph"
        onKeyDown={(e) => {
          if (e.key === "Escape") requestClose();
        }}
        className="relative flex h-full w-full max-w-2xl flex-col gap-6 overflow-y-auto overscroll-contain border-l border-rule bg-surface p-6 lg:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="annotation text-accent">Photograph</p>
            <p className="annotation mt-2 text-on-surface-faint tabular-nums">
              {photo.width}×{photo.height}
              {fileSize(photo.bytes) ? ` · ${fileSize(photo.bytes)}` : ""} · added {added(photo.createdAt)}
            </p>
          </div>
          <Btn type="button" onClick={requestClose}>
            Close
          </Btn>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <figure className="flex flex-col gap-2">
            <Thumb src={photo.src} alt={photo.alt} />
            <figcaption className="annotation text-on-surface-faint">Daylight</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            {evening ? (
              <Thumb src={evening.src} alt={evening.alt} />
            ) : (
              <div className="grid aspect-[4/3] place-items-center border border-dashed border-rule px-4 text-center text-xs text-on-surface-faint">
                No evening version
              </div>
            )}
            <figcaption className="annotation text-on-surface-faint">After dark</figcaption>
          </figure>
        </div>

        {saving.error && <Notice tone="error">{saving.error}</Notice>}

        <div className="flex flex-col gap-4">
          <Field
            label="Description"
            hint="What someone who cannot see the photograph needs to know. Screen readers read it aloud."
          >
            <textarea
              autoFocus
              rows={3}
              className={inputClass}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </Field>
          <Field label="Caption" hint="Shown under the photograph. Optional.">
            <input className={inputClass} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <div className="flex items-center gap-4">
            <Btn
              type="button"
              variant="primary"
              disabled={!dirty || saving.busy}
              onClick={() => void saving.run(() => updateMedia({ id: photo._id, alt, caption }))}
            >
              {saving.busy ? "Saving" : "Save"}
            </Btn>
            {saving.done && !dirty && (
              <span role="status" className="annotation text-accent">
                Saved
              </span>
            )}
          </div>
        </div>

        <section className="flex flex-col gap-3 border-t border-rule pt-5">
          <h3 className="annotation text-on-surface-faint">Evening version</h3>
          <p className="text-sm text-on-surface-muted">
            The same view rendered after dark, from the same camera. Wherever this photograph appears, the site
            adds a lamp switch that reveals it.
          </p>
          {mismatched && (
            <Notice tone="warning">
              The two renders are not the same shape, so the switch will not line up. Export both from the same
              camera at the same size.
            </Notice>
          )}
          <div className="flex flex-wrap gap-2">
            <Btn type="button" onClick={() => setChoosingEvening((open) => !open)}>
              {choosingEvening
                ? "Close the library"
                : evening
                  ? "Change the evening version"
                  : "Choose an evening version"}
            </Btn>
            {photo.nightId && (
              <Btn type="button" variant="danger" onClick={() => setEvening(null)}>
                Remove it
              </Btn>
            )}
          </div>
          {choosingEvening && (
            <MediaLibrary
              mode="select"
              exclude={[photo._id]}
              selected={photo.nightId ? [photo.nightId] : []}
              onToggle={(id) => setEvening(photo.nightId === id ? null : id)}
            />
          )}
        </section>

        <section className="flex flex-col gap-3 border-t border-rule pt-5">
          <h3 className="annotation text-on-surface-faint">
            {uses.length ? `Used in ${uses.length} ${uses.length === 1 ? "place" : "places"}` : "Not used anywhere yet"}
          </h3>
          {uses.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-on-surface-muted">
              {uses.map((use, i) => (
                <li key={`${use}-${i}`}>{use}</li>
              ))}
            </ul>
          )}
          <Btn type="button" variant="danger" className="self-start" onClick={destroy}>
            Delete the photograph
          </Btn>
        </section>
      </div>
    </div>
  );
}
