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

interface RoomRow {
  _id: Id<"thresholds">;
  room: string;
  ceiling: string;
  note: string;
  published: boolean;
  order: number;
  media: { _id: Id<"media">; src: string; alt: string; night?: { src: string } } | null;
}

interface Draft {
  room: string;
  ceiling: string;
  note: string;
  published: boolean;
  mediaId?: Id<"media">;
}

const blank = (): Draft => ({ room: "", ceiling: "+2.80", note: "", published: true });

const draftFrom = (room: RoomRow): Draft => ({
  room: room.room,
  ceiling: room.ceiling,
  note: room.note,
  published: room.published,
  mediaId: room.media?._id,
});

/**
 * The rooms listed at /inside, in order: a photograph, the finished ceiling
 * height and one sentence about a decision in the room. When the photograph has
 * an evening version (set in Photographs) the room gets its lamp switch.
 */
export default function WalkthroughDesk() {
  const rooms = useQuery(api.thresholds.listAll) as RoomRow[] | undefined;
  const library = useQuery(api.media.list) as MediaRow[] | undefined;
  const create = useMutation(api.thresholds.create);
  const update = useMutation(api.thresholds.update);
  const remove = useMutation(api.thresholds.remove);
  const reorder = useMutation(api.thresholds.reorder);
  const editor = useRun();
  const list = useRun();

  const [editing, setEditing] = useState<Id<"thresholds"> | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [initial, setInitial] = useState("");
  const [picking, setPicking] = useState(false);

  const photos = useMemo(() => new Map((library ?? []).map((photo) => [photo._id, photo])), [library]);

  const dirty = editing !== null && JSON.stringify(draft) !== initial;
  useLeaveWarning(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const open = (room?: RoomRow) => {
    if (dirty && !confirm("Discard the changes to the room you are editing?")) return;
    const next = room ? draftFrom(room) : blank();
    setDraft(next);
    setInitial(JSON.stringify(next));
    setPicking(false);
    setEditing(room ? room._id : "new");
    editor.clearError();
  };

  const close = () => {
    if (dirty && !confirm("Discard the changes to this room?")) return;
    setPicking(false);
    setEditing(null);
  };

  const save = () =>
    editor.run(async () => {
      const payload = {
        room: draft.room.trim(),
        ceiling: draft.ceiling.trim(),
        note: draft.note.trim(),
        published: draft.published,
        mediaId: draft.mediaId,
      };
      if (!payload.room) throw new Error("Give the room a name.");
      if (editing === "new") await create(payload);
      else if (editing) await update({ id: editing, ...payload });
      setPicking(false);
      setEditing(null);
    });

  const move = (index: number, delta: number) => {
    if (!rooms) return;
    const ids = rooms.map((r) => r._id);
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void list.run(() => reorder({ ids }));
  };

  const photo = draft.mediaId ? photos.get(draft.mediaId) : undefined;

  return (
    <>
      <DeskHeader
        sheet="X-950"
        title="Rooms"
        lead="The rooms listed at /inside, in the order the page shows them."
        action={
          <Btn type="button" variant="primary" onClick={() => open()}>
            Add a room
          </Btn>
        }
      />

      <div className="mb-6 flex flex-col gap-3 empty:hidden">
        {list.error && <Notice tone="error">{list.error}</Notice>}
        {editor.done && !editing && <Notice tone="success">Saved.</Notice>}
      </div>

      {editing && (
        <Panel className="mb-8 flex flex-col gap-6">
          {editor.error && <Notice tone="error">{editor.error}</Notice>}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <Field label="Room name">
                <input className={inputClass} value={draft.room} onChange={(e) => set("room", e.target.value)} />
              </Field>
              <Field label="Finished ceiling height" hint="Shown beside the room name, e.g. +2.80">
                <input className={inputClass} value={draft.ceiling} onChange={(e) => set("ceiling", e.target.value)} />
              </Field>
              <Field label="Note" hint="One or two sentences about a decision in this room.">
                <textarea rows={4} className={inputClass} value={draft.note} onChange={(e) => set("note", e.target.value)} />
              </Field>
              <Toggle
                checked={draft.published}
                onChange={(v) => set("published", v)}
                label={draft.published ? "Published" : "Hidden"}
              />
            </div>

            <div className="flex flex-col gap-4">
              <p className="annotation text-on-surface-faint">Photograph</p>
              {draft.mediaId ? (
                <Thumb src={photo?.src} alt={photo?.alt} badge={photo?.night ? "Evening" : undefined} />
              ) : (
                <div className="grid aspect-[4/3] place-items-center border border-dashed border-rule px-6 text-center text-sm text-on-surface-faint">
                  No photograph — the room is left off the page until it has one.
                </div>
              )}
              {photo && !photo.night && (
                <p className="text-sm text-on-surface-muted">
                  No evening version yet. Give this photograph one in Photographs and the room gets a lamp switch.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Btn type="button" onClick={() => setPicking((open) => !open)}>
                  {picking ? "Close the library" : draft.mediaId ? "Change the photograph" : "Choose a photograph"}
                </Btn>
                {draft.mediaId && (
                  <Btn type="button" variant="danger" onClick={() => set("mediaId", undefined)}>
                    Remove
                  </Btn>
                )}
              </div>
            </div>
          </div>

          {picking && (
            <div className="border-t border-rule pt-6">
              <MediaLibrary
                mode="select"
                selected={draft.mediaId ? [draft.mediaId] : []}
                onToggle={(id) => set("mediaId", draft.mediaId === id ? undefined : id)}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-rule pt-5">
            <Btn type="button" onClick={close}>
              {dirty ? "Discard" : "Cancel"}
            </Btn>
            <Btn type="button" variant="primary" disabled={editor.busy} onClick={() => void save()}>
              {editor.busy ? "Saving" : "Save"}
            </Btn>
          </div>
        </Panel>
      )}

      {rooms === undefined && <p className="annotation text-on-surface-faint">Loading…</p>}

      {rooms && rooms.length === 0 && !editing && (
        <Empty title="No rooms yet" hint="The page shows the seed apartment’s rooms until rooms are added here." />
      )}

      {rooms && rooms.length > 0 && (
        <ul className="flex flex-col">
          {rooms.map((room, i) => (
            <li
              key={room._id}
              className="grid items-center gap-4 border-b border-rule py-4 sm:grid-cols-[5rem_1fr_auto]"
            >
              <Thumb src={room.media?.src} className="w-20" />
              <div className="min-w-0">
                <p className="annotation mb-1.5 flex flex-wrap gap-3 text-on-surface-faint">
                  <span className="text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>Ceiling {room.ceiling}</span>
                  {room.media?.night && <span>Day & evening</span>}
                  {!room.published && <span className="text-accent">Hidden</span>}
                </p>
                <p className="inked truncate text-lead font-light">{room.room}</p>
                <p className="truncate text-sm text-on-surface-muted">{room.note}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {room.published && !room.media && <Chip tone="warning">No photograph — left out</Chip>}
                <Btn type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${room.room} up`}>
                  ↑
                </Btn>
                <Btn
                  type="button"
                  disabled={i === rooms.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move ${room.room} down`}
                >
                  ↓
                </Btn>
                <Btn type="button" onClick={() => open(room)}>
                  Edit
                </Btn>
                <Btn
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Remove ${room.room} from the page? This cannot be undone.`)) {
                      void list.run(() => remove({ id: room._id }));
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
