"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function RosterView(props: { students: Student[]; allStudents: Student[]; query: string; setQuery: (v: string) => void; languageFilter: Language | "All"; setLanguageFilter: (v: any) => void; statusFilter: Status | "All"; setStatusFilter: (v: any) => void; languages: Array<Language | "All">; statuses: Array<Status | "All">; selected: string[]; toggleSelected: (id: string) => void; selectAllVisible: () => void; hoveredId: string | null; setHoveredId: (id: string | null) => void; onRowClick: (id: string) => void; onSend: (id: string) => void; privacyMode: boolean; maskPII: any }) {
  const { students, allStudents, query, setQuery, languageFilter, setLanguageFilter, statusFilter, setStatusFilter, languages, statuses, selected, toggleSelected, selectAllVisible, hoveredId, setHoveredId, onRowClick, onSend, privacyMode, maskPII } = props;
  
  const [sortField, setSortField] = useState<"name" | "language" | "status" | "contacted">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const STATUS_SORT_WEIGHT: Record<Status, number> = {
    "Responded": 6,
    "Sent": 5,
    "Pending": 4,
    "Not Contacted": 3,
    "SMS Required": 2,
    "Unreachable": 1,
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = getStudentName(a).localeCompare(getStudentName(b));
      } else if (sortField === "language") {
        cmp = a.language.localeCompare(b.language);
      } else if (sortField === "status") {
        cmp = STATUS_SORT_WEIGHT[a.status] - STATUS_SORT_WEIGHT[b.status];
      } else if (sortField === "contacted") {
        const aVal = a.status === "Sent" || a.status === "Responded" ? 1 : 0;
        const bVal = b.status === "Sent" || b.status === "Responded" ? 1 : 0;
        cmp = aVal - bVal;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, sortField, sortDir]);

  const toggleSort = (field: "name" | "language" | "status" | "contacted") => {
    if (sortField === field) setSortDir(prev => prev === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span style={{ opacity: 0.2, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: COLORS.teal }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Student Roster" right={<div style={{ display: "flex", gap: 10, alignItems: "center" }}><Muted>Showing {students.length} of {allStudents.length} students</Muted></div>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search names..." style={inputStyle()} />
          <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} style={inputStyle()}>
            {languages.map(l => <option key={l} value={l}>{l === "All" ? "All Languages" : l}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle()}>
            {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
          <HoverableButton style={btn({ variant: "outline" })} onClick={selectAllVisible}>
            {selected.length === students.length && students.length > 0 ? "Deselect All" : "Select All"}
          </HoverableButton>
        </div>
        
        {selected.length > 0 && (
          <div style={{ padding: "12px 16px", background: "rgba(8,145,178,0.08)", border: `1px solid ${COLORS.teal}`, borderRadius: RADII.md, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <div style={{ fontWeight: 800, color: COLORS.navy }}>{selected.length} student(s) selected</div>
            <div style={{ display: "flex", gap: 8 }}>
              <HoverableButton style={btn({ variant: "outline" })} onClick={() => {
                // To open bulk modal we need to dispatch an event or trigger it via a callback.
                // Alternatively, we can just ask the user to click Send Bulk from Command Center.
                alert("Use the 'Send Bulk' button in the Command Center to message these selected students.");
              }}>Bulk Actions</HoverableButton>
            </div>
          </div>
        )}
        
        <Divider style={{ marginTop: selected.length > 0 ? 16 : 24 }} />
        
        <div style={{ overflow: "auto", borderRadius: RADII.md, border: `1px solid ${COLORS.border}` }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
              <tr style={{ background: "#FAFBFD" }}>
                <th style={{ ...thStyle(true), width: 40 }}> </th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("name")}>Student <SortIcon field="name" /></th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("language")}>Language <SortIcon field="language" /></th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("status")}>Status <SortIcon field="status" /></th>
                <th style={{ ...thStyle(true), cursor: "pointer" }} onClick={() => toggleSort("contacted")}>Last Contacted <SortIcon field="contacted" /></th>
                <th style={{ ...thStyle(true), textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map(s => {
                const isSelected = selected.includes(s.id);
                return (
                  <tr key={s.id} onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)} style={{ background: isSelected ? "rgba(31,58,95,0.03)" : "#fff", cursor: "pointer" }}>
                    <td style={tdStyle()}><input type="checkbox" checked={isSelected} onChange={() => toggleSelected(s.id)} onClick={e => e.stopPropagation()} /></td>
                    <td style={{ ...tdStyle(), position: "sticky", left: 0, background: isSelected ? "rgba(31,58,95,0.03)" : COLORS.white, zIndex: 2, fontWeight: 850 }} onClick={() => onRowClick(s.id)}>
                      {privacyMode ? maskPII(getStudentName(s), "name") : getStudentName(s)}
                      <div><Muted style={{ fontSize: 11 }}>{s.email ? (privacyMode ? maskPII(s.email, "email") : s.email) : s.phone ? (privacyMode ? maskPII(s.phone, "phone") : s.phone) : "No contact info"}</Muted></div>
                    </td>
                    <td style={tdStyle()} onClick={() => onRowClick(s.id)}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <LanguageTag lang={s.language} />
                        <Muted style={{ fontSize: 11 }}>{s.languageConfidence ?? "Auto-detected"}</Muted>
                      </div>
                    </td>
                    <td style={tdStyle()} onClick={() => onRowClick(s.id)}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle()} onClick={() => onRowClick(s.id)}>
                      <span style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600 }}>
                        {s.status === "Sent" ? "Recently" : s.status === "Responded" ? "Active" : "Never"}
                      </span>
                    </td>
                    <td style={{ ...tdStyle(), textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <HoverableButton style={{ ...btn({ variant: "outline" }), padding: "4px 10px" }} onClick={() => onSend(s.id)}>Send</HoverableButton>
                        <HoverableButton style={{ ...btn({ variant: "outline" }), padding: "4px 10px" }} onClick={() => window.dispatchEvent(new CustomEvent('open-call-simulator', { detail: s.id }))}>Call</HoverableButton>
                        <HoverableButton style={{ ...btn({ variant: "outline" }), padding: "4px 10px" }} onClick={() => onRowClick(s.id)}>View</HoverableButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center" }}><div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>No matching students</div><Muted>Adjust filters or search to continue.</Muted></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
