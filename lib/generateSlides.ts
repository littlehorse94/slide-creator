import Anthropic from "@anthropic-ai/sdk";
import { Ollama } from "ollama";

export interface SlideContent {
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  notes?: string;
  layout?: "title" | "content" | "two-column" | "image" | "blank";
  leftColumn?: string[];
  rightColumn?: string[];
  imageDescription?: string;
  theme?: {
    background?: string;
    titleColor?: string;
    bodyColor?: string;
    accent?: string;
  };
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

const SYSTEM_PROMPT = `You are an expert presentation designer for Vista Eye Specialist, a professional ophthalmology clinic under Qualitas Health group.
Your task is to generate a structured JSON plan for a PowerPoint presentation.

Rules:
- Always respond with valid JSON only, no markdown, no explanation, no code fences
- Create professional, clean slides suitable for a medical/corporate audience
- Use Vista's brand colors: primary blue #1B9BD9, secondary dark blue #1B3A6B, accent green #8DC63F
- Each slide must have a clear title and well-organized content
- Generate 5-15 slides depending on the content
- If source data is provided, use it accurately in the slides
- If a reference description is provided, match that style/structure

Return this exact JSON structure:
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
      "title": "Main Title",
      "subtitle": "Subtitle text",
      "notes": "Speaker notes"
    },
    {
      "layout": "content",
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "body": "Optional paragraph text",
      "notes": "Speaker notes"
    }
  ]
}

Layout types: "title" (opening slide), "content" (bullets/text), "two-column" (leftColumn[], rightColumn[]), "blank"`;

function buildUserMessage(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): string {
  return `Create a presentation based on the following:

USER REQUEST: ${prompt}

${sourceContent ? `SOURCE DATA:\n${sourceContent.slice(0, 8000)}` : "No source data provided."}

${referenceDescriptions.length > 0 ? `REFERENCE STYLE NOTES:\n${referenceDescriptions.join("\n\n")}` : ""}

Generate a complete, professional presentation plan as JSON only.`;
}

function extractJson(text: string): PresentationPlan {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Find the first { ... } block in case the model added extra text
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(cleaned.slice(start, end + 1)) as PresentationPlan;
}

async function generateWithClaude(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): Promise<PresentationPlan> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(prompt, sourceContent, referenceDescriptions),
      },
    ],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return extractJson(text);
}

async function generateWithOllama(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): Promise<PresentationPlan> {
  const host = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  const ollama = new Ollama({ host });

  const response = await ollama.chat({
    model,
    options: { num_predict: 8000, temperature: 0.3 },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(prompt, sourceContent, referenceDescriptions) },
    ],
    stream: false,
  });

  const text = response.message.content;
  return extractJson(text);
}

export async function generatePresentationPlan(
  prompt: string,
  sourceContent: string | null,
  referenceDescriptions: string[]
): Promise<PresentationPlan> {
  const provider = process.env.AI_PROVIDER || "ollama";

  if (provider === "claude") {
    return generateWithClaude(prompt, sourceContent, referenceDescriptions);
  }
  return generateWithOllama(prompt, sourceContent, referenceDescriptions);
}

// Describe a reference image using vision model or Claude
export async function describeReferenceImage(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const provider = process.env.AI_PROVIDER || "ollama";

  if (provider === "claude" && mimeType.startsWith("image/")) {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                data: fileBuffer.toString("base64"),
              },
            },
            { type: "text", text: "Describe the layout, style, color scheme, and structure of this slide or presentation image so I can replicate the design." },
          ],
        },
      ],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  if (provider === "ollama" && mimeType.startsWith("image/")) {
    const host = process.env.OLLAMA_HOST || "http://localhost:11434";
    const visionModel = process.env.OLLAMA_VISION_MODEL || process.env.OLLAMA_MODEL || "llama3.2-vision";
    const ollama = new Ollama({ host });

    try {
      const response = await ollama.chat({
        model: visionModel,
        messages: [
          {
            role: "user",
            content: "Describe the layout, style, color scheme, and structure of this slide or presentation image so I can replicate the design.",
            images: [fileBuffer.toString("base64")],
          },
        ],
        stream: false,
      });
      return response.message.content;
    } catch {
      // Vision model unavailable — return filename as hint
      return `Reference file: ${filename} (vision analysis unavailable — no vision model loaded in Ollama)`;
    }
  }

  // For PDFs, extract text
  if (mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fileBuffer);
    return `Reference PDF content: ${data.text.slice(0, 2000)}`;
  }

  return `Reference file uploaded: ${filename}`;
}
