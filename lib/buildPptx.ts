import PptxGenJS from "pptxgenjs";
import { PresentationPlan, SlideContent } from "./generateSlides";
import { fetchPexelsPhoto, downloadImageAsBase64 } from "./pexels";
import fs from "fs";
import path from "path";

// ── Brand palette ────────────────────────────────────────────────
const NAVY   = "1B3A6B";
const BLUE   = "1B9BD9";
const GREEN  = "8DC63F";
const WHITE  = "FFFFFF";
const OFFWHT = "F4F8FC";
const DARK   = "1A202C";
const MUTED  = "64748B";

const W = 10, H = 7.5;
const HDR_H  = 1.15;      // header bar height
const FTR_Y  = 6.9;       // footer top Y
const FTR_H  = 0.6;       // footer height
const LOGO_W = 1.5;
const LOGO_H = 0.38;

// ── Utility ──────────────────────────────────────────────────────
const lp = (n: string) => path.join(process.cwd(), "public", "logos", n);
const le = (n: string) => fs.existsSync(lp(n));

async function photo(query?: string) {
  if (!query) return null;
  const p = await fetchPexelsPhoto(query);
  return p ? downloadImageAsBase64(p.url) : null;
}

// ── Shared: footer with logos ────────────────────────────────────
function footer(slide: PptxGenJS.Slide, dark = false) {
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: FTR_Y, w: W, h: FTR_H,
    fill: { color: dark ? NAVY : OFFWHT },
  });
  slide.addShape("line" as PptxGenJS.ShapeType, {
    x: 0, y: FTR_Y, w: W, h: 0,
    line: { color: BLUE, width: 1.5 },
  });
  const ly = FTR_Y + (FTR_H - LOGO_H) / 2;
  // Vista — left
  if (le("vista-logo.png")) {
    slide.addImage({ path: lp("vista-logo.png"), x: 0.18, y: ly, w: LOGO_W, h: LOGO_H,
      sizing: { type: "contain", w: LOGO_W, h: LOGO_H } });
  } else {
    slide.addText("VISTA eye specialist", { x: 0.18, y: ly, w: LOGO_W, h: LOGO_H,
      fontSize: 10, bold: true, color: dark ? WHITE : NAVY, valign: "middle" });
  }
  // Qualitas — right
  if (le("qualitas-logo.png")) {
    slide.addImage({ path: lp("qualitas-logo.png"), x: W - LOGO_W - 0.18, y: ly, w: LOGO_W, h: LOGO_H,
      sizing: { type: "contain", w: LOGO_W, h: LOGO_H } });
  } else {
    slide.addText("QUALITAS health", { x: W - LOGO_W - 0.18, y: ly, w: LOGO_W, h: LOGO_H,
      fontSize: 10, bold: true, color: dark ? WHITE : NAVY, align: "right", valign: "middle" });
  }
}

// ── Shared: navy header bar ──────────────────────────────────────
function header(slide: PptxGenJS.Slide, title: string) {
  slide.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: HDR_H, fill: { color: NAVY } });
  slide.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: HDR_H, w: W, h: 0.06, fill: { color: GREEN } });
  slide.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: 0.1, h: HDR_H, fill: { color: BLUE } });
  slide.addText(title, {
    x: 0.28, y: 0, w: W - 0.4, h: HDR_H,
    fontSize: 30, bold: true, color: WHITE, fontFace: "Calibri", valign: "middle",
  });
}

