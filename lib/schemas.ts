import { z } from "zod";

const LANGUAGES = [
  "Spanish", "Ukrainian", "Chinese", "Russian", "Filipino", "Fula",
  "Malinké", "Mayan", "Persian", "French", "English", "Arabic",
  "Portuguese", "Hindi", "Bengali", "Urdu", "Vietnamese", "Korean",
  "Japanese", "Turkish", "Polish", "Romanian", "Dutch", "Italian",
  "German", "Haitian Creole", "Somali", "Amharic", "Swahili", "Hmong",
  "Khmer", "Lao", "Burmese", "Nepali", "Pashto",
] as const;

const STATUSES = [
  "Not Contacted", "Pending", "Sent", "Responded", "SMS Required", "Unreachable",
] as const;

export const StudentCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  language: z.enum(LANGUAGES),
  status: z.enum(STATUSES).default("Not Contacted"),
  lastSeen: z.string().datetime().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  languageConfidence: z.enum(["Auto-detected", "Verified"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
  classCode: z.string().max(50).optional().nullable(),
  teacherName: z.string().max(100).optional().nullable(),
  school: z.string().max(200).optional().nullable(),
  absenceDays: z.number().int().min(0).optional(),
  isPopRisk: z.boolean().optional(),
  popRiskReason: z.string().max(500).optional().nullable(),
  activeWorkerId: z.string().max(100).optional().nullable(),
  activeWorkerName: z.string().max(100).optional().nullable(),
  scheduledOutreach: z.string().datetime().optional().nullable(),
});

export const StudentUpdateSchema = StudentCreateSchema.partial();

export const AuditEntrySchema = z.object({
  actor: z.string().min(1).max(200),
  action: z.string().min(1).max(200),
  studentId: z.string().optional().nullable(),
  studentName: z.string().max(200).optional().nullable(),
  details: z.string().max(2000),
  type: z.enum(["outreach", "system", "import", "compliance"]),
});

export const SendOutreachSchema = z.object({
  studentId: z.string().min(1),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(5000),
  channel: z.enum(["Email", "SMS"]),
});

export type StudentCreateInput = z.infer<typeof StudentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>;
export type AuditEntryInput = z.infer<typeof AuditEntrySchema>;
export type SendOutreachInput = z.infer<typeof SendOutreachSchema>;
