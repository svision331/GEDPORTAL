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
      const isMissingInfo = !s.email || !s.phone;
      const isNotContacted = s.status === "Not Contacted";
      return {
        studentId: s.id,
        score: isNotContacted ? 75 : isMissingInfo ? 45 : 15,
        level: isNotContacted ? "High" : isMissingInfo ? "Medium" : "Low",
        reason: isNotContacted ? "Missing initial contact" : isMissingInfo ? "Incomplete contact profile" : "Healthy engagement",
        recommendation: isNotContacted ? "Send introductory email" : isMissingInfo ? "Request missing contact info" : "Maintain schedule"
      };
    }) as RiskAssessment[];
  }
  return await predictRisk(students, apiKey);
}
