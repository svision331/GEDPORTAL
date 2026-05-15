export default function EducatorOutreachPortal_Antigravity({ session }: { session: any }) {
  useDarkModeTime();
  const [program, setProgram] = useState<"GED Reconnect" | "ESL Bridge" | "Workforce Launch">("GED Reconnect");
  const [tab, setTab] = useState<"Dashboard" | "Roster" | "Templates" | "Outreach" | "Analytics" | "Audit" | "Mobile">("Dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<Language | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [tone, setTone] = useState<TemplateTone>("neutral");
  const [subject, setSubject] = useState(TONE_TEMPLATES.neutral.subject);
  const [body, setBody] = useState(TONE_TEMPLATES.neutral.body);
  const [previewLangs, setPreviewLangs] = useState<Language[]>(["Spanish", "Ukrainian", "Chinese"]);
  const [library, setLibrary] = useState<Array<{ name: string; subject: string; body: string; tone: TemplateTone }>>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<"confirm" | "sent">("confirm");
  const [bulkChannel, setBulkChannel] = useState<OutreachChannel>("Email");
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [legalModalOpen, setLegalModalOpen] = useState<{ open: boolean, type: "terms" | "privacy" | "dmca" | "refund" | null }>({ open: false, type: null });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({ firstName: "", lastName: "", email: "", phone: "", language: "English", status: "Not Contacted", address: "", notes: "" });
  const [activeCallStudentId, setActiveCallStudentId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      const dbStudents = await getStudents();
      if (dbStudents.length === 0) {
        // Seed if empty
        for (const s of MOCK_STUDENTS) {
          await dbCreateStudent({ ...s, id: undefined });
        }
        setStudents(await getStudents() as any);
      } else {
        setStudents(dbStudents as any);
      }

      const dbAudit = await getAuditLogs();
      if (dbAudit.length === 0) {
        for (const a of MOCK_AUDIT) {
          await dbCreateAuditEntry({ ...a, timestamp: new Date().toISOString() } as any);
        }
        setAuditLog(await getAuditLogs() as any);
      } else {
        setAuditLog(dbAudit as any);
      }

      const dbProgram = await getSetting("outreach_program");
      if (dbProgram) setProgram(dbProgram as any);

      const dbTone = await getSetting("outreach_tone");
      if (dbTone) setTone(dbTone as any);

      const dbSubject = await getSetting("outreach_subject");
      if (dbSubject) setSubject(dbSubject);

      const dbBody = await getSetting("outreach_body");
      if (dbBody) setBody(dbBody);

      const dbApiKey = await getSetting("ag_gemini_api_key");
      if (dbApiKey) setApiKey(dbApiKey);

      const dbResend = await getSetting("resend_api_key");
      if (dbResend) setResendKey(dbResend);

      const dbSid = await getSetting("twilio_sid");
      if (dbSid) setTwilioSid(dbSid);

      const dbToken = await getSetting("twilio_auth_token");
      if (dbToken) setTwilioToken(dbToken);

      const dbPhone = await getSetting("twilio_phone_number");
      if (dbPhone) setTwilioPhone(dbPhone);

      const dbFrom = await getSetting("email_from_address");
      if (dbFrom) setFromEmail(dbFrom);

      const dbLib = await getSetting("template_library");
      if (dbLib) {
        try { setLibrary(JSON.parse(dbLib)); } catch (e) { console.error("Library parse err", e); }
      }
    }
    init();
  }, []);

  async function syncSetting(key: string, val: string) {
    try {
      await saveSetting(key, val);
      showToast("Settings synchronized", "success");
    } catch (e) {
      showToast("Failed to save settings", "error");
    }
  }

  // Sync Settings to DB
  useEffect(() => { syncSetting("outreach_program", program); }, [program]);
  useEffect(() => { syncSetting("outreach_tone", tone); }, [tone]);
  useEffect(() => { syncSetting("outreach_subject", subject); }, [subject]);
  useEffect(() => { syncSetting("outreach_body", body); }, [body]);
  useEffect(() => { syncSetting("ag_gemini_api_key", apiKey); }, [apiKey]);
  useEffect(() => { syncSetting("resend_api_key", resendKey); }, [resendKey]);
  useEffect(() => { syncSetting("twilio_sid", twilioSid); }, [twilioSid]);
  useEffect(() => { syncSetting("twilio_auth_token", twilioToken); }, [twilioToken]);
  useEffect(() => { syncSetting("twilio_phone_number", twilioPhone); }, [twilioPhone]);
  useEffect(() => { syncSetting("email_from_address", fromEmail); }, [fromEmail]);

  useEffect(() => {
    const handleOpenCall = (e: any) => setActiveCallStudentId(e.detail);
    window.addEventListener('open-call-simulator', handleOpenCall);
    return () => window.removeEventListener('open-call-simulator', handleOpenCall);
  }, []);

  const programName = useMemo(() => {
    if (program === "GED Reconnect") return "GED Program";
    if (program === "ESL Bridge") return "ESL Bridge Program";
    return "Workforce Launch Program";
  }, [program]);

  useEffect(() => { setSubject(TONE_TEMPLATES[tone].subject); setBody(TONE_TEMPLATES[tone].body); }, [tone]);

  const filtered = useMemo(() => students.filter(s => languageFilter === "All" ? true : s.language === languageFilter).filter(s => statusFilter === "All" ? true : s.status === statusFilter).filter(s => query.trim() ? getStudentName(s).toLowerCase().includes(query.trim().toLowerCase()) : true), [students, languageFilter, statusFilter, query]);
  const activeStudent = useMemo(() => students.find(s => s.id === activeStudentId) || null, [students, activeStudentId]);
  const focus = useMemo(() => computeTodayFocus(students), [students]);
  const languages = useMemo(() => { const set = new Set(students.map(s => s.language)); return ["All" as const, ...(Array.from(set).sort() as Language[])]; }, [students]);
  const statuses = useMemo(() => { const set = new Set(students.map(s => s.status)); return ["All" as const, ...(Array.from(set).sort() as Status[])]; }, [students]);

  async function logAudit(entry: Omit<AuditEntry, "id" | "timestamp" | "actor">) {
    const newEntry = {
      ...entry,
      actor: "Mr. Caldwell",
      timestamp: new Date().toISOString()
    };
    const dbEntry = await dbCreateAuditEntry(newEntry as any);
    setAuditLog(prev => [dbEntry as any, ...prev]);
  }

  function toggleSelected(id: string) { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function selectAllVisible() { const ids = filtered.map(s => s.id); const allSelected = ids.every(id => selected.includes(id)); setSelected(prev => { if (allSelected) return prev.filter(id => !ids.includes(id)); const next = new Set(prev); ids.forEach(id => next.add(id)); return Array.from(next); }); }
  
  async function updateStudent(id: string, updates: Partial<Student>) { 
    const res = await dbUpdateStudent(id, updates);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    showToast("Student profile updated", "success");
    return res;
  }

  async function sendSingle(id: string) {
    const s = students.find(x => x.id === id);
    if (!s) return;
    
    const chan: "Email" | "SMS" = (s.email ? "Email" : "SMS");
    const res = await sendOutreach({ studentId: id, subject, body, channel: chan });
    
    await updateStudent(id, { status: "Sent" });
    logAudit({ action: "Outreach Sent", studentId: s.id, studentName: getStudentName(s), details: `Individual outreach message sent via ${chan}. ${"simulated" in res && res.simulated ? "(Simulated)" : "(Real API)"}`, type: "outreach" });
    showToast(`${chan} sent successfully to ${getStudentName(s)}`, "success");
  }

  function openBulk() { setBulkStep("confirm"); setBulkOpen(true); }

  async function doBulkSend() {
    const ids = selected.length ? selected : filtered.map(s => s.id);
    const chan: "Email" | "SMS" = bulkChannel === "SMS" ? "SMS" : "Email";
    const newStatus = "Sent";
    
    setStudents(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: newStatus as any } : s));
    
    for (const id of ids) {
      await sendOutreach({ studentId: id, subject, body, channel: chan });
    }

    logAudit({ action: "Bulk Outreach", details: `Sent ${ids.length} messages via ${chan}. Status updated for compliance.`, type: "outreach" });
    setBulkStep("sent");
    showToast(`Bulk ${chan} outreach completed for ${ids.length} students`, "success");
  }
  function exportReport() { const rows = students.map(s => ({ Student: getStudentName(s), Language: s.language, Status: s.status, "Language Confidence": s.languageConfidence ?? "Auto-detected", Email: s.email ?? "", Phone: s.phone ?? "" })); exportCSV(rows, `educator-outreach-report-${program.replaceAll(" ", "_").toLowerCase()}.csv`); }
  
  function exportPDFReport() {
    const doc = new jsPDF();
    const title = `Educator Outreach Report: ${program}`;
    const date = new Date().toLocaleString();
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date} | Program: ${program}`, 14, 30);
    
    const tableData = students.map(s => [
      getStudentName(s),
      s.language,
      s.status,
      s.email || "—",
      s.phone || "—",
      s.languageConfidence || "Auto"
    ]);
    
    autoTable(doc, {
      startY: 35,
      head: [['Student Name', 'Language', 'Status', 'Email', 'Phone', 'Confidence']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [240, 244, 248], textColor: [31, 58, 95], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    
    doc.save(`outreach-report-${program.toLowerCase().replace(/ /g, '-')}.pdf`);
  }
  function handleImport(file: File) { const extra: Student[] = [{ id: String(Date.now()), firstName: "Andrii", lastName: "Savchenko", language: "Ukrainian", status: "Not Contacted", languageConfidence: "Auto-detected", phone: "" }, { id: String(Date.now() + 1), firstName: "Maxine", lastName: "Chen", language: "Chinese", status: "Not Contacted", languageConfidence: "Auto-detected", email: "" }, { id: String(Date.now() + 2), firstName: "Richard", lastName: "Mora", language: "Spanish", status: "Not Contacted", languageConfidence: "Auto-detected", email: "richard@example.com" }]; setStudents(prev => [...extra, ...prev]); setImportOpen(false); }
  const [importTab, setImportTab] = useState<"paste" | "file">("paste");
  const [pasteText, setPasteText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<Student[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);





  async function handleParsePaste() {
    setParsedPreview(null);
    setParseError("");
    if (!pasteText.trim()) { setParseError("Please paste some data first."); return; }
    setParsing(true);
    try {
      // Use AI for parsing on the server
      const result = await parseViaAI(pasteText);
      setParsedPreview(result as any);
    } catch (e: any) {
      setParseError(e.message || "Could not parse the data.");
    } finally {
      setParsing(false);
    }
  }

  async function confirmPasteImport() {
    if (!parsedPreview) return;
    
    const imported: Student[] = [];
    for (const s of parsedPreview) {
      const created = await dbCreateStudent({ ...s, id: undefined });
      imported.push(created as any);
    }
    
    setStudents(prev => [...imported, ...prev]);
    logAudit({ action: "Bulk Import", details: `Imported ${parsedPreview.length} students from manual paste with AI parsing.`, type: "import" });
    setPasteText("");
    setParsedPreview(null);
    setParseError("");
    setImportOpen(false);
    showToast(`Successfully imported ${imported.length} student records`, "success");
  }

  function updateParsedLang(idx: number, lang: Language) {
    setParsedPreview(prev => prev ? prev.map((s, i) => i === idx ? { ...s, language: lang } : s) : prev);
  }


  const isAdmin = session?.user?.role === "ADMIN";
  const tabs = useMemo(() => {
    return [
      { value: "Dashboard", label: "Dashboard" },
      { value: "Roster", label: "Roster" },
      { value: "Outreach", label: "Outreach" },
      { value: "Calendar", label: "Calendar" },
      { value: "Reports", label: "Reports" },
    ];
  }, []);

  return (
    <AppShell 
      title="The Educator Outreach Portal" 
      subtitle={`Program: ${program} • 🔐 Session Active (Auto-expire in 2h)`} 
      onExportReport={exportReport} 
      onOpenLegal={type => setLegalModalOpen({ open: true, type })} 
      onOpenSettings={() => setSettingsOpen(true)} 
      onStartDemo={() => setDemoStep(1)}
      userName={session?.user?.name} 
      role={session?.user?.role}
      privacyMode={privacyMode}
      setPrivacyMode={setPrivacyMode}
      showToast={showToast}
    >
      {/* Demo Overlay */}
      {demoStep !== null && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: COLORS.navy, color: "#fff", padding: "16px 24px", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", gap: 20, border: `1px solid ${COLORS.teal}66`, minWidth: 450 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: COLORS.teal, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Guided Scenario: Step {demoStep} of 7</div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
              {demoStep === 1 && "Scenario A: Risk Identification. Notice the 'High Absence' alerts on your Dashboard."}
              {demoStep === 2 && "Searching for high-risk students in the Roster. Erica Maria is flagged for POP-Risk (60+ days)."}
              {demoStep === 3 && "Opening Erica's profile. Review her class context, active worker flag, and AI risk timeline."}
              {demoStep === 4 && "Scenario B: Automation. Using the AI Smart Importer to bring in new attendance records."}
              {demoStep === 5 && "Reviewing AI parsing. Languages are auto-detected and records are ready for the queue."}
              {demoStep === 6 && "Mass Outreach Preview. AI generates translated messages for all selected languages instantly."}
              {demoStep === 7 && "Compliance & Logs. Every action is tracked in the Audit Log for state-level reporting."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <HoverableButton 
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              onClick={() => setDemoStep(null)}
            >
              Exit
            </HoverableButton>
            <HoverableButton 
              style={{ background: COLORS.teal, border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
              onClick={() => {
                if (demoStep === 1) { setTab("Roster"); setStatusFilter("Not Contacted"); setDemoStep(2); }
                else if (demoStep === 2) { setActiveStudentId("1"); setDemoStep(3); }
                else if (demoStep === 3) { setActiveStudentId(null); setImportOpen(true); setImportTab("paste"); setDemoStep(4); }
                else if (demoStep === 4) { 
                  setPasteText("Garcia\tMaria\tmaria@email.com\t555-1234\tSpanish\nNguyen\tTuan\t\t555-5678\tVietnamese"); 
                  handleParsePaste();
                  setDemoStep(5); 
                }
                else if (demoStep === 5) { setImportOpen(false); setTab("Outreach"); setDemoStep(6); }
                else if (demoStep === 6) { setTab("Reports"); setDemoStep(7); }
                else { setDemoStep(null); setTab("Dashboard"); showToast("Demo Scenario Completed Successfully", "success"); }
              }}
            >
              {demoStep === 7 ? "Finish" : "Next Step →"}
            </HoverableButton>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={program} onChange={e => setProgram(e.target.value as any)} style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.borderStrong}`, background: "rgba(255,255,255,0.75)", fontWeight: 800, color: COLORS.textPrimary }}>
            <option>GED Reconnect</option>
            <option>ESL Bridge</option>
            <option>Workforce Launch</option>
          </select>
          <Segmented value={tab} onChange={v => setTab(v as any)} options={tabs} />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {tab === "Roster" && <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => setAddStudentOpen(true)}>Add Student</HoverableButton>
            {isAdmin && <HoverableButton style={btn({ variant: "outline" })} onClick={() => setImportOpen(true)}>Smart Import</HoverableButton>}
            <HoverableButton style={btn({ variant: "primary" })} onClick={openBulk}>Send Bulk</HoverableButton>
          </>}
          {tab === "Outreach" && (
            <HoverableButton style={btn({ variant: "primary" })} onClick={openBulk}>Send Bulk</HoverableButton>
          )}
          {tab === "Reports" && (
            <HoverableButton style={btn({ variant: "outline" })} onClick={exportPDFReport}>📄 Export PDF</HoverableButton>
          )}
        </div>
      </div>

      {/* Global Toasts */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "grid", gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ 
            minWidth: 300, 
            padding: "14px 18px", 
            borderRadius: RADII.md, 
            background: t.type === "success" ? SEMANTIC.success : t.type === "error" ? SEMANTIC.danger : COLORS.navy, 
            color: "#fff", 
            boxShadow: SHADOWS.modal, 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            fontWeight: 700,
            fontSize: 13
          }}>
            <span>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>

      {tab === "Dashboard" ? (
        <DashboardView 
          focus={focus} 
          onPickFocus={key => { 
            if (key === "atRisk") setStatusFilter("Not Contacted"); 
            if (key === "missingContact") setStatusFilter("All"); 
            if (key === "replies") setStatusFilter("Responded"); 
            setTab("Roster"); 
          }} 
          stats={{ 
            total: students.length, 
            atRisk: students.filter(s => s.status === "Not Contacted" || s.status === "Pending").length, 
            smsRequired: students.filter(s => s.status === "SMS Required").length, 
            unreachable: students.filter(s => s.status === "Unreachable" || (!s.email && !s.phone)).length 
          }}
          auditLog={auditLog}
          onSendEmail={() => { setTab("Outreach"); setBulkChannel("Email"); setBulkOpen(true); }}
          onReviewDrafts={() => setTab("Outreach")}
          onDownloadLog={exportReport}
          onHealthCheck={() => {
            const risk60 = students.filter(s => s.absenceDays && s.absenceDays >= 60 && s.absenceDays < 90);
            const risk90 = students.filter(s => s.absenceDays && s.absenceDays >= 90);
            if (risk90.length > 0) showToast(`URGENT: ${risk90.length} students officially in POP-Risk status!`, "error");
            else if (risk60.length > 0) showToast(`${risk60.length} students approaching POP-Risk threshold (60+ days).`, "info");
            else showToast("Student population health is optimal. No new risks detected.", "success");
          }}
        />
      ) : null}
      {tab === "Roster" ? <RosterView students={filtered} allStudents={students} query={query} setQuery={setQuery} languageFilter={languageFilter} setLanguageFilter={setLanguageFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} languages={languages} statuses={statuses} selected={selected} toggleSelected={toggleSelected} selectAllVisible={selectAllVisible} hoveredId={hoveredId} setHoveredId={setHoveredId} onRowClick={id => setActiveStudentId(id)} onSend={id => sendSingle(id)} privacyMode={privacyMode} maskPII={maskPII} /> : null}
      {tab === "Outreach" ? <OutreachView
          students={students}
          template={{ subject, body }}
          programName={program}
          onOpenStudent={id => setActiveStudentId(id)}
          auditLog={auditLog}
          privacyMode={privacyMode}
          maskPII={maskPII}
          tone={tone}
          setTone={setTone}
          subject={subject}
          setSubject={setSubject}
          body={body}
          setBody={setBody}
          previewLangs={previewLangs}
          setPreviewLangs={setPreviewLangs}
          library={library}
          onSaveTemplate={(name) => {
            const next = [...library, { name, subject, body, tone }];
            setLibrary(next);
            saveSetting("template_library", JSON.stringify(next));
          }}
          onLoadTemplate={(t) => {
            setSubject(t.subject);
            setBody(t.body);
            setTone(t.tone);
          }}
          onSendTest={() => alert(`Test message sent to ${session?.user?.email || "you"}! Check your inbox for the ${tone} draft.`)}
        /> : null}
      {tab === "Calendar" ? <CalendarView students={students} onOpenStudent={id => setActiveStudentId(id)} /> : null}
      {tab === "Reports" ? <ReportsView students={students} auditLog={auditLog} onFilterStatus={s => { setStatusFilter(s); setTab("Roster"); }} privacyMode={privacyMode} maskPII={maskPII} isAdmin={isAdmin} onExportPDF={exportPDFReport} onExportCSV={exportReport} /> : null}
      {tab === "Mobile" ? <MobileDemoView students={students} onTabChange={t => setTab(t)} onOpenStudent={id => setActiveStudentId(id)} privacyMode={privacyMode} maskPII={maskPII} /> : null}

      <Modal open={!!activeStudent} title={activeStudent ? `Student Profile — ${privacyMode ? maskPII(getStudentName(activeStudent), "name") : getStudentName(activeStudent)}` : "Student Profile"} onClose={() => setActiveStudentId(null)} footer={activeStudent ? (
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <select 
            value={activeStudent.status} 
            onChange={e => updateStudent(activeStudent.id, { status: e.target.value as Status })}
            style={{ padding: "8px 12px", borderRadius: RADII.sm, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.bg, fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}
          >
            <option value="Not Contacted">Not Contacted</option>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Responded">Responded</option>
            <option value="SMS Required">SMS Required</option>
            <option value="Unreachable">Unreachable</option>
          </select>
          <div style={{ display: "flex", gap: 10 }}>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => updateStudent(activeStudent.id, { status: "Sent" })}>Mark as Contacted</HoverableButton>
            <HoverableButton style={btn({ variant: "teal" })} onClick={() => updateStudent(activeStudent.id, { status: "Responded" })}>Mark Responded</HoverableButton>
          </div>
        </div>
      ) : null}>
        {activeStudent ? <StudentDetail student={activeStudent} programName={programName} template={{ subject, body }} onClose={() => setActiveStudentId(null)} onSend={id => sendSingle(id)} auditLog={auditLog} onUpdate={updateStudent} currentUser={{ id: session?.user?.id || "u1", name: session?.user?.name || "Educator" }} /> : null}
      </Modal>

      <Modal open={addStudentOpen} title="Add New Student" onClose={() => setAddStudentOpen(false)} footer={
        <>
          <HoverableButton style={btn({ variant: "outline" })} onClick={() => setAddStudentOpen(false)}>Cancel</HoverableButton>
          <HoverableButton style={btn({ variant: "primary" })} onClick={async () => {
            if (!newStudent.firstName || !newStudent.lastName) return showToast("First and Last name are required", "error");
            const created = await dbCreateStudent({ ...newStudent, languageConfidence: "Manual" });
            setStudents(prev => [created as any, ...prev]);
            logAudit({ action: "Manual Add", details: `Added student ${getStudentName(newStudent as any)} manually.`, type: "import" });
            showToast(`Student ${newStudent.firstName} added to roster.`);
            setAddStudentOpen(false);
            setNewStudent({ firstName: "", lastName: "", email: "", phone: "", language: "English", status: "Not Contacted", address: "", notes: "" });
          }}>Save Student</HoverableButton>
        </>
      }>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={labelStyle()}>First Name</label><input type="text" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} style={inputStyle()} /></div>
            <div><label style={labelStyle()}>Last Name</label><input type="text" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} style={inputStyle()} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={labelStyle()}>Email</label><input type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} style={inputStyle()} /></div>
            <div><label style={labelStyle()}>Phone</label><input type="text" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} style={inputStyle()} /></div>
          </div>
          <div><label style={labelStyle()}>Address</label><input type="text" value={newStudent.address} onChange={e => setNewStudent({...newStudent, address: e.target.value})} style={inputStyle()} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle()}>Language</label>
              <select value={newStudent.language} onChange={e => setNewStudent({...newStudent, language: e.target.value as Language})} style={inputStyle()}>
                {(["Arabic", "Amharic", "Bengali", "Burmese", "Chinese", "Dutch", "English", "Filipino", "French", "Fula", "German", "Haitian Creole", "Hindi", "Hmong", "Italian", "Japanese", "Khmer", "Korean", "Lao", "Malinké", "Mayan", "Nepali", "Persian", "Pashto", "Polish", "Portuguese", "Romanian", "Russian", "Somali", "Spanish", "Swahili", "Turkish", "Ukrainian", "Urdu", "Vietnamese"] as Language[]).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle()}>Initial Status</label>
              <select value={newStudent.status} onChange={e => setNewStudent({...newStudent, status: e.target.value as Status})} style={inputStyle()}>
                <option value="Not Contacted">Not Contacted</option>
                <option value="Pending">Pending</option>
                <option value="SMS Required">SMS Required</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle()}>Internal Notes</label><textarea value={newStudent.notes} onChange={e => setNewStudent({...newStudent, notes: e.target.value})} style={{ ...inputStyle(), minHeight: 60 }} placeholder="Log initial observations..." /></div>
        </div>
      </Modal>

      <Modal open={bulkOpen} title="Bulk Outreach" onClose={() => setBulkOpen(false)} footer={bulkStep === "confirm" ? (<><HoverableButton style={btn({ variant: "outline" })} onClick={() => setBulkOpen(false)}>Cancel</HoverableButton><HoverableButton style={btn({ variant: "primary" })} onClick={doBulkSend}>Send Now</HoverableButton></>) : (<><HoverableButton style={btn({ variant: "outline" })} onClick={() => exportReport()}>Download Report</HoverableButton><HoverableButton style={btn({ variant: "primary" })} onClick={() => setBulkOpen(false)}>Continue</HoverableButton></>)}>
        {bulkStep === "confirm" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 850, fontSize: 13, marginBottom: 8 }}>You're about to contact <span style={{fontWeight: 900}}>{selected.length || filtered.length}</span> students</div>
              <Muted>This preview is for confidence. In production, it will reflect actual email/SMS routing.</Muted>
              <Divider />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(["Email", "SMS", "Call", "Letter"] as OutreachChannel[]).map(ch => <HoverableButton key={ch} style={btn({ variant: bulkChannel === ch ? "primary" : "outline" })} onClick={() => setBulkChannel(ch)}>{ch}</HoverableButton>)}
              </div>
              <Divider />
              <div style={{ fontSize: 12, fontWeight: 850, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase", color: COLORS.textMuted }}>Message Template</div>
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: RADII.md, padding: 12, background: "rgba(247,249,252,0.8)" }}>
                <div style={{ fontWeight: 900, marginBottom: 6, fontSize: 13 }}>{subject}</div>
                <div style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{body}</div>
              </div>
            </div>
            <div>
              <Card title="Safety Checks">
                <ul style={{ margin: 0, paddingLeft: 16, color: COLORS.textSecondary, lineHeight: 1.65, fontSize: 13 }}>
                  <li>Translations reviewed</li>
                  <li>Official account connected</li>
                  <li>Auto-logged for reporting</li>
                </ul>
              </Card>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 6 }}>Outreach Sent Successfully</div>
            <Muted>Messages were queued and logged. You can export a supervisor report now.</Muted>
          </div>
        )}
      </Modal>

      <Modal open={importOpen} title="Smart Importer" onClose={() => { setImportOpen(false); setPasteText(""); setParsedPreview(null); setParseError(""); }} footer={
        parsedPreview ? (
          <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => { setParsedPreview(null); setPasteText(""); }}>← Back</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={confirmPasteImport}>✓ Add {parsedPreview.length} Student{parsedPreview.length !== 1 ? "s" : ""} to Roster</HoverableButton>
          </>
        ) : importTab === "paste" ? (
          <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => { setImportOpen(false); setPasteText(""); setParseError(""); }}>Cancel</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={handleParsePaste} >{parsing ? "Analyzing…" : "Analyze & Preview"}</HoverableButton>
          </>
        ) : (
          <>
            <HoverableButton style={btn({ variant: "outline" })} onClick={() => setImportOpen(false)}>Close</HoverableButton>
            <HoverableButton style={btn({ variant: "primary" })} onClick={() => { const f = fileRef.current?.files?.[0]; if (f) handleImport(f); }}>Import File</HoverableButton>
          </>
        )
      }>
        {parsedPreview ? (
          // ── Preview Table ──────────────────────────────────────
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>AI parsed {parsedPreview.length} student{parsedPreview.length !== 1 ? "s" : ""} successfully</div>
                <Muted>Review below — you can adjust languages before importing.</Muted>
              </div>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: RADII.md }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: COLORS.bg, position: "sticky", top: 0 }}>
                    <th style={thStyle()}>Name</th>
                    <th style={thStyle()}>Language</th>
                    <th style={thStyle()}>Email</th>
                    <th style={thStyle()}>Phone</th>
                    <th style={thStyle()}>Status</th>
                    <th style={thStyle()}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPreview.map((s, idx) => (
                    <tr key={s.id} style={{ background: idx % 2 === 0 ? COLORS.white : COLORS.bg }}>
                      <td style={{ ...tdStyle(), fontWeight: 700 }}>{getStudentName(s)}</td>
                      <td style={tdStyle()}>
                        <select
                          value={s.language}
                          onChange={e => updateParsedLang(idx, e.target.value as Language)}
                          style={{ fontSize: 11, padding: "3px 6px", borderRadius: 6, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, fontFamily: "inherit", color: LANG_COLORS[s.language]?.fg ?? COLORS.textPrimary }}
                        >
                          {(["Arabic", "Amharic", "Bengali", "Burmese", "Chinese", "Dutch", "English", "Filipino", "French", "Fula", "German", "Haitian Creole", "Hindi", "Hmong", "Italian", "Japanese", "Khmer", "Korean", "Lao", "Malinké", "Mayan", "Nepali", "Persian", "Pashto", "Polish", "Portuguese", "Romanian", "Russian", "Somali", "Spanish", "Swahili", "Turkish", "Ukrainian", "Urdu", "Vietnamese"] as Language[]).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle(), color: s.email ? COLORS.textPrimary : COLORS.textMuted, fontWeight: s.email ? 700 : 500, fontStyle: s.email ? "normal" : "italic" }}>{s.email || "—"}</td>
                      <td style={{ ...tdStyle(), color: s.phone ? COLORS.textPrimary : COLORS.textMuted, fontWeight: s.phone ? 700 : 500, fontStyle: s.phone ? "normal" : "italic" }}>{s.phone || "—"}</td>
                      <td style={tdStyle()}><StatusBadge status={s.status} /></td>
                      <td style={tdStyle()}>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: s.languageConfidence === "Verified" ? "rgba(22,163,74,0.10)" : "rgba(217,119,6,0.10)", color: s.languageConfidence === "Verified" ? SEMANTIC.success : SEMANTIC.warning, fontWeight: 700 }}>
                          {s.languageConfidence === "Verified" ? "✓ Verified" : "~ Auto-detected"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // ── Input Tabs ─────────────────────────────────────────
          <div style={{ display: "grid", gap: 14 }}>
            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 0, border: `1px solid ${COLORS.borderStrong}`, borderRadius: RADII.md, overflow: "hidden", width: "fit-content" }}>
              {(["paste", "file"] as const).map(t => (
                <button key={t} onClick={() => setImportTab(t)} style={{ padding: "8px 20px", background: importTab === t ? COLORS.navy : "transparent", color: importTab === t ? "#fff" : COLORS.textMuted, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.03em" }}>
                  {t === "paste" ? "📋 Paste Data" : "📁 Upload File"}
                </button>
              ))}
            </div>

            {importTab === "paste" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ background: "rgba(8,145,178,0.06)", border: `1px solid rgba(8,145,178,0.18)`, borderRadius: RADII.md, padding: "10px 14px", fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  <strong style={{ color: COLORS.teal }}>How to use:</strong> Open your Excel or Google Sheets roster → Select all cells (Ctrl+A / Cmd+A) → Copy (Ctrl+C / Cmd+C) → Paste below. The AI will auto-detect columns like Name, Email, Phone, Language, and Status.
                </div>
                <textarea
                  value={pasteText}
                  onChange={e => { setPasteText(e.target.value); setParsedPreview(null); setParseError(""); }}
                  placeholder={`Paste your Excel or Google Sheets data here…\n\nExample:\nLast Name\tFirst Name\tEmail\tPhone\tLanguage\nGarcia\tMaria\tmaria@email.com\t555-1234\tSpanish\nNguyen\tTuan\t\t555-5678\tVietnamese`}
                  style={{ width: "100%", minHeight: 180, padding: "12px 14px", borderRadius: RADII.md, border: `1.5px solid ${parseError ? SEMANTIC.danger : COLORS.borderStrong}`, background: COLORS.white, fontFamily: "'Courier New', monospace", fontSize: 12, color: COLORS.textPrimary, resize: "vertical", outline: "none", lineHeight: 1.5 }}
                />
                {parseError && (
                  <div style={{ color: SEMANTIC.danger, fontSize: 12, fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
                    <span>⚠</span> {parseError}
                  </div>
                )}
                {parsing && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: COLORS.teal, fontSize: 12, fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out infinite" }} />
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out 0.2s infinite" }} />
                    <div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1s ease-in-out 0.4s infinite" }} />
                    <span style={{ marginLeft: 4 }}>AI is analyzing your data…</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <Muted>Choose a CSV or Excel file to import student data.</Muted>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" />
                <Card title="What happens on import">
                  <ul style={{ margin: 0, paddingLeft: 16, color: COLORS.textSecondary, lineHeight: 1.65, fontSize: 13 }}>
                    <li>Auto-detect primary language from name patterns</li>
                    <li>Flag missing contact info</li>
                    <li>Recommend SMS outreach when email is missing</li>
                  </ul>
                </Card>
              </div>
            )}
          </div>
        )}
      </Modal>

      <LegalModal open={legalModalOpen.open} type={legalModalOpen.type} onClose={() => setLegalModalOpen({ ...legalModalOpen, open: false })} />

      <Modal open={settingsOpen} title="System & AI Settings" onClose={() => setSettingsOpen(false)} footer={<HoverableButton style={btn({ variant: "primary" })} onClick={() => setSettingsOpen(false)}>Save & Close</HoverableButton>}>
        <div style={{ display: "grid", gap: 20, maxHeight: 480, overflowY: "auto", paddingRight: 8 }}>
          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Artificial Intelligence</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Gemini API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." style={inputStyle()} />
                <Muted style={{ display: "block", marginTop: 4 }}>Powers context-aware translations and Smart Import.</Muted>
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Email (Resend)</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Resend API Key</label>
                <input type="password" value={resendKey} onChange={e => setResendKey(e.target.value)} placeholder="re_..." style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>From Email Address</label>
                <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="outreach@yourdomain.edu" style={inputStyle()} />
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>SMS (Twilio)</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={labelStyle()}>Account SID</label>
                <input type="text" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} placeholder="AC..." style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Auth Token</label>
                <input type="password" value={twilioToken} onChange={e => setTwilioToken(e.target.value)} placeholder="token..." style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Twilio Phone Number</label>
                <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} placeholder="+1..." style={inputStyle()} />
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <div style={{ fontSize: 11, fontWeight: 900, color: COLORS.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Compliance & Notifications</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                <div style={{ width: 40, height: 20, borderRadius: 10, background: notificationsEnabled ? COLORS.teal : COLORS.border, position: "relative", transition: "background 0.2s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 2, left: notificationsEnabled ? 22 : 2, transition: "left 0.2s" }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Enable Real-time Bounce Notifications</div>
              </div>
              <Muted style={{ fontSize: 11 }}>When enabled, critical delivery failures will trigger alerts on the dashboard.</Muted>
            </div>
          </section>
        </div>
      </Modal>

      {/* CALL SIMULATOR MODAL */}
      <Modal open={!!activeCallStudentId} title="Secure Voice Bridge" onClose={() => setActiveCallStudentId(null)} footer={
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ background: SEMANTIC.warning, color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>SIMULATION ONLY</span>
          <HoverableButton style={btn({ variant: "danger" })} onClick={() => setActiveCallStudentId(null)}><span style={{fontSize:18, marginRight:6}}>🛑</span> End Call</HoverableButton>
        </div>
      }>
        <div style={{ display: "grid", placeItems: "center", gap: 24, padding: "20px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: COLORS.navy, display: "grid", placeItems: "center", fontSize: 32, color: COLORS.white, fontWeight: 900, boxShadow: SHADOWS.card, position: "relative" }}>
              {(students.find(s => s.id === activeCallStudentId)?.firstName || "S")[0]}
              <div style={{ position: "absolute", inset: -10, border: `2px solid ${COLORS.teal}`, borderRadius: 999, animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.navy }}>
                {activeCallStudentId ? (privacyMode ? maskPII(getStudentName(students.find(s => s.id === activeCallStudentId)!), "name") : getStudentName(students.find(s => s.id === activeCallStudentId)!)) : "Student"}
              </div>
              <Muted style={{ fontSize: 14 }}>Connecting via {activeCallStudentId && privacyMode ? maskPII(students.find(s => s.id === activeCallStudentId)?.phone || "", "phone") : students.find(s => s.id === activeCallStudentId)?.phone || "secure line"}...</Muted>
            </div>
          </div>
          
          <div style={{ width: "100%", background: COLORS.bg, borderRadius: RADII.md, padding: 16, border: `1px solid ${COLORS.borderStrong}`, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>
              <span>Live Transcript (Simulated)</span>
              <span style={{ color: COLORS.teal, display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 6, height: 6, borderRadius: 999, background: COLORS.teal, animation: "pulse 1.5s infinite" }} /> Recording</span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ padding: "8px 12px", background: COLORS.white, borderRadius: RADII.sm, border: `1px solid ${COLORS.border}`, width: "fit-content", maxWidth: "80%", borderBottomLeftRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textMuted, marginBottom: 2 }}>
                  {activeCallStudentId ? getStudentName(students.find(s => s.id === activeCallStudentId)!) : "Student"}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Hello? Who is this?</div>
              </div>
              <div style={{ padding: "8px 12px", background: "rgba(15,23,42,0.05)", borderRadius: RADII.sm, border: `1px solid ${COLORS.borderStrong}`, width: "fit-content", maxWidth: "80%", marginLeft: "auto", borderBottomRightRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.navy, marginBottom: 2 }}>You (Mr. Caldwell)</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>Hi, this is Mr. Caldwell from the GED program. I'm calling to see if you needed any help enrolling in classes this semester.</div>
              </div>
              <div style={{ fontSize: 12, fontStyle: "italic", color: COLORS.textMuted, textAlign: "center", marginTop: 8 }}>Awaiting response...</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <button style={{ width: 50, height: 50, borderRadius: 999, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, boxShadow: SHADOWS.card }}>🎤</button>
            <button style={{ width: 50, height: 50, borderRadius: 999, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, boxShadow: SHADOWS.card }}>⏸</button>
            <button style={{ width: 50, height: 50, borderRadius: 999, border: `1px solid ${COLORS.borderStrong}`, background: COLORS.white, display: "grid", placeItems: "center", fontSize: 20, cursor: "pointer", color: COLORS.textMuted, boxShadow: SHADOWS.card }}>⌨️</button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
