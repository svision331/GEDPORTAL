"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendRealEmail, sendRealSMS } from "@/lib/comms";
import { Student, Language } from "@/components/EducatorOutreachPortal";

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

export async function updateStudent(id: string, data: any) {
  return await prisma.student.update({
    where: { id },
    data,
  });
}

export async function createStudent(data: any) {
  return await prisma.student.create({
    data,
  });
}

export async function createAuditEntry(data: any) {
  return await prisma.auditEntry.create({
    data,
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

export async function sendOutreach({ studentId, subject, body, channel }: { studentId: string; subject: string; body: string; channel: "Email" | "SMS" }) {
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
    data: { status: channel === "SMS" ? "SMS Required" : "Sent" }
  });

  return { success: true, ...result };
}
