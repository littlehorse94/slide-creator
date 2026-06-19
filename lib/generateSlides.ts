import Groq from "groq-sdk";

export interface SlideContent {
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  notes?: string;
  layout?: "title" | "content" | "image-left" | "image-right" | "two-column" | "big-stat";
  leftColumn?: string[];
  rightColumn?: string[];
  imageQuery?: string;        // Pexels search query for this slide
  stat?: string;              // For big-stat layout e.g. "98%"
  statLabel?: string;
}

export interface PresentationPlan {
  title: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    accentColor: string;
    fontTitle: string;
    fontBody: string;
  };
  slides: SlideContent[];
}

const SYSTEM_PROMPT = `You are an expert presentation designer for Vista Eye Specialist, a professional ophthalmology clinic under Qualitas Health.
Generate a structured JSON plan for a PowerPoint presentation.

RULES:
- Respond with valid JSON ONLY — no markdown, no code fences, no explanation
- Professional slides for a medical/corporate audience
- Vista brand colors: primary #1B9BD9, dark navy #1B3A6B, accent green #8DC63F
- Generate 6–12 slides
- Use source data accurately when provided
- Every slide MUST include an "imageQuery" field: a short, vivid English phrase for Pexels stock photo search (e.g. "modern eye clinic interior", "ophthalmologist examining patient", "medical team meeting")
- Vary the layouts — use a mix of content, image-right, image-left, two-column, and big-stat

LAYOUT TYPES:
- "title"        → opening slide (title + subtitle)
- "content"      → text/bullets only
- "image-right"  → bullets on left, full photo on right half
- "image-left"   → full photo on left half, bullets on right
- "two-column"   → leftColumn[] and rightColumn[] side by side
- "big-stat"     → large centered number/stat with a label and supporting bullets

JSON SCHEMA:
{
  "title": "Presentation Title",
  "theme": {
    "primaryColor": "#1B9BD9",
    "secondaryColor": "#1B3A6B",
    "backgroundColor": "#FFFFFF",
    "accentColor": "#8DC63F",
    "fontTitle": "Calibri",
    "fontBody": "Calibri"
  },
  "slides": [
    { "layout": "title",       "title": "...", "subtitle": "...", "imageQuery": "eye specialist clinic reception" },
    { "layout": "image-right", "title": "...", "bullets": ["..."], "imageQuery": "ophthalmologist patient consultation", "notes": "..." },
    { "layout": "big-stat",    "title": "...", "stat": "98%", "statLabel": "Patient satisfaction", "bullets": ["supporting point"], "imageQuery": "happy medical patient" },
    { "layout": "two-column",  "title": "...", "leftColumn": ["..."], "rightColumn": ["..."], "imageQuery": "medical team" }
  ]
}`;

function buildUserMessage(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): string {
  return `Create a presentation based on:

USER REQUEST: ${prompt}

${sourceContent ? `SOURCE DATA:\n${sourceContent.slice(0, 6000)}` : "No source data provided."}

${referenceDescriptions.length > 0 ? `REFERENCE STYLE:\n${referenceDescriptions.join("\n")}` : ""}

Respond with the JSON only.`;
}

function extractJson(text: string): PresentationPlan {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
  return JSON.parse(text.slice(start, end + 1)) as PresentationPlan;
}

export async function generatePresentationPlan(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): Promise<PresentationPlan> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    max_tokens: 8000,
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(prompt, sourceContent, referenceDescriptions) },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return extractJson(text);
}

// Reference image description — text-only since Groq free tier is text only
export async function describeReferenceFile(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fileBuffer);
    return `Reference PDF "${filename}" content:\n${data.text.slice(0, 2000)}`;
  }
  if (mimeType.startsWith("image/")) {
    return `Reference image uploaded: "${filename}". Mirror its general layout — keep slides clean, structured, and professional.`;
  }
  return `Reference file: ${filename}`;
}
