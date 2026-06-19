import PptxGenJS from "pptxgenjs";
import { PresentationPlan, SlideContent } from "./generateSlides";
import { fetchPexelsPhoto, downloadImageAsBase64 } from "./pexels";
import fs from "fs";
import path from "path";

// ── Brand colors (without #) ────────────────────────────────────
const C = {
  navy:   "1B3A6B",
  blue:   "1B9BD9",
  green:  "8DC63F",
  white:  "FFFFFF",
  light:  "F0F6FB",
  dark:   "111827",
  muted:  "4B5563",
  gray:   "E5EDF5",
};

// Slide dimensions (LAYOUT_WIDE = 10 × 7.5 inches)
const W = 10, H = 7.5;
const FOOTER_Y = 6.95;
const FOOTER_H = 0.55;
const LOGO_W = 1.4, LOGO_H = 0.35;

// ── Helpers ─────────────────────────────────────────────────────
function logoPath(name: string) { return path.join(process.cwd(), "public", "logos", name); }
function logoExists(name: string) { return fs.existsSync(logoPath(name)); }

function addFooter(slide: PptxGenJS.Slide, dark = false) {
  const bg    = dark ? C.navy : C.light;
  const line  = dark ? C.blue : C.blue;
  const txtC  = dark ? C.white : C.navy;

  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: FOOTER_Y, w: W, h: FOOTER_H,
    fill: { color: bg },
  });
  slide.addShape("line" as PptxGenJS.ShapeType, {
    x: 0, y: FOOTER_Y, w: W, h: 0,
    line: { color: line, width: 1.5 },
  });

  const ly = FOOTER_Y + (FOOTER_H - LOGO_H) / 2;

  // Vista logo — left
  if (logoExists("vista-logo.png")) {
    slide.addImage({ path: logoPath("vista-logo.png"), x: 0.15, y: ly, w: LOGO_W, h: LOGO_H,
      sizing: { type: "contain", w: LOGO_W, h: LOGO_H } });
  } else {
    slide.addText("VISTA eye specialist", {
      x: 0.15, y: ly, w: LOGO_W, h: LOGO_H,
      fontSize: 9, bold: true, color: txtC, valign: "middle",
    });
  }

  // Qualitas logo — right
  if (logoExists("qualitas-logo.png")) {
    slide.addImage({ path: logoPath("qualitas-logo.png"), x: W - LOGO_W - 0.15, y: ly, w: LOGO_W, h: LOGO_H,
      sizing: { type: "contain", w: LOGO_W, h: LOGO_H } });
  } else {
    slide.addText("QUALITAS health", {
      x: W - LOGO_W - 0.15, y: ly, w: LOGO_W, h: LOGO_H,
      fontSize: 9, bold: true, color: txtC, align: "right", valign: "middle",
    });
  }
}

function addHeader(slide: PptxGenJS.Slide, title: string) {
  slide.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: 1.1, fill: { color: C.navy } });
  slide.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 1.1, w: W, h: 0.06, fill: { color: C.green } });
  slide.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: 0.08, h: 1.1, fill: { color: C.blue } });
  slide.addText(title, {
    x: 0.25, y: 0.1, w: W - 0.4, h: 0.9,
    fontSize: 28, bold: true, color: C.white, fontFace: "Calibri", valign: "middle",
  });
}

async function getPhotoB64(query?: string): Promise<string | null> {
  if (!query) return null;
  const photo = await fetchPexelsPhoto(query);
  if (!photo) return null;
  return downloadImageAsBase64(photo.url);
}

// ── Title slide ─────────────────────────────────────────────────
async function buildTitleSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: C.navy } });

  const b64 = await getPhotoB64(slide.imageQuery);
  if (b64) {
    s.addImage({ data: b64, x: 3.8, y: 0, w: 6.2, h: H - FOOTER_H,
      sizing: { type: "cover", w: 6.2, h: H - FOOTER_H } });
    s.addShape("rect" as PptxGenJS.ShapeType, { x: 3.8, y: 0, w: 6.2, h: H - FOOTER_H,
      fill: { color: "000000", transparency: 40 } });
  }

  // Left panel
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: 4.4, h: H - FOOTER_H, fill: { color: C.navy } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: 0.08, h: H - FOOTER_H, fill: { color: C.blue } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0.15, y: 2.5, w: 3.8, h: 0.07, fill: { color: C.green } });

  s.addText(slide.title, {
    x: 0.3, y: 1.2, w: 3.9, h: 1.6,
    fontSize: 34, bold: true, color: C.white, fontFace: "Calibri", wrap: true,
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.3, y: 2.7, w: 3.9, h: 1.2,
      fontSize: 18, color: "A8C8E8", fontFace: "Calibri", wrap: true,
    });
  }
  addFooter(s, true);
}

