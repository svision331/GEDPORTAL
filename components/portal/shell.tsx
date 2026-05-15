"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII } from "./types";

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

function TopBar({ title, subtitle, onStartDemo, userName, role, privacyMode, setPrivacyMode, showToast }: { title: string; subtitle?: string; onStartDemo: () => void; userName?: string; role?: string; privacyMode: boolean; setPrivacyMode: (v: boolean) => void; showToast: (m: string, t?: any) => void }) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(240,244,248,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${COLORS.border}`, boxShadow: "0 1px 0 rgba(15,23,42,0.04)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>

        {/* LEFT: logo + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: RADII.sm, background: `linear-gradient(135deg, ${COLORS.navy}, ${COLORS.teal})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(31,58,95,0.3)" }}>
            <img src={logoImg} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>{title}</div>
            {subtitle ? <Muted style={{ display: "block", marginTop: 1, fontSize: 11 }}>{subtitle}</Muted> : null}
          </div>
        </div>

        {/* RIGHT: compact controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

          {/* Privacy + Secure — single icon button */}
          <button
            onClick={() => { setPrivacyMode(!privacyMode); showToast(`Privacy Mode ${!privacyMode ? "On — PII masked" : "Off — PII visible"}`); }}
            title={privacyMode ? "Privacy On — PII masked. Click to reveal." : "Privacy Off — PII visible. FERPA-compliant encryption active."}
            style={{ width: 32, height: 32, borderRadius: RADII.full, display: "flex", alignItems: "center", justifyContent: "center", background: privacyMode ? COLORS.navy : "rgba(22,163,74,0.08)", color: privacyMode ? "#fff" : SEMANTIC.success, border: `1px solid ${privacyMode ? "transparent" : "rgba(22,163,74,0.2)"}`, cursor: "pointer", fontSize: 15, transition: "all 0.2s", flexShrink: 0 }}
          >
            {privacyMode ? "🔒" : "🛡️"}
          </button>

          {/* Help menu — Run Demo inside */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setHelpOpen(v => !v)}
              title="Help & Demo"
              style={{ width: 32, height: 32, borderRadius: RADII.full, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(148,163,184,0.1)", color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, cursor: "pointer", fontSize: 15, transition: "all 0.2s", flexShrink: 0 }}
            >
              ?
            </button>
            {helpOpen && (
              <div style={{ position: "absolute", top: 40, right: 0, background: COLORS.white, border: `1px solid ${COLORS.borderStrong}`, borderRadius: RADII.md, boxShadow: SHADOWS.modal, padding: 8, minWidth: 180, zIndex: 100 }}>
                <button
                  onClick={() => { onStartDemo(); setHelpOpen(false); }}
                  style={{ width: "100%", textAlign: "left", padding: "8px 12px", borderRadius: RADII.sm, border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: COLORS.navy, display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = COLORS.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  🚀 Run Guided Demo
                </button>
                <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Security</div>
                <div style={{ padding: "4px 12px 8px", fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
                  FERPA-aware · Encrypted at rest · TLS in transit
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 24, background: COLORS.border }} />

          {/* User identity + log out */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{userName || "Educator"}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: role === "ADMIN" ? COLORS.teal : COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{role}</div>
            </div>
            <HoverableButton onClick={() => signOut()} style={{ ...btn({ variant: "ghost" }), color: "var(--danger)", padding: "6px 10px" }}>Log Out</HoverableButton>
          </div>

        </div>
      </div>
      {/* Click-outside to close help menu */}
      {helpOpen && <div onClick={() => setHelpOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />}
    </div>
  );
}

function AppShell({ children, title, subtitle, onOpenLegal, onStartDemo, userName, role, privacyMode, setPrivacyMode, showToast, showFooter = true }: { children: React.ReactNode; title: string; subtitle?: string; onOpenLegal: (t: "terms" | "privacy" | "dmca" | "refund") => void; onStartDemo: () => void; userName?: string; role?: string; privacyMode: boolean; setPrivacyMode: (v: boolean) => void; showToast: (m: string, t?: any) => void; showFooter?: boolean }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.textPrimary }}>
      <TopBar title={title} subtitle={subtitle} onStartDemo={onStartDemo} userName={userName} role={role} privacyMode={privacyMode} setPrivacyMode={setPrivacyMode} showToast={showToast} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 32px", minHeight: "calc(100vh - 160px)" }}>{children}</div>
      {showFooter && <Footer onOpenLegal={onOpenLegal} />}
      <CookieBanner />
    </div>
  );
}
