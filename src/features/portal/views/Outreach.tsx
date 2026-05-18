"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, LANG_COLORS, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "@/src/models";

function TranslationCard({ lang, body, onRemove }: { lang: Language; body: string; onRemove: () => void }) {
  const { translated, loading, error } = useTranslation(body, lang);
  const accentColor: string = LANG_COLORS[lang]?.fg ?? COLORS.teal;
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${accentColor}`, borderRadius: RADII.md, padding: "12px 14px", background: COLORS.white, boxShadow: SHADOWS.card }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageTag lang={lang} />
          {loading && <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: "italic" }}>Translating…</span>}
          {error && <span style={{ fontSize: 11, color: SEMANTIC.warning }}>⚠ Fallback to English</span>}
        </div>
        <button onClick={onRemove} style={btn({ variant: "ghost" })}>✕</button>
      </div>
      <Divider style={{ margin: "10px 0" }} />
      {loading ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0" }}>
          <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, animation: "pulse 1s ease-in-out infinite" }} />
          <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, animation: "pulse 1s ease-in-out 0.2s infinite" }} />
          <div style={{ width: 6, height: 6, borderRadius: 999, background: accentColor, animation: "pulse 1s ease-in-out 0.4s infinite" }} />
        </div>
      ) : (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{translated || body}</div>
      )}
    </div>
  );
}

function OutreachView({
  students, template, programName, onOpenStudent, auditLog, privacyMode, maskPII,
  tone, setTone, subject, setSubject, body, setBody,
  previewLangs, setPreviewLangs, library, onSaveTemplate, onLoadTemplate, onSendTest
}: {
  students: Student[];
  template: { subject: string; body: string };
  programName: string;
  onOpenStudent: (id: string) => void;
  auditLog: AuditEntry[];
  privacyMode: boolean;
  maskPII: any;
  tone: TemplateTone;
  setTone: (v: TemplateTone) => void;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  previewLangs: Language[];
  setPreviewLangs: (v: Language[]) => void;
  library: Array<{ name: string; subject: string; body: string; tone: TemplateTone }>;
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (t: any) => void;
  onSendTest: () => void;
}) {
  const [queueFilter, setQueueFilter] = useState<"all" | "first-contact" | "follow-up" | "problem">("all");
  const [builderOpen, setBuilderOpen] = useState(true);

  const queueStudents = useMemo(() => {
    switch (queueFilter) {
      case "first-contact": return students.filter(s => s.status === "Not Contacted" || s.status === "Pending");
      case "follow-up": return students.filter(s => s.status === "Sent" || s.status === "SMS Required");
      case "problem": return students.filter(s => s.status === "Unreachable");
      default: return students.filter(s => s.status !== "Responded");
    }
  }, [students, queueFilter]);

  const firstContactCount = students.filter(s => s.status === "Not Contacted" || s.status === "Pending").length;
  const followUpCount = students.filter(s => s.status === "Sent" || s.status === "SMS Required").length;
  const problemCount = students.filter(s => s.status === "Unreachable").length;

  const langOptions: Language[] = [
    "Arabic", "Amharic", "Bengali", "Burmese", "Chinese", "Dutch",
    "English", "Filipino", "French", "Fula", "German", "Haitian Creole",
    "Hindi", "Hmong", "Italian", "Japanese", "Khmer", "Korean",
    "Lao", "Malinké", "Mayan", "Nepali", "Persian", "Pashto",
    "Polish", "Portuguese", "Romanian", "Russian", "Somali", "Spanish",
    "Swahili", "Turkish", "Ukrainian", "Urdu", "Vietnamese",
  ];

  const charCount = body.length;
  const isSMSCritical = charCount > 160;

  return (
    <div style={{ display: "grid", gap: 16 }}>

      {/* ── Message Builder (was Templates tab) ── */}
      <Card
        title="Message Builder"
        right={
          <HoverableButton
            style={{ ...btn({ variant: "ghost" }), fontSize: 12, padding: "4px 10px" }}
            onClick={() => setBuilderOpen(v => !v)}
          >
            {builderOpen ? "▲ Collapse" : "▼ Expand"}
          </HoverableButton>
        }
        accent={COLORS.teal}
      >
        {builderOpen && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Left — builder */}
            <div style={{ display: "grid", gap: 12 }}>
              {/* Saved templates strip */}
              {library.length > 0 && (
                <div>
                  <label style={labelStyle()}>Saved Templates</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {library.map((t, i) => (
                      <button key={i} onClick={() => onLoadTemplate(t)} style={{ padding: "6px 12px", borderRadius: RADII.sm, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", fontSize: 12, fontWeight: 700, color: COLORS.navy }}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle()}>Tone Preset</label>
                  <select value={tone} onChange={e => setTone(e.target.value as TemplateTone)} style={inputStyle()}>
                    <option value="neutral">Neutral / Informational</option>
                    <option value="encouraging">Encouraging</option>
                    <option value="urgent">Urgent (Attendance Risk)</option>
                    <option value="exit">Exit Confirmation</option>
                  </select>
                </div>
                <div style={{ alignSelf: "end" }}>
                  <HoverableButton style={{ ...btn({ variant: "outline" }), width: "100%" }} onClick={onSendTest}>Send Test to Me</HoverableButton>
                </div>
              </div>

              <div>
                <label style={labelStyle()}>Subject Line</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle()} />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={labelStyle()}>Message Body (English)</label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: isSMSCritical ? SEMANTIC.warning : COLORS.textMuted }}>
                    {charCount} chars {isSMSCritical ? "(>1 SMS unit)" : ""}
                  </span>
                </div>
                <textarea value={body} onChange={e => setBody(e.target.value)} style={{ ...inputStyle(), minHeight: 120, resize: "vertical", lineHeight: 1.5 }} />
                <Muted style={{ display: "block", marginTop: 6 }}>Tags: {"{Student_Name}"}, {"{Program_Name}"}, {"{Educator_Name}"}</Muted>
              </div>

              <HoverableButton
                style={{ ...btn({ variant: "outline" }), fontSize: 12 }}
                onClick={() => { const n = prompt("Template name?"); if (n) onSaveTemplate(n); }}
              >
                Save as Template
              </HoverableButton>
            </div>

            {/* Right — live translation preview */}
            <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
              <div>
                <label style={labelStyle()}>Live Translation Preview</label>
                <select
                  value=""
                  onChange={e => { const v = e.target.value as Language; if (!v) return; if (!previewLangs.includes(v)) setPreviewLangs([...previewLangs, v]); }}
                  style={{ ...inputStyle(), marginTop: 6 }}
                >
                  <option value="">Add language preview…</option>
                  {langOptions.filter(l => !previewLangs.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {previewLangs.map(lang => (
                <TranslationCard key={lang} lang={lang} body={body} onRemove={() => setPreviewLangs(previewLangs.filter(x => x !== lang))} />
              ))}

              {previewLangs.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, background: COLORS.bg, borderRadius: RADII.md, border: `1px dashed ${COLORS.borderStrong}` }}>
                  <Muted>Add a language above to see live AI translations.</Muted>
                </div>
              )}

              <div style={{ padding: "6px 12px", borderTop: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 9.5, color: COLORS.textMuted, lineHeight: 1.4, display: "block" }}>Translations are machine-generated. Verify before sending.</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Outreach Queue + Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>
        <Card title="Outreach Queue">
          {/* Filter bar */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {[
              { key: "all", label: `All (${students.filter(s => s.status !== "Responded").length})` },
              { key: "first-contact", label: `First Contact (${firstContactCount})`, color: firstContactCount > 0 ? SEMANTIC.danger : undefined },
              { key: "follow-up", label: `Follow-Up (${followUpCount})`, color: followUpCount > 0 ? SEMANTIC.warning : undefined },
              { key: "problem", label: `Unreachable (${problemCount})`, color: problemCount > 0 ? SEMANTIC.danger : undefined },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setQueueFilter(key as any)}
                style={{
                  padding: "5px 12px", borderRadius: RADII.full, border: `1px solid ${queueFilter === key ? (color || COLORS.teal) : COLORS.border}`,
                  background: queueFilter === key ? (color ? color + "12" : "rgba(8,145,178,0.08)") : COLORS.white,
                  color: queueFilter === key ? (color || COLORS.teal) : COLORS.textMuted,
                  fontSize: 11, fontWeight: 800, cursor: "pointer", transition: "all 0.15s",
                }}
              >{label}</button>
            ))}
          </div>
          <div style={{ overflow: "auto", borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, maxHeight: 360 }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 540 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 5 }}>
                <tr style={{ background: "#FAFBFD" }}>
                  <th style={thStyle(true)}>Student</th>
                  <th style={thStyle(true)}>Language</th>
                  <th style={thStyle(true)}>Status</th>
                  <th style={thStyle(true)}>Draft Preview</th>
                </tr>
              </thead>
              <tbody>
                {queueStudents.map(s => (
                  <tr key={s.id} style={{ background: COLORS.white, cursor: "pointer", borderBottom: `1px solid ${COLORS.border}` }} onClick={() => onOpenStudent(s.id)}>
                    <td style={{ ...tdStyle(), color: COLORS.navy, fontWeight: 900, fontSize: 14 }}>{privacyMode ? maskPII(getStudentName(s), "name") : getStudentName(s)}</td>
                    <td style={tdStyle()}><LanguageTag lang={s.language} /></td>
                    <td style={tdStyle()}><StatusBadge status={s.status} /></td>
                    <td style={tdStyle()}>
                      <div style={{ fontSize: 11, fontStyle: "italic", color: COLORS.textSecondary }}>
                        {s.status === "Unreachable"
                          ? "No valid contact info — update record manually"
                          : formatTemplate(template.body, s, programName, undefined).slice(0, 60) + "…"}
                      </div>
                    </td>
                  </tr>
                ))}
                {queueStudents.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 24, textAlign: "center" }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>
                      {queueFilter === "all" ? "All students responded ✓" : "No students in this category"}
                    </div>
                    <Muted>{queueFilter === "all" ? "Every student has replied." : "Try a different filter above."}</Muted>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Card title="Engagement Stats" accent={COLORS.navy}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textMuted, textTransform: "uppercase" }}>Queue Health</div>
                <div style={{ height: 8, background: COLORS.chipBg, borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ width: `${(1 - firstContactCount / Math.max(students.length, 1)) * 100}%`, height: "100%", background: SEMANTIC.success, borderRadius: 4 }} />
                </div>
                <Muted style={{ marginTop: 6, display: "block" }}>{Math.round((1 - firstContactCount / Math.max(students.length, 1)) * 100)}% of students contacted</Muted>
              </div>
              <Divider />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: SEMANTIC.success }}>{students.filter(s => s.status === "Responded").length}</div>
                  <Muted>Replied</Muted>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.navy }}>{students.filter(s => s.status === "Sent").length}</div>
                  <Muted>Awaiting reply</Muted>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Recent Send History" accent={COLORS.teal}>
            <div style={{ display: "grid", gap: 8 }}>
              {auditLog.filter(a => a.type === "outreach").slice(0, 4).map(a => (
                <div key={a.id} style={{ padding: "8px 10px", border: `1px solid ${COLORS.border}`, borderRadius: RADII.sm, display: "flex", justifyContent: "space-between", alignItems: "center", background: COLORS.white }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 99, background: "rgba(34, 197, 94, 0.1)", color: SEMANTIC.success, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 12 }}>{a.studentName || "Bulk Outreach"}</div>
                      <Muted style={{ fontSize: 10 }}>{new Date(a.timestamp).toLocaleTimeString()}</Muted>
                    </div>
                  </div>
                  <Muted style={{ fontSize: 10 }}>{a.details?.split(".")[0]}</Muted>
                </div>
              ))}
              {auditLog.filter(a => a.type === "outreach").length === 0 && (
                <div style={{ textAlign: "center", padding: 16 }}><Muted>No send history yet.</Muted></div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