// ── TITLE SLIDE ──────────────────────────────────────────────────
async function titleSlide(pptx: PptxGenJS, s: SlideContent) {
  const sl = pptx.addSlide();

  // Full background
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: NAVY } });

  // Right photo panel
  const b64 = await photo(s.imageQuery);
  if (b64) {
    sl.addImage({ data: b64, x: 4.2, y: 0, w: 5.8, h: FTR_Y,
      sizing: { type: "cover", w: 5.8, h: FTR_Y } });
    sl.addShape("rect" as PptxGenJS.ShapeType, { x: 4.2, y: 0, w: 5.8, h: FTR_Y,
      fill: { color: "000000", transparency: 38 } });
  }

  // Left content panel
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: 4.6, h: FTR_Y, fill: { color: NAVY } });
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: 0.1, h: FTR_Y, fill: { color: BLUE } });

  // Decorative elements
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0.3, y: 2.55, w: 3.8, h: 0.07, fill: { color: GREEN } });
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0.3, y: 2.7, w: 0.55, h: 0.07, fill: { color: BLUE } });

  sl.addText(s.title, {
    x: 0.3, y: 1.0, w: 4.0, h: 1.45,
    fontSize: 36, bold: true, color: WHITE, fontFace: "Calibri", wrap: true, valign: "bottom",
  });
  if (s.subtitle) {
    sl.addText(s.subtitle, {
      x: 0.3, y: 2.9, w: 4.0, h: 1.2,
      fontSize: 18, color: "B8D4EC", fontFace: "Calibri", wrap: true,
    });
  }

  footer(sl, true);
}

// ── CONTENT SLIDE ────────────────────────────────────────────────
async function contentSlide(pptx: PptxGenJS, s: SlideContent) {
  const sl = pptx.addSlide();
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: WHITE } });
  header(sl, s.title);

  const bullets = s.bullets ?? [];
  const contentY = HDR_H + 0.2;
  const contentH = FTR_Y - contentY - 0.1;

  sl.addText(
    bullets.map((b, i) => ({
      text: b,
      options: {
        bullet: { type: "bullet" as const, indent: 18 },
        fontSize: 20,
        color: i % 2 === 0 ? DARK : MUTED,
        fontFace: "Calibri",
        paraSpaceAfter: 12,
        breakLine: true,
      },
    })),
    { x: 0.45, y: contentY, w: W - 0.9, h: contentH, valign: "top", wrap: true }
  );

  footer(sl);
}

// ── IMAGE SLIDE (left or right) ──────────────────────────────────
async function imageSlide(pptx: PptxGenJS, s: SlideContent, imgRight: boolean) {
  const sl = pptx.addSlide();
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: WHITE } });

  const imgW = 4.6;
  const imgX = imgRight ? W - imgW : 0;
  const txtX = imgRight ? 0.35 : imgW + 0.35;
  const txtW = W - imgW - 0.6;
  const hdrX = imgRight ? 0 : imgW;

  // Photo panel
  const b64 = await photo(s.imageQuery);
  if (b64) {
    sl.addImage({ data: b64, x: imgX, y: 0, w: imgW, h: FTR_Y,
      sizing: { type: "cover", w: imgW, h: FTR_Y } });
    sl.addShape("rect" as PptxGenJS.ShapeType, { x: imgX, y: 0, w: imgW, h: FTR_Y,
      fill: { color: "000000", transparency: 50 } });
  } else {
    sl.addShape("rect" as PptxGenJS.ShapeType, { x: imgX, y: 0, w: imgW, h: FTR_Y, fill: { color: NAVY } });
  }

  // Divider stripe
  const barX = imgRight ? imgX - 0.08 : imgX + imgW;
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: barX, y: 0, w: 0.08, h: FTR_Y, fill: { color: BLUE } });

  // Header on text side
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: hdrX, y: 0, w: txtW + 0.55, h: HDR_H, fill: { color: NAVY } });
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: hdrX, y: HDR_H, w: txtW + 0.55, h: 0.06, fill: { color: GREEN } });
  sl.addText(s.title, {
    x: txtX, y: 0, w: txtW, h: HDR_H,
    fontSize: 24, bold: true, color: WHITE, fontFace: "Calibri", valign: "middle", wrap: true,
  });

  // Bullets
  const bullets = s.bullets ?? [];
  sl.addText(
    bullets.map(b => ({
      text: b,
      options: { bullet: { type: "bullet" as const, indent: 14 }, fontSize: 18, color: DARK,
        fontFace: "Calibri", paraSpaceAfter: 10, breakLine: true },
    })),
    { x: txtX, y: HDR_H + 0.2, w: txtW, h: FTR_Y - HDR_H - 0.3, valign: "top", wrap: true }
  );

  footer(sl);
}

