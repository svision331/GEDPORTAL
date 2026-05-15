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
    return students.map(s => ({
      studentId: s.id,
      score: s.status === "Not Contacted" ? 75 : 15,
      level: s.status === "Not Contacted" ? "High" : "Low",
      reason: "Missing initial contact",
      recommendation: "Send introductory email"
    })) as RiskAssessment[];
  }
  return await predictRisk(students, apiKey);
}
