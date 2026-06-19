import PptxGenJS from "pptxgenjs";
import { PresentationPlan, SlideContent } from "./generateSlides";
import fs from "fs";
import path from "path";

const VISTA_BLUE = "#1B9BD9";
const DARK_BLUE = "#1B3A6B";
const ACCENT_GREEN = "#8DC63F";
const WHITE = "#FFFFFF";
const LIGHT_GRAY = "#F5F7FA";

function logoPath(name: string): string {
  return path.join(process.cwd(), "public", "logos", name);
}

function logoExists(name: string): boolean {
  return fs.existsSync(logoPath(name));
}

function addLogos(slide: PptxGenJS.Slide) {
  const vistaExists = logoExists("vista-logo.png");
  const qualitasExists = logoExists("qualitas-logo.png");

  const logoH = 0.35;
  const logoW = 1.3;
  const logoY = 7.1;
  const padding = 0.15;

  if (vistaExists) {
    slide.addImage({
      path: logoPath("vista-logo.png"),
      x: padding,
      y: logoY,
      w: logoW,
      h: logoH,
      sizing: { type: "contain", w: logoW, h: logoH },
    });
  } else {
    slide.addText("VISTA eye specialist", {
      x: padding,
      y: logoY,
      w: logoW,
      h: logoH,
      fontSize: 7,
      color: DARK_BLUE,
      bold: true,
    });
  }

  if (qualitasExists) {
    slide.addImage({
      path: logoPath("qualitas-logo.png"),
      x: 10 - logoW - padding,
      y: logoY,
      w: logoW,
      h: logoH,
      sizing: { type: "contain", w: logoW, h: logoH },
    });
  } else {
    slide.addText("QUALITAS health", {
      x: 10 - logoW - padding,
      y: logoY,
      w: logoW,
      h: logoH,
      fontSize: 7,
      color: DARK_BLUE,
      bold: true,
      align: "right",
    });
  }

  // Thin separator line above logos
  slide.addShape("line" as PptxGenJS.ShapeType, {
    x: 0.15,
    y: logoY - 0.05,
    w: 9.7,
    h: 0,
    line: { color: VISTA_BLUE, width: 0.5 },
  });
}

function addTitleSlide(pptx: PptxGenJS, slide: SlideContent, theme: PresentationPlan["theme"]) {
  const s = pptx.addSlide();

  // Gradient-style background using shapes
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 7.5,
    fill: { color: DARK_BLUE },
  });
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 4.8, w: 10, h: 2.7,
    fill: { color: VISTA_BLUE },
  });
  // Decorative accent bar
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 4.75, w: 10, h: 0.08,
    fill: { color: ACCENT_GREEN },
  });

  s.addText(slide.title, {
    x: 0.8, y: 1.8, w: 8.4, h: 2,
    fontSize: 36,
    bold: true,
    color: WHITE,
    align: "left",
    fontFace: "Calibri",
    wrap: true,
  });

  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.8, y: 3.9, w: 8.4, h: 0.8,
      fontSize: 18,
      color: LIGHT_GRAY,
      align: "left",
      fontFace: "Calibri",
    });
  }

  // Logos on dark bg - use text fallback adjusted for dark
  addLogosOnDark(s);
}

function addLogosOnDark(slide: PptxGenJS.Slide) {
  const logoH = 0.35;
  const logoW = 1.3;
  const logoY = 7.1;
  const padding = 0.15;

  if (logoExists("vista-logo.png")) {
    slide.addImage({
      path: logoPath("vista-logo.png"),
      x: padding, y: logoY, w: logoW, h: logoH,
      sizing: { type: "contain", w: logoW, h: logoH },
    });
  } else {
    slide.addText("VISTA eye specialist", {
      x: padding, y: logoY, w: logoW, h: logoH,
      fontSize: 7, color: WHITE, bold: true,
    });
  }

  if (logoExists("qualitas-logo.png")) {
    slide.addImage({
      path: logoPath("qualitas-logo.png"),
      x: 10 - logoW - padding, y: logoY, w: logoW, h: logoH,
      sizing: { type: "contain", w: logoW, h: logoH },
    });
  } else {
    slide.addText("QUALITAS health", {
      x: 10 - logoW - padding, y: logoY, w: logoW, h: logoH,
      fontSize: 7, color: WHITE, bold: true, align: "right",
    });
  }

  slide.addShape("line" as PptxGenJS.ShapeType, {
    x: 0.15, y: logoY - 0.05, w: 9.7, h: 0,
    line: { color: WHITE, width: 0.5 },
  });
}

function addContentSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 7.5,
    fill: { color: WHITE },
  });
  // Header bar
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_BLUE },
  });
  // Accent stripe
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 1.1, w: 10, h: 0.06,
    fill: { color: ACCENT_GREEN },
  });

  s.addText(slide.title, {
    x: 0.4, y: 0.12, w: 9.2, h: 0.85,
    fontSize: 24,
    bold: true,
    color: WHITE,
    fontFace: "Calibri",
    align: "left",
  });

  let contentY = 1.4;

  if (slide.body) {
    s.addText(slide.body, {
      x: 0.4, y: contentY, w: 9.2, h: 0.8,
      fontSize: 14,
      color: "#333333",
      fontFace: "Calibri",
      wrap: true,
    });
    contentY += 0.9;
  }

  if (slide.bullets && slide.bullets.length > 0) {
    const bulletTexts = slide.bullets.map((b) => ({
      text: b,
      options: {
        bullet: { type: "bullet" as const },
        fontSize: 16,
        color: "#222222",
        fontFace: "Calibri",
        paraSpaceAfter: 6,
      },
    }));
    s.addText(bulletTexts, {
      x: 0.5, y: contentY, w: 9, h: 5.5 - contentY,
      fontFace: "Calibri",
      fontSize: 16,
      color: "#222222",
      valign: "top",
      wrap: true,
    });
  }

  addLogos(s);
}

function addTwoColumnSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 7.5,
    fill: { color: WHITE },
  });
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_BLUE },
  });
  s.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: 1.1, w: 10, h: 0.06,
    fill: { color: ACCENT_GREEN },
  });

  s.addText(slide.title, {
    x: 0.4, y: 0.12, w: 9.2, h: 0.85,
    fontSize: 24, bold: true, color: WHITE, fontFace: "Calibri",
  });

  const left = slide.leftColumn ?? [];
  const right = slide.rightColumn ?? [];

  if (left.length > 0) {
    s.addText(
      left.map((b) => ({
        text: b,
        options: { bullet: { type: "bullet" as const }, fontSize: 14, color: "#222222", fontFace: "Calibri", paraSpaceAfter: 4 },
      })),
      { x: 0.4, y: 1.35, w: 4.4, h: 5.6, valign: "top", wrap: true }
    );
  }

  // Divider
  s.addShape("line" as PptxGenJS.ShapeType, {
    x: 5, y: 1.35, w: 0, h: 5.6,
    line: { color: VISTA_BLUE, width: 1 },
  });

  if (right.length > 0) {
    s.addText(
      right.map((b) => ({
        text: b,
        options: { bullet: { type: "bullet" as const }, fontSize: 14, color: "#222222", fontFace: "Calibri", paraSpaceAfter: 4 },
      })),
      { x: 5.2, y: 1.35, w: 4.4, h: 5.6, valign: "top", wrap: true }
    );
  }

  addLogos(s);
}

export async function buildPptx(plan: PresentationPlan): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Vista Eye Specialist";
  pptx.company = "Qualitas Health";
  pptx.title = plan.title;

  for (const slide of plan.slides) {
    switch (slide.layout) {
      case "title":
        addTitleSlide(pptx, slide, plan.theme);
        break;
      case "two-column":
        addTwoColumnSlide(pptx, slide);
        break;
      default:
        addContentSlide(pptx, slide);
    }
  }

  const result = await pptx.write({ outputType: "nodebuffer" });
  return result as Buffer;
}
