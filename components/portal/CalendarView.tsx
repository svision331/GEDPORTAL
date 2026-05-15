"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function CalendarView({ students, onOpenStudent }: { students: Student[]; onOpenStudent: (id: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  
  const scheduled = students.filter(s => s.scheduledOutreach);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.navy }}>{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
          <div style={{ display: "flex", gap: 4 }}>
            <HoverableButton onClick={() => setViewDate(new Date(year, month - 1))} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white }}>←</HoverableButton>
            <HoverableButton onClick={() => setViewDate(new Date())} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 11, fontWeight: 700 }}>Today</HoverableButton>
            <HoverableButton onClick={() => setViewDate(new Date(year, month + 1))} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white }}>→</HoverableButton>
          </div>
        </div>
        <Muted style={{ fontSize: 12, fontWeight: 700 }}>{scheduled.length} Planned Outreaches</Muted>
      </div>

      <div style={{ background: COLORS.white, borderRadius: RADII.lg, border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: SHADOWS.card }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "rgba(31,58,95,0.03)", borderBottom: `1px solid ${COLORS.border}` }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ padding: 12, textAlign: "center", fontSize: 11, fontWeight: 900, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {blanks.map(b => <div key={`b-${b}`} style={{ minHeight: 120, borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: "rgba(248,250,252,0.5)" }} />)}
          {days.map(d => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const matches = scheduled.filter(s => s.scheduledOutreach === dateStr);
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
            
            return (
              <div key={d} style={{ minHeight: 120, borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, padding: 8, position: "relative", background: isToday ? "rgba(8,145,178,0.02)" : "transparent" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: isToday ? COLORS.teal : COLORS.textMuted, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>{d}</span>
                  {isToday && <span style={{ fontSize: 8, background: COLORS.teal, color: "#fff", padding: "2px 6px", borderRadius: 4 }}>TODAY</span>}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  {matches.map(s => (
                    <div key={s.id} onClick={() => onOpenStudent(s.id)} style={{ padding: "4px 8px", borderRadius: 6, background: s.email ? COLORS.navy : COLORS.teal, color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`${getStudentName(s)} (${s.email ? "Email" : "SMS"})`}>
                      {s.lastName}, {s.firstName[0]}.
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
