"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
const logoImg = "/logo.webp";
import { getStudents, updateStudent as dbUpdateStudent, createStudent as dbCreateStudent, createAuditEntry as dbCreateAuditEntry, getAuditLogs, saveSetting, getSetting, sendOutreach } from "@/app/actions";
import { parseViaAI, translateViaAI, getRiskAssessment } from "@/app/ai-actions";
import type { RiskAssessment } from "@/lib/aiService";
import { signOut } from "next-auth/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Language = "Spanish" | "Ukrainian" | "Chinese" | "Russian" | "Filipino" | "Fula" | "Malinké" | "Mayan" | "Persian" | "French" | "English" | "Arabic" | "Portuguese" | "Hindi" | "Bengali" | "Urdu" | "Vietnamese" | "Korean" | "Japanese" | "Turkish" | "Polish" | "Romanian" | "Dutch" | "Italian" | "German" | "Haitian Creole" | "Somali" | "Amharic" | "Swahili" | "Hmong" | "Khmer" | "Lao" | "Burmese" | "Nepali" | "Pashto";
type Status = "Not Contacted" | "Pending" | "Sent" | "Responded" | "SMS Required" | "Unreachable";
type OutreachChannel = "Email" | "SMS" | "Call" | "Letter";
export type Student = { id: string; name: string; language: Language; status: Status; lastSeen?: string; email?: string; phone?: string; address?: string; languageConfidence?: "Auto-detected" | "Verified"; notes?: string; };
type AuditEntry = { id: string; timestamp: string; actor: string; action: string; studentId?: string; studentName?: string; details: string; type: "outreach" | "system" | "import" | "compliance" };
type TemplateTone = "neutral" | "encouraging" | "urgent" | "exit";

const COLORS = { navy: "var(--navy)", navyDark: "var(--navy-dark)", navyLight: "var(--navy-light)", teal: "var(--teal)", tealLight: "var(--teal-light)", tealBg: "var(--teal-bg)", bg: "var(--bg)", white: "var(--surface)", border: "var(--border)", borderStrong: "var(--border-strong)", textPrimary: "var(--text-primary)", textSecondary: "var(--text-secondary)", textMuted: "var(--text-muted)", chipBg: "var(--chip-bg)" };
const SEMANTIC = { danger: "var(--danger)", warning: "var(--warning)", success: "var(--success)", info: "var(--info)" };
const SHADOWS = { card: "0 1px 3px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)", hover: "0 12px 32px rgba(15,23,42,0.12),0 4px 8px rgba(15,23,42,0.06)", modal: "0 24px 64px rgba(15,23,42,0.18),0 8px 16px rgba(15,23,42,0.08)" };
const RADII = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };

const STATUS_CONFIG: Record<Status, { dot: string; color: string; bg: string; border: string }> = {
  "Not Contacted": { dot: "rgba(15,23,42,0.35)", color: COLORS.textSecondary, bg: "rgba(148,163,184,0.14)", border: "rgba(148,163,184,0.28)" },
  Pending: { dot: SEMANTIC.info, color: COLORS.navy, bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.18)" },
  Sent: { dot: COLORS.teal, color: COLORS.teal, bg: "rgba(46,139,139,0.10)", border: "rgba(46,139,139,0.18)" },
  Responded: { dot: SEMANTIC.success, color: SEMANTIC.success, bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.18)" },
  "SMS Required": { dot: SEMANTIC.warning, color: SEMANTIC.warning, bg: "rgba(217,119,6,0.10)", border: "rgba(217,119,6,0.18)" },
  Unreachable: { dot: SEMANTIC.danger, color: SEMANTIC.danger, bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.18)" },
};

const LANG_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  // Original
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
  // New
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
  Lao: { bg: "rgba(248,113,113,0.10)", fg: "#7F1D1D", border: "rgba(248,113,113,0.18)" },
  Burmese: { bg: "rgba(251,191,36,0.10)", fg: "#78350F", border: "rgba(251,191,36,0.18)" },
  Nepali: { bg: "rgba(239,68,68,0.08)", fg: "#7F1D1D", border: "rgba(239,68,68,0.16)" },
  Pashto: { bg: "rgba(5,150,105,0.08)", fg: "#064E3B", border: "rgba(5,150,105,0.16)" },
};

const TONE_TEMPLATES: Record<TemplateTone, { subject: string; body: string }> = {
  neutral: { subject: "We missed you in the GED program", body: "Hello {Student_Name}, this is Mr. Caldwell from the {Program_Name}. We haven't seen you in a while and wanted to check in. Are you interested in returning? Reply YES and we'll help you re-enroll." },
  encouraging: { subject: "We'd love to welcome you back", body: "Hi {Student_Name}, Mr. Caldwell here from {Program_Name}. You still have a place with us, and we can support you step-by-step. If you want to return, reply YES and we'll set you up with the next class." },
  urgent: { subject: "Important: Attendance status needs attention", body: "Hello {Student_Name}, this is Mr. Caldwell from {Program_Name}. Our records show you haven't attended recently. Please reply ASAP if you plan to continue so we can hold your spot and support you." },
  exit: { subject: "Confirming your enrollment status", body: "Hello {Student_Name}, this is Mr. Caldwell from {Program_Name}. If you are not planning to return, please reply STOP so we can document an exit plan properly. If you want to return, reply YES." },
};

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(!!mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  useEffect(() => {
    if (reducedMotion) { setDisplay(value); return; }
    let raf = 0;
    const start = performance.now();
    const from = display;
    const delta = value - from;
    const tick = (t: number) => {
      const p = clamp((t - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reducedMotion]);
  return <>{display}</>;
}

const Muted: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: 500, ...style }}>{children}</span>
);

function btn({ variant }: { variant: "primary" | "outline" | "ghost" | "teal" | "danger" }): React.CSSProperties {
  const base: React.CSSProperties = { borderRadius: RADII.md, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1.5px solid transparent", transition: "all 180ms ease", outline: "none", userSelect: "none", whiteSpace: "nowrap", letterSpacing: "0.01em", fontFamily: "inherit" };
  if (variant === "primary") return { ...base, background: COLORS.navy, color: "#fff", boxShadow: "0 1px 4px rgba(31,58,95,0.25)" };
  if (variant === "teal") return { ...base, background: COLORS.teal, color: "#fff", boxShadow: "0 1px 4px rgba(8,145,178,0.25)" };
  if (variant === "danger") return { ...base, background: SEMANTIC.danger, color: "#fff" };
  if (variant === "outline") return { ...base, background: COLORS.white, color: COLORS.textPrimary, borderColor: COLORS.borderStrong, boxShadow: SHADOWS.card };
  return { ...base, background: "transparent", color: COLORS.textMuted, borderColor: "transparent" };
}

function HoverableButton({ children, style, onClick }: { children: React.ReactNode; style: React.CSSProperties; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  const isGhost = !style.background || style.background === "transparent";
  return (
    <button onClick={onClick} style={{ ...style, transform: hover ? "translateY(-2px)" : "translateY(0)", boxShadow: hover && !isGhost ? SHADOWS.hover : style.boxShadow, opacity: hover && isGhost ? 0.7 : 1 }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", padding: "5px 10px", borderRadius: RADII.full, border: `1.5px solid ${cfg.border}`, background: cfg.bg, fontSize: 11, fontWeight: 800, color: cfg.color, letterSpacing: "0.03em" }}>
      <span style={{ width: 6, height: 6, borderRadius: RADII.full, background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function LanguageTag({ lang }: { lang: Language }) {
  const cfg = LANG_COLORS[lang] || LANG_COLORS.English;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: RADII.full, background: cfg.bg, border: `1.5px solid ${cfg.border}`, color: cfg.fg, fontSize: 11, fontWeight: 800, width: "fit-content", letterSpacing: "0.02em" }}>
      {lang}
    </span>
  );
}

function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: COLORS.border, margin: "14px 0", ...style }} />;
}

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{ fontSize: 11, color: color || COLORS.navy, background: color ? `${color}14` : COLORS.chipBg, border: `1.5px solid ${color ? `${color}28` : "rgba(31,58,95,0.14)"}`, padding: "5px 11px", borderRadius: RADII.full, fontWeight: 800, letterSpacing: "0.03em" }}>
      {label}
    </span>
  );
}

function Card({ children, title, right, style, accent }: { children: React.ReactNode; title?: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties; accent?: string }) {
  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: RADII.lg, boxShadow: SHADOWS.card, overflow: "hidden", position: "relative", ...style }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: accent }} />}
      {title ? (
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.01em", color: COLORS.textPrimary }}>{title}</div>
          {right}
        </div>
      ) : null}
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "min(840px, 100%)", background: COLORS.white, borderRadius: RADII.xl, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.modal, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "linear-gradient(135deg,rgba(31,58,95,0.03),rgba(8,145,178,0.03))" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>{title}</div>
          <button onClick={onClose} style={{ ...btn({ variant: "ghost" }), fontSize: 12, padding: "6px 12px", border: `1px solid ${COLORS.border}`, borderRadius: RADII.sm }}>✕ Close</button>
        </div>
        <div style={{ padding: 20, maxHeight: "70vh", overflowY: "auto" }}>{children}</div>
        {footer ? (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, background: "rgba(240,244,248,0.6)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "inline-flex", border: `1.5px solid ${COLORS.borderStrong}`, background: COLORS.white, borderRadius: RADII.full, overflow: "hidden", boxShadow: SHADOWS.card }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{ padding: "8px 14px", border: "none", background: active ? COLORS.navy : "transparent", color: active ? "#fff" : COLORS.textMuted, fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 180ms ease", letterSpacing: "0.01em", fontFamily: "inherit" }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CookieBanner() {
  const [accepted, setAccepted] = useState(true); // Default true to avoid flash before effect runs

  useEffect(() => {
    const hasAccepted = localStorage.getItem("ag_cookie_consent");
    if (!hasAccepted) {
      setAccepted(false);
    }
  }, []);

  if (accepted) return null;

  return (
    <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "min(600px, calc(100vw - 40px))", background: COLORS.navyDark, color: COLORS.white, padding: "16px 20px", borderRadius: RADII.lg, boxShadow: SHADOWS.modal, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 2000 }}>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        <strong style={{ display: "block", marginBottom: 4, fontSize: 14 }}>Cookie Policy</strong>
        We use cookies to ensure you get the best experience on our portal. By continuing to use this site, you consent to our use of cookies.
      </div>
      <button
        onClick={() => {
          localStorage.setItem("ag_cookie_consent", "true");
          setAccepted(true);
        }}
        style={{ ...btn({ variant: "teal" }), whiteSpace: "nowrap" }}
      >
        I Understand
      </button>
    </div>
  );
}

