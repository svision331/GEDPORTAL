"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function DashboardView({ focus, onPickFocus, stats, onSendEmail, onReviewDrafts, onDownloadLog, onHealthCheck, notificationsEnabled, students, setTab, setStatusFilter }: { focus: { atRisk: number; missingContact: number; repliesWaiting: number }; onPickFocus: (key: string) => void; stats: { total: number; atRisk: number; smsRequired: number; unreachable: number }; onSendEmail: () => void; onReviewDrafts: () => void; onDownloadLog: () => void; onHealthCheck: () => void; notificationsEnabled: boolean; students: Student[]; setTab: (t: any) => void; setStatusFilter: (f: any) => void }) {
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
                <span>Active Attendance & Delivery Alerts</span>
                <Muted>Prioritized by urgency</Muted>
              </div>
              
              {stats.atRisk > 0 && <AlertRow onClick={() => onPickFocus("atRisk")} title="High Absence Threshold Reached" detail={`${stats.atRisk} student(s) critically flagged. Prioritize immediate outreach.`} tone="danger" />}
              {focus.missingContact > 0 && <AlertRow onClick={() => onPickFocus("missingContact")} title="Missing Contact Information" detail={`${focus.missingContact} student(s) unreachable. Update records manually.`} tone="warning" />}
              {focus.repliesWaiting > 0 && <AlertRow onClick={() => onPickFocus("replies")} title="New Replies Waiting" detail={`${focus.repliesWaiting} response(s) pending your review.`} tone="info" />}
              
              {/* NEW: Bounce-Back Notifications */}
              {notificationsEnabled && students?.some(s => s.status === "Unreachable") && (
                <AlertRow 
                  onClick={() => { setStatusFilter("Unreachable"); setTab("Roster"); }} 
                  title="Delivery Failure (Bounce-Back)" 
                  detail="Critical: Email/SMS delivery failed for several students. Verify contact info." 
                  tone="danger" 
                />
              )}

              {stats.atRisk === 0 && focus.missingContact === 0 && focus.repliesWaiting === 0 && !students?.some(s => s.status === "Unreachable") && (
                <div style={{ padding: 24, textAlign: "center", background: "rgba(34, 197, 94, 0.05)", borderRadius: 12, border: `1px dashed rgba(34, 197, 94, 0.3)` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: SEMANTIC.success }}>All caught up</div>
                  <Muted>No critical alerts at this time.</Muted>
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
