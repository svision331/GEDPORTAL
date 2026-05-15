// Shared types and constants for the portal

export type Language =
  | "Spanish" | "Ukrainian" | "Chinese" | "Russian" | "Filipino"
  | "Fula" | "Malinké" | "Mayan" | "Persian" | "French" | "English"
  | "Arabic" | "Portuguese" | "Hindi" | "Bengali" | "Urdu" | "Vietnamese"
  | "Korean" | "Japanese" | "Turkish" | "Polish" | "Romanian" | "Dutch"
  | "Italian" | "German" | "Haitian Creole" | "Somali" | "Amharic"
  | "Swahili" | "Hmong" | "Khmer" | "Lao" | "Burmese" | "Nepali" | "Pashto";

export type Status = "Not Contacted" | "Pending" | "Sent" | "Responded" | "SMS Required" | "Unreachable";
export type OutreachChannel = "Email" | "SMS" | "Call" | "Letter";
export type TemplateTone = "neutral" | "encouraging" | "urgent" | "exit";

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  language: Language;
  status: Status;
  lastSeen?: string;
  email?: string;
  phone?: string;
  address?: string;
  languageConfidence?: "Auto-detected" | "Verified";
  notes?: string;
  classCode?: string;
  teacherName?: string;
  school?: string;
  absenceDays?: number;
  isPopRisk?: boolean;
  popRiskReason?: string;
  activeWorkerId?: string;
  activeWorkerName?: string;
  scheduledOutreach?: string;
};

export type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  studentId?: string;
  studentName?: string;
  details: string;
  type: "outreach" | "system" | "import" | "compliance";
};

export const COLORS = {
  navy: "var(--navy)", navyDark: "var(--navy-dark)", navyLight: "var(--navy-light)",
  teal: "var(--teal)", tealLight: "var(--teal-light)", tealBg: "var(--teal-bg)",
  bg: "var(--bg)", white: "var(--surface)", border: "var(--border)",
  borderStrong: "var(--border-strong)", textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)", textMuted: "var(--text-muted)", chipBg: "var(--chip-bg)",
};

export const SEMANTIC = {
  danger: "var(--danger)", warning: "var(--warning)", success: "var(--success)", info: "var(--info)",
};

export const SHADOWS = {
  card: "0 1px 3px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)",
  hover: "0 12px 32px rgba(15,23,42,0.12),0 4px 8px rgba(15,23,42,0.06)",
  modal: "0 24px 64px rgba(15,23,42,0.18),0 8px 16px rgba(15,23,42,0.08)",
};

export const RADII = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };

export const STATUS_CONFIG: Record<Status, { dot: string; color: string; bg: string; border: string }> = {
  "Not Contacted": { dot: "rgba(15,23,42,0.35)", color: COLORS.textSecondary, bg: "rgba(148,163,184,0.14)", border: "rgba(148,163,184,0.28)" },
  Pending: { dot: SEMANTIC.info, color: COLORS.navy, bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.18)" },
  Sent: { dot: COLORS.teal, color: COLORS.teal, bg: "rgba(46,139,139,0.10)", border: "rgba(46,139,139,0.18)" },
  Responded: { dot: SEMANTIC.success, color: SEMANTIC.success, bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.18)" },
  "SMS Required": { dot: SEMANTIC.warning, color: SEMANTIC.warning, bg: "rgba(217,119,6,0.10)", border: "rgba(217,119,6,0.18)" },
  Unreachable: { dot: SEMANTIC.danger, color: SEMANTIC.danger, bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.18)" },
};

export const TONE_TEMPLATES: Record<TemplateTone, { subject: string; body: string }> = {
  neutral: { subject: "We missed you in the GED program", body: "Hello {Student_Name}, this is Mr. Caldwell from the {Program_Name}. We haven't seen you in a while and wanted to check in. Are you interested in returning? Reply YES and we'll help you re-enroll." },
  encouraging: { subject: "We'd love to welcome you back", body: "Hi {Student_Name}, Mr. Caldwell here from {Program_Name}. You still have a place with us, and we can support you step-by-step. If you want to return, reply YES and we'll set you up with the next class." },
  urgent: { subject: "Important: Attendance status needs attention", body: "Hello {Student_Name}, this is Mr. Caldwell from {Program_Name}. Our records show you haven't attended recently. Please reply ASAP if you plan to continue so we can hold your spot and support you." },
  exit: { subject: "Confirming your enrollment status", body: "Hello {Student_Name}, this is Mr. Caldwell from {Program_Name}. If you are not planning to return, please reply STOP so we can document an exit plan properly. If you want to return, reply YES." },
};

export function getStudentName(s: Student): string {
  return `${s.firstName} ${s.lastName}`;
}