// ── Content slide ────────────────────────────────────────────────
async function buildContentSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });
  addHeader(s, slide.title);

  const bullets = slide.bullets ?? [];
  const startY = 1.3;
  const availH = FOOTER_Y - startY - 0.1;

  if (bullets.length > 0) {
    s.addText(
      bullets.map(b => ({
        text: b,
        options: { bullet: { type: "bullet" as const, indent: 15 }, fontSize: 18, color: C.dark,
          fontFace: "Calibri", paraSpaceAfter: 10, breakLine: true },
      })),
      { x: 0.4, y: startY, w: W - 0.8, h: availH, valign: "top", wrap: true }
    );
  }

  if (slide.body) {
    s.addText(slide.body, {
      x: 0.4, y: startY, w: W - 0.8, h: 0.8,
      fontSize: 16, color: C.muted, fontFace: "Calibri", wrap: true,
    });
  }
  addFooter(s);
}

// ── Image slide (left or right) ─────────────────────────────────
async function buildImageSlide(pptx: PptxGenJS, slide: SlideContent, imgRight: boolean) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });

  const imgW = 4.4;
  const imgX = imgRight ? W - imgW : 0;
  const textX = imgRight ? 0.3 : imgW + 0.3;
  const textW = W - imgW - 0.5;

  const b64 = await getPhotoB64(slide.imageQuery);
  if (b64) {
    s.addImage({ data: b64, x: imgX, y: 0, w: imgW, h: H - FOOTER_H,
      sizing: { type: "cover", w: imgW, h: H - FOOTER_H } });
    s.addShape("rect" as PptxGenJS.ShapeType, { x: imgX, y: 0, w: imgW, h: H - FOOTER_H,
      fill: { color: "000000", transparency: 55 } });
  } else {
    s.addShape("rect" as PptxGenJS.ShapeType, { x: imgX, y: 0, w: imgW, h: H - FOOTER_H,
      fill: { color: C.navy } });
  }

  // Blue divider bar
  const barX = imgRight ? imgX - 0.07 : imgX + imgW;
  s.addShape("rect" as PptxGenJS.ShapeType, { x: barX, y: 0, w: 0.07, h: H - FOOTER_H, fill: { color: C.blue } });

  // Header on text side
  const headerX = imgRight ? 0 : imgW + 0.07;
  s.addShape("rect" as PptxGenJS.ShapeType, { x: headerX, y: 0, w: textW + 0.4, h: 1.05, fill: { color: C.navy } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: headerX, y: 1.05, w: textW + 0.4, h: 0.06, fill: { color: C.green } });
  s.addText(slide.title, {
    x: textX, y: 0.1, w: textW, h: 0.85,
    fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", wrap: true, valign: "middle",
  });

  const bullets = slide.bullets ?? [];
  if (bullets.length > 0) {
    s.addText(
      bullets.map(b => ({
        text: b,
        options: { bullet: { type: "bullet" as const, indent: 12 }, fontSize: 17, color: C.dark,
          fontFace: "Calibri", paraSpaceAfter: 10, breakLine: true },
      })),
      { x: textX, y: 1.25, w: textW, h: FOOTER_Y - 1.35, valign: "top", wrap: true }
    );
  }
  addFooter(s);
}

// ── Two-column slide ─────────────────────────────────────────────
async function buildTwoColumnSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });
  addHeader(s, slide.title);

  const colW = 4.55, gap = 0.15;
  const colH = FOOTER_Y - 1.25;

  // Column backgrounds
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0.2, y: 1.2, w: colW, h: colH,
    fill: { color: C.light }, line: { color: "D1E5F5", width: 1 } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0.2 + colW + gap, y: 1.2, w: colW, h: colH,
    fill: { color: C.light }, line: { color: "D1E5F5", width: 1 } });
  // Blue top strip on columns
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0.2, y: 1.2, w: colW, h: 0.06, fill: { color: C.blue } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0.2 + colW + gap, y: 1.2, w: colW, h: 0.06, fill: { color: C.blue } });

  const leftBullets = (slide.leftColumn ?? []).map(b => ({
    text: b,
    options: { bullet: { type: "bullet" as const, indent: 10 }, fontSize: 16, color: C.dark,
      fontFace: "Calibri", paraSpaceAfter: 9, breakLine: true },
  }));
  const rightBullets = (slide.rightColumn ?? []).map(b => ({
    text: b,
    options: { bullet: { type: "bullet" as const, indent: 10 }, fontSize: 16, color: C.dark,
      fontFace: "Calibri", paraSpaceAfter: 9, breakLine: true },
  }));

  if (leftBullets.length)  s.addText(leftBullets,  { x: 0.3, y: 1.35, w: colW - 0.15, h: colH - 0.2, valign: "top", wrap: true });
  if (rightBullets.length) s.addText(rightBullets, { x: 0.3 + colW + gap, y: 1.35, w: colW - 0.15, h: colH - 0.2, valign: "top", wrap: true });

  addFooter(s);
}