const TOS_CONTENT = `
# TERMS OF SERVICE

**Last Updated:** May 2026

## 1. Agreement to Terms

By accessing or using Antigravity (“Service”), you agree to these Terms. If you do not agree, do not use the Service.

## 2. Description of Service

Antigravity provides AI-powered tools that generate structured creative outputs, design systems, and related digital content. Outputs are generated automatically using artificial intelligence systems.

## 3. Eligibility

You must be at least 18 years old to use the Service.

## 4. Accounts

You are responsible for:

- Maintaining account security
- All activity under your account
- Keeping login credentials confidential

We may suspend accounts that violate these Terms.

## 5. Acceptable Use

You may not:

- Use the Service for unlawful purposes
- Reverse engineer the platform
- Attempt to extract training data
- Use outputs to build a competing AI model
- Upload harmful or infringing content

## 6. AI Output Disclaimer

The Service generates content using artificial intelligence.
We do not guarantee:

- Accuracy
- Completeness
- Legal compliance
- Fitness for any specific purpose

Outputs are provided “as is.” You are solely responsible for reviewing and validating outputs before use. Antigravity is not liable for damages resulting from reliance on AI-generated content.

## 7. Intellectual Property

We retain all rights to:

- Software
- Algorithms
- Brand assets
- Platform infrastructure

Subject to your compliance with these Terms:

- You own the outputs generated for you.
- You grant us a limited license to use anonymized inputs for system improvement.

## 8. Payment and Subscription

If you purchase a subscription:

- Fees are billed in advance
- Subscriptions auto-renew unless canceled
- Refunds are provided only if required by law
- Failure to pay may result in suspension.

## 9. Termination

We may suspend or terminate access if you violate these Terms. You may cancel at any time.

## 10. Limitation of Liability

To the fullest extent permitted by law:
Antigravity shall not be liable for indirect, incidental, consequential, or special damages. Total liability shall not exceed the amount paid in the prior 12 months.

## 11. Indemnification

You agree to indemnify and hold harmless Antigravity from claims arising from:

- Your use of the Service
- Your misuse of AI outputs
- Your violation of these Terms

## 12. Dispute Resolution

All disputes shall be resolved through binding arbitration in Newark, New Jersey. No class actions permitted.

## 13. Governing Law

These Terms are governed by the laws of the State of New Jersey.

## 14. Changes to Terms

We may update these Terms at any time. Continued use constitutes acceptance.

---
*Note: This is founder-grade protection. A lawyer can refine it later.*
`;
const PRIVACY_POLICY_CONTENT = `
# Privacy Policy

**Last Updated:** February 2026

Antigravity ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use the Educator Outreach Portal (the "Service").

By using the Service, you consent to the data practices described in this policy.

## 1. Information We Collect

We collect information that you provide directly to us when using the Service:

* **Account Information:** When you register, we may collect your name, email address, and institutional affiliation (if applicable).
* **Student Data Inputs:** The Service processes the student data you input or upload (e.g., student names, contact information, language preferences, attendance data) strictly for the purpose of generating outreach communications.
* **Communication Content:** We process the content of the templates, subjects, and body texts you create within the platform.
* **Usage Data:** We may collect anonymous data about how you interact with the Service (e.g., time spent on pages, buttons clicked, errors encountered) to improve performance and user experience.

## 2. How We Use Your Information

We use the information we collect primarily to provide, maintain, and improve the Service:

* **Providing the Core Service:** To process your student rosters, generate translated outreach drafts, and facilitate communication tracking.
* **Service Improvement:** To analyze usage trends, fix bugs, and optimize the platform's features (e.g., improving language detection accuracy).
* **AI Model Training (Anonymized Data Only):** We **do not** use personally identifiable student data to train our core AI models. We may use highly anonymized, aggregated usage patterns and non-sensitive generic inputs (like generalized template structures) to improve the general performance of our natural language processing systems.
* **Communication:** To send you technical notices, security alerts, and administrative messages.

## 3. Data Sharing and Disclosure

We respect the sensitive nature of educational data. We do not sell, rent, or trade your personal information or your students' data to third parties for their marketing purposes.

We may share your information only in the following limited circumstances:

* **Essential Service Providers:** We may share data with trusted third-party vendors who perform services on our behalf, such as translation API providers (e.g., MyMemory API), hosting services, and payment processors (e.g., Stripe). These providers are bound by confidentiality obligations and are restricted from using the data for any purpose other than providing these services to us.
* **Legal Compliance:** We may disclose information if required to do so by law or in the good-faith belief that such action is necessary to comply with state and federal laws (such as FERPA, where applicable).
* **Business Transfers:** If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.

## 4. Third-Party AI Services

The Service utilizes third-party artificial intelligence and translation APIs to generate content. When you submit text for translation or generation, that specific text is transmitted to our API partners. We use providers that adhere to strict data security standards and generally do not retain or use your inputs to train their public models. However, you acknowledge that AI processing inherently involves data transmission over the internet.

## 5. Security of Your Information

We use administrative, technical, and physical security measures to help protect your personal information and student data. This includes HTTPS encryption in transit. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.

## 6. Cookies and Tracking Technologies

We may use cookies and similar tracking technologies on the Service to help customize the Site and improve your experience. Most browsers are set to accept cookies by default. You can remove or reject cookies, but be aware that such action could affect the availability and functionality of the Service.

## 7. Your Data Rights

Depending on your location, you may have the right to request access to, correction of, or deletion of the personal information we hold about you. You may also have the right to object to or restrict certain processing activities.

To exercise these rights, or if you wish to delete your account and associated data, please contact us using the information provided below.

## 8. Children’s Privacy

The Service is intended for use by educators and administrators. We do not knowingly collect personally identifiable information directly from children under the age of 13. If you become aware that a child under 13 has provided us with personal information, please contact us immediately.

## 9. Changes to This Privacy Policy

We may update this Privacy Policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 10. Contact Us

If you have questions or comments about this Privacy Policy or our data practices, please contact us at:

**Antigravity Legal**
100 Innovation Way
Newark, NJ 07102
legal@gedportal.edu
`;

const DMCA_POLICY_CONTENT = `
**Last Updated:** February 2026

**Digital Millennium Copyright Act ("DMCA") Policy**

Antigravity respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at http://www.copyright.gov/legislation/dmca.pdf, Antigravity will respond expeditiously to claims of copyright infringement committed using the Antigravity service and/or the Antigravity website (the "Site") if such claims are reported to Antigravity's Designated Copyright Agent identified in the sample notice below.

If you are a copyright owner, authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to Antigravity's Designated Copyright Agent.

**1. DMCA Notice of Alleged Infringement ("Notice")**
*   Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.
*   Identify the material or link you claim is infringing (or the subject of infringing activity) and that access to which is to be disabled, including at a minimum, if applicable, the URL of the link shown on the Site or the exact location where such material may be found.
*   Provide your company affiliation (if applicable), mailing address, telephone number, and, if available, email address.
*   Include both of the following statements in the body of the Notice:
    *   "I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."
    *   "I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."
*   Provide your full legal name and your electronic or physical signature.

Deliver this Notice, with all items completed, to Antigravity's Designated Copyright Agent:

**Copyright Agent**
Antigravity Legal
100 Innovation Way
Newark, NJ 07102
legal@gedportal.edu

**2. Counter-Notice**
If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice containing the following information to the Copyright Agent:
*   Your physical or electronic signature;
*   Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled;
*   A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content; and
*   Your name, address, telephone number, and e-mail address, a statement that you consent to the jurisdiction of the federal court in Newark, New Jersey, and a statement that you will accept service of process from the person who provided notification of the alleged infringement.

If a counter-notice is received by the Copyright Agent, Antigravity may send a copy of the counter-notice to the original complaining party informing that person that it may replace the removed content or cease disabling it in 10 business days. Unless the copyright owner files an action seeking a court order against the content provider, member or user, the removed content may be replaced, or access to it restored, in 10 to 14 business days or more after receipt of the counter-notice, at Antigravity's sole discretion.
`;

const REFUND_POLICY_CONTENT = `
**Last Updated:** February 2026

**Refund and Cancellation Policy**

Antigravity strives to provide the highest quality service to our users. This Refund and Cancellation Policy outlines the conditions under which refunds may be granted and how you can manage your subscription.

**1. Subscription Cancellations**
You may cancel your subscription to the Educator Outreach Portal at any time. Cancellation will take effect at the end of your current billing cycle. You will retain access to the Service until the end of that cycle. We do not provide prorated refunds for mid-cycle cancellations.

**2. Refund Eligibility**
Because Antigravity incurs immediate computing costs when you generate AI outputs, we generally **do not offer refunds** for past subscription charges or one-time purchases, except in the specific circumstances outlined below.

**3. Exceptional Circumstances for Refunds**
We will review requests for refunds on a case-by-case basis. A refund *may* be granted if:
*   You experienced a significant, documented technical failure that prevented you from using the core features of the Service for an extended period, and our support team was unable to resolve the issue within a reasonable timeframe.
*   You were erroneously charged due to a billing error on our end.
*   Required by applicable consumer protection laws in your jurisdiction.

**4. How to Request a Refund**
If you believe you are eligible for a refund under the exceptional circumstances listed above, please contact our support team at legal@gedportal.edu within 14 days of the charge. Please include your account email address, a description of the issue, and any relevant documentation.

**5. Changes to Fees**
We reserve the right to change our subscription fees upon reasonable prior notice, which will be communicated to you via email or through the Service. Continued use of the Service after the fee change becomes effective constitutes your agreement to pay the modified fee.
`;



function LegalModal({ open, type, onClose }: { open: boolean; type: "terms" | "privacy" | "dmca" | "refund" | null; onClose: () => void }) {
  if (!open || !type) return null;

  const title = type === "terms" ? "Terms of Service" : type === "privacy" ? "Privacy Policy" : type === "dmca" ? "DMCA Policy" : "Refund Policy";

  // Basic markdown-to-html for paragraphs, bold text, headers, and lists
  const rawContent = type === "terms" ? TOS_CONTENT : type === "privacy" ? PRIVACY_POLICY_CONTENT : type === "dmca" ? DMCA_POLICY_CONTENT : REFUND_POLICY_CONTENT;
  const content = (rawContent || "").split('\n\n').map((p: string, i: number) => {
    if (!p) return null;
    let html = String(p).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (html.startsWith('## ')) {
      html = `<strong style="font-size: 15px; color: var(--navy); display: block; margin-top: 8px;">${html.replace('## ', '')}</strong>`;
    } else if (html.startsWith('# ')) {
      html = `<strong style="font-size: 18px; color: var(--navy); display: block; margin-top: 8px;">${html.replace('# ', '')}</strong>`;
    } else {
      // Process lists (starting with * or -)
      html = html.replace(/\n\* /g, '<br/>• ').replace(/^\* /g, '• ');
      html = html.replace(/\n- /g, '<br/>• ').replace(/^- /g, '• ');
    }
    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ marginBottom: 12, lineHeight: 1.6, fontSize: 13, color: COLORS.textSecondary }} />
  });

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div style={{ padding: "0 4px" }}>
        {content}
      </div>
    </Modal>
  );
}

