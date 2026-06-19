import Groq from "groq-sdk";

export interface ChartDataset {
  name: string;
  labels: string[];
  values: number[];
}

export interface SlideContent {
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  notes?: string;
  layout?: "title" | "content" | "image-right" | "image-left" | "two-column" | "big-stat" | "chart";
  leftColumn?: string[];
  rightColumn?: string[];
  imageQuery?: string;
  stat?: string;
  statLabel?: string;
  chartType?: "bar" | "pie" | "line";
  chartData?: ChartDataset[];
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

const SYSTEM_PROMPT = `You are a senior presentation designer for Vista Eye Specialist (ophthalmology clinic, Qualitas Health group).

Your job: turn the user's request and source data into a detailed, data-rich slide plan JSON.

STRICT RULES:
1. Return ONLY raw JSON — no markdown fences, no explanation, nothing else
2. ALWAYS use the actual numbers and names from the SOURCE DATA — do NOT invent placeholder text
3. Generate 7–10 slides with RICH, SPECIFIC content on every slide
4. Every bullet must be a complete, informative sentence with real data — NO vague filler like "Key metric here"
5. Every slide MUST have an "imageQuery" field (short vivid English phrase for Pexels stock search)
6. Include at least 2 chart slides if the source data contains numbers
7. Vary layouts — use all layout types across the deck

LAYOUT TYPES:
- "title"        → title + subtitle only (first slide)
- "content"      → 4–6 detailed bullet points
- "image-right"  → 4–5 bullets on left, photo on right
- "image-left"   → photo on left, 4–5 bullets on right
- "two-column"   → leftColumn[] and rightColumn[] (3–5 items each)
- "big-stat"     → one large number/KPI + statLabel + 3–4 supporting bullets
- "chart"        → bar/pie/line chart with real data from the source file

CHART SCHEMA (use real numbers from source data):
{
  "layout": "chart",
  "title": "Slide Title",
  "chartType": "bar",
  "chartData": [{ "name": "Series name", "labels": ["Label1","Label2"], "values": [42, 58] }],
  "bullets": ["Insight from the data", "Another observation"],
  "imageQuery": "data analytics medical"
}

FULL JSON SCHEMA:
{
  "title": "Full Presentation Title",
  "theme": { "primaryColor": "#1B9BD9", "secondaryColor": "#1B3A6B", "backgroundColor": "#FFFFFF", "accentColor": "#8DC63F", "fontTitle": "Calibri", "fontBody": "Calibri" },
  "slides": [
    { "layout": "title", "title": "...", "subtitle": "...", "imageQuery": "..." },
    { "layout": "content", "title": "...", "bullets": ["Full sentence with real data.", "..."], "imageQuery": "..." },
    { "layout": "chart", "title": "...", "chartType": "bar", "chartData": [{ "name": "...", "labels": ["..."], "values": [0] }], "bullets": ["Insight."], "imageQuery": "..." },
    { "layout": "big-stat", "title": "...", "stat": "98%", "statLabel": "Patient Satisfaction", "bullets": ["..."], "imageQuery": "..." },
    { "layout": "two-column", "title": "...", "leftColumn": ["..."], "rightColumn": ["..."], "imageQuery": "..." },
    { "layout": "image-right", "title": "...", "bullets": ["..."], "imageQuery": "..." }
  ]
}`;

function buildUserMessage(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): string {
  const sourceSection = sourceContent
    ? `SOURCE DATA (use ALL numbers and names exactly as they appear):\n${sourceContent.slice(0, 7000)}`
    : "No source data provided — generate plausible but clearly labelled example data.";

  return `USER REQUEST: ${prompt}

${sourceSection}

${referenceDescriptions.length > 0 ? `REFERENCE STYLE:\n${referenceDescriptions.join("\n")}` : ""}

Generate the complete JSON presentation plan now. Use real data from the source. Every bullet must be a full sentence with specific details.`;
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
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(prompt, sourceContent, referenceDescriptions) },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";
  return extractJson(text);
}

export async function describeReferenceFile(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fileBuffer);
    return `Reference PDF "${filename}":\n${data.text.slice(0, 2000)}`;
  }
  if (mimeType.startsWith("image/")) {
    return `Reference image "${filename}" — mirror its general layout style.`;
  }
  return `Reference file: ${filename}`;
}
