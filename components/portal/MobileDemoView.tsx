"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function MobileDemoView({ students, onTabChange, onOpenStudent, privacyMode, maskPII }: { students: Student[]; onTabChange: (t: any) => void; onOpenStudent: (id: string) => void; privacyMode: boolean; maskPII: any }) {
  const allToContact = students.filter(s => s.status === "Not Contacted" || s.status === "Pending");
  const pendingCount = allToContact.length;
  // Show first 5 pending students in the "Focus" list
  const focusStudents = allToContact.slice(0, 5);
  
  return (
    <div style={{ display: "grid", gap: 20, placeItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontWeight: 900, color: COLORS.navy, fontSize: 18 }}>Mobile Experience Preview</div>
        <Muted style={{ fontSize: 13 }}>This panel simulates the native mobile interface educators use for field outreach and real-time student engagement.</Muted>
      </div>
      
      <div style={{ width: 360, height: 640, borderRadius: 32, border: `8px solid ${COLORS.navy}`, boxShadow: "0 40px 100px rgba(15,23,42,0.25)", background: COLORS.white, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Status Bar */}
        <div style={{ height: 24, padding: "4px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontWeight: 700 }}>
          <span>9:41</span>
          <div style={{ display: "flex", gap: 4 }}>
            <span>📶</span> <span>🔋</span>
          </div>
        </div>

        <div style={{ padding: "8px 16px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>GED Reconnect</div>
          <Muted style={{ fontSize: 11 }}>Field Outreach Assistant</Muted>
        </div>

        <div style={{ padding: 16, display: "grid", gap: 14, flex: 1, overflowY: "auto", background: "#F8FAFC" }}>
          <Card title="Priority Focus" style={{ boxShadow: "none", border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 900, color: COLORS.navy, fontSize: 15 }}>{pendingCount} Pending Contacts</div>
              <Muted style={{ fontSize: 11 }}>Recommended students for today's outreach cycle based on risk scores.</Muted>
              <HoverableButton style={{ ...btn({ variant: "primary" }), width: "100%" }} onClick={() => onTabChange("Outreach")}>Start Campaign</HoverableButton>
            </div>
          </Card>

          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
            Pending Students ({focusStudents.length})
          </div>
          
          <div style={{ display: "grid", gap: 8 }}>
            {focusStudents.map(s => (
              <button key={s.id} onClick={() => onOpenStudent(s.id)} style={{ textAlign: "left", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 900, fontSize: 13, color: COLORS.navy }}>{privacyMode ? maskPII(getStudentName(s), "name") : getStudentName(s)}</div>
                  <LanguageTag lang={s.language} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Muted style={{ fontSize: 11 }}>{s.status}</Muted>
                  <span style={{ fontSize: 10, color: COLORS.teal, fontWeight: 700 }}>Tap to draft →</span>
                </div>
              </button>
            ))}
            {focusStudents.length === 0 && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Muted style={{ fontSize: 12 }}>All students contacted!</Muted>
              </div>
            )}
          </div>
        </div>

        {/* Aligned Bottom Navigation */}
        <div style={{ padding: "8px 12px 24px", borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-around", background: COLORS.white }}>
          <MobileNavIcon icon="📊" label="Dashboard" active={true} onClick={() => onTabChange("Dashboard")} />
          <MobileNavIcon icon="📋" label="Roster" onClick={() => onTabChange("Roster")} />
          <MobileNavIcon icon="✉️" label="Outreach" onClick={() => onTabChange("Outreach")} />
          <MobileNavIcon icon="📈" label="Reports" onClick={() => onTabChange("Reports")} />
        </div>
      </div>
    </div>
  );
}

function MobileNavIcon({ icon, label, active, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", flex: 1 }} onClick={onClick}>
      <span style={{ fontSize: 18, filter: active ? "none" : "grayscale(1) opacity(0.5)" }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 800, color: active ? COLORS.teal : COLORS.textMuted }}>{label}</span>
    </div>
  );
}
