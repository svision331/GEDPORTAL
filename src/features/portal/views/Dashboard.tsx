"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "@/src/models";

function DashboardView({ focus, onPickFocus, stats, onSendEmail, onReviewDrafts, onDownloadLog, onHealthCheck, notificationsEnabled, students, auditLog, setTab, setStatusFilter }: { focus: { atRisk: number; missingContact: number; repliesWaiting: number }; onPickFocus: (key: string) => void; stats: { total: number; atRisk: number; smsRequired: number; unreachable: number }; onSendEmail: () => void; onReviewDrafts: () => void; onDownloadLog: () => void; onHealthCheck: () => void; notificationsEnabled: boolean; students: Student[]; auditLog: AuditEntry[]; setTab: (t: any) => void; setStatusFilter: (f: any) => void }) {
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasAlerts = stats.atRisk > 0 || focus.missingContact > 0 || focus.repliesWaiting > 0 || students?.some(s => s.status === "Unreachable");
  const recentActivity = auditLog.slice(0, 6);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Outreach Command Center" right={<Chip label={`Data Synced: Today at ${timeString}`} />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

          {/* LEFT: Metrics + Alerts or Recent Activity */}
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <Metric title="Total Students" value={stats.total} sub="Roster size" tone="neutral" />
              <Metric title="At Risk" value={stats.atRisk} sub="Needs outreach" tone={stats.atRisk > 0 ? "danger" : "success"} />
              <Metric title="Replies Waiting" value={focus.repliesWaiting} sub="Needs review" tone={focus.repliesWaiting > 0 ? "info" : "neutral"} />
              <Metric title="Unreachable" value={stats.unreachable} sub="Missing contact info" tone={stats.unreachable > 0 ? "warning" : "success"} />
            </div>

            {hasAlerts ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
                  <span>Active Alerts</span>
                  <Muted>Prioritized by urgency</Muted>
                </div>
                {stats.atRisk > 0 && <AlertRow onClick={() => onPickFocus("atRisk")} title="High Absence Threshold Reached" detail={`${stats.atRisk} student(s) critically flagged. Prioritize immediate outreach.`} tone="danger" />}
                {students?.some(s => s.status === "Unreachable") && (
                  <AlertRow onClick={() => { setStatusFilter("Unreachable"); setTab("Roster"); }} title="Delivery Failure (Bounce-Back)" detail="Email/SMS delivery failed for one or more students. Verify contact info." tone="danger" />
                )}
                {focus.missingContact > 0 && <AlertRow onClick={() => onPickFocus("missingContact")} title="Missing Contact Information" detail={`${focus.missingContact} student(s) unreachable. Update records manually.`} tone="warning" />}
                {focus.repliesWaiting > 0 && <AlertRow onClick={() => onPickFocus("replies")} title="New Replies Waiting" detail={`${focus.repliesWaiting} response(s) pending your review.`} tone="info" />}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
                  <span>Recent Activity</span>
                  <button onClick={() => setTab("Reports")} style={{ fontSize: 11, fontWeight: 700, color: COLORS.teal, background: "none", border: "none", cursor: "pointer" }}>View full audit →</button>
                </div>
                {recentActivity.length > 0 ? recentActivity.map(a => (
                  <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: RADII.sm }}>
                    <div style={{ width: 28, height: 28, borderRadius: 99, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: a.type === "outreach" ? "rgba(8,145,178,0.1)" : a.type === "import" ? "rgba(37,99,235,0.08)" : "rgba(148,163,184,0.12)", color: a.type === "outreach" ? COLORS.teal : a.type === "import" ? SEMANTIC.info : COLORS.textMuted }}>
                      {a.type === "outreach" ? "✉" : a.type === "import" ? "⬆" : "◎"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.studentName ? <span style={{ color: COLORS.teal }}>{a.studentName} — </span> : null}
                        {a.action}
                      </div>
                      <Muted style={{ fontSize: 11, display: "block", marginTop: 2 }}>
                        {a.actor} · {new Date(a.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Muted>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase", flexShrink: 0, background: a.type === "outreach" ? "rgba(8,145,178,0.08)" : a.type === "import" ? "rgba(37,99,235,0.08)" : COLORS.chipBg, color: a.type === "outreach" ? COLORS.teal : a.type === "import" ? SEMANTIC.info : COLORS.textMuted }}>
                      {a.type}
                    </span>
                  </div>
                )) : (
                  <div style={{ padding: "20px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: SEMANTIC.success, marginBottom: 4 }}>All caught up</div>
                    <Muted>No alerts and no activity yet. Add students to get started.</Muted>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Card title="Quick Actions" style={{ background: `linear-gradient(135deg, rgba(31,58,95,0.02), rgba(8,145,178,0.04))`, border: `1px solid ${COLORS.borderStrong}`, height: "100%", boxShadow: "none" }}>
              <div style={{ display: "grid", gap: 10 }}>
                <Muted style={{ marginBottom: 4 }}>Fast tools for daily compliance workflows.</Muted>
                <HoverableButton style={btn({ variant: "teal" })} onClick={onSendEmail}>Send Mass Email</HoverableButton>
                <HoverableButton style={btn({ variant: "outline" })} onClick={onReviewDrafts}>Review Translated Drafts</HoverableButton>
                <HoverableButton style={btn({ variant: "outline" })} onClick={onHealthCheck}>Run POP-Risk Health Check</HoverableButton>
                <HoverableButton style={btn({ variant: "outline" })} onClick={onDownloadLog}>Download Supervisor Log</HoverableButton>
              </div>
            </Card>
          </div>

        </div>
      </Card>
    </div>
  );
}
