"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthToken } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { compressVideo } from "./compressVideo";
import { Btn, Chip, DeskHeader, Empty, Notice, inputClass, useRun } from "./ui";
import { posterUrl, runtime } from "@/lib/video";
import { cn } from "@/lib/utils";

/** Cloudinary's free plan takes no larger file; a compressed clip is far smaller. */
const MAX_BYTES = 100 * 1000 * 1000;

interface Row {
  _id: Id<"videos">;
  publicId: string;
  title: string;
  projectSlug?: string;
  duration: number;
  bytes: number;
  compressed?: boolean;
  published: boolean;
}

interface Job {
  id: string;
  name: string;
  status: "waiting" | "compressing" | "uploading" | "saving" | "done" | "error";
  progress: number;
  error?: string;
}

/** POST a form and report upload progress, which fetch cannot do. */
function send(url: string, form: FormData, onProgress: (progress: number) => void) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let body: { error?: { message?: string } } & Record<string, unknown> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body.error?.message ?? "Upload failed — try again"));
    };
    xhr.onerror = () => reject(new Error("Connection lost — try again"));
    xhr.send(form);
  });
}

const label = (job: Job) =>
  job.status === "error"
    ? job.error
    : job.status === "compressing" || job.status === "uploading"
      ? `${job.status} ${Math.round(job.progress * 100)}%`
      : job.status;

const megabytes = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

/**
 * Short films. Each clip is compressed to 720p on this computer before it is
 * uploaded (compressVideo.ts), straight to Cloudinary with a signature from the
 * server, so the free plan's storage and downloads go a long way.
 */
