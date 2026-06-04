import { randomUUID } from "crypto";
import { getDb, bookings } from "@/lib/server/db";
import { apiError, json, readJson, serverError } from "@/lib/server/http";
import { sendBookingRequestEmail } from "@/lib/server/notifications";
import { ensureServerSchema } from "@/lib/server/schemaSync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureServerSchema();
    const { name, email, phone, artist, eventType, eventDate, message } = await readJson(request);
    if (!name || !email || !phone || !artist || !eventType || !eventDate || !message) {
      return apiError("Missing required booking fields", 400);
    }

    const booking = {
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

    await getDb().insert(bookings).values(booking);
    const emailResult = await sendBookingRequestEmail(booking);
    if (!emailResult.sent && emailResult.warning) {
      console.error(`[booking-email] ${emailResult.warning}`);
    }

    return json(
      {
        ...booking,
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