function Footer({ onOpenLegal }: { onOpenLegal: (type: "terms" | "privacy" | "dmca" | "refund") => void }) {
  return (
    <div style={{ padding: "32px 20px", marginTop: 40, borderTop: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", gap: 24, fontSize: 12, fontWeight: 700 }}>
        <button onClick={() => onOpenLegal("terms")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Terms of Service</button>
        <button onClick={() => onOpenLegal("privacy")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Privacy Policy</button>
        <button onClick={() => onOpenLegal("dmca")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>DMCA Policy</button>
        <button onClick={() => onOpenLegal("refund")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Refund Policy</button>
      </div>
      <Muted>Copyright © Antigravity 2026. All rights reserved.</Muted>
    </div>
  );
}

const FOCUS_ACCENTS = [COLORS.teal, SEMANTIC.warning, SEMANTIC.success];
function TodaysFocus({ items, onPick }: { items: Array<{ label: string; count: number; filterKey: string }>; onPick: (filterKey: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {items.map((item, idx) => (
        <button key={idx} onClick={() => onPick(item.filterKey)} style={{ textAlign: "left", background: COLORS.white, borderRadius: RADII.md, padding: "14px 16px", border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${FOCUS_ACCENTS[idx]}`, boxShadow: SHADOWS.card, cursor: "pointer", transition: "all 180ms ease" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: FOCUS_ACCENTS[idx], lineHeight: 1.1 }}><CountUp value={item.count} /></div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: 500 }}>{item.label}</div>
        </button>
      ))}
    </div>
  );
}

const LANG_CODES: Record<Language, string> = {
  Spanish: "es", Ukrainian: "uk", Chinese: "zh", Russian: "ru",
  Filipino: "tl", Fula: "ff", "Malinké": "bm", Mayan: "yua",
  Persian: "fa", French: "fr", English: "en",
  Arabic: "ar", Portuguese: "pt", Hindi: "hi", Bengali: "bn",
  Urdu: "ur", Vietnamese: "vi", Korean: "ko", Japanese: "ja",
  Turkish: "tr", Polish: "pl", Romanian: "ro", Dutch: "nl",
  Italian: "it", German: "de", "Haitian Creole": "ht", Somali: "so",
  Amharic: "am", Swahili: "sw", Hmong: "hmn", Khmer: "km",
  Lao: "lo", Burmese: "my", Nepali: "ne", Pashto: "ps",
};

const translationCache = new Map<string, string>();

function useTranslation(text: string, lang: Language): { translated: string; loading: boolean; error: boolean } {
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const code = LANG_CODES[lang];
  useEffect(() => {
    if (lang === "English" || !text.trim()) { setTranslated(text); setLoading(false); return; }
    setLoading(true); setError(false);
    const timer = setTimeout(async () => {
      try {
        const result = await translateViaAI(text, lang, code);
        setTranslated(result);
        setError(false);
      } catch {
        setError(true);
        setTranslated(text);
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [text, lang, code]);
  return { translated, loading, error };
}

function formatTemplate(template: string, student: Student, programName: string) {
  return template.replaceAll("{Student_Name}", student.name).replaceAll("{Program_Name}", programName);
}

const MOCK_STUDENTS: Student[] = [
  { id: "1", name: "ALAMORA DORIA, ERICA MARIA", language: "Spanish", status: "Not Contacted", languageConfidence: "Auto-detected", email: "erica@example.com" },
  { id: "2", name: "HEREDIA NORIEGA, PAUL", language: "Spanish", status: "Not Contacted", languageConfidence: "Auto-detected", email: "paul@example.com" },
  { id: "3", name: "MOREL, DANILO", language: "French", status: "Not Contacted", languageConfidence: "Auto-detected", email: "danilo@example.com" },
  { id: "4", name: "BAGRYAN, LUSINE", language: "Ukrainian", status: "Not Contacted", languageConfidence: "Auto-detected", phone: "+1 (917) 000-0101" },
  { id: "5", name: "YEN, DAYANE", language: "Chinese", status: "Not Contacted", languageConfidence: "Auto-detected", phone: "+1 (917) 000-0102" },
  { id: "6", name: "ORAZALIMOVA, SHARA", language: "Russian", status: "Not Contacted", languageConfidence: "Auto-detected", email: "shara@example.com" },
  { id: "7", name: "CUNUHAY, ISAAC", language: "Filipino", status: "Not Contacted", languageConfidence: "Auto-detected", email: "isaac@example.com" },
  { id: "8", name: "DIALLO, AISSATA", language: "Fula", status: "SMS Required", languageConfidence: "Auto-detected", phone: "+1 (917) 000-0103" },
  { id: "9", name: "CAMARA, MOHAMED", language: "Malinké", status: "SMS Required", languageConfidence: "Auto-detected", phone: "" },
];

function computeTodayFocus(students: Student[]) {
  const atRisk = students.filter(s => s.status === "Not Contacted" || s.status === "Pending").length;
  const missingContact = students.filter(s => !s.email && !s.phone).length;
  const repliesWaiting = students.filter(s => s.status === "Responded").length;
  return { atRisk, missingContact, repliesWaiting };
}

function exportCSV(rows: Array<Record<string, any>>, filename: string) {
  const headers = Object.keys(rows[0] || { empty: "" });
  const csv = headers.join(",") + "\n" + rows.map(r => headers.map(h => { const v = r[h] ?? ""; const s = String(v).replaceAll('"', '""'); return `"${s}"`; }).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: "10px 14px", borderRadius: RADII.md, border: `1.5px solid ${COLORS.borderStrong}`, background: COLORS.white, color: COLORS.textPrimary, fontWeight: 500, fontSize: 13, outline: "none", fontFamily: "inherit" };
}
function labelStyle(): React.CSSProperties {
  return { fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 };
}
function thStyle(bg = false): React.CSSProperties {
  return { textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 800, padding: "11px 14px", borderBottom: `1px solid ${COLORS.border}`, background: bg ? "#F8FAFC" : undefined, whiteSpace: "nowrap", letterSpacing: "0.04em", textTransform: "uppercase" };
}
function tdStyle(): React.CSSProperties {
  return { padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textSecondary, verticalAlign: "middle" };
}

const METRIC_ACCENTS = [COLORS.teal, SEMANTIC.warning, SEMANTIC.danger, "#7C3AED"];
function Metric({ title, value, sub, tone = "neutral", trend }: { title: string; value: number; sub?: string; tone?: "success" | "warning" | "danger" | "info" | "neutral"; trend?: string }) {
  const color = tone === "success" ? SEMANTIC.success : tone === "warning" ? SEMANTIC.warning : tone === "danger" ? SEMANTIC.danger : tone === "info" ? SEMANTIC.info : COLORS.navy;
  const bg = tone === "success" ? "rgba(34, 197, 94, 0.05)" : tone === "warning" ? "rgba(245, 158, 11, 0.05)" : tone === "danger" ? "rgba(239, 68, 68, 0.05)" : tone === "info" ? "rgba(59, 130, 246, 0.05)" : COLORS.white;
  
  return (
    <div style={{ padding: "14px 16px", borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, background: bg, boxShadow: SHADOWS.card, borderTop: `3px solid ${color}`, position: "relative" }}>
      {trend && (
        <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 800, color: trend.startsWith("+") ? SEMANTIC.success : SEMANTIC.danger, background: trend.startsWith("+") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", padding: "2px 6px", borderRadius: 4 }}>
          {trend}
        </div>
      )}
      <div style={{ fontSize: 28, fontWeight: 800, color: color, lineHeight: 1.1 }}><CountUp value={value} /></div>
      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, marginTop: 4 }}>{title}</div>
      {sub ? <Muted style={{ display: "block", marginTop: 2 }}>{sub}</Muted> : null}
    </div>
  );
}

function AlertRow({ title, detail, tone, onClick }: { title: string; detail: string; tone: "warning" | "danger" | "info" | "success"; onClick?: () => void }) {
  const color = tone === "warning" ? SEMANTIC.warning : tone === "danger" ? SEMANTIC.danger : tone === "info" ? SEMANTIC.info : SEMANTIC.success;
  return (
    <div 
      onClick={onClick}
      style={{ padding: "12px 14px", borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${color}`, background: COLORS.white, display: "flex", gap: 12, alignItems: "center", boxShadow: SHADOWS.card, cursor: onClick ? "pointer" : "default", transition: "all 0.2s" }}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { if(onClick) e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{title}</div>
        <Muted style={{ display: "block", marginTop: 3 }}>{detail}</Muted>
      </div>
      {onClick && <span style={{ color: COLORS.textMuted, fontSize: 16 }}>➔</span>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10, alignItems: "baseline" }}>
      <Muted style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</Muted>
      <div style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TopBar({ title, subtitle, onExportReport, onOpenSettings, userName, role }: { title: string; subtitle?: string; onExportReport?: () => void; onOpenSettings: () => void; userName?: string; role?: string }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(240,244,248,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${COLORS.border}`, boxShadow: "0 1px 0 rgba(15,23,42,0.04)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: RADII.sm, background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.teal})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(31,58,95,0.3)" }}>
            <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>{title}</div>
            {subtitle ? <Muted style={{ display: "block", marginTop: 1, fontSize: 11 }}>{subtitle}</Muted> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Chip label="Secure" color={SEMANTIC.success} />
          <Chip label={role === "ADMIN" ? "Admin Mode" : "Educator Access"} color={role === "ADMIN" ? COLORS.teal : COLORS.navyLight} />
          <HoverableButton onClick={onExportReport} style={btn({ variant: "outline" })}>⬇ Export Report</HoverableButton>
          {role === "ADMIN" && <HoverableButton onClick={onOpenSettings} style={btn({ variant: "outline" })}>⚙️ AI Settings</HoverableButton>}
          <div style={{ width: 1, height: 24, background: COLORS.border, margin: "0 4px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{userName || "Educator"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{role}</div>
            </div>
            <HoverableButton onClick={() => signOut()} style={{ ...btn({ variant: "ghost" }), color: "var(--danger)" }}>Log Out</HoverableButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ children, title, subtitle, onExportReport, onOpenLegal, onOpenSettings, userName, role }: { children: React.ReactNode; title: string; subtitle?: string; onExportReport?: () => void; onOpenLegal: (t: "terms" | "privacy" | "dmca" | "refund") => void; onOpenSettings: () => void; userName?: string; role?: string }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textPrimary }}>
      <TopBar title={title} subtitle={subtitle} onExportReport={onExportReport} onOpenSettings={onOpenSettings} userName={userName} role={role} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 32px", minHeight: "calc(100vh - 160px)" }}>{children}</div>
      <Footer onOpenLegal={onOpenLegal} />
      <CookieBanner />
    </div>
  );
}

function DashboardView({ focus, onPickFocus, stats, onSendEmail, onReviewDrafts, onDownloadLog }: { focus: { atRisk: number; missingContact: number; repliesWaiting: number }; onPickFocus: (key: string) => void; stats: { total: number; atRisk: number; smsRequired: number; unreachable: number }; onSendEmail: () => void; onReviewDrafts: () => void; onDownloadLog: () => void }) {
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Outreach Command Center" right={<Chip label={`Data Synced: Today at ${timeString}`} />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          {/* LEFT: Metrics and Alerts */}
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Metric title="Total Students" value={stats.total} sub="Roster size" tone="neutral" />
              <Metric title="At Risk" value={stats.atRisk} sub="Needs outreach" tone={stats.atRisk > 0 ? "danger" : "success"} />
              <Metric title="Replies Waiting" value={focus.repliesWaiting} sub="Needs review" tone={focus.repliesWaiting > 0 ? "info" : "neutral"} />
              <Metric title="Unreachable" value={stats.unreachable} sub="Missing contact info" tone={stats.unreachable > 0 ? "warning" : "success"} />
            </div>
            
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 850, fontSize: 13, marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
                <span>Active Attendance Alerts</span>
                <Muted>Prioritized by urgency</Muted>
              </div>
              
              {stats.atRisk > 0 && <AlertRow onClick={() => onPickFocus("atRisk")} title="High Absence Threshold Reached" detail={`${stats.atRisk} student(s) critically flagged. Prioritize immediate outreach.`} tone="danger" />}
              {focus.missingContact > 0 && <AlertRow onClick={() => onPickFocus("missingContact")} title="Missing Contact Information" detail={`${focus.missingContact} student(s) unreachable. Update records manually.`} tone="warning" />}
              {focus.repliesWaiting > 0 && <AlertRow onClick={() => onPickFocus("replies")} title="New Replies Waiting" detail={`${focus.repliesWaiting} response(s) pending your review.`} tone="info" />}
              
              {stats.atRisk === 0 && focus.missingContact === 0 && focus.repliesWaiting === 0 && (
                <div style={{ padding: 24, textAlign: "center", background: "rgba(34, 197, 94, 0.05)", borderRadius: 12, border: `1px dashed rgba(34, 197, 94, 0.3)` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: SEMANTIC.success }}>All caught up</div>
                  <Muted>No critical attendance alerts at this time.</Muted>
                </div>
              )}
            </div>
          </div>
          
          {/* RIGHT: Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Card title="Quick Actions" style={{ background: `linear-gradient(135deg, rgba(31,58,95,0.02), rgba(8,145,178,0.04))`, border: `1px solid ${COLORS.borderStrong}`, height: "100%", boxShadow: "none" }}>
              <div style={{ display: "grid", gap: 10 }}>
                <Muted style={{ marginBottom: 4 }}>Fast tools for daily compliance workflows.</Muted>
                <HoverableButton style={btn({ variant: "teal" })} onClick={onSendEmail}>Send Mass Email</HoverableButton>
                <HoverableButton style={btn({ variant: "outline" })} onClick={onReviewDrafts}>Review Translated Drafts</HoverableButton>
                <HoverableButton style={btn({ variant: "outline" })} onClick={onDownloadLog}>Download Supervisor Log</HoverableButton>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RosterView(props: { students: Student[]; allStudents: Student[]; query: string; setQuery: (v: string) => void; languageFilter: Language | "All"; setLanguageFilter: (v: any) => void; statusFilter: Status | "All"; setStatusFilter: (v: any) => void; languages: Array<Language | "All">; statuses: Array<Status | "All">; selected: string[]; toggleSelected: (id: string) => void; selectAllVisible: () => void; hoveredId: string | null; setHoveredId: (id: string | null) => void; onRowClick: (id: string) => void; onSend: (id: string) => void }) {
  const { students, allStudents, query, setQuery, languageFilter, setLanguageFilter, statusFilter, setStatusFilter, languages, statuses, selected, toggleSelected, selectAllVisible, hoveredId, setHoveredId, onRowClick, onSend } = props;
  
  const [sortField, setSortField] = useState<"name" | "language" | "status" | "contacted">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const STATUS_SORT_WEIGHT: Record<Status, number> = {
    "Responded": 6,
    "Sent": 5,
    "Pending": 4,
    "Not Contacted": 3,
    "SMS Required": 2,
    "Unreachable": 1,
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "language") {
        cmp = a.language.localeCompare(b.language);
      } else if (sortField === "status") {
        cmp = STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status];
      } else if (sortField === "contacted") {
        const aVal = a.status === "Sent" || a.status === "Responded" ? 1 : 0;
        const bVal = b.status === "Sent" || b.status === "Responded" ? 1 : 0;
        cmp = aVal - bVal;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, sortField, sortDir]);

  const toggleSort = (field: "name" | "language" | "status" | "contacted") => {
    if (sortField === field) setSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span style={{ opacity: 0.2, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: COLORS.teal }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Student Roster" right={<div style={{ display: "flex", gap: 10, alignItems: "center" }}><Muted>Showing {students.length} of {allStudents.length} students</Muted></div>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search names..." style={inputStyle()} />
          <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} style={inputStyle()}>
            {languages.map(l => <option key={l} value={l}>{l === "All" ? "All Languages" : l}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle()}>
            {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
          <HoverableButton style={btn({ variant: "outline" })} onClick={selectAllVisible}>
            {selected.length === students.length && students.length > 0 ? "Deselect All" : "Select All"}
          </HoverableButton>
        </div>
        
        {selected.length > 0 && (
          <div style={{ padding: "12px 16px", background: "rgba(8,145,178,0.08)", border: `1px solid ${COLORS.teal}`, borderRadius: RADII.md, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <div style={{ fontWeight: 800, color: COLORS.navy }}>{selected.length} student(s) selected</div>
            <div style={{ display: "flex", gap: 8 }}>
              <HoverableButton style={btn({ variant: "outline" })} onClick={() => {
                // To open bulk modal we need to dispatch an event or trigger it via a callback.
                // Alternatively, we can just ask the user to click Send Bulk from Command Center.
                alert("Use the 'Send Bulk' button in the Command Center to message these selected students.");
              }}>Bulk Actions</HoverableButton>
            </div>
          </div>
        )}
        
        <Divider style={{ marginTop: selected.length > 0 ? 16 : 24 }} />
        
        <div style={{ overflow: "auto", borderRadius: RADII.md, border: `1px solid ${COLORS.border}` }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
              <tr style={{ background: "#FAFBFD" }}>
                <th style={{ ...thStyle(true), width: 40 }}> </th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("name")}>Student <SortIcon field="name" /></th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("language")}>Language <SortIcon field="language" /></th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("status")}>Status <SortIcon field="status" /></th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("contacted")}>Last Contacted <SortIcon field="contacted" /></th>
                <th style={{ ...thStyle(true), textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map(s => {
                const isSelected = selected.includes(s.id);
                return (
                  <tr key={s.id} onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: isSelected ? "rgba(31,58,95,0.03)" : "#fff", cursor: "pointer" }}>
                    <td style={tdStyle()}><input type="checkbox" checked={isSelected} onChange={() => toggleSelected(s.id)} onClick={e => e.stopPropagation()} /></td>
                    <td style={{ ...tdStyle(), position: "sticky", left: 0, background: isSelected ? "rgba(31,58,95,0.03)" : COLORS.white, zIndex: 2, fontWeight: 850 }} onClick={() => onRowClick(s.id)}>
                      {s.name}
                      <div><Muted style={{ fontSize: 11 }}>{s.email ? s.email : s.phone ? s.phone : "No contact info"}</Muted></div>
                    </td>
                    <td style={tdStyle()} onClick={() => onRowClick(s.id)}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <LanguageTag lang={s.language} />
                        <Muted style={{ fontSize: 11 }}>{s.languageConfidence ?? "Auto-detected"}</Muted>
                      </div>
                    </td>
                    <td style={tdStyle()} onClick={() => onRowClick(s.id)}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle()} onClick={() => onRowClick(s.id)}>
                      <span style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600 }}>
                        {s.status === "Sent" ? "Recently" : s.status === "Responded" ? "Active" : "Never"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <HoverableButton style={{ ...btn({ variant: "outline" }), padding: "4px 10px" }} onClick={() => onSend(s.id)}>Send</HoverableButton>
                        <HoverableButton style={{ ...btn({ variant: "outline" }), padding: "4px 10px" }} onClick={() => window.dispatchEvent(new CustomEvent('open-call-simulator', { detail: s.id }))}>Call</HoverableButton>
                        <HoverableButton style={{ ...btn({ variant: "outline" }), padding: "4px 10px" }} onClick={() => onRowClick(s.id)}>View</HoverableButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center" }}><div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>No matching students</div><Muted>Adjust filters or search to continue.</Muted></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TranslationCard({ lang, body, onRemove }: { lang: Language; body: string; onRemove: () => void }) {
  const { translated, loading, error } = useTranslation(body, lang);
  const accentColor: string = LANG_COLORS[lang]?.fg ?? COLORS.teal;
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${accentColor}`, borderRadius: RADII.md, padding: "12px 14px", background: COLORS.white, boxShadow: SHADOWS.card }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageTag lang={lang} />
          {loading && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>AI Translating…</span>}
          {error && <span style={{ fontSize: 11, color: SEMANTIC.warning }}>⚠ Fallback to English</span>}
        </div>
        <button onClick={onRemove} style={btn({ variant: "ghost" })}>✕</button>
      </div>
      <Divider style={{ margin: "10px 0" }} />
      {loading ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0" }}>
          <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, animation: "pulse 1s ease-in-out infinite" }} />
          <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, animation: "pulse 1s ease-in-out 0.2s infinite" }} />
          <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, animation: "pulse 1s ease-in-out 0.4s infinite" }} />
        </div>
      ) : (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{translated || body}</div>
      )}
    </div>
  );
}

function TemplatesView({ tone, setTone, subject, setSubject, body, setBody, previewLangs, setPreviewLangs, library, onSaveTemplate, onLoadTemplate, onSendTest }: { tone: TemplateTone; setTone: (v: TemplateTone) => void; subject: string; setSubject: (v: string) => void; body: string; setBody: (v: string) => void; previewLangs: Language[]; setPreviewLangs: (v: Language[]) => void; library: Array<{ name: string; subject: string; body: string; tone: TemplateTone }>; onSaveTemplate: (name: string) => void; onLoadTemplate: (t: any) => void; onSendTest: () => void }) {
  const langOptions: Language[] = [
    "Arabic", "Amharic", "Bengali", "Burmese", "Chinese", "Dutch",
    "English", "Filipino", "French", "Fula", "German", "Haitian Creole",
    "Hindi", "Hmong", "Italian", "Japanese", "Khmer", "Korean",
    "Lao", "Malinké", "Mayan", "Nepali", "Persian", "Pashto",
    "Polish", "Portuguese", "Romanian", "Russian", "Somali", "Spanish",
    "Swahili", "Turkish", "Ukrainian", "Urdu", "Vietnamese",
  ];
  
  const charCount = body.length;
  const isSMSCritical = charCount > 160;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <Card title="Template Library" right={<HoverableButton style={{ ...btn({ variant: "teal" }), padding: "4px 12px" }} onClick={() => { const n = prompt("Template name?"); if(n) onSaveTemplate(n); }}>Save Current</HoverableButton>}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {library.map((t, i) => (
              <button key={i} onClick={() => onLoadTemplate(t)} style={{ padding: "8px 12px", borderRadius: RADII.sm, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: COLORS.navy }}>
                {t.name}
              </button>
            ))}
            {library.length === 0 && <Muted style={{ fontSize: 12 }}>No saved templates yet.</Muted>}
          </div>
        </Card>

        <Card title="Template Builder">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Tone Preset</label>
                <select value={tone} onChange={e => setTone(e.target.value as TemplateTone)} style={inputStyle()}>
                  <option value="neutral">Neutral / Informational</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="urgent">Urgent (Attendance Risk)</option>
                  <option value="exit">Exit Confirmation</option>
                </select>
              </div>
              <div style={{ alignSelf: "end" }}>
                <HoverableButton style={{ ...btn({ variant: "outline" }), width: "100%" }} onClick={onSendTest}>Send Test to Me</HoverableButton>
              </div>
            </div>
            <div>
              <label style={labelStyle()}>Subject Line</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle()} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={labelStyle()}>Message Body (English)</label>
                <span style={{ fontSize: 11, fontWeight: 800, color: isSMSCritical ? SEMANTIC.warning : COLORS.textMuted }}>
                  {charCount} chars {isSMSCritical ? "(>1 SMS unit)" : ""}
                </span>
              </div>
              <textarea value={body} onChange={e => setBody(e.target.value)} style={{ ...inputStyle(), minHeight: 140, resize: "vertical", lineHeight: 1.5 }} />
              <Muted style={{ display: "block", marginTop: 6 }}>Use tags: {"{Student_Name}"}, {"{Program_Name}"}</Muted>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Live Translation Preview" right={
        <select value="" onChange={e => { const v = e.target.value as Language; if (!v) return; if (!previewLangs.includes(v)) setPreviewLangs([...previewLangs, v]); }} style={inputStyle()}>
          <option value="">Add language preview…</option>
          {langOptions.filter(l => !previewLangs.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      }>
        <div style={{ display: "grid", gap: 10 }}>
          {previewLangs.map(lang => (
            <TranslationCard key={lang} lang={lang} body={body} onRemove={() => setPreviewLangs(previewLangs.filter(x => x !== lang))} />
          ))}
          {previewLangs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 }}>No preview languages</div>
              <Muted>Add a language above to see live AI translations.</Muted>
            </div>
          ) : null}
        </div>

        {/* Subtler AI Disclaimer */}
        <div style={{ marginTop: 24, padding: "10px 12px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <Muted style={{ fontSize: 10.5, lineHeight: 1.4, display: "block" }}>
            <strong>AI Preview:</strong> Translations are generated as-is. Please validate all outputs for accuracy before sending.
          </Muted>
        </div>
      </Card>
    </div>
  );
}

function OutreachView({ students, template, programName, onOpenStudent, auditLog }: { students: Student[]; template: { subject: string; body: string }; programName: string; onOpenStudent: (id: string) => void; auditLog: AuditEntry[] }) {
  const pending = students.filter(s => s.status === "Not Contacted" || s.status === "Pending");
  const [dripActive, setDripActive] = useState(false);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
        <Card title="Outreach Queue">
          <Muted>Track outreach status with audit-friendly detail. Click any student to view message drafts.</Muted>
          <Divider />
          <div style={{ overflow: "auto", borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, maxHeight: 400 }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 600 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
                <tr style={{ background: "#FAFBFD" }}>
                  <th style={thStyle(true)}>Student</th>
                  <th style={thStyle(true)}>Language</th>
                  <th style={thStyle(true)}>Status</th>
                  <th style={thStyle(true)}>Draft Preview</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(s => (
                  <tr key={s.id} style={{ background: "#fff", cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }} onClick={() => onOpenStudent(s.id)}>
                    <td style={{ ...tdStyle(), color: COLORS.navy, fontWeight: 900, fontSize: 14 }}>{s.name}</td>
                    <td style={tdStyle()}><LanguageTag lang={s.language} /></td>
                    <td style={tdStyle()}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle()}>
                      <div style={{ color: COLORS.textSecondary, fontSize: 11, fontStyle: "normal", display: "flex", flexDirection: "column" }}>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 2 }}>Draft updated: Just now</div>
                        <div style={{ fontStyle: "italic" }}>{formatTemplate(template.body, s, programName).slice(0, 60)}…</div>
                      </div>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 18, textAlign: "center" }}><div style={{ fontWeight: 900 }}>You're up to date</div><Muted>No students currently need outreach.</Muted></td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Automated Workflows (Drip Campaigns)" accent={COLORS.teal}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: COLORS.textPrimary }}>3-Day Non-Response Sequence</div>
                <Muted>Automatically follow up if no response.</Muted>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <HoverableButton style={{ ...btn({ variant: "ghost" }), padding: "4px 8px" }} onClick={() => alert("Drip Editor: Change trigger conditions and message delay.")}>Edit</HoverableButton>
                <button 
                  onClick={() => setDripActive(!dripActive)}
                  style={{ background: dripActive ? SEMANTIC.success : SEMANTIC.danger, border: "none", borderRadius: 20, padding: "6px 14px", color: "#fff", fontWeight: 800, fontSize: 11, cursor: "pointer", transition: "all 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                >
                  {dripActive ? "ACTIVE" : "PAUSED"}
                </button>
              </div>
            </div>
            {!dripActive && (
              <div style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.05)", border: `1px solid ${SEMANTIC.danger}30`, borderRadius: RADII.sm, fontSize: 11, color: SEMANTIC.danger, fontWeight: 600 }}>
                ⚠ Outreach suspended. Automated follow-ups will not fire.
              </div>
            )}
            
            <div style={{ padding: 12, background: "rgba(240,244,248,0.6)", borderRadius: RADII.md, border: `1px dashed ${COLORS.borderStrong}` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 99, background: COLORS.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>1</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Send Initial Email</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 2, height: 16, background: COLORS.border, marginLeft: 11 }} />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 99, background: COLORS.teal, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>2</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Wait 3 Days</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 2, height: 16, background: COLORS.border, marginLeft: 11 }} />
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ width: 24, height: 24, borderRadius: 99, background: SEMANTIC.warning, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>3</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Send SMS Follow-up</span>
              </div>
            </div>

            <HoverableButton style={btn({ variant: "outline" })} onClick={() => alert("Workflow Builder: Feature coming soon to production. This will allow you to design custom drip sequences.")}>+ Create New Workflow</HoverableButton>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
        <Card title="Recent Send History" accent={COLORS.teal}>
          <div style={{ display: "grid", gap: 8 }}>
            {auditLog.filter(a => a.type === "outreach").slice(0, 5).map(a => (
              <div key={a.id} style={{ padding: "10px 12px", border: `1px solid ${COLORS.border}`, borderRadius: RADII.sm, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.white }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 99, background: "rgba(34, 197, 94, 0.1)", color: SEMANTIC.success, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{a.studentName || "Bulk Outreach"}</div>
                    <Muted style={{ fontSize: 11 }}>{a.action} — {new Date(a.timestamp).toLocaleTimeString()}</Muted>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted }}>{a.details?.split(".")[0]}</div>
              </div>
            ))}
            {auditLog.filter(a => a.type === "outreach").length === 0 && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Muted>No recent send history found.</Muted>
              </div>
            )}
          </div>
        </Card>

        <Card title="Engagement Stats" accent={COLORS.navy}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>Queue Health</div>
              <div style={{ height: 8, background: COLORS.chipBg, borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${(1 - pending.length / Math.max(students.length, 1)) * 100}%`, height: "100%", background: SEMANTIC.success }} />
              </div>
              <Muted style={{ marginTop: 6, display: "block" }}>{Math.round((1 - pending.length / Math.max(students.length, 1)) * 100)}% of tasks completed</Muted>
            </div>
            <Divider />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{students.filter(s => s.status === "Responded").length}</div>
                <Muted>Total Replies</Muted>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{students.filter(s => s.status === "Sent").length}</div>
                <Muted>Awaiting Reply</Muted>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsView({ students, onFilterStatus }: { students: Student[]; onFilterStatus: (s: Status) => void }) {
  const [riskData, setRiskData] = useState<RiskAssessment[]>([]);
  const [loadingRisk, setLoadingRisk] = useState(false);

  useEffect(() => {
    async function fetchRisk() {
      setLoadingRisk(true);
      try {
        const data = await getRiskAssessment(students);
        setRiskData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRisk(false);
      }
    }
    fetchRisk();
  }, [students]);

  const total = students.length;
  const contacted = students.filter(s => s.status === "Sent" || s.status === "Responded").length;
  const responded = students.filter(s => s.status === "Responded").length;
  const responseRate = total ? Math.round((responded / total) * 100) : 0;
  const unreachable = students.filter(s => s.status === "Unreachable" || (!s.email && !s.phone)).length;
  
  const byLang = useMemo(() => {
    const map = new Map<Language, { total: number; contacted: number }>();
    students.forEach(s => { const cur = map.get(s.language) || { total: 0, contacted: 0 }; cur.total += 1; if (s.status === "Sent" || s.status === "Responded") cur.contacted += 1; map.set(s.language, cur); });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [students]);

  const chartData = useMemo(() => {
    return byLang.map(([lang, stats]) => ({
      name: lang,
      Contacted: stats.contacted,
      Pending: stats.total - stats.contacted,
      Total: stats.total
    }));
  }, [byLang]);

  const pieData = useMemo(() => {
    const counts = { "Not Contacted": 0, "Pending": 0, "Sent": 0, "Responded": 0, "SMS Required": 0, "Unreachable": 0 };
    students.forEach(s => counts[s.status as keyof typeof counts]++);
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));
  }, [students]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Outreach Analytics" right={<Chip label="Last 30 days" />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <Metric title="Total Students" value={total} sub="In scope" trend="+2%" />
          <Metric title="Contacted" value={contacted} sub="Sent + Responded" trend="+12%" />
          <Metric 
            title="Response Rate" 
            value={responseRate} 
            sub={responseRate < 10 ? "Requires attention" : "Percent responded"} 
            tone={responseRate < 10 ? "danger" : responseRate < 30 ? "warning" : "success"}
            trend={responseRate > 20 ? "+4%" : "-1%"}
          />
          <Metric title="Responded" value={responded} sub="Replies received" trend="+8%" />
          <Metric title="Unreachable" value={unreachable} sub="Invalid/missing contact" trend="-3%" />
        </div>
      </Card>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        <Card title="Contact Progress by Language">
          <div style={{ height: 320, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.borderStrong} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(31,58,95,0.04)' }} 
                  contentStyle={{ borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.card }}
                  formatter={(val: any, name: any, props: any) => [`${val} (${Math.round((Number(val)||0)/(Number(props.payload.Total)||1) * 100)}%)`, name]}
                />
                <Bar dataKey="Contacted" stackId="a" fill={COLORS.teal} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill={COLORS.navyLight} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Status Distribution">
          <div style={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={2} 
                  dataKey="value"
                  onClick={(data) => onFilterStatus(data.name as Status)}
                  style={{ cursor: "pointer" }}
                >
                  {pieData.map((entry, index) => {
                    const cfg = STATUS_CONFIG[entry.name as Status];
                    return <Cell key={`cell-${index}`} fill={cfg?.dot || COLORS.navy} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.card }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Click segment to filter roster</div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              {pieData.map(d => (
                <button 
                  key={d.name} 
                  onClick={() => onFilterStatus(d.name as Status)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 4, transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.chipBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: STATUS_CONFIG[d.name as Status]?.dot || COLORS.navy }} />
                  {d.name} ({d.value})
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="AI Predictive Risk Assessment" right={loadingRisk ? <Chip label="Analyzing..." /> : <Chip label="Intelligence Active" color={COLORS.teal} />}>
        <div style={{ display: "grid", gap: 12 }}>
          <Muted>AI-driven identification of students at high risk of disengagement based on contact patterns and data completeness.</Muted>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {riskData.slice(0, 6).map(risk => {
              const student = students.find(s => s.id === risk.studentId);
              if (!student) return null;
              const color = risk.level === "High" ? SEMANTIC.danger : risk.level === "Medium" ? SEMANTIC.warning : SEMANTIC.success;
              return (
                <div key={risk.studentId} style={{ padding: 16, borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{student.name}</div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: color + "15", color: color, fontWeight: 900, textTransform: "uppercase" }}>{risk.level} Risk</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 }}>{risk.reason}</div>
                  <div style={{ padding: 8, borderRadius: 8, background: COLORS.bg, fontSize: 11, fontWeight: 700, borderLeft: `3px solid ${COLORS.teal}` }}>
                    💡 Rec: {risk.recommendation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function AuditLogView({ auditLog }: { auditLog: AuditEntry[] }) {
  const [filter, setFilter] = useState("all");

  async function simulateSMS() {
    await fetch("/api/webhooks/sms", {
      method: "POST",
      body: new URLSearchParams({
        From: "+19170000101", // Matching Lusine Bagryan
        Body: "Hello! I am interested in the GED program. How do I start?"
      })
    });
    window.location.reload();
  }

  const filtered = useMemo(() => {
    if (filter === "all") return auditLog;
    return auditLog.filter(a => a.type === filter);
  }, [auditLog, filter]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, background: COLORS.chipBg, padding: 4, borderRadius: RADII.md }}>
          {["all", "outreach", "import", "compliance", "system"].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding: "6px 16px", borderRadius: RADII.sm, border: "none", background: filter === t ? COLORS.white : "transparent", color: filter === t ? COLORS.navy : COLORS.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: filter === t ? SHADOWS.card : "none", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <HoverableButton style={btn({ variant: "outline" })} onClick={simulateSMS}>🛠 Simulate SMS Reply</HoverableButton>
          <HoverableButton style={btn({ variant: "primary" })} onClick={() => {
            const rows = auditLog.map(a => ({ Timestamp: new Date(a.timestamp).toLocaleString(), Actor: a.actor, Action: a.action, Type: a.type, Details: a.details }));
            exportCSV(rows, `audit-log-${new Date().toISOString().slice(0,10)}.csv`);
          }}>
            📥 Export Audit-Ready Logs
          </HoverableButton>
        </div>
      </div>

      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                <th style={{ ...thStyle(), width: 180 }}>Timestamp</th>
                <th style={{ ...thStyle(), width: 140 }}>Actor</th>
                <th style={{ ...thStyle(), width: 140 }}>Action</th>
                <th style={thStyle()}>Details</th>
                <th style={{ ...thStyle(), width: 100 }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, idx) => (
                <tr key={entry.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: idx % 2 === 0 ? "transparent" : "rgba(15,23,42,0.01)" }}>
                  <td style={tdStyle()}>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td style={{ ...tdStyle(), fontWeight: 700 }}>{entry.actor}</td>
                  <td style={tdStyle()}><span style={{ color: COLORS.navy, fontWeight: 700 }}>{entry.action}</span></td>
                  <td style={tdStyle()}>
                    {entry.studentName && <strong style={{ color: COLORS.teal }}>{entry.studentName}: </strong>}
                    {entry.details}
                  </td>
                  <td style={tdStyle()}>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: COLORS.chipBg, color: COLORS.textMuted, fontWeight: 800, textTransform: "uppercase" }}>{entry.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MobileDemoView({ students, onTabChange, onOpenStudent }: { students: Student[]; onTabChange: (t: any) => void; onOpenStudent: (id: string) => void }) {
  const todays = students.filter(s => s.status === "Not Contacted" || s.status === "Pending").slice(0, 5);
  const recent = students.slice(0, 3);
  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <div style={{ width: 360, borderRadius: 28, border: `1px solid ${COLORS.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.12)", background: COLORS.white, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontWeight: 900 }}>GED Reconnect</div>
          <Muted>Mobile outreach workflow</Muted>
        </div>
        <div style={{ padding: 16, display: "grid", gap: 14 }}>
          <Card title="Today's Task" style={{ boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>{todays.length} students to contact</div>
              <HoverableButton style={btn({ variant: "primary" })} onClick={() => onTabChange("Roster")}>Start Outreach</HoverableButton>
            </div>
          </Card>
          <Card title="Recent Students" style={{ boxShadow: "none" }}>
            <div style={{ display: "grid", gap: 8 }}>
              {recent.map(s => (
                <button key={s.id} onClick={() => onOpenStudent(s.id)} style={{ textAlign: "left", background: "rgba(247,249,252,0.75)", border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, cursor: "pointer" }}>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{s.name}</div>
                  <Muted>{s.language} • {s.status}</Muted>
                </button>
              ))}
            </div>
          </Card>
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => onTabChange("Dashboard")} style={btn({ variant: "ghost" })}>Home</button>
          <button onClick={() => onTabChange("Roster")} style={btn({ variant: "ghost" })}>Roster</button>
          <button onClick={() => onTabChange("Outreach")} style={btn({ variant: "ghost" })}>Send</button>
          <button onClick={() => onTabChange("Audit")} style={btn({ variant: "ghost" })}>Logs</button>
        </div>
      </div>
    </div>
  );
}

function CommunicationTimeline({ studentId, auditLog }: { studentId: string; auditLog: AuditEntry[] }) {
  const history = useMemo(() => auditLog.filter(a => a.studentId === studentId), [auditLog, studentId]);

  if (history.length === 0) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center", border: `1px dashed ${COLORS.borderStrong}`, borderRadius: RADII.md }}>
        <Muted style={{ fontSize: 12 }}>No documented communication history for this record.</Muted>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16, position: "relative", paddingLeft: 12 }}>
      <div style={{ position: "absolute", left: 3, top: 8, bottom: 8, width: 2, background: COLORS.border, borderRadius: 2 }} />
      {history.map((entry, idx) => (
        <div key={entry.id} style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: -12.5, top: 5, width: 8, height: 8, borderRadius: 99, background: entry.type === "outreach" ? COLORS.teal : COLORS.navy, border: `2px solid ${COLORS.white}`, boxShadow: "0 0 0 1px " + (entry.type === "outreach" ? COLORS.teal : COLORS.navy) }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{entry.action}</span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>{new Date(entry.timestamp).toLocaleDateString()} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{entry.details}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4 }}>Actor: {entry.actor}</div>
        </div>
      ))}
    </div>
  );
}

