import { NextRequest, NextResponse } from "next/server";
import { generatePresentationPlan, describeReferenceFile } from "@/lib/generateSlides";
import { buildPptx } from "@/lib/buildPptx";
import { buildPdf } from "@/lib/buildPdf";
import { parseSourceFile } from "@/lib/parseSource";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    const outputFormat = (formData.get("format") as string) || "pptx";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const referenceFiles = formData.getAll("reference") as File[];
    const sourceFiles    = formData.getAll("source") as File[];

    // Parse all source files
    const sourceParts: string[] = [];
    for (const file of sourceFiles) {
      const buf  = Buffer.from(await file.arrayBuffer());
      const text = await parseSourceFile(buf, file.type, file.name);
      sourceParts.push(`--- ${file.name} ---\n${text}`);
    }
    const sourceContent = sourceParts.length > 0 ? sourceParts.join("\n\n") : null;

    // Describe reference files
    const referenceDescriptions: string[] = [];
    for (const file of referenceFiles) {
      const buf  = Buffer.from(await file.arrayBuffer());
      const desc = await describeReferenceFile(buf, file.type, file.name);
      if (desc) referenceDescriptions.push(desc);
    }

    // Generate plan via Groq
    const plan = await generatePresentationPlan(prompt, sourceContent, referenceDescriptions);

    // Build output (images fetched from Pexels inside builders)
    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (outputFormat === "pdf") {
      fileBuffer  = await buildPdf(plan);
      contentType = "application/pdf";
      filename    = `${plan.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    } else {
      fileBuffer  = await buildPptx(plan);
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      filename    = `${plan.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
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
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}
