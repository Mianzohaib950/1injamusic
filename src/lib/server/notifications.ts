import nodemailer from "nodemailer";

type InquiryPayload = {
  id: string;
  name: string;
  email: string;
  phone: string;
  artist: string;
  eventType: string;
  eventDate: string;
  message: string;
  createdAt: Date;
};

type SendEmailResult = {
  sent: boolean;
  adminSent: boolean;
  submitterSent: boolean;
  warning?: string;
};

function requiredEnv(key: string) {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : "";
}

function getRecipientList() {
  const configured = requiredEnv("BOOKING_NOTIFY_EMAILS");
  const fallback = requiredEnv("BOOKING_NOTIFY_EMAIL") || requiredEnv("SMTP_USER");
  const target = configured || fallback;
  if (!target) return [];
  return target.split(",").map((email) => email.trim()).filter(Boolean);
}

function getFromName() {
  return requiredEnv("SMTP_FROM_NAME") || "1injamusic";
}

function getFromEmail() {
  return requiredEnv("SMTP_FROM_EMAIL") || requiredEnv("RESEND_FROM_EMAIL") || requiredEnv("SMTP_USER");
}

function getFromHeader() {
  const fromEmail = getFromEmail();
  const fromName = getFromName();
  return fromEmail ? `${fromName} <${fromEmail}>` : "";
}

async function sendViaResend(to: string[], subject: string, html: string, replyTo?: string) {
  const resendApiKey = requiredEnv("RESEND_API_KEY");
  const fromEmail = requiredEnv("RESEND_FROM_EMAIL");
  if (!resendApiKey || !fromEmail) {
    return { sent: false, warning: "Resend is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${getFromName()} <${fromEmail}>`,
      to,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      sent: false,
      warning: `Resend failed (${response.status}): ${body || "No response body."}`,
    };
  }

  return { sent: true };
}

async function sendViaSmtp(to: string[], subject: string, html: string, replyTo?: string) {
  const host = requiredEnv("SMTP_HOST");
  const user = requiredEnv("SMTP_USER");
  const pass = requiredEnv("SMTP_PASS");
  const from = getFromHeader();
  const port = Number(requiredEnv("SMTP_PORT") || "587");
  const secure = requiredEnv("SMTP_SECURE").toLowerCase() === "true";

  if (!host || !user || !pass || !from) {
    return { sent: false, warning: "SMTP is not configured." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from,
      to: to.join(","),
      subject,
      html,
      replyTo,
    });

    return { sent: true };
  } catch (error: any) {
    return {
      sent: false,
      warning: `SMTP failed: ${error?.message ?? "Unknown error."}`,
    };
  }
}

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  if (to.length === 0) {
    return { sent: false, warning: "No recipient email configured." };
  }

  const smtpConfigured = Boolean(requiredEnv("SMTP_HOST") && requiredEnv("SMTP_USER") && requiredEnv("SMTP_PASS"));
  if (smtpConfigured) return sendViaSmtp(to, subject, html, replyTo);
  return sendViaResend(to, subject, html, replyTo);
}

async function sendInquiryEmail(subjectPrefix: string, payload: InquiryPayload): Promise<SendEmailResult> {
  const recipients = getRecipientList();
  const adminSubject = `${subjectPrefix} - ${payload.artist} - ${payload.name}`;
  const adminHtml = `
    <h2>${subjectPrefix}</h2>
    <p><strong>ID:</strong> ${payload.id}</p>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Artist:</strong> ${payload.artist}</p>
    <p><strong>Event Type:</strong> ${payload.eventType}</p>
    <p><strong>Event Date:</strong> ${payload.eventDate}</p>
    <p><strong>Submitted At:</strong> ${payload.createdAt.toISOString()}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <p>${payload.message.replace(/\n/g, "<br/>")}</p>
  `;
  const adminSend = await sendEmail(recipients, adminSubject, adminHtml, payload.email);

  const submitterSubject = `We received your request - 1injamusic`;
  const submitterHtml = `
    <h2>Thanks, ${payload.name}</h2>
    <p>We have received your request and our team will contact you soon.</p>
    <p><strong>Reference ID:</strong> ${payload.id}</p>
    <p><strong>Artist:</strong> ${payload.artist}</p>
    <p><strong>Event Type:</strong> ${payload.eventType}</p>
    <p><strong>Event Date:</strong> ${payload.eventDate}</p>
  `;
  const submitterSend = await sendEmail([payload.email], submitterSubject, submitterHtml);

  const warnings = [adminSend.warning, submitterSend.warning].filter(Boolean).join(" | ");
  return {
    sent: adminSend.sent && submitterSend.sent,
    adminSent: adminSend.sent,
    submitterSent: submitterSend.sent,
    warning: warnings || undefined,
  };
}

export function sendBookingRequestEmail(payload: InquiryPayload) {
  return sendInquiryEmail("New Booking Request", payload);
}

export function sendEventContactEmail(payload: InquiryPayload) {
  return sendInquiryEmail("New Event Contact Request", payload);
}
