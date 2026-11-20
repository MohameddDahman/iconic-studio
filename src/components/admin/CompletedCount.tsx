"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Btn, Notice, Panel, inputClass, useLeaveWarning, useRun } from "./ui";

/**
 * The total the home page shows: every project the studio has finished,
 * including the ones it keeps off the site. It sits above the register,
 * where the studio already looks after its projects.
 */
export default function CompletedCount({ onSite }: { onSite: number | undefined }) {
  const settings = useQuery(api.settings.get);
  const setCount = useMutation(api.settings.setCompletedProjects);
  const saving = useRun();

  const saved = settings?.completedProjects ? String(settings.completedProjects) : "";
  // Null until the box is typed in, so it follows the saved number until then.
  const [typed, setTyped] = useState<string | null>(null);
  const value = typed ?? saved;
  const dirty = typed !== null && typed.trim() !== saved;
  useLeaveWarning(dirty);

  if (settings === undefined) return null;

  const count = Number(value);
  const fewer = value.trim() !== "" && onSite !== undefined && count < onSite;

  return (
    <Panel className="mb-8">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void saving.run(async () => {
            await setCount({ count: value.trim() ? count : null });
            setTyped(null);
          });
        }}
      >
        <label htmlFor="completed-projects" className="annotation text-on-surface-faint">
          Completed projects · shown on the home page
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="completed-projects"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="150"
            value={value}
            onChange={(e) => setTyped(e.target.value)}
            className={cn(inputClass, "w-36")}
          />
          <Btn type="submit" variant="primary" disabled={saving.busy || !dirty || settings === null}>
            {saving.busy ? "Saving" : "Save"}
          </Btn>
          <p role="status" className="annotation text-on-surface-faint">
            {saving.done && !dirty ? <span className="text-accent">Saved</span> : dirty ? "Not saved yet" : null}
          </p>
        </div>
        <p className="max-w-2xl text-sm text-on-surface-muted">
          Every project the studio has finished, including the ones not on the site
          {onSite !== undefined && (
            <>
              {" "}
              ({onSite} {onSite === 1 ? "is" : "are"} on the site now)
            </>
          )}
          . The home page shows it at the top, as {value.trim() && count > 0 ? count.toLocaleString("en-US") : "150"}+. Leave it empty to hide it.
        </p>
        {fewer && (
          <Notice tone="warning">
            That is fewer than the {onSite} projects already on the site.
          </Notice>
        )}
        {settings === null && (
          <Notice tone="warning">Save the studio’s Settings once first, then set the count here.</Notice>
        )}
        {saving.error && <Notice tone="error">{saving.error}</Notice>}
      </form>
    </Panel>
  );
}
