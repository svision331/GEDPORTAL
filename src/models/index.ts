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
  neutral: { subject: "We missed you in the GED program", body: "Hello {Student_Name}, this is {Educator_Name} from the {Program_Name}. We haven't seen you in a while and wanted to check in. Are you interested in returning? Reply YES and we'll help you re-enroll." },
  encouraging: { subject: "We'd love to welcome you back", body: "Hi {Student_Name}, {Educator_Name} here from {Program_Name}. You still have a place with us, and we can support you step-by-step. If you want to return, reply YES and we'll set you up with the next class." },
  urgent: { subject: "Important: Attendance status needs attention", body: "Hello {Student_Name}, this is {Educator_Name} from {Program_Name}. Our records show you haven't attended recently. Please reply ASAP if you plan to continue so we can hold your spot and support you." },
  exit: { subject: "Confirming your enrollment status", body: "Hello {Student_Name}, this is {Educator_Name} from {Program_Name}. If you are not planning to return, please reply STOP so we can document an exit plan properly. If you want to return, reply YES." },
};

export function getStudentName(s: Student): string {
  return `${s.firstName} ${s.lastName}`;
}

export const LANG_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  Spanish: { bg: "rgba(217,119,6,0.10)", fg: "#7C2D12", border: "rgba(217,119,6,0.18)" },
  Ukrainian: { bg: "rgba(37,99,235,0.10)", fg: "#1E3A8A", border: "rgba(37,99,235,0.18)" },
  Chinese: { bg: "rgba(34,197,94,0.10)", fg: "#065F46", border: "rgba(34,197,94,0.18)" },
  Russian: { bg: "rgba(99,102,241,0.10)", fg: "#3730A3", border: "rgba(99,102,241,0.18)" },
  Filipino: { bg: "rgba(14,165,233,0.10)", fg: "#075985", border: "rgba(14,165,233,0.18)" },
  Fula: { bg: "rgba(148,163,184,0.14)", fg: "#475569", border: "rgba(148,163,184,0.28)" },
  "Malinké": { bg: "rgba(245,158,11,0.10)", fg: "#7C2D12", border: "rgba(245,158,11,0.18)" },
  Mayan: { bg: "rgba(16,185,129,0.10)", fg: "#065F46", border: "rgba(16,185,129,0.18)" },
  Persian: { bg: "rgba(236,72,153,0.10)", fg: "#9D174D", border: "rgba(236,72,153,0.18)" },
  French: { bg: "rgba(100,116,139,0.14)", fg: "#334155", border: "rgba(100,116,139,0.24)" },
  English: { bg: "rgba(31,58,95,0.06)", fg: "#1F3A5F", border: "rgba(31,58,95,0.14)" },
  Arabic: { bg: "rgba(5,150,105,0.10)", fg: "#065F46", border: "rgba(5,150,105,0.18)" },
  Portuguese: { bg: "rgba(220,38,38,0.10)", fg: "#991B1B", border: "rgba(220,38,38,0.18)" },
  Hindi: { bg: "rgba(249,115,22,0.10)", fg: "#9A3412", border: "rgba(249,115,22,0.18)" },
  Bengali: { bg: "rgba(168,85,247,0.10)", fg: "#6B21A8", border: "rgba(168,85,247,0.18)" },
  Urdu: { bg: "rgba(236,72,153,0.08)", fg: "#831843", border: "rgba(236,72,153,0.16)" },
  Vietnamese: { bg: "rgba(239,68,68,0.10)", fg: "#991B1B", border: "rgba(239,68,68,0.18)" },
  Korean: { bg: "rgba(59,130,246,0.10)", fg: "#1D4ED8", border: "rgba(59,130,246,0.18)" },
  Japanese: { bg: "rgba(244,63,94,0.10)", fg: "#9F1239", border: "rgba(244,63,94,0.18)" },
  Turkish: { bg: "rgba(239,68,68,0.08)", fg: "#7F1D1D", border: "rgba(239,68,68,0.16)" },
  Polish: { bg: "rgba(220,38,38,0.08)", fg: "#7F1D1D", border: "rgba(220,38,38,0.16)" },
  Romanian: { bg: "rgba(250,204,21,0.12)", fg: "#713F12", border: "rgba(250,204,21,0.22)" },
  Dutch: { bg: "rgba(249,115,22,0.08)", fg: "#7C2D12", border: "rgba(249,115,22,0.16)" },
  Italian: { bg: "rgba(34,197,94,0.08)", fg: "#14532D", border: "rgba(34,197,94,0.16)" },
  German: { bg: "rgba(234,179,8,0.10)", fg: "#713F12", border: "rgba(234,179,8,0.18)" },
  "Haitian Creole": { bg: "rgba(59,130,246,0.08)", fg: "#1E3A8A", border: "rgba(59,130,246,0.16)" },
  Somali: { bg: "rgba(16,185,129,0.08)", fg: "#065F46", border: "rgba(16,185,129,0.16)" },
  Amharic: { bg: "rgba(245,158,11,0.08)", fg: "#78350F", border: "rgba(245,158,11,0.16)" },
  Swahili: { bg: "rgba(20,184,166,0.10)", fg: "#134E4A", border: "rgba(20,184,166,0.18)" },
  Hmong: { bg: "rgba(139,92,246,0.10)", fg: "#4C1D95", border: "rgba(139,92,246,0.18)" },
  Khmer: { bg: "rgba(251,146,60,0.10)", fg: "#7C2D12", border: "rgba(251,146,60,0.18)" },
  Lao: { bg: "rgba(248,113,113,0.10)", fg: "#7F1D1D", border: "rgba(248,113,113,0.16)" },
  Burmese: { bg: "rgba(251,191,36,0.10)", fg: "#78350F", border: "rgba(251,191,36,0.18)" },
  Nepali: { bg: "rgba(239,68,68,0.08)", fg: "#7F1D1D", border: "rgba(239,68,68,0.16)" },
  Pashto: { bg: "rgba(5,150,105,0.08)", fg: "#064E3B", border: "rgba(5,150,105,0.16)" },
};
