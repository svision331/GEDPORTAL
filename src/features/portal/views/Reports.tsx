"use client";
import React from "react";
import { COLORS, SHADOWS, RADII, Student, AuditEntry, Status } from "@/src/models";

function ReportsView({
  students, auditLog, onFilterStatus, privacyMode, maskPII, isAdmin, onExportPDF, onExportCSV,
}: {
  students: Student[];
  auditLog: AuditEntry[];
  onFilterStatus: (s: Status) => void;
  privacyMode: boolean;
  maskPII: any;
  isAdmin: boolean;
  onExportPDF: () => void;
  onExportCSV: () => void;
}) {
  const [subTab, setSubTab] = useState<"analytics" | "audit">("analytics");

  const SubTabBtn = ({ value, label }: { value: "analytics" | "audit"; label: string }) => (
    <button
      onClick={() => setSubTab(value)}
      style={{
        padding: "7px 20px", borderRadius: RADII.sm, border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 700, transition: "all 0.15s",
        background: subTab === value ? COLORS.white : "transparent",
        color: subTab === value ? COLORS.navy : COLORS.textMuted,
        boxShadow: subTab === value ? SHADOWS.card : "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: COLORS.chipBg, padding: 4, borderRadius: RADII.md }}>
          <SubTabBtn value="analytics" label="Analytics" />
          {isAdmin && <SubTabBtn value="audit" label="Audit Log" />}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {subTab === "analytics" && (
            <HoverableButton style={btn({ variant: "outline" })} onClick={onExportCSV}>⬇ Export CSV</HoverableButton>
          )}
          {subTab === "audit" && isAdmin && (
            <HoverableButton style={{ ...btn({ variant: "primary" }), fontSize: 12 }} onClick={onExportPDF}>📄 Export Audit-Ready Logs</HoverableButton>
          )}
        </div>
      </div>
      {subTab === "analytics" && (
        <AnalyticsView students={students} onFilterStatus={onFilterStatus} privacyMode={privacyMode} maskPII={maskPII} />
      )}
      {subTab === "audit" && isAdmin && (
        <AuditLogView auditLog={auditLog} privacyMode={privacyMode} maskPII={maskPII} />
      )}
    </div>
  );
}