function StudentDetail({ student, programName, template, onClose, onSend, auditLog }: { student: Student; programName: string; template: { subject: string; body: string }; onClose: () => void; onSend: (id: string) => void; auditLog: AuditEntry[] }) {
  const msgEnglish = formatTemplate(template.body, student, programName);
  const { translated: msgNative, loading: translating } = useTranslation(msgEnglish, student.language);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Profile" style={{ boxShadow: "none" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <LanguageTag lang={student.language} />
              <StatusBadge status={student.status} />
            </div>
            <Divider />
            <Row label="Email" value={student.email || "—"} />
            <Row label="Phone" value={student.phone || "—"} />
            <Row label="Address" value={student.address || "—"} />
            <Row label="Language Confidence" value={student.languageConfidence || "Auto-detected"} />
            <Row label="Notes" value={student.notes || "None"} />
          </div>
        </Card>
        <Card title="Actions" style={{ boxShadow: "none" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => window.dispatchEvent(new CustomEvent('open-call-simulator', { detail: student.id }))}>Call Now</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={() => { onSend(student.id); onClose(); }}>
              {student.email ? "Send Email" : "Send SMS"}
            </HoverableButton>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => alert("Generating PDF: Preparing physical outreach letter for mailing...")}>Print Letter</HoverableButton>
          </div>
        </Card>
        <Card title="Activity Timeline" style={{ boxShadow: "none" }}>
          <CommunicationTimeline studentId={student.id} auditLog={auditLog} />
        </Card>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Quick Message (Native Language)" style={{ boxShadow: "none" }}>
          {translating ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0" }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out 0.2s infinite" }} />
              <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out 0.4s infinite" }} />
              <Muted style={{ marginLeft: 4, fontStyle: "italic" }}>Translating…</Muted>
            </div>
          ) : (
            <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msgNative || msgEnglish}</div>
          )}
        </Card>
        <Card title="English Copy" style={{ boxShadow: "none" }}>
          <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{msgEnglish}</div>
        </Card>
      </div>
    </div>
  );
}

