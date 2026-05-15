"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


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

function StudentDetail({ student, programName, template, onClose, onSend, auditLog, onUpdate, currentUser }: { student: Student; programName: string; template: { subject: string; body: string }; onClose: () => void; onSend: (id: string) => void; auditLog: AuditEntry[]; onUpdate: (id: string, data: Partial<Student>) => void; currentUser?: { id: string; name?: string } }) {
  const msgEnglish = formatTemplate(template.body, student, programName);
  const { translated: msgNative, loading: translating } = useTranslation(msgEnglish, student.language);
  
  const isWorking = student.activeWorkerId === currentUser?.id;
  
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Profile & Context" right={
          <button 
            onClick={() => onUpdate(student.id, { activeWorkerId: isWorking ? null as any : currentUser?.id, activeWorkerName: isWorking ? null as any : currentUser?.name })}
            style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: isWorking ? SEMANTIC.success : "rgba(148,163,184,0.1)", color: isWorking ? "#fff" : COLORS.textPrimary, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
          >
            {isWorking ? "✅ You are working this case" : "🚩 Flag as Active"}
          </button>
        } style={{ boxShadow: "none" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {student.activeWorkerId && !isWorking && (
              <div style={{ background: "rgba(31,58,95,0.05)", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, color: COLORS.navy, border: `1px solid ${COLORS.navy}33`, marginBottom: 4 }}>
              👤 {student.activeWorkerName} is currently working this case.
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <LanguageTag lang={student.language} />
            <div style={{ display: "flex", gap: 6 }}>
              {student.isPopRisk && <span style={{ background: SEMANTIC.danger, color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 900 }}>POP-RISK</span>}
              <StatusBadge status={student.status} />
            </div>
          </div>
          <Divider />
          <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.navy, marginBottom: 8 }}>{getStudentName(student)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Row label="Class" value={student.classCode || "—"} />
              <Row label="Teacher" value={student.teacherName || "—"} />
            </div>
            <Row label="School" value={student.school || "—"} />
            <Divider />
            <Row label="Email" value={student.email || "—"} />
            <Row label="Phone" value={student.phone || "—"} />
            {student.absenceDays && student.absenceDays > 0 ? (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: student.absenceDays >= 90 ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)", borderLeft: `4px solid ${student.absenceDays >= 90 ? SEMANTIC.danger : SEMANTIC.warning}` }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: student.absenceDays >= 90 ? SEMANTIC.danger : SEMANTIC.warning }}>{student.absenceDays} Days Absent</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{student.absenceDays >= 90 ? "Official POP-Risk threshold crossed." : `Warning: ${90 - student.absenceDays} days until POP-Risk status.`}</div>
              </div>
            ) : null}
            <Divider />
            <div style={{ fontWeight: 800, fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>NOTES</div>
            <textarea 
              value={student.notes || ""} 
              onChange={e => onUpdate(student.id, { notes: e.target.value })}
              placeholder="Log observations, call outcomes, or next steps..."
              style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }}
            />
          </div>
        </Card>
        <Card title="Actions" style={{ boxShadow: "none" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => window.dispatchEvent(new CustomEvent('open-call-simulator', { detail: student.id }))}>Call Now</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={() => { onSend(student.id); onClose(); }}>
              {student.email ? "Send Email" : "Send SMS"}
            </HoverableButton>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, whiteSpace: "nowrap" }}>📅 Schedule:</label>
              <input
                type="date"
                value={student.scheduledOutreach ? new Date(student.scheduledOutreach).toISOString().split('T')[0] : ""}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => onUpdate(student.id, { scheduledOutreach: e.target.value || null as any })}
                style={{ ...inputStyle(), padding: "6px 10px", fontSize: 12, width: 140 }}
              />
            </div>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => alert("Generating PDF: Preparing physical outreach letter for mailing...")}>Print Letter</HoverableButton>
          </div>
        </Card>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <Card title="Quick Message (Native Language)" style={{ boxShadow: "none" }}>
          {translating ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0" }}>
              <div className="spinner" />
              <Muted style={{ fontStyle: "italic" }}>AI generating native translation…</Muted>
            </div>
          ) : (
            <div style={{ color: COLORS.textPrimary, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", fontWeight: 500 }}>{msgNative || msgEnglish}</div>
          )}
        </Card>
        <Card title="Outreach History" style={{ boxShadow: "none" }}>
          <CommunicationTimeline studentId={student.id} auditLog={auditLog} />
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
