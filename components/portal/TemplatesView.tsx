"use client";
import React from "react";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, AuditEntry, Language, Status, TemplateTone, getStudentName } from "./types";


function TranslationCard({ lang, body, onRemove }: { lang: Language; body: string; onRemove: () => void }) {
  const { translated, loading, error } = useTranslation(body, lang);
  const accentColor: string = LANG_COLORS[lang]?.fg ?? COLORS.teal;
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${accentColor}`, borderRadius: RADII.md, padding: "12px 14px", background: COLORS.white, boxShadow: SHADOWS.card }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LanguageTag lang={lang} />
          {loading && <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>AI Translating…</span>}
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

function TemplatesView({ tone, setTone, subject, setSubject, body, setBody, previewLangs, setPreviewLangs, library, onSaveTemplate, onLoadTemplate, onSendTest }: { tone: TemplateTone; setTone: (v: TemplateTone) => void; subject: string; setSubject: (v: string) => void; body: string; setBody: (v: string) => void; previewLangs: Language[]; setPreviewLangs: (v: Language[]) => void; library: Array<{ name: string; subject: string; body: string; tone: TemplateTone }>; onSaveTemplate: (name: string) => void; onLoadTemplate: (t: any) => void; onSendTest: () => void }) {
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <Card title="Template Library" right={<HoverableButton style={{ ...btn({ variant: "teal" }), padding: "4px 12px" }} onClick={() => { const n = prompt("Template name?"); if(n) onSaveTemplate(n); }}>Save Current</HoverableButton>}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {library.map((t, i) => (
              <button key={i} onClick={() => onLoadTemplate(t)} style={{ padding: "8px 12px", borderRadius: RADII.sm, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: COLORS.navy }}>
                {t.name}
              </button>
            ))}
            {library.length === 0 && <Muted style={{ fontSize: 12 }}>No saved templates yet.</Muted>}
          </div>
        </Card>

        <Card title="Template Builder">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
              <textarea value={body} onChange={e => setBody(e.target.value)} style={{ ...inputStyle(), minHeight: 140, resize: "vertical", lineHeight: 1.5 }} />
              <Muted style={{ display: "block", marginTop: 6 }}>Use tags: {"{First_Name}"}, {"{Last_Name}"}, {"{Student_Name}"}, {"{Program_Name}"}</Muted>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Live Translation Preview" right={
        <select value="" onChange={e => { const v = e.target.value as Language; if (!v) return; if (!previewLangs.includes(v)) setPreviewLangs([...previewLangs, v]); }} style={inputStyle()}>
          <option value="">Add language preview…</option>
          {langOptions.filter(l => !previewLangs.includes(l)).map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      }>
        <div style={{ display: "grid", gap: 10 }}>
          {previewLangs.map(lang => (
            <TranslationCard key={lang} lang={lang} body={body} onRemove={() => setPreviewLangs(previewLangs.filter(x => x !== lang))} />
          ))}
          {previewLangs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary, marginBottom: 4 }}>No preview languages</div>
              <Muted>Add a language above to see live AI translations.</Muted>
            </div>
          ) : null}
        </div>

        {/* Subtler AI Disclaimer */}
        <div style={{ marginTop: 24, padding: "10px 12px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <Muted style={{ fontSize: 10.5, lineHeight: 1.4, display: "block" }}>
            <strong>AI Preview:</strong> Translations are generated as-is. Please validate all outputs for accuracy before sending.
          </Muted>
        </div>
      </Card>
    </div>
  );
}