// ── TWO COLUMN SLIDE ─────────────────────────────────────────────
async function twoColSlide(pptx: PptxGenJS, s: SlideContent) {
  const sl = pptx.addSlide();
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: WHITE } });
  header(sl, s.title);

  const colW = 4.6, colY = HDR_H + 0.15, colH = FTR_Y - colY - 0.1;

  // Left column box
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0.2, y: colY, w: colW, h: colH,
    fill: { color: OFFWHT }, line: { color: "D0E4F5", width: 1.5 } });
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0.2, y: colY, w: colW, h: 0.07, fill: { color: BLUE } });

  // Right column box
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 5.2, y: colY, w: colW, h: colH,
    fill: { color: OFFWHT }, line: { color: "D0E4F5", width: 1.5 } });
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 5.2, y: colY, w: colW, h: 0.07, fill: { color: GREEN } });

  const mkBullets = (items: string[]) => items.map(b => ({
    text: b,
    options: { bullet: { type: "bullet" as const, indent: 12 }, fontSize: 17, color: DARK,
      fontFace: "Calibri", paraSpaceAfter: 10, breakLine: true },
  }));

  if (s.leftColumn?.length)  sl.addText(mkBullets(s.leftColumn),  { x: 0.35, y: colY + 0.18, w: colW - 0.2, h: colH - 0.28, valign: "top", wrap: true });
  if (s.rightColumn?.length) sl.addText(mkBullets(s.rightColumn), { x: 5.35, y: colY + 0.18, w: colW - 0.2, h: colH - 0.28, valign: "top", wrap: true });

  footer(sl);
}

// ── BIG STAT SLIDE ───────────────────────────────────────────────
async function bigStatSlide(pptx: PptxGenJS, s: SlideContent) {
  const sl = pptx.addSlide();

  const b64 = await photo(s.imageQuery);
  if (b64) {
    sl.addImage({ data: b64, x: 0, y: 0, w: W, h: FTR_Y, sizing: { type: "cover", w: W, h: FTR_Y } });
    sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: FTR_Y, fill: { color: "000000", transparency: 40 } });
  } else {
    sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: FTR_Y, fill: { color: NAVY } });
  }

  // Frosted box
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 2.0, y: 0.5, w: 6.0, h: 5.6,
    fill: { color: "000000", transparency: 42 }, line: { color: BLUE, width: 2.5 } });
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 2.0, y: 0.5, w: 6.0, h: 0.08, fill: { color: GREEN } });

  sl.addText(s.title, {
    x: 2.2, y: 0.65, w: 5.6, h: 0.85,
    fontSize: 22, bold: true, color: WHITE, align: "center", fontFace: "Calibri",
  });
  sl.addText(s.stat ?? "", {
    x: 2.0, y: 1.55, w: 6.0, h: 2.1,
    fontSize: 96, bold: true, color: BLUE, align: "center", fontFace: "Calibri",
  });
  if (s.statLabel) {
    sl.addText(s.statLabel, {
      x: 2.0, y: 3.7, w: 6.0, h: 0.6,
      fontSize: 22, bold: true, color: GREEN, align: "center", fontFace: "Calibri",
    });
  }

  const bullets = s.bullets ?? [];
  if (bullets.length) {
    sl.addText(
      bullets.map(b => ({
        text: b,
        options: { bullet: { type: "bullet" as const }, fontSize: 16, color: "E2E8F0",
          fontFace: "Calibri", paraSpaceAfter: 6, breakLine: true },
      })),
      { x: 2.2, y: 4.4, w: 5.6, h: 1.5, valign: "top", wrap: true }
    );
  }

  footer(sl, true);
}

