import { NextRequest, NextResponse } from "next/server";
import { generatePresentationPlan } from "@/lib/generateSlides";
import { buildPptx } from "@/lib/buildPptx";
import { buildPdf } from "@/lib/buildPdf";
import { parseSourceFile } from "@/lib/parseSource";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

async function describeReference(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const client = new Anthropic();

  if (mimeType.startsWith("image/")) {
    const base64 = fileBuffer.toString("base64");
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Describe the layout, style, color scheme, and structure of this slide/presentation reference image so I can replicate the design.",
            },
          ],
        },
      ],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  if (mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fileBuffer);
    return `Reference PDF content (first 2000 chars): ${data.text.slice(0, 2000)}`;
  }

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const outputFormat = (formData.get("format") as string) || "pptx";
    const referenceFile = formData.get("reference") as File | null;
    const sourceFile = formData.get("source") as File | null;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Parse source file
    let sourceContent: string | null = null;
    if (sourceFile) {
      const sourceBuffer = Buffer.from(await sourceFile.arrayBuffer());
      sourceContent = await parseSourceFile(
        sourceBuffer,
        sourceFile.type,
        sourceFile.name
      );
    }

    // Describe reference file
    let referenceDescription: string | null = null;
    if (referenceFile) {
      const refBuffer = Buffer.from(await referenceFile.arrayBuffer());
      referenceDescription = await describeReference(refBuffer, referenceFile.type);
    }

    // Generate presentation plan via Claude
    const plan = await generatePresentationPlan(
      prompt,
      sourceContent,
      referenceDescription
    );

    // Build the output file
    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (outputFormat === "pdf") {
      fileBuffer = await buildPdf(plan);
      contentType = "application/pdf";
      filename = `${plan.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    } else {
      fileBuffer = await buildPptx(plan);
      contentType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      filename = `${plan.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
    }

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Slide-Plan": encodeURIComponent(JSON.stringify(plan)),
      },
    });
  } catch (err: any) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}
