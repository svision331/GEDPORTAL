"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function OutreachView({ students, template, programName, onOpenStudent, auditLog, privacyMode, maskPII }: { students: Student[]; template: { subject: string; body: string }; programName: string; onOpenStudent: (id: string) => void; auditLog: AuditEntry[]; privacyMode: boolean; maskPII: any }) {
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
                  <tr key={s.id} style={{ background: COLORS.white, cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }} onClick={() => onOpenStudent(s.id)}>
                    <td style={{ ...tdStyle(), color: COLORS.navy, fontWeight: 900, fontSize: 14 }}>{privacyMode ? maskPII(getStudentName(s), "name") : getStudentName(s)}</td>
                    <td style={tdStyle()}><LanguageTag lang={s.language} /></td>
                    <td style={tdStyle()}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle()}>
                      <div style={{ color: COLORS.textPrimary, fontSize: 11, fontStyle: "normal", display: "flex", flexDirection: "column" }}>
                        <div style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 2 }}>Draft updated: Just now</div>
                        <div style={{ fontStyle: "italic", fontWeight: 500 }}>{formatTemplate(template.body, s, programName).slice(0, 60)}…</div>
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