export default function VideosDesk() {
  const videos = useQuery(api.videos.listAll) as Row[] | undefined;
  const projects = useQuery(api.projects.options);
  const create = useMutation(api.videos.create);
  const update = useMutation(api.videos.update);
  const remove = useMutation(api.videos.remove);
  const reorder = useMutation(api.videos.reorder);
  const token = useAuthToken();
  const list = useRun();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const patch = (id: string, next: Partial<Job>) =>
    setJobs((all) => all.map((job) => (job.id === id ? { ...job, ...next } : job)));
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

  const uploadOne = async (file: File, id: string) => {
    if (!file.type.startsWith("video/")) throw new Error("Not a video — skipped");
    let upload = file;
    let compressed = false;
    patch(id, { status: "compressing", progress: 0 });
    try {
      const small = await compressVideo(file, (progress) => patch(id, { progress }));
      if (small) {
        upload = small;
        compressed = true;
      }
    } catch {
      // This browser could not read or encode the clip; the original goes instead.
    }
    if (!compressed && file.size > MAX_BYTES) {
      throw new Error("Over 100 MB and this browser cannot shrink it — try Chrome or Edge");
    }

    patch(id, { status: "uploading", progress: 0 });
    const sign = await fetch("/api/videos/sign", { method: "POST", headers, body: JSON.stringify({ compressed }) }).then(
      (res) => res.json(),
    );
    if (!sign.ok) throw new Error(sign.error ?? "Video uploads are not set up yet");
    const form = new FormData();
    form.append("file", upload);
    form.append("api_key", sign.apiKey);
    form.append("signature", sign.signature);
    for (const [name, value] of Object.entries(sign.params as Record<string, string>)) form.append(name, value);
    const result = await send(`https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`, form, (progress) =>
      patch(id, { progress }),
    );

    patch(id, { status: "saving", progress: 1 });
    await create({
      publicId: String(result.public_id),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      duration: Number(result.duration ?? 0),
      width: Number(result.width ?? 0),
      height: Number(result.height ?? 0),
      bytes: Number(result.bytes ?? upload.size),
      compressed,
    });
    patch(id, { status: "done", progress: 1 });
  };

  const handleFiles = async (files: FileList) => {
    setBusy(true);
    const queued = Array.from(files).map((file) => ({ file, id: `${file.name}-${Math.random().toString(36).slice(2, 8)}` }));
    setJobs((all) => [...queued.map(({ file, id }) => ({ id, name: file.name, status: "waiting" as const, progress: 0 })), ...all]);
    for (const { file, id } of queued) {
      try {
        await uploadOne(file, id);
      } catch (error) {
        patch(id, { status: "error", error: error instanceof Error ? error.message : "Upload failed" });
      }
    }
    setBusy(false);
    if (token) void fetch("/api/refresh", { method: "POST", headers }).catch(() => {});
    setTimeout(() => setJobs((all) => all.filter((job) => job.status !== "done")), 3000);
  };

  const destroy = (row: Row) => {
    if (!confirm(`Delete “${row.title}” permanently? It is removed from Cloudinary too.`)) return;
    void list.run(async () => {
      const res = await fetch("/api/videos/delete", { method: "POST", headers, body: JSON.stringify({ publicId: row.publicId }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body.error ?? "Cloudinary did not remove the film. Try again.");
      await remove({ id: row._id });
    });
  };

  const move = (index: number, delta: number) => {
    if (!videos) return;
    const ids = videos.map((row) => row._id);
    const next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void list.run(() => reorder({ ids }));
  };

  return (
    <>
      <DeskHeader
        sheet="X-925"
        title="Videos"
        lead="Short films for the site. Each clip is shrunk to 720p on this computer before it uploads, so keep your full-size files somewhere safe."
      />

      <div className="mb-8 flex flex-col gap-3">
        <div className="border border-dashed border-rule px-6 py-10 text-center">
          <p className="text-sm text-on-surface-muted">Choose one clip or several. Clips of a minute or less work best.</p>
          <p className="annotation mt-2 text-on-surface-faint">MP4, MOV or WebM · shrunk to 720p automatically</p>
          <input
            ref={picker}
            type="file"
            accept="video/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Btn type="button" variant="primary" className="mt-6" disabled={busy} onClick={() => picker.current?.click()}>
            {busy ? "Working" : "Choose videos"}
          </Btn>
        </div>
        {jobs.length > 0 && (
          <ul className="flex flex-col gap-2" aria-live="polite">
            {jobs.map((job) => (
              <li key={job.id} className="flex items-center justify-between gap-4 border border-rule px-4 py-2.5 text-sm">
                <span className="truncate">{job.name}</span>
                <span className={cn("annotation shrink-0", job.status === "error" ? "text-red-400" : "text-on-surface-faint")}>
                  {label(job)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {list.error && <Notice tone="error">{list.error}</Notice>}
        {list.done && <Notice tone="success">Saved. It shows on the site within a minute.</Notice>}
      </div>

      {videos === undefined && <p className="annotation text-on-surface-faint">Loading the films…</p>}
      {videos && videos.length === 0 && (
        <Empty
          title="No films yet"
          hint="Upload a clip and it appears on the site, with a Videos page in the menu, and on its project if you choose one."
        />
      )}

      {videos && videos.length > 0 && (
        <ul className="flex flex-col">
          {videos.map((row, i) => (
            <li key={row._id} className="grid items-center gap-4 border-b border-rule py-4 sm:grid-cols-[10rem_1fr_auto]">
              <div className="relative aspect-video w-40 overflow-hidden border border-rule bg-surface-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterUrl(row.publicId)}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // The poster is still being made just after an upload.
                    e.currentTarget.style.visibility = "hidden";
                  }}
                />
              </div>

              <div className="flex min-w-0 flex-col gap-2">
                <input
                  key={`${row._id}-${row.title}`}
                  aria-label="Title"
                  defaultValue={row.title}
                  className={inputClass}
                  onBlur={(e) => {
                    const title = e.target.value.trim();
                    if (title && title !== row.title) void list.run(() => update({ id: row._id, title }));
                  }}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label="Project"
                    value={row.projectSlug ?? ""}
                    onChange={(e) => void list.run(() => update({ id: row._id, projectSlug: e.target.value }))}
                    className={cn(inputClass, "w-auto max-w-xs")}
                  >
                    <option value="">No project</option>
                    {(projects ?? []).map((project) => (
                      <option key={project.slug} value={project.slug}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  <span className="annotation text-on-surface-faint tabular-nums">
                    {runtime(row.duration)} · {megabytes(row.bytes)} · {row.compressed ? "720p" : "original"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={row.published ? "accent" : "muted"}>{row.published ? "Live" : "Draft"}</Chip>
                <Btn type="button" onClick={() => void list.run(() => update({ id: row._id, published: !row.published }))}>
                  {row.published ? "Take off site" : "Put on site"}
                </Btn>
                <div className="flex items-center gap-2">
                  <Btn type="button" aria-label={`Move ${row.title} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </Btn>
                  <Btn
                    type="button"
                    aria-label={`Move ${row.title} down`}
                    disabled={i === videos.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </Btn>
                  <Btn type="button" variant="danger" onClick={() => destroy(row)}>
                    Delete
                  </Btn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
