import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string; // +1XXXXXXXXXX
    const body = formData.get("Body") as string;

    if (!from || !body) {
      return new NextResponse("Missing data", { status: 400 });
    }

    // Normalize phone number for matching (remove +1 if present, strip characters)
    const cleanFrom = from.replace(/\D/g, "").slice(-10);

    // Find student by phone (matching last 10 digits)
    const student = await prisma.student.findFirst({
      where: {
        phone: {
          contains: cleanFrom,
        },
      },
    });

    if (student) {
      // Update student status
      await prisma.student.update({
        where: { id: student.id },
        data: {
          status: "Responded",
        },
      });

      // Log the reply in Audit Logs
      await prisma.auditEntry.create({
        data: {
          action: "SMS Received",
          actor: "System (Twilio Webhook)",
          studentId: student.id,
          studentName: student.name,
          details: `Student replied via SMS: "${body}"`,
          type: "outreach",
          timestamp: new Date(),
        },
      });

      console.log(`[SMS Webhook] Updated student ${student.name} from ${from}`);
    } else {
      console.log(`[SMS Webhook] No student found for number ${from}`);
    }

    // Twilio requires a TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[SMS Webhook Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
