import Anthropic from "@anthropic-ai/sdk";

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

export async function generatePresentationPlan(
  prompt: string,
  sourceContent: string | null,
  referenceDescription: string | null
): Promise<PresentationPlan> {
  const client = new Anthropic();

  const systemPrompt = `You are an expert presentation designer for Vista Eye Specialist, a professional ophthalmology clinic under Qualitas Health group.
Your task is to generate a structured JSON plan for a PowerPoint presentation.

Rules:
- Always respond with valid JSON only, no markdown or explanation
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

  const userMessage = `Create a presentation based on the following:

USER PROMPT: ${prompt}

${sourceContent ? `SOURCE DATA:\n${sourceContent.slice(0, 8000)}` : "No source data provided."}

${referenceDescription ? `REFERENCE STYLE: ${referenceDescription}` : ""}

Generate a complete, professional presentation plan as JSON.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: userMessage }],
    system: systemPrompt,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as PresentationPlan;
}
