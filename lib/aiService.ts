import { Language, Student } from "@/components/EducatorOutreachPortal";

export async function translateText(text: string, langName: string, langCode: string, apiKey: string): Promise<string> {
  if (!text.trim()) return "";
  
  const useLLM = apiKey && apiKey.length > 10;
  
  try {
    if (useLLM) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `You are a professional educational translator. Translate the following English message to ${langName}. Preserve the exact tone (whether encouraging, urgent, or neutral). DO NOT translate or modify the smart tags {Student_Name} and {Program_Name}, leave them exactly as is. Output ONLY the translated text, with no markdown formatting or extra commentary.\n\nMessage:\n${text}`;
      
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    } else {
      // Fallback
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`;
      const res = await fetchWithTimeout(url, { method: "GET" }, 5000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.responseData?.translatedText ?? text;
    }
  } catch (e) {
    console.error("Translation error:", e);
    return text; // graceful fallback to English
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function parseRawPasteLLM(raw: string, apiKey: string): Promise<Student[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are an expert data parser. The following text is raw pasted data from a spreadsheet containing student information.
Parse the data and extract a list of students. For each student, determine their primary language based on their name (use heuristics, e.g., Hispanic names -> Spanish, Chinese -> Chinese, etc.). If unsure, default to English. Set languageConfidence to "Auto-detected".
Status should be mapped to one of: "Not Contacted", "Pending", "Sent", "Responded", "SMS Required", "Unreachable". Default to "Not Contacted".

Return the result STRICTLY as a JSON array of objects with the following keys:
- id (generate a unique string like "import-xxx")
- name (string, formatted properly)
- language (must be one of the supported languages, e.g., Spanish, French, Chinese, English, etc.)
- status (string)
- email (string or null)
- phone (string or null)
- languageConfidence ("Auto-detected")

Do NOT include any markdown formatting or \`\`\`json blocks. Output only the raw JSON array.

Raw Data:
${raw}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  
  try {
    // Strip markdown formatting if the LLM included it by mistake
    const cleanJson = textOutput.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    throw new Error("Failed to parse LLM output as JSON");
  }
}

export type RiskAssessment = {
  studentId: string;
  score: number; // 0-100
  level: "High" | "Medium" | "Low";
  reason: string;
  recommendation: string;
};

export async function predictRisk(students: Student[], apiKey: string): Promise<RiskAssessment[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are a specialized educational risk assessment agent. Analyze the following student roster and identify students who are at risk of being lost or unreachable.
Factors to consider: Missing contact info, "Not Contacted" status, specific language barriers, and manual notes.

Return a JSON array of objects with these keys:
- studentId (string, matching the input)
- score (number, 0-100 where 100 is critical risk)
- level ("High", "Medium", "Low")
- reason (string, concise)
- recommendation (string, specific outreach action)

Do NOT include any markdown formatting or code blocks. Output ONLY the raw JSON array.

Student Data:
${JSON.stringify(students.map(s => ({ id: s.id, name: s.name, status: s.status, language: s.language, email: !!s.email, phone: !!s.phone })))}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  
  try {
    const cleanJson = textOutput.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    return students.map(s => {
      const isCritical = s.status === "Not Contacted";
      const isWarn = s.status === "Pending" || (!s.email && !s.phone);
      return {
        studentId: s.id,
        score: isCritical ? 85 : isWarn ? 50 : 15,
        level: isCritical ? "High" : isWarn ? "Medium" : "Low",
        reason: "Heuristic fallback (data patterns)",
        recommendation: isCritical ? "Priority outreach" : "Check details"
      };
    });
  }
}
