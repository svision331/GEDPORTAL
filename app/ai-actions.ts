import { translateText as translate, parseRawPasteLLM as parse, predictRisk, RiskAssessment } from "@/lib/aiService";
import { getSetting } from "./actions";
import { Student } from "@/components/EducatorOutreachPortal";

export async function translateViaAI(text: string, langName: string, langCode: string) {
  const dbKey = await getSetting("ag_gemini_api_key");
  const apiKey = dbKey || process.env.GEMINI_API_KEY || "";
  return await translate(text, langName, langCode, apiKey);
}

export async function parseViaAI(raw: string) {
  const dbKey = await getSetting("ag_gemini_api_key");
  const apiKey = dbKey || process.env.GEMINI_API_KEY || "";
  return await parse(raw, apiKey);
}

export async function getRiskAssessment(students: Student[]) {
  const dbKey = await getSetting("ag_gemini_api_key");
  const apiKey = dbKey || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    // Fallback heuristic if no API key
    return students.map(s => {
      let level: "High" | "Medium" | "Low" = "Low";
      let score = 15;
      let reason = "Contact history stable";
      let recommendation = "Maintain schedule";

      if (s.status === "Not Contacted") {
        level = "High";
        score = 85;
        reason = "Initial outreach missing";
        recommendation = "Send welcome message";
      } else if (s.status === "Pending" || (!s.email && !!s.phone)) {
        level = "Medium";
        score = 45;
        reason = "Follow-up required / limited contact data";
        recommendation = "Verify email or call student";
      }

      return { studentId: s.id, score, level, reason, recommendation };
    }) as RiskAssessment[];
  }
  return await predictRisk(students, apiKey);
}
