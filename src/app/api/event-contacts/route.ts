import { randomUUID } from "crypto";
import { eventContacts, getDb } from "@/lib/server/db";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { sendEventContactEmail } from "@/lib/server/notifications";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureServerSchema();
    const { name, email, phone, artist, eventType, eventDate, message } = await readJson(request);
    if (!name || !email || !phone || !artist || !eventType || !eventDate || !message) {
      return apiError("Missing required event contact fields", 400);
    }

    const inquiry = {
      id: randomUUID(),
      name,
      email,
      phone,
      artist,
      eventType,
      eventDate,
      message,
      status: "New",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await getDb().insert(eventContacts).values(inquiry);
    const emailResult = await sendEventContactEmail(inquiry);
    if (!emailResult.sent && emailResult.warning) {
      console.error(`[event-contact-email] ${emailResult.warning}`);
    }

    return json(
      {
        ...inquiry,
        emailSent: emailResult.sent,
        adminEmailSent: emailResult.adminSent,
        submitterEmailSent: emailResult.submitterSent,
        warning: emailResult.warning,
      },
      { status: 201 },
    );
  } catch (error) {
    return serverError(error);
  }
}
