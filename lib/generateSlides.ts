import { GoogleGenerativeAI, Part } from "@google/generative-ai";

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
  layout?: "title" | "content" | "image-right" | "image-left" | "two-column" | "big-stat" | "chart";
  leftColumn?: string[];
  rightColumn?: string[];
  imageQuery?: string;
  stat?: string;
  statLabel?: string;
  chartType?: "bar" | "pie" | "line";
  chartData?: ChartDataset[];
  notes?: string;
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

const SYSTEM_PROMPT = `You are a senior data presentation specialist for Vista Eye Specialist (ophthalmology clinic under Qualitas Health, Malaysia).

Transform the user's request and source data into a complete, accurate, professional slide deck plan in JSON.

CRITICAL RULES — follow every one:
1. Output ONLY raw JSON. No markdown, no code fences, no comments.
2. Extract EVERY number, name, date, and metric from the SOURCE DATA. Use them verbatim.
3. Do NOT invent data. If a number isn't in the source, say "Not provided" rather than guessing.
4. Generate 8–12 slides with DENSE, SPECIFIC content.
5. Every bullet must be a complete sentence containing actual data from the source (e.g. "Total screenings in June: 142 patients across 3 clinics").
6. Add at least 2 "chart" slides using REAL numbers extracted from the source data.
7. Vary layouts across all types.
8. Every slide needs an "imageQuery" (vivid English phrase for stock photo search, e.g. "ophthalmologist examining patient retina").

LAYOUT TYPES:
- "title"        → opening slide, title + subtitle only
- "content"      → 5–7 detailed bullet points with real data
- "image-right"  → 4–5 bullets on left, photo fills right half
- "image-left"   → photo fills left half, 4–5 bullets on right
- "two-column"   → leftColumn[] vs rightColumn[] (4 items each, label: value format)
- "big-stat"     → one large KPI number + label + 3 supporting bullets
- "chart"        → bar/pie/line chart with real extracted numbers + 3 insight bullets

JSON SCHEMA (return exactly this structure):
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
    {
      "layout": "title",
      "title": "Exact title",
      "subtitle": "Subtitle with date/context",
      "imageQuery": "modern eye clinic reception"
    },
    {
      "layout": "chart",
      "title": "Monthly Patient Volume",
      "chartType": "bar",
      "chartData": [{"name": "Patients", "labels": ["Jan","Feb","Mar"], "values": [120, 145, 138]}],
      "bullets": ["January had the highest volume at 120 patients.", "March saw a 5% drop from February."],
      "imageQuery": "medical data analytics dashboard"
    },
    {
      "layout": "big-stat",
      "title": "Overall Referral Rate",
      "stat": "34%",
      "statLabel": "Referred for follow-up",
      "bullets": ["34 out of 100 screened patients required follow-up.", "Glaucoma suspects accounted for 12%."],
      "imageQuery": "eye doctor patient consultation"
    }
  ]
}`;

function extractJson(text: string): PresentationPlan {
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in AI response");
  return JSON.parse(text.slice(start, end + 1)) as PresentationPlan;
}

export async function generatePresentationPlan(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): Promise<PresentationPlan> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const userMessage = `USER REQUEST: ${prompt}

${sourceContent
  ? `SOURCE DATA — extract every number and name exactly:\n${sourceContent.slice(0, 8000)}`
  : "No source data provided. Generate clearly labelled example data relevant to the request."}

${referenceDescriptions.length > 0 ? `STYLE REFERENCE:\n${referenceDescriptions.join("\n")}` : ""}

Now output the complete JSON presentation plan. Use only real data from the source above.`;

  const result = await model.generateContent(userMessage);
  const text   = result.response.text();
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
    // Use Gemini vision to describe reference image
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

    const imagePart: Part = {
      inlineData: { data: fileBuffer.toString("base64"), mimeType: mimeType as "image/png" | "image/jpeg" | "image/webp" },
    };
    const result = await model.generateContent([
      imagePart,
      "Describe the layout, color scheme, font style, and overall design of this presentation slide so I can recreate the same style.",
    ]);
    return result.response.text();
  }

  return `Reference file: ${filename}`;
}
