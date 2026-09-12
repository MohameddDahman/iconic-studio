"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export interface EnquiryState {
  status: "idle" | "sent" | "error";
  message?: string;
  /** Field-level problems, keyed by input name. */
  errors?: Record<string, string>;
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export async function sendEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const budget = String(formData.get("budget") ?? "").trim();
  const space = String(formData.get("space") ?? "").trim();

  // Bots fill everything in; people never see this field.
  if (String(formData.get("company") ?? "")) {
    return { status: "sent" };
  }

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Tell us who you are.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.email = "That address does not look right. We need it to reply.";
  }
  if (message.length < 12) {
    errors.message = "A sentence or two about the space is enough to start.";
  }
  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Check the fields marked below.", errors };
  }

  if (!CONVEX_URL) {
    return {
      status: "error",
      message:
        "The enquiry form is not connected to the studio inbox yet. Email us directly and we will pick it up.",
    };
  }

  try {
    const client = new ConvexHttpClient(CONVEX_URL);
    await client.mutation(api.inquiries.submit, {
      name,
      email,
      subject: subject || "Enquiry",
      space: space || undefined,
      message,
      budget: budget || undefined,
    });
    return { status: "sent" };
  } catch (error) {
    console.error("[contact] enquiry failed", error);
    return {
      status: "error",
      message: "That did not send. Try again, or email the studio directly.",
    };
  }
}
