"use client";
import React, { useEffect, useState } from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, LANG_COLORS, Language, Status, TemplateTone } from "./types";

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

function HoverableButton({ children, style, onClick, disabled }: { children: React.ReactNode; style: React.CSSProperties; onClick?: () => void; disabled?: boolean }) {
  const [hover, setHover] = useState(false);
  const finalStyle = {
    ...style,
    opacity: disabled ? 0.5 : hover ? 0.9 : 1,
    transform: disabled ? "none" : hover ? "translateY(-1px)" : "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: disabled ? "none" : hover ? SHADOWS.hover : (style.boxShadow || "none")
  };
  return <button onMouseEnter={() => !disabled && setHover(true)} onMouseLeave={() => setHover(false)} onClick={!disabled ? onClick : undefined} style={finalStyle}>{children}</button>;
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

By accessing or using Soulvision LLC (“Service”), you agree to these Terms. If you do not agree, do not use the Service.

## 2. Description of Service

GED Portal provides AI-powered educator outreach tools for student reconnection and attendance tracking. Outputs are generated automatically using artificial intelligence systems.

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

Outputs are provided “as is.” You are solely responsible for reviewing and validating outputs before use. Soulvision LLC is not liable for damages resulting from reliance on AI-generated content.

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
Soulvision LLC shall not be liable for indirect, incidental, consequential, or special damages. Total liability shall not exceed the amount paid in the prior 12 months.

## 11. Indemnification

You agree to indemnify and hold harmless Soulvision LLC from claims arising from:

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

Soulvision LLC ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use the GED Portal (the "Service").

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

**Soulvision LLC Legal**
100 Innovation Way
Newark, NJ 07102
legal@gedportal.edu
`;

const DMCA_POLICY_CONTENT = `
**Last Updated:** February 2026

**Digital Millennium Copyright Act ("DMCA") Policy**

Soulvision LLC respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act of 1998, the text of which may be found on the U.S. Copyright Office website at http://www.copyright.gov/legislation/dmca.pdf, Soulvision LLC will respond expeditiously to claims of copyright infringement committed using the Soulvision LLC service and/or the Soulvision LLC website (the "Site") if such claims are reported to Soulvision LLC's Designated Copyright Agent identified in the sample notice below.

If you are a copyright owner, authorized to act on behalf of one, or authorized to act under any exclusive right under copyright, please report alleged copyright infringements taking place on or through the Site by completing the following DMCA Notice of Alleged Infringement and delivering it to Soulvision LLC's Designated Copyright Agent.

**1. DMCA Notice of Alleged Infringement ("Notice")**
*   Identify the copyrighted work that you claim has been infringed, or - if multiple copyrighted works are covered by this Notice - you may provide a representative list of the copyrighted works that you claim have been infringed.
*   Identify the material or link you claim is infringing (or the subject of infringing activity) and that access to which is to be disabled, including at a minimum, if applicable, the URL of the link shown on the Site or the exact location where such material may be found.
*   Provide your company affiliation (if applicable), mailing address, telephone number, and, if available, email address.
*   Include both of the following statements in the body of the Notice:
    *   "I hereby state that I have a good faith belief that the disputed use of the copyrighted material is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)."
    *   "I hereby state that the information in this Notice is accurate and, under penalty of perjury, that I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right under the copyright that is allegedly infringed."
*   Provide your full legal name and your electronic or physical signature.

Deliver this Notice, with all items completed, to Soulvision LLC's Designated Copyright Agent:

**Copyright Agent**
Soulvision LLC Legal
100 Innovation Way
Newark, NJ 07102
legal@gedportal.edu

**2. Counter-Notice**
If you believe that your content that was removed (or to which access was disabled) is not infringing, or that you have the authorization from the copyright owner, the copyright owner's agent, or pursuant to the law, to post and use the material in your content, you may send a counter-notice containing the following information to the Copyright Agent:
*   Your physical or electronic signature;
*   Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled;
*   A statement that you have a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content; and
*   Your name, address, telephone number, and e-mail address, a statement that you consent to the jurisdiction of the federal court in Newark, New Jersey, and a statement that you will accept service of process from the person who provided notification of the alleged infringement.

If a counter-notice is received by the Copyright Agent, Soulvision LLC may send a copy of the counter-notice to the original complaining party informing that person that it may replace the removed content or cease disabling it in 10 business days. Unless the copyright owner files an action seeking a court order against the content provider, member or user, the removed content may be replaced, or access to it restored, in 10 to 14 business days or more after receipt of the counter-notice, at Soulvision LLC's sole discretion.
`;

const REFUND_POLICY_CONTENT = `
**Last Updated:** February 2026

**Refund and Cancellation Policy**

Soulvision LLC strives to provide the highest quality service to our users. This Refund and Cancellation Policy outlines the conditions under which refunds may be granted and how you can manage your subscription.

**1. Subscription Cancellations**
You may cancel your subscription to the Educator Outreach Portal at any time. Cancellation will take effect at the end of your current billing cycle. You will retain access to the Service until the end of that cycle. We do not provide prorated refunds for mid-cycle cancellations.

**2. Refund Eligibility**
Because Soulvision LLC incurs immediate computing costs when you generate AI outputs, we generally **do not offer refunds** for past subscription charges or one-time purchases, except in the specific circumstances outlined below.

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
  const content = (rawContent || "").split('

').map((p: string, i: number) => {
    if (!p) return null;
    let html = String(p).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (html.startsWith('## ')) {
      html = `<strong style="font-size: 15px; color: var(--navy); display: block; margin-top: 8px;">${html.replace('## ', '')}</strong>`;
    } else if (html.startsWith('# ')) {
      html = `<strong style="font-size: 18px; color: var(--navy); display: block; margin-top: 8px;">${html.replace('# ', '')}</strong>`;
    } else {
      // Process lists (starting with * or -)
      html = html.replace(/
\* /g, '<br/>• ').replace(/^\* /g, '• ');
      html = html.replace(/
- /g, '<br/>• ').replace(/^- /g, '• ');
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
    <div style={{ padding: "20px", marginTop: 24, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <Muted style={{ fontSize: 11 }}>© Soulvision LLC 2026. All rights reserved.</Muted>
      <div style={{ display: "flex", gap: 20, fontSize: 11, fontWeight: 600 }}>
        <button onClick={() => onOpenLegal("terms")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>Terms</button>
        <button onClick={() => onOpenLegal("privacy")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>Privacy</button>
        <button onClick={() => onOpenLegal("dmca")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>DMCA</button>
        <button onClick={() => onOpenLegal("refund")} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>Refund</button>
      </div>
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
        if (result) {
          setTranslated(result);
          setError(false);
        } else {
          setTranslated(text);
        }
      } catch {
        setError(true);
        setTranslated(text);
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [text, lang, code]);
  return { translated, loading, error };
}

function formatTemplate(template: string, student: Student, programName: string, educatorName?: string) {
  return template
    .replaceAll("{Student_Name}", getStudentName(student))
    .replaceAll("{First_Name}", student.firstName)
    .replaceAll("{Last_Name}", student.lastName)
    .replaceAll("{Program_Name}", programName)
    .replaceAll("{Educator_Name}", educatorName || "your educator");
}

const MOCK_STUDENTS: Student[] = [
  { id: "1", firstName: "ERICA MARIA", lastName: "ALAMORA DORIA", language: "Spanish", status: "Not Contacted", languageConfidence: "Auto-detected", email: "erica@example.com", classCode: "GED-101", teacherName: "Caldwell", school: "Brooklyn Adult Ed", absenceDays: 62 },
  { id: "2", firstName: "PAUL", lastName: "HEREDIA NORIEGA", language: "Spanish", status: "Not Contacted", languageConfidence: "Auto-detected", email: "paul@example.com", classCode: "GED-101", teacherName: "Caldwell", school: "Brooklyn Adult Ed", absenceDays: 94, isPopRisk: true },
  { id: "3", firstName: "DANILO", lastName: "MOREL", language: "French", status: "Not Contacted", languageConfidence: "Auto-detected", email: "danilo@example.com", classCode: "ESL-B", teacherName: "Stevens", school: "Queens Learning Ctr", absenceDays: 12 },
  { id: "4", firstName: "LUSINE", lastName: "BAGRYAN", language: "Ukrainian", status: "Not Contacted", languageConfidence: "Auto-detected", phone: "+1 (917) 000-0101", classCode: "GED-202", teacherName: "Volkov", school: "Brighton Beach Annex" },
  { id: "5", firstName: "DAYANE", lastName: "YEN", language: "Chinese", status: "Not Contacted", languageConfidence: "Auto-detected", phone: "+1 (917) 000-0102", classCode: "ESL-A", teacherName: "Zhang", school: "Manhattan Bridge" },
  { id: "6", firstName: "SHARA", lastName: "ORAZALIMOVA", language: "Russian", status: "Not Contacted", languageConfidence: "Auto-detected", email: "shara@example.com" },
  { id: "7", firstName: "ISAAC", lastName: "CUNUHAY", language: "Filipino", status: "Not Contacted", languageConfidence: "Auto-detected", email: "isaac@example.com" },
  { id: "8", firstName: "AISSATA", lastName: "DIALLO", language: "Fula", status: "SMS Required", languageConfidence: "Auto-detected", phone: "+1 (917) 000-0103" },
  { id: "9", firstName: "MOHAMED", lastName: "CAMARA", language: "Malinké", status: "SMS Required", languageConfidence: "Auto-detected", phone: "" },
];

function computeTodayFocus(students: Student[]) {
  const atRisk = students.filter(s => s.status === "Not Contacted" || s.status === "Pending").length;
  const missingContact = students.filter(s => !s.email && !s.phone).length;
  const repliesWaiting = students.filter(s => s.status === "Responded").length;
  return { atRisk, missingContact, repliesWaiting };
}

function exportCSV(rows: Array<Record<string, any>>, filename: string) {
  const headers = Object.keys(rows[0] || { empty: "" });
  const csv = headers.join(",") + "
" + rows.map(r => headers.map(h => { const v = r[h] ?? ""; const s = String(v).replaceAll('"', '""'); return `"${s}"`; }).join(",")).join("
");
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

function maskPII(text: string, type: "name" | "email" | "phone"): string {
  if (!text) return "—";
  if (type === "name") {
    return text.split(" ").map(part => part.length > 0 ? part[0] + "****" : "").join(" ");
  }
  if (type === "email") {
    const parts = text.split("@");
    if (parts.length !== 2) return "****";
    const [user, domain] = parts;
    return user[0] + "****@" + domain[0] + "****." + domain.split(".").pop();
  }
  if (type === "phone") {
    const parts = text.split("-");
    if (parts.length === 3) return `${parts[0]}-***-****`;
    return text.slice(0, 3) + "-***-****";
  }
  return text;
}

const getStudentName = (s: Student) => `${s.firstName} ${s.lastName}`;

const METRIC_ACCENTS = [COLORS.teal, SEMANTIC.warning, SEMANTIC.danger, "#7C3AED"];
const MOCK_AUDIT: Omit<AuditEntry, "id" | "timestamp">[] = [
  { actor: "System", action: "Database Initialized", details: "GED Reconnect portal first load seed completed.", type: "system" },
  { actor: "Educator", action: "Compliance Review", details: "All student records verified for language compliance and contact status.", type: "compliance" },
  { actor: "Educator", action: "Bulk Outreach", details: "Sent 12 initial check-in messages to Ukrainian-speaking students.", type: "outreach" },
  { actor: "System", action: "Smart Import", details: "Successfully parsed 5 student records from manual paste source using AI.", type: "import" },
  { actor: "Educator", action: "Template Update", details: "Modified 'Encouraging' tone template to include new re-enrollment link.", type: "system" },
  { actor: "System (Webhook)", action: "SMS Received", studentName: "Lusine Bagryan", details: 'Student replied: "I finished my paperwork, what next?"', type: "outreach" },
  { actor: "Educator", action: "Manual Export", details: "Exported audit-ready CSV for Q3 compliance reporting.", type: "compliance" },
];