// ── Big-stat slide ───────────────────────────────────────────────
async function buildBigStatSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();

  const b64 = await getPhotoB64(slide.imageQuery);
  if (b64) {
    s.addImage({ data: b64, x: 0, y: 0, w: W, h: H - FOOTER_H,
      sizing: { type: "cover", w: W, h: H - FOOTER_H } });
    s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H - FOOTER_H,
      fill: { color: "000000", transparency: 38 } });
  } else {
    s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H - FOOTER_H, fill: { color: C.navy } });
  }

  // Stat box
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 2.2, y: 0.6, w: 5.6, h: 5.2,
    fill: { color: "000000", transparency: 42 }, line: { color: C.blue, width: 2 } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 2.2, y: 0.6, w: 5.6, h: 0.07, fill: { color: C.green } });

  s.addText(slide.title, {
    x: 2.4, y: 0.75, w: 5.2, h: 0.75,
    fontSize: 20, bold: true, color: C.white, align: "center", fontFace: "Calibri",
  });
  s.addText(slide.stat ?? "", {
    x: 2.2, y: 1.55, w: 5.6, h: 2.0,
    fontSize: 88, bold: true, color: C.blue, align: "center", fontFace: "Calibri",
  });
  if (slide.statLabel) {
    s.addText(slide.statLabel, {
      x: 2.2, y: 3.6, w: 5.6, h: 0.55,
      fontSize: 20, bold: true, color: C.green, align: "center", fontFace: "Calibri",
    });
  }

  const bullets = slide.bullets ?? [];
  if (bullets.length) {
    s.addText(
      bullets.map(b => ({
        text: b,
        options: { bullet: { type: "bullet" as const }, fontSize: 15, color: "DDDDDD",
          fontFace: "Calibri", paraSpaceAfter: 5, breakLine: true },
      })),
      { x: 2.4, y: 4.25, w: 5.2, h: 1.3, valign: "top", wrap: true }
    );
  }
  addFooter(s, true);
}

// ── Chart slide ──────────────────────────────────────────────────
async function buildChartSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });
  addHeader(s, slide.title);

  const chartData = slide.chartData ?? [];
  const hasBullets = (slide.bullets?.length ?? 0) > 0;
  const chartW = hasBullets ? 6.0 : 9.2;
  const chartH = 4.8;
  const chartY = 1.25;

  if (chartData.length > 0) {
    const series = chartData.map(d => ({ name: d.name, labels: d.labels, values: d.values }));
    const chartType = slide.chartType === "pie" ? "pie"
                    : slide.chartType === "line" ? "line"
                    : "bar";

    const chartOpts: PptxGenJS.IChartOpts = {
      x: 0.3, y: chartY, w: chartW, h: chartH,
      chartColors: [C.blue, C.green, C.navy, "FF9600", "9B59B6"],
      showLegend: true, legendPos: "b", legendFontSize: 12,
      showValue: true, dataLabelFontSize: 13, dataLabelColor: C.dark,
      catAxisLabelFontSize: 13, valAxisLabelFontSize: 12,
      titleFontSize: 14,
    };

    if (chartType === "pie") {
      s.addChart("pie" as PptxGenJS.CHART_NAME, series, chartOpts);
    } else if (chartType === "line") {
      s.addChart("line" as PptxGenJS.CHART_NAME, series, chartOpts);
    } else {
      s.addChart("bar" as PptxGenJS.CHART_NAME, series, chartOpts);
    }
  }

  // Insight bullets on right
  if (hasBullets) {
    s.addShape("rect" as PptxGenJS.ShapeType, {
      x: chartW + 0.5, y: chartY, w: W - chartW - 0.7, h: chartH,
      fill: { color: C.light }, line: { color: "D1E5F5", width: 1 },
    });
    s.addShape("rect" as PptxGenJS.ShapeType, {
      x: chartW + 0.5, y: chartY, w: W - chartW - 0.7, h: 0.06, fill: { color: C.green },
    });
    s.addText("Key Insights", {
      x: chartW + 0.55, y: chartY + 0.12, w: W - chartW - 0.8, h: 0.4,
      fontSize: 14, bold: true, color: C.navy, fontFace: "Calibri",
    });
    s.addText(
      (slide.bullets ?? []).map(b => ({
        text: b,
        options: { bullet: { type: "bullet" as const }, fontSize: 14, color: C.dark,
          fontFace: "Calibri", paraSpaceAfter: 8, breakLine: true },
      })),
      { x: chartW + 0.55, y: chartY + 0.58, w: W - chartW - 0.8, h: chartH - 0.65, valign: "top", wrap: true }
    );
  }
  addFooter(s);
}

// ── Main export ──────────────────────────────────────────────────
export async function buildPptx(plan: PresentationPlan): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Vista Eye Specialist";
  pptx.company = "Qualitas Health";
  pptx.title = plan.title;

  for (const slide of plan.slides) {
    switch (slide.layout) {
      case "title":       await buildTitleSlide(pptx, slide);              break;
      case "image-right": await buildImageSlide(pptx, slide, true);        break;
      case "image-left":  await buildImageSlide(pptx, slide, false);       break;
      case "two-column":  await buildTwoColumnSlide(pptx, slide);          break;
      case "big-stat":    await buildBigStatSlide(pptx, slide);            break;
      case "chart":       await buildChartSlide(pptx, slide);              break;
      default:            await buildContentSlide(pptx, slide);            break;
    }
  }

  const result = await pptx.write({ outputType: "nodebuffer" });
  return result as Buffer;
}