function useDarkModeTime() {
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // Activate dark mode if it's 19:00 (7 PM) or later, or before 7 AM.
      const isDark = hour >= 19 || hour < 7;
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
}



export default function EducatorOutreachPortal_Antigravity({ session }: { session: any }) {
  useDarkModeTime();
  const [program, setProgram] = useState<"GED Reconnect" | "ESL Bridge" | "Workforce Launch">("GED Reconnect");
  const [tab, setTab] = useState<"Dashboard" | "Roster" | "Templates" | "Outreach" | "Analytics" | "Audit" | "Mobile">("Dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<Language | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [tone, setTone] = useState<TemplateTone>("neutral");
  const [subject, setSubject] = useState(TONE_TEMPLATES.neutral.subject);
  const [body, setBody] = useState(TONE_TEMPLATES.neutral.body);
  const [previewLangs, setPreviewLangs] = useState<Language[]>(["Spanish", "Ukrainian", "Chinese"]);
  const [library, setLibrary] = useState<Array<{ name: string; subject: string; body: string; tone: TemplateTone }>>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<"confirm" | "sent">("confirm");
  const [bulkChannel, setBulkChannel] = useState<OutreachChannel>("Email");
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [legalModalOpen, setLegalModalOpen] = useState<{ open: boolean, type: "terms" | "privacy" | "dmca" | "refund" | null }>({ open: false, type: null });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({ name: "", email: "", phone: "", language: "English", status: "Not Contacted" });
  const [activeCallStudentId, setActiveCallStudentId] = useState<string | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      const dbStudents = await getStudents();
      if (dbStudents.length === 0) {
        // Seed if empty
        for (const s of MOCK_STUDENTS) {
          await dbCreateStudent({ ...s, id: undefined });
        }
        setStudents(await getStudents() as any);
      } else {
        setStudents(dbStudents as any);
      }

      const dbAudit = await getAuditLogs();
      setAuditLog(dbAudit as any);

      const dbProgram = await getSetting("outreach_program");
      if (dbProgram) setProgram(dbProgram as any);

      const dbTone = await getSetting("outreach_tone");
      if (dbTone) setTone(dbTone as any);

      const dbSubject = await getSetting("outreach_subject");
      if (dbSubject) setSubject(dbSubject);

      const dbBody = await getSetting("outreach_body");
      if (dbBody) setBody(dbBody);

      const dbApiKey = await getSetting("ag_gemini_api_key");
      if (dbApiKey) setApiKey(dbApiKey);

      const dbResend = await getSetting("resend_api_key");
      if (dbResend) setResendKey(dbResend);

      const dbSid = await getSetting("twilio_sid");
      if (dbSid) setTwilioSid(dbSid);

      const dbToken = await getSetting("twilio_auth_token");
      if (dbToken) setTwilioToken(dbToken);

      const dbPhone = await getSetting("twilio_phone_number");
      if (dbPhone) setTwilioPhone(dbPhone);

      const dbFrom = await getSetting("email_from_address");
      if (dbFrom) setFromEmail(dbFrom);

      const dbLib = await getSetting("template_library");
      if (dbLib) {
        try { setLibrary(JSON.parse(dbLib)); } catch (e) { console.error("Library parse err", e); }
      }
    }
    init();
  }, []);

  // Sync Settings to DB
  useEffect(() => { saveSetting("outreach_program", program); }, [program]);
  useEffect(() => { saveSetting("outreach_tone", tone); }, [tone]);
  useEffect(() => { saveSetting("outreach_subject", subject); }, [subject]);
  useEffect(() => { saveSetting("outreach_body", body); }, [body]);
  useEffect(() => { saveSetting("ag_gemini_api_key", apiKey); }, [apiKey]);
  useEffect(() => { saveSetting("resend_api_key", resendKey); }, [resendKey]);
  useEffect(() => { saveSetting("twilio_sid", twilioSid); }, [twilioSid]);
  useEffect(() => { saveSetting("twilio_auth_token", twilioToken); }, [twilioToken]);
  useEffect(() => { saveSetting("twilio_phone_number", twilioPhone); }, [twilioPhone]);
  useEffect(() => { saveSetting("email_from_address", fromEmail); }, [fromEmail]);

  useEffect(() => {
    const handleOpenCall = (e: any) => setActiveCallStudentId(e.detail);
    window.addEventListener('open-call-simulator', handleOpenCall);
    return () => window.removeEventListener('open-call-simulator', handleOpenCall);
  }, []);

  const programName = useMemo(() => {
    if (program === "GED Reconnect") return "GED Program";
    if (program === "ESL Bridge") return "ESL Bridge Program";
    return "Workforce Launch Program";
  }, [program]);

  useEffect(() => { setSubject(TONE_TEMPLATES[tone].subject); setBody(TONE_TEMPLATES[tone].body); }, [tone]);

  const filtered = useMemo(() => students.filter(s => languageFilter === "All" ? true : s.language === languageFilter).filter(s => statusFilter === "All" ? true : s.status === statusFilter).filter(s => query.trim() ? s.name.toLowerCase().includes(query.trim().toLowerCase()) : true), [students, languageFilter, statusFilter, query]);
  const activeStudent = useMemo(() => students.find(s => s.id === activeStudentId) || null, [students, activeStudentId]);
  const focus = useMemo(() => computeTodayFocus(students), [students]);
  const languages = useMemo(() => { const set = new Set(students.map(s => s.language)); return ["All" as const, ...(Array.from(set).sort() as Language[])]; }, [students]);
  const statuses = useMemo(() => { const set = new Set(students.map(s => s.status)); return ["All" as const, ...(Array.from(set).sort() as Status[])]; }, [students]);

  async function logAudit(entry: Omit<AuditEntry, "id" | "timestamp" | "actor">) {
    const newEntry = {
      ...entry,
      actor: "Mr. Caldwell",
      timestamp: new Date().toISOString()
    };
    const dbEntry = await dbCreateAuditEntry(newEntry as any);
    setAuditLog(prev => [dbEntry as any, ...prev]);
  }

  function toggleSelected(id: string) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function selectAllVisible() { const ids = filtered.map(s => s.id); const allSelected = ids.every(id => selected.includes(id)); setSelected(prev => { if (allSelected) return prev.filter(id => !ids.includes(id)); const next = new Set(prev); ids.forEach(id => next.add(id)); return Array.from(next); }); }
  
  async function updateStudent(id: string, patch: Partial<Student>) { 
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    await dbUpdateStudent(id, patch);
  }

  async function sendSingle(id: string) {
    const s = students.find(x => x.id === id);
    if (!s) return;
    
    const chan: "Email" | "SMS" = (s.email ? "Email" : "SMS");
    const res = await sendOutreach({ studentId: id, subject, body, channel: chan });
    
    await updateStudent(id, { status: "Sent" });
    logAudit({ action: "Outreach Sent", studentId: s.id, studentName: s.name, details: `Individual outreach message sent via ${chan}. ${"simulated" in res && res.simulated ? "(Simulated)" : "(Real API)"}`, type: "outreach" });
  }

  function openBulk() { setBulkStep("confirm"); setBulkOpen(true); }

  async function doBulkSend() {
    const ids = selected.length ? selected : filtered.map(s => s.id);
    const chan: "Email" | "SMS" = bulkChannel === "SMS" ? "SMS" : "Email";
    const newStatus = "Sent";
    
    setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: newStatus as any } : s));
    
    for (const id of ids) {
      await sendOutreach({ studentId: id, subject, body, channel: chan });
    }

    logAudit({ action: "Bulk Outreach", details: `Sent ${ids.length} messages via ${chan}. Status updated for compliance.`, type: "outreach" });
    setBulkStep("sent");
  }
  function exportReport() { const rows = students.map(s => ({ Student: s.name, Language: s.language, Status: s.status, "Language Confidence": s.languageConfidence ?? "Auto-detected", Email: s.email ?? "", Phone: s.phone ?? "" })); exportCSV(rows, `educator-outreach-report-${program.replaceAll(" ", "_").toLowerCase()}.csv`); }
  
  function exportPDFReport() {
    const doc = new jsPDF();
    const title = `Educator Outreach Report: ${program}`;
    const date = new Date().toLocaleString();
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date} | Program: ${program}`, 14, 30);
    
    const tableData = students.map(s => [
      s.name,
      s.language,
      s.status,
      s.email || "—",
      s.phone || "—",
      s.languageConfidence || "Auto"
    ]);
    
    autoTable(doc, {
      startY: 35,
      head: [['Student Name', 'Language', 'Status', 'Email', 'Phone', 'Confidence']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [240, 244, 248], textColor: [31, 58, 95], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    
    doc.save(`outreach-report-${program.toLowerCase().replace(/ /g, '-')}.pdf`);
  }
  function handleImport(file: File) { const extra: Student[] = [{ id: String(Date.now()), name: "SAVCHENKO, ANDRII", language: "Ukrainian", status: "Not Contacted", languageConfidence: "Auto-detected", phone: "" }, { id: String(Date.now() + 1), name: "CHEN, MAXINE LU", language: "Chinese", status: "Not Contacted", languageConfidence: "Auto-detected", email: "" }, { id: String(Date.now() + 2), name: "MORA, RICHARD", language: "Spanish", status: "Not Contacted", languageConfidence: "Auto-detected", email: "richard@example.com" }]; setStudents(prev => [...extra, ...prev]); setImportOpen(false); }
  const [importTab, setImportTab] = useState<"paste" | "file">("paste");
  const [pasteText, setPasteText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<Student[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);





  async function handleParsePaste() {
    setParsedPreview(null);
    setParseError("");
    if (!pasteText.trim()) { setParseError("Please paste some data first."); return; }
    setParsing(true);
    try {
      // Use AI for parsing on the server
      const result = await parseViaAI(pasteText);
      setParsedPreview(result as any);
    } catch (e: any) {
      setParseError(e.message || "Could not parse the data.");
    } finally {
      setParsing(false);
    }
  }

  async function confirmPasteImport() {
    if (!parsedPreview) return;
    
    const imported: Student[] = [];
    for (const s of parsedPreview) {
      const created = await dbCreateStudent({ ...s, id: undefined });
      imported.push(created as any);
    }
    
    setStudents(prev => [...imported, ...prev]);
    logAudit({ action: "Bulk Import", details: `Imported ${parsedPreview.length} students from manual paste with AI parsing.`, type: "import" });
    setPasteText("");
    setParsedPreview(null);
    setParseError("");
    setImportOpen(false);
  }

  function updateParsedLang(idx: number, lang: Language) {
    setParsedPreview(prev => prev ? prev.map((s, i) => i === idx ? { ...s, language: lang } : s) : prev);
  }


  const isAdmin = session?.user?.role === "ADMIN";
  const tabs = useMemo(() => {
    const base = [
      { value: "Dashboard", label: "Dashboard" },
      { value: "Roster", label: "Roster" },
      { value: "Templates", label: "Templates" },
      { value: "Outreach", label: "Outreach" },
      { value: "Analytics", label: "Analytics" },
    ];
    if (isAdmin) base.push({ value: "Audit", label: "Audit" });
    base.push({ value: "Mobile", label: "Mobile" });
    return base;
  }, [isAdmin]);

  return (
    <AppShell title="The Educator Outreach Portal" subtitle={`Program: ${program} • Session Active`} onExportReport={exportReport} onOpenLegal={type => setLegalModalOpen({ open: true, type })} onOpenSettings={() => setSettingsOpen(true)} userName={session?.user?.name} role={session?.user?.role}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={program} onChange={e => setProgram(e.target.value as any)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.borderStrong}`, background: "rgba(255,255,255,0.75)", fontWeight: 800, color: COLORS.textPrimary }}>
            <option>GED Reconnect</option>
            <option>ESL Bridge</option>
            <option>Workforce Launch</option>
          </select>
          <Segmented value={tab} onChange={v => setTab(v as any)} options={tabs} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <HoverableButton style={btn({ variant: "outline" })} onClick={exportPDFReport}>📄 Export PDF</HoverableButton>
          <HoverableButton style={btn({ variant: "outline" })} onClick={() => setAddStudentOpen(true)}>Add Student</HoverableButton>
          {isAdmin && <HoverableButton style={btn({ variant: "outline" })} onClick={() => setImportOpen(true)}>Smart Import</HoverableButton>}
          <HoverableButton style={btn({ variant: "primary" })} onClick={openBulk}>Send Bulk</HoverableButton>
        </div>
      </div>

      {tab === "Dashboard" ? (
        <DashboardView 
          focus={focus} 
          onPickFocus={key => { 
            if (key === "atRisk") setStatusFilter("Not Contacted"); 
            if (key === "missingContact") setStatusFilter("All"); 
            if (key === "replies") setStatusFilter("Responded"); 
            setTab("Roster"); 
          }} 
          stats={{ 
            total: students.length, 
            atRisk: students.filter(s => s.status === "Not Contacted" || s.status === "Pending").length, 
            smsRequired: students.filter(s => s.status === "SMS Required").length, 
            unreachable: students.filter(s => s.status === "Unreachable" || (!s.email && !s.phone)).length 
          }}
          onSendEmail={() => { setTab("Outreach"); setBulkChannel("Email"); setBulkOpen(true); }}
          onReviewDrafts={() => setTab("Templates")}
          onDownloadLog={exportReport}
        />
      ) : null}
      {tab === "Roster" ? <RosterView students={filtered} allStudents={students} query={query} setQuery={setQuery} languageFilter={languageFilter} setLanguageFilter={setLanguageFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} languages={languages} statuses={statuses} selected={selected} toggleSelected={toggleSelected} selectAllVisible={selectAllVisible} hoveredId={hoveredId} setHoveredId={setHoveredId} onRowClick={id => setActiveStudentId(id)} onSend={id => sendSingle(id)} /> : null}
      {tab === "Templates" ? (
        <TemplatesView 
          tone={tone} 
          setTone={setTone} 
          subject={subject} 
          setSubject={setSubject} 
          body={body} 
          setBody={setBody} 
          previewLangs={previewLangs} 
          setPreviewLangs={setPreviewLangs} 
          library={library}
          onSaveTemplate={(name) => {
            const next = [...library, { name, subject, body, tone }];
            setLibrary(next);
            saveSetting("template_library", JSON.stringify(next));
          }}
          onLoadTemplate={(t) => {
            setSubject(t.subject);
            setBody(t.body);
            setTone(t.tone);
          }}
          onSendTest={() => alert(`Test message sent to ${session?.user?.email || "you"}! Check your inbox for the ${tone} draft.`)}
        />
      ) : null}
      {tab === "Outreach" ? <OutreachView students={students} template={{ subject, body }} programName={programName} onOpenStudent={id => setActiveStudentId(id)} auditLog={auditLog} /> : null}
      {tab === "Analytics" ? <AnalyticsView students={students} onFilterStatus={(s) => { setStatusFilter(s); setTab("Roster"); }} /> : null}
      {tab === "Audit" ? <AuditLogView auditLog={auditLog} /> : null}
      {tab === "Mobile" ? <MobileDemoView students={students} onTabChange={setTab} onOpenStudent={id => setActiveStudentId(id)} /> : null}

      <Modal open={!!activeStudent} title={activeStudent ? `Student Profile — ${activeStudent.name}` : "Student Profile"} onClose={() => setActiveStudentId(null)} footer={activeStudent ? (
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <select 
            value={activeStudent.status} 
            onChange={e => updateStudent(activeStudent.id, { status: e.target.value as Status })}
            style={{ padding: "8px 12px", borderRadius: RADII.sm, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.bg, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}
          >
            <option value="Not Contacted">Not Contacted</option>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Responded">Responded</option>
            <option value="SMS Required">SMS Required</option>
            <option value="Unreachable">Unreachable</option>
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => updateStudent(activeStudent.id, { status: "Sent" })}>Mark as Contacted</HoverableButton>
            <HoverableButton style={btn({ variant: "teal" })} onClick={() => updateStudent(activeStudent.id, { status: "Responded" })}>Mark Responded</HoverableButton>
          </div>
        </div>
      ) : null}>
        {activeStudent ? <StudentDetail student={activeStudent} programName={programName} template={{ subject, body }} onClose={() => setActiveStudentId(null)} onSend={id => sendSingle(id)} auditLog={auditLog} /> : null}
      </Modal>

      <Modal open={addStudentOpen} title="Add New Student" onClose={() => setAddStudentOpen(false)} footer={
        <>
          <HoverableButton style={btn({ variant: "outline" })} onClick={() => setAddStudentOpen(false)}>Cancel</HoverableButton>
          <HoverableButton style={btn({ variant: "primary" })} onClick={async () => {
            if (!newStudent.name) return alert("Name is required");
            const created = await dbCreateStudent({ ...newStudent, languageConfidence: "Manual" });
            setStudents(prev => [created as any, ...prev]);
            logAudit({ action: "Manual Add", details: `Added student ${newStudent.name} manually.`, type: "import" });
            setAddStudentOpen(false);
            setNewStudent({ name: "", email: "", phone: "", language: "English", status: "Not Contacted" });
          }}>Save Student</HoverableButton>
        </>
      }>
        <div style={{ display: "grid", gap: 12 }}>
          <div><label style={labelStyle()}>Name</label><input type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} style={inputStyle()} /></div>
          <div><label style={labelStyle()}>Email</label><input type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} style={inputStyle()} /></div>
          <div><label style={labelStyle()}>Phone</label><input type="text" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} style={inputStyle()} /></div>
          <div>
            <label style={labelStyle()}>Language</label>
            <select value={newStudent.language} onChange={e => setNewStudent({...newStudent, language: e.target.value as Language})} style={inputStyle()}>
              {(["Arabic", "Amharic", "Bengali", "Burmese", "Chinese", "Dutch", "English", "Filipino", "French", "Fula", "German", "Haitian Creole", "Hindi", "Hmong", "Italian", "Japanese", "Khmer", "Korean", "Lao", "Malinké", "Mayan", "Nepali", "Persian", "Pashto", "Polish", "Portuguese", "Romanian", "Russian", "Somali", "Spanish", "Swahili", "Turkish", "Ukrainian", "Urdu", "Vietnamese"] as Language[]).map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={bulkOpen} title="Bulk Outreach" onClose={() => setBulkOpen(false)} footer={bulkStep === "confirm" ? (<><HoverableButton style={btn({ variant: "outline" })} onClick={() => setBulkOpen(false)}>Cancel</HoverableButton><HoverableButton style={btn({ variant: "primary" })} onClick={doBulkSend}>Send Now</HoverableButton></>) : (<><HoverableButton style={btn({ variant: "outline" })} onClick={() => exportReport()}>Download Report</HoverableButton><HoverableButton style={btn({ variant: "primary" })} onClick={() => setBulkOpen(false)}>Continue</HoverableButton></>)}>
        {bulkStep === "confirm" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 850, fontSize: 13, marginBottom: 8 }}>You're about to contact <CountUp value={selected.length || filtered.length} /> students</div>
              <Muted>This preview is for confidence. In production, it will reflect actual email/SMS routing.</Muted>
              <Divider />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["Email", "SMS", "Call", "Letter"] as OutreachChannel[]).map(ch => <HoverableButton key={ch} style={btn({ variant: bulkChannel === ch ? "primary" : "outline" })} onClick={() => setBulkChannel(ch)}>{ch}</HoverableButton>)}
              </div>
              <Divider />
              <div style={{ fontSize: 12, fontWeight: 850, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase", color: COLORS.textMuted }}>Message Template</div>
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: RADII.md, padding: 12, background: "rgba(247,249,252,0.8)" }}>
                <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 13 }}>{subject}</div>
                <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{body}</div>
              </div>
            </div>
            <div>
              <Card title="Safety Checks">
                <ul style={{ margin: 0, paddingLeft: 16, color: COLORS.textSecondary, lineHeight: 1.65, fontSize: 13 }}>
                  <li>Translations reviewed</li>
                  <li>Official account connected</li>
                  <li>Auto-logged for reporting</li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>Outreach Sent Successfully</div>
            <Muted>Messages were queued and logged. You can export a supervisor report now.</Muted>
          </div>
        )}
      </Modal>

      <Modal open={importOpen} title="Smart Importer" onClose={() => { setImportOpen(false); setPasteText(""); setParsedPreview(null); setParseError(""); }} footer={
        parsedPreview ? (
          <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => { setParsedPreview(null); setPasteText(""); }}>← Back</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={confirmPasteImport}>✓ Add {parsedPreview.length} Student{parsedPreview.length !== 1 ? "s" : ""} to Roster</HoverableButton>
          </>
        ) : importTab === "paste" ? (
          <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => { setImportOpen(false); setPasteText(""); setParseError(""); }}>Cancel</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={handleParsePaste} >{parsing ? "Analyzing…" : "Analyze & Preview"}</HoverableButton>
          </>
        ) : (
          <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => setImportOpen(false)}>Close</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={() => { const f = fileRef.current?.files?.[0]; if (f) handleImport(f); }}>Import File</HoverableButton>
          </>
        )
      }>
        {parsedPreview ? (
          // ── Preview Table ──────────────────────────────────────
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>AI parsed {parsedPreview.length} student{parsedPreview.length !== 1 ? "s" : ""} successfully</div>
                <Muted>Review below — you can adjust languages before importing.</Muted>
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: RADII.md }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: COLORS.bg, position: "sticky", top: 0 }}>
                    <th style={thStyle()}>Name</th>
                    <th style={thStyle()}>Language</th>
                    <th style={thStyle()}>Email</th>
                    <th style={thStyle()}>Phone</th>
                    <th style={thStyle()}>Status</th>
                    <th style={thStyle()}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPreview.map((s, idx) => (
                    <tr key={s.id} style={{ background: idx % 2 === 0 ? COLORS.white : COLORS.bg }}>
                      <td style={{ ...tdStyle(), fontWeight: 700 }}>{s.name}</td>
                      <td style={tdStyle()}>
                        <select
                          value={s.language}
                          onChange={e => updateParsedLang(idx, e.target.value as Language)}
                          style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, fontFamily: "inherit", color: LANG_COLORS[s.language]?.fg ?? COLORS.textPrimary }}
                        >
                          {(["Arabic", "Amharic", "Bengali", "Burmese", "Chinese", "Dutch", "English", "Filipino", "French", "Fula", "German", "Haitian Creole", "Hindi", "Hmong", "Italian", "Japanese", "Khmer", "Korean", "Lao", "Malinké", "Mayan", "Nepali", "Persian", "Pashto", "Polish", "Portuguese", "Romanian", "Russian", "Somali", "Spanish", "Swahili", "Turkish", "Ukrainian", "Urdu", "Vietnamese"] as Language[]).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle(), color: s.email ? COLORS.textSecondary : COLORS.textMuted, fontStyle: s.email ? "normal" : "italic" }}>{s.email || "—"}</td>
                      <td style={{ ...tdStyle(), color: s.phone ? COLORS.textSecondary : COLORS.textMuted, fontStyle: s.phone ? "normal" : "italic" }}>{s.phone || "—"}</td>
                      <td style={tdStyle()}><StatusBadge status={s.status} /></td>
                      <td style={tdStyle()}>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: s.languageConfidence === "Verified" ? "rgba(22,163,74,0.10)" : "rgba(217,119,6,0.10)", color: s.languageConfidence === "Verified" ? SEMANTIC.success : SEMANTIC.warning, fontWeight: 700 }}>
                          {s.languageConfidence === "Verified" ? "✓ Verified" : "~ Auto-detected"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // ── Input Tabs ─────────────────────────────────────────
          <div style={{ display: "grid", gap: 14 }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 0, border: `1px solid ${COLORS.borderStrong}`, borderRadius: RADII.md, overflow: "hidden", width: "fit-content" }}>
              {(["paste", "file"] as const).map(t => (
                <button key={t} onClick={() => setImportTab(t)} style={{ padding: "8px 20px", background: importTab === t ? COLORS.navy : "transparent", color: importTab === t ? "#fff" : COLORS.textMuted, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.03em" }}>
                  {t === "paste" ? "📋 Paste Data" : "📁 Upload File"}
                </button>
              ))}
            </div>

            {importTab === "paste" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ background: "rgba(8,145,178,0.06)", border: `1px solid rgba(8,145,178,0.18)`, borderRadius: RADII.md, padding: "10px 14px", fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  <strong style={{ color: COLORS.teal }}>How to use:</strong> Open your Excel or Google Sheets roster → Select all cells (Ctrl+A / Cmd+A) → Copy (Ctrl+C / Cmd+C) → Paste below. The AI will auto-detect columns like Name, Email, Phone, Language, and Status.
                </div>
                <textarea
                  value={pasteText}
                  onChange={e => { setPasteText(e.target.value); setParsedPreview(null); setParseError(""); }}
                  placeholder={`Paste your Excel or Google Sheets data here…\n\nExample:\nLast Name\tFirst Name\tEmail\tPhone\tLanguage\nGarcia\tMaria\tmaria@email.com\t555-1234\tSpanish\nNguyen\tTuan\t\t555-5678\tVietnamese`}
                  style={{ width: "100%", minHeight: 180, padding: "12px 14px", borderRadius: RADII.md, border: `1.5px solid ${parseError ? SEMANTIC.danger : COLORS.borderStrong}`, background: COLORS.white, fontFamily: "'Courier New', monospace", fontSize: 12, color: COLORS.textPrimary, resize: "vertical", outline: "none", lineHeight: 1.5 }}
                />
                {parseError && (
                  <div style={{ color: SEMANTIC.danger, fontSize: 12, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                    <span>⚠</span> {parseError}
                  </div>
                )}
                {parsing && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: COLORS.teal, fontSize: 12, fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out infinite" }} />
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out 0.2s infinite" }} />
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out 0.4s infinite" }} />
                    <span style={{ marginLeft: 4 }}>AI is analyzing your data…</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <Muted>Choose a CSV or Excel file to import student data.</Muted>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" />
                <Card title="What happens on import">
                  <ul style={{ margin: 0, paddingLeft: 16, color: COLORS.textSecondary, lineHeight: 1.65, fontSize: 13 }}>
                    <li>Auto-detect primary language from name patterns</li>
                    <li>Flag missing contact info</li>
                    <li>Recommend SMS outreach when email is missing</li>
                  </ul>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>

      <LegalModal open={legalModalOpen.open} type={legalModalOpen.type} onClose={() => setLegalModalOpen({ ...legalModalOpen, open: false })} />

      <Modal open={settingsOpen} title="System & AI Settings" onClose={() => setSettingsOpen(false)} footer={<HoverableButton style={btn({ variant: "primary" })} onClick={() => setSettingsOpen(false)}>Save & Close</HoverableButton>}>
        <div style={{ display: "grid", gap: 20, maxHeight: 480, overflowY: "auto", paddingRight: 8 }}>
          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Artificial Intelligence</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Gemini API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." style={inputStyle()} />
                <Muted style={{ display: "block", marginTop: 4 }}>Powers context-aware translations and Smart Import.</Muted>
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Email (Resend)</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Resend API Key</label>
                <input type="password" value={resendKey} onChange={e => setResendKey(e.target.value)} placeholder="re_..." style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>From Email Address</label>
                <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="outreach@yourdomain.edu" style={inputStyle()} />
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>SMS (Twilio)</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Account SID</label>
                <input type="text" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} placeholder="AC..." style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Auth Token</label>
                <input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} placeholder="token..." style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Twilio Phone Number</label>
                <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} placeholder="+1..." style={inputStyle()} />
              </div>
            </div>
          </section>
        </div>
      </Modal>

      {/* CALL SIMULATOR MODAL */}
      <Modal open={!!activeCallStudentId} title="Secure Voice Bridge" onClose={() => setActiveCallStudentId(null)} footer={
        <HoverableButton style={btn({ variant: "danger" })} onClick={() => setActiveCallStudentId(null)}><span style={{fontSize:18, marginRight:6}}>🛑</span> End Call</HoverableButton>
      }>
        <div style={{ display: "grid", placeItems: "center", gap: 24, padding: "20px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: COLORS.navy, display: "grid", placeItems: "center", fontSize: 32, color: COLORS.white, fontWeight: 900, boxShadow: SHADOWS.card, position: "relative" }}>
              {(students.find(s => s.id === activeCallStudentId)?.name || "S")[0]}
              <div style={{ position: "absolute", inset: -10, border: `2px solid ${COLORS.teal}`, borderRadius: 999, animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{students.find(s => s.id === activeCallStudentId)?.name || "Student"}</div>
              <Muted style={{ fontSize: 14 }}>Connecting via {students.find(s => s.id === activeCallStudentId)?.phone || "secure line"}...</Muted>
            </div>
          </div>
          
          <div style={{ width: "100%", background: COLORS.bg, borderRadius: RADII.md, padding: 16, border: `1px solid ${COLORS.borderStrong}`, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>
              <span>Live Transcript (Simulated)</span>
              <span style={{ color: COLORS.teal, display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1.5s infinite" }} /> Recording</span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ padding: "8px 12px", background: COLORS.white, borderRadius: RADII.sm, border: `1px solid ${COLORS.border}`, width: "fit-content", maxWidth: "80%", borderBottomLeftRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, marginBottom: 2 }}>{students.find(s => s.id === activeCallStudentId)?.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Hello? Who is this?</div>
              </div>
              <div style={{ padding: "8px 12px", background: "rgba(15,23,42,0.05)", borderRadius: RADII.sm, border: `1px solid ${COLORS.borderStrong}`, width: "fit-content", maxWidth: "80%", marginLeft: "auto", borderBottomRightRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.navy, marginBottom: 2 }}>You (Mr. Caldwell)</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>Hi, this is Mr. Caldwell from the GED program. I'm calling to see if you needed any help enrolling in classes this semester.</div>
              </div>
              <div style={{ fontSize: 12, fontStyle: "italic", color: COLORS.textMuted, textAlign: "center", marginTop: 8 }}>Awaiting response...</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <button style={{ width: 50, height: 50, borderRadius: 999, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, boxShadow: SHADOWS.card }}>🎤</button>
            <button style={{ width: 50, height: 50, borderRadius: 999, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, boxShadow: SHADOWS.card }}>⏸</button>
            <button style={{ width: 50, height: 50, borderRadius: 999, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, boxShadow: SHADOWS.card }}>⌨️</button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
