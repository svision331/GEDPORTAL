import { NextResponse } from "next/server";
import { prisma } from "@/src/core/prisma";
import twilio from "twilio";
import { getSetting } from "@/app/actions";

async function validateTwilioSignature(req: Request, rawBody: string): Promise<boolean> {
  const authToken = await getSetting("twilio_auth_token");
  if (!authToken) {
    console.warn("[SMS Webhook] No Twilio auth token configured — rejecting request.");
    return false;
  }

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms`
    : null;

  if (!url) {
    console.warn("[SMS Webhook] NEXT_PUBLIC_APP_URL not set — cannot validate signature.");
    return false;
  }

  // Parse form params for signature validation
  const params: Record<string, string> = {};
  new URLSearchParams(rawBody).forEach((value, key) => {
    params[key] = value;
  });

  return twilio.validateRequest(authToken, signature, url, params);
}

export async function POST(req: Request) {
  try {
    // Read raw body once for both signature validation and parsing
    const rawBody = await req.text();

    const isValid = await validateTwilioSignature(req, rawBody);
    if (!isValid) {
      console.warn("[SMS Webhook] Invalid or missing Twilio signature — request rejected.");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const params = new URLSearchParams(rawBody);
    const from = params.get("From");
    const body = params.get("Body");

    if (!from || !body) {
      return new NextResponse("Missing data", { status: 400 });
    }

    // Normalize phone number for matching (last 10 digits)
    const cleanFrom = from.replace(/\D/g, "").slice(-10);

    const student = await prisma.student.findFirst({
      where: {
        phone: { contains: cleanFrom },
      },
    });

    if (student) {
      const studentName = `${student.firstName} ${student.lastName}`;

      await prisma.student.update({
        where: { id: student.id },
        data: { status: "Responded" },
      });

      await prisma.auditEntry.create({
        data: {
          action: "SMS Received",
          actor: "System (Twilio Webhook)",
          studentId: student.id,
          studentName,
          details: `Student replied via SMS: "${body}"`,
          type: "outreach",
          timestamp: new Date(),
        },
      });

      console.log(`[SMS Webhook] Updated student ${studentName} from ${from}`);
    } else {
      console.log(`[SMS Webhook] No student found for number ${from}`);
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[SMS Webhook Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
