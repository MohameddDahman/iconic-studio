"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/(site)/contact/actions";
import { cn } from "@/lib/utils";

const initial: EnquiryState = { status: "idle" };

const SPACES = ["Home", "Office or showroom", "Restaurant or café", "Hotel", "Retail", "Clinic or spa", "Something else"];
const BUDGETS = ["Under 500k EGP", "500k — 1M EGP", "1M — 2.5M EGP", "2.5M — 5M EGP", "Over 5M EGP", "Not sure yet"];

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="eyebrow text-on-surface-faint">
        {label}
      </label>
      {children}
      {hint && !error && (
        <span id={`${name}-hint`} className="text-sm text-on-surface-faint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-error`} className="text-sm text-accent">
          {error}
        </span>
      )}
    </div>
  );
}

const inputClass =
  "min-h-13 w-full border-b border-rule-strong bg-transparent px-0 py-3 text-lg outline-none transition-colors duration-300 placeholder:text-on-surface-faint/70 focus:border-accent";

export default function EnquiryForm() {
  const [state, formAction, pending] = useActionState(sendEnquiry, initial);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /* Send focus to the summary so a failure is announced and reachable. */
  useEffect(() => {
    if (state.status === "error") summaryRef.current?.focus();
    if (state.status === "sent") formRef.current?.reset();
  }, [state]);

  if (state.status === "sent") {
    return (
      <div role="status" className="border-t border-rule pt-10">
        <p className="eyebrow text-accent">Received</p>
        <h2 className="inked mt-6 text-d2 leading-[0.95]">
          Thank you — <em>it arrived.</em>
        </h2>
        <p className="mt-6 max-w-md text-on-surface-muted">
          We read every enquiry the same day. If the project looks like one we can do well, you will
          hear back with our first questions rather than a brochure.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-10" noValidate>
      {state.status === "error" && state.message && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-sm border border-accent px-5 py-4 text-sm text-accent outline-none"
        >
          {state.message}
        </div>
      )}

      {/* Honeypot — off-screen, never announced, never tab-reachable. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className="eyebrow mb-4 text-on-surface-faint">Type of space</legend>
        <div className="flex flex-wrap gap-2">
          {SPACES.map((space, i) => (
            <label key={space} className="cursor-pointer">
              <input type="radio" name="space" value={space} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex h-10 items-center rounded-full border border-rule-strong px-4 text-sm transition-colors duration-300 peer-checked:border-on-surface peer-checked:bg-on-surface peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:border-on-surface">
                {space}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-10 sm:grid-cols-2">
        <Field label="Your name" name="name" error={state.errors?.name}>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            aria-describedby={state.errors?.name ? "name-error" : undefined}
            aria-invalid={Boolean(state.errors?.name)}
            className={inputClass}
            placeholder="Ahmed Hassan"
          />
        </Field>

        <Field label="Email" name="email" error={state.errors?.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            aria-invalid={Boolean(state.errors?.email)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>
      </div>

      <div className="grid gap-10 sm:grid-cols-2">
        <Field label="Where is it" name="subject" hint="Area, compound or city — and the size if you know it.">
          <input
            id="subject"
            name="subject"
            type="text"
            aria-describedby="subject-hint"
            className={inputClass}
            placeholder="New Cairo — 220 m²"
          />
        </Field>

        <Field label="Budget" name="budget" hint="A range is fine. It changes what we suggest.">
          <select
            id="budget"
            name="budget"
            aria-describedby="budget-hint"
            className={cn(inputClass, "cursor-pointer")}
            defaultValue=""
          >
            <option value="">Prefer not to say</option>
            {BUDGETS.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="About the project"
        name="message"
        error={state.errors?.message}
        hint="What you have now, what you want it to become, and roughly when you need it."
      >
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          aria-describedby={state.errors?.message ? "message-error" : "message-hint"}
          aria-invalid={Boolean(state.errors?.message)}
          className={cn(inputClass, "resize-y leading-relaxed")}
          placeholder="We have just received the keys to…"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="group relative isolate inline-flex h-13 w-fit cursor-pointer items-center gap-5 overflow-hidden rounded-full bg-on-surface pr-1.5 pl-7 text-surface transition-colors duration-500 hover:text-night disabled:cursor-wait disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 translate-y-[101%] rounded-full bg-glow transition-transform duration-700 ease-cut group-hover:translate-y-0"
        />
        <span className="eyebrow">{pending ? "Sending…" : "Send enquiry"}</span>
        <span className="grid size-10 place-items-center rounded-full bg-surface text-on-surface transition-transform duration-500 ease-cut group-hover:-rotate-45">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
            <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
      </button>
    </form>
  );
}
