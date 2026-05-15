"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function AuditLogView({ auditLog, privacyMode, maskPII }: { auditLog: AuditEntry[]; privacyMode: boolean; maskPII: any }) {
  const [filter, setFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [simSuccess, setSimSuccess] = useState(false);

  async function simulateSMS() {
    setSimulating(true);
    setSimSuccess(false);
    try {
      const res = await fetch("/api/webhooks/sms", {
        method: "POST",
        body: new URLSearchParams({
          From: "+19170000101", // Matching Lusine Bagryan
          Body: "Hello! I am interested in the GED program. How do I start?"
        })
      });
      if (res.ok) {
        const dbStudents = await getStudents();
        const dbAudit = await getAuditLogs();
        setStudents(dbStudents as any);
        setAuditLog(dbAudit as any);
        setSimSuccess(true);
        setTimeout(() => setSimSuccess(false), 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  }

  const filtered = useMemo(() => {
    return auditLog.filter(a => {
      if (filter !== "all" && a.type !== filter) return false;
      if (dateFrom && new Date(a.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.timestamp) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [auditLog, filter, dateFrom, dateTo]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, background: COLORS.chipBg, padding: 4, borderRadius: RADII.md }}>
            {["all", "outreach", "import", "compliance", "system"].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 14px", borderRadius: RADII.sm, border: "none", background: filter === t ? COLORS.white : "transparent", color: filter === t ? COLORS.navy : COLORS.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: filter === t ? SHADOWS.card : "none", textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Muted style={{ fontSize: 11, whiteSpace: "nowrap" }}>From:</Muted>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle(), padding: "5px 8px", fontSize: 11, width: 130 }} />
            <Muted style={{ fontSize: 11 }}>To:</Muted>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle(), padding: "5px 8px", fontSize: 11, width: 130 }} />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} style={{ fontSize: 11, fontWeight: 700, color: SEMANTIC.danger, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>✕ Clear</button>
            )}
          </div>
          <Muted style={{ fontSize: 11 }}>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</Muted>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {simSuccess && (
            <div style={{ fontSize: 12, fontWeight: 800, color: SEMANTIC.success, animation: "fadeIn 0.5s" }}>
              ✅ SMS Simulated Successfully
            </div>
          )}
          <HoverableButton style={btn({ variant: "outline" })} onClick={simulateSMS} disabled={simulating}>
            {simulating ? "📡 Processing..." : "🛠 Simulate SMS Reply"}
          </HoverableButton>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 80, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16, filter: "grayscale(1) opacity(0.5)" }}>📋</div>
                    <div style={{ fontWeight: 900, color: COLORS.navy, fontSize: 18, marginBottom: 8 }}>Transparency & Compliance Ready</div>
                    <Muted style={{ maxWidth: 300, margin: "0 auto", lineHeight: 1.5 }}>
                      No activity has been logged yet. All outreach, imports, and system changes will appear here for administrative oversight.
                    </Muted>
                    <div style={{ marginTop: 24 }}>
                      <HoverableButton style={btn({ variant: "outline" })} onClick={simulateSMS} disabled={simulating}>
                        {simulating ? "📡 Processing..." : "Generate Demo Activity"}
                      </HoverableButton>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
