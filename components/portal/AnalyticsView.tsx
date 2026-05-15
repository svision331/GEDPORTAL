"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { COLORS, SEMANTIC, SHADOWS, RADII, STATUS_CONFIG, Student, Status, getStudentName } from "./types";


function AnalyticsView({ students, onFilterStatus, privacyMode, maskPII }: { students: Student[]; onFilterStatus: (s: Status) => void; privacyMode: boolean; maskPII: any }) {
  const [riskData, setRiskData] = useState<RiskAssessment[]>([]);
  const [loadingRisk, setLoadingRisk] = useState(false);

  useEffect(() => {
    async function fetchRisk() {
      setLoadingRisk(true);
      try {
        const data = await getRiskAssessment(students);
        setRiskData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRisk(false);
      }
    }
    fetchRisk();
  }, [students]);

  const total = students.length;
  const contacted = students.filter(s => s.status === "Sent" || s.status === "Responded").length;
  const responded = students.filter(s => s.status === "Responded").length;
  const responseRate = total ? Math.round((responded / total) * 100) : 0;
  const unreachable = students.filter(s => s.status === "Unreachable" || (!s.email && !s.phone)).length;
  
  const byLang = useMemo(() => {
    const map = new Map<Language, { total: number; contacted: number }>();
    students.forEach(s => { const cur = map.get(s.language) || { total: 0, contacted: 0 }; cur.total += 1; if (s.status === "Sent" || s.status === "Responded") cur.contacted += 1; map.set(s.language, cur); });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [students]);

  const chartData = useMemo(() => {
    return byLang.map(([lang, stats]) => ({
      name: lang,
      Contacted: stats.contacted,
      Pending: stats.total - stats.contacted,
      Total: stats.total
    }));
  }, [byLang]);

  const pieData = useMemo(() => {
    const counts = { "Not Contacted": 0, "Pending": 0, "Sent": 0, "Responded": 0, "SMS Required": 0, "Unreachable": 0 };
    students.forEach(s => counts[s.status as keyof typeof counts]++);
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }));
  }, [students]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Outreach Analytics" right={<Chip label="Last 30 days" />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <Metric title="Total Students" value={total} sub="In scope" trend="+2%" />
          <Metric title="Contacted" value={contacted} sub="Sent + Responded" trend="+12%" />
          <Metric 
            title="Response Rate" 
            value={responseRate} 
            sub={responseRate < 10 ? "Requires attention" : "Percent responded"} 
            tone={responseRate < 10 ? "danger" : responseRate < 30 ? "warning" : "success"}
            trend={responseRate > 20 ? "+4%" : "-1%"}
          />
          <Metric title="Responded" value={responded} sub="Replies received" trend="+8%" />
          <Metric title="Unreachable" value={unreachable} sub="Invalid/missing contact" trend="-3%" />
        </div>
      </Card>
      
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        <Card title="Contact Progress by Language">
          <div style={{ height: 320, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.borderStrong} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(31,58,95,0.04)' }} 
                  contentStyle={{ borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.card }}
                  formatter={(val: any, name: any, props: any) => [`${val} (${Math.round((Number(val)||0)/(Number(props.payload.Total)||1) * 100)}%)`, name]}
                />
                <Bar dataKey="Contacted" stackId="a" fill={COLORS.teal} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill={COLORS.navyLight} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Status Distribution">
          <div style={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={100} 
                  paddingAngle={2} 
                  dataKey="value"
                  onClick={(data) => onFilterStatus(data.name as Status)}
                  style={{ cursor: "pointer" }}
                >
                  {pieData.map((entry, index) => {
                    const cfg = STATUS_CONFIG[entry.name as Status];
                    return <Cell key={`cell-${index}`} fill={cfg?.dot || COLORS.navy} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, boxShadow: SHADOWS.card }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", fontSize: 10, color: COLORS.textMuted, marginBottom: 8 }}>Click segment to filter roster</div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              {pieData.map(d => (
                <button 
                  key={d.name} 
                  onClick={() => onFilterStatus(d.name as Status)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 4, transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.chipBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: STATUS_CONFIG[d.name as Status]?.dot || COLORS.navy }} />
                  {d.name} ({d.value})
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="AI Predictive Risk Assessment" right={loadingRisk ? <Chip label="Analyzing..." /> : <Chip label="Intelligence Active" color={COLORS.teal} />}>
        <div style={{ display: "grid", gap: 12 }}>
          <Muted>AI-driven identification of students at high risk of disengagement based on contact patterns and data completeness.</Muted>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {riskData.slice(0, 6).map(risk => {
              const student = students.find(s => s.id === risk.studentId);
              if (!student) return null;
              const color = risk.level === "High" ? SEMANTIC.danger : risk.level === "Medium" ? SEMANTIC.warning : SEMANTIC.success;
              return (
                <div key={risk.studentId} style={{ padding: 16, borderRadius: RADII.md, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{privacyMode ? maskPII(getStudentName(student), "name") : getStudentName(student)}</div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: color + "15", color: color, fontWeight: 900, textTransform: "uppercase" }}>{risk.level} Risk</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 }}>{risk.reason}</div>
                  <div style={{ padding: 8, borderRadius: 8, background: COLORS.bg, fontSize: 11, fontWeight: 700, borderLeft: `3px solid ${COLORS.teal}` }}>
                    💡 Rec: {risk.recommendation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