// ── CHART SLIDE ──────────────────────────────────────────────────
async function chartSlide(pptx: PptxGenJS, s: SlideContent) {
  const sl = pptx.addSlide();
  sl.addShape("rect" as PptxGenJS.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: WHITE } });
  header(sl, s.title);

  const hasBullets = (s.bullets?.length ?? 0) > 0;
  const chartW = hasBullets ? 6.2 : 9.3;
  const chartH = FTR_Y - HDR_H - 0.25;
  const chartY = HDR_H + 0.15;

  const datasets = s.chartData ?? [];

  if (datasets.length > 0) {
    const chartType: PptxGenJS.CHART_NAME =
      s.chartType === "pie"  ? "pie"  :
      s.chartType === "line" ? "line" : "bar";

    const seriesData = datasets.map(d => ({
      name:   d.name,
      labels: d.labels,
      values: d.values,
    }));

    sl.addChart(chartType, seriesData, {
      x: 0.3,
      y: chartY,
      w: chartW,
      h: chartH,
      chartColors: [BLUE, GREEN, NAVY, "FF9600", "A855F7", "EF4444"],
      showLegend:        true,
      legendPos:         "b",
      legendFontSize:    13,
      showValue:         true,
      dataLabelFontSize: 13,
      dataLabelColor:    DARK,
      catAxisLabelFontSize: 14,
      valAxisLabelFontSize: 13,
      barGapWidthPct:    50,
    } as PptxGenJS.IChartOpts);
  } else {
    // Fallback: "No chart data" message
    sl.addText("Chart data not available", {
      x: 0.3, y: chartY + chartH / 2 - 0.3, w: chartW, h: 0.6,
      fontSize: 18, color: MUTED, align: "center", fontFace: "Calibri",
    });
  }

  // Insight panel on the right
  if (hasBullets) {
    const panelX = chartW + 0.5;
    const panelW = W - panelX - 0.2;
    sl.addShape("rect" as PptxGenJS.ShapeType, {
      x: panelX, y: chartY, w: panelW, h: chartH,
      fill: { color: OFFWHT }, line: { color: "D0E4F5", width: 1.5 },
    });
    sl.addShape("rect" as PptxGenJS.ShapeType, { x: panelX, y: chartY, w: panelW, h: 0.07, fill: { color: GREEN } });
    sl.addText("Key Insights", {
      x: panelX + 0.12, y: chartY + 0.12, w: panelW - 0.2, h: 0.45,
      fontSize: 15, bold: true, color: NAVY, fontFace: "Calibri",
    });
    sl.addText(
      (s.bullets ?? []).map(b => ({
        text: b,
        options: { bullet: { type: "bullet" as const, indent: 10 }, fontSize: 15, color: DARK,
          fontFace: "Calibri", paraSpaceAfter: 10, breakLine: true },
      })),
      { x: panelX + 0.12, y: chartY + 0.65, w: panelW - 0.2, h: chartH - 0.75, valign: "top", wrap: true }
    );
  }

  footer(sl);
}

// ── MAIN EXPORT ──────────────────────────────────────────────────
export async function buildPptx(plan: PresentationPlan): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout  = "LAYOUT_WIDE";
  pptx.author  = "Vista Eye Specialist";
  pptx.company = "Qualitas Health";
  pptx.title   = plan.title;

  for (const s of plan.slides) {
    switch (s.layout) {
      case "title":       await titleSlide(pptx, s);           break;
      case "image-right": await imageSlide(pptx, s, true);     break;
      case "image-left":  await imageSlide(pptx, s, false);    break;
      case "two-column":  await twoColSlide(pptx, s);          break;
      case "big-stat":    await bigStatSlide(pptx, s);         break;
      case "chart":       await chartSlide(pptx, s);           break;
      default:            await contentSlide(pptx, s);         break;
    }
  }

  const result = await pptx.write({ outputType: "nodebuffer" });
  return result as Buffer;
}
