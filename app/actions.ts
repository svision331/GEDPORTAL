"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendRealEmail, sendRealSMS } from "@/lib/comms";
import {
  StudentCreateSchema,
  StudentUpdateSchema,
  AuditEntrySchema,
  SendOutreachSchema,
} from "@/lib/schemas";

function isAdmin(session: Awaited<ReturnType<typeof auth>>): boolean {
  return (session?.user as any)?.role === "ADMIN";
}

export async function getStudents() {
  try {
    return await prisma.student.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("DB Error getStudents:", error);
    return [];
  }
}

export async function updateStudent(id: string, data: unknown) {
  const parsed = StudentUpdateSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid student data: ${parsed.error.message}`);
  }
  return await prisma.student.update({
    where: { id },
    data: parsed.data,
  });
}

export async function createStudent(data: unknown) {
  const parsed = StudentCreateSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid student data: ${parsed.error.message}`);
  }
  return await prisma.student.create({
    data: parsed.data,
  });
}

export async function createAuditEntry(data: unknown) {
  const parsed = AuditEntrySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid audit entry: ${parsed.error.message}`);
  }
  return await prisma.auditEntry.create({
    data: parsed.data,
  });
}

export async function getAuditLogs() {
  const session = await auth();
  if (!isAdmin(session)) {
    return [];
  }
  try {
    return await prisma.auditEntry.findMany({
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    console.error("DB Error getAuditLogs:", error);
    return [];
  }
}

export async function saveSetting(id: string, value: string) {
  const session = await auth();
  if (!isAdmin(session)) {
    throw new Error("Unauthorized: ADMIN role required for settings change.");
  }
  return await prisma.setting.upsert({
    where: { id },
    update: { value },
    create: { id, value },
  });
}

export async function getSetting(id: string) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { id },
    });
    return setting?.value || null;
  } catch (error) {
    console.error("DB Error getSetting:", error);
    return null;
  }
}

export async function sendOutreach(input: unknown) {
  const parsed = SendOutreachSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`Invalid outreach data: ${parsed.error.message}`);
  }
  const { studentId, subject, body, channel } = parsed.data;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  let result;
  if (channel === "Email" && student.email) {
    result = await sendRealEmail({ to: student.email, subject, body });
  } else if (channel === "SMS" && student.phone) {
    result = await sendRealSMS({ to: student.phone, body });
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { status: channel === "SMS" ? "SMS Required" : "Sent" },
  });

  return { success: true, ...result };
}
