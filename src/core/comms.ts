import { Resend } from "resend";
import twilio from "twilio";
import { getSetting } from "@/app/actions";

export async function sendRealEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const apiKey = await getSetting("resend_api_key");
  const from = await getSetting("email_from_address") || "onboarding@resend.dev";

  if (!apiKey) {
    console.log("Resend API Key missing. Simulation mode.");
    return { success: true, simulated: true };
  }

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text: body,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Resend Error:", err);
    return { success: false, error: err };
  }
}

export async function sendRealSMS({ to, body }: { to: string; body: string }) {
  const sid = await getSetting("twilio_sid");
  const token = await getSetting("twilio_auth_token");
  const from = await getSetting("twilio_phone_number");

  if (!sid || !token || !from) {
    console.log("Twilio credentials missing. Simulation mode.");
    return { success: true, simulated: true };
  }

  const client = twilio(sid, token);
  try {
    const message = await client.messages.create({
      body,
      from,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("Twilio Error:", err);
    return { success: false, error: err };
  }
}
