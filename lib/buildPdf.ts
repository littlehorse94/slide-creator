import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PDFImage, RGB } from "pdf-lib";
import { PresentationPlan, SlideContent } from "./generateSlides";
import { fetchPexelsPhoto, downloadImageAsBase64 } from "./pexels";
import fs from "fs";
import path from "path";

const W = 1280, H = 720;
const FOOTER_H = 38;

const col = {
  navy:  rgb(0.106, 0.227, 0.420),
  blue:  rgb(0.106, 0.608, 0.851),
  green: rgb(0.553, 0.776, 0.247),
  white: rgb(1, 1, 1),
  light: rgb(0.941, 0.961, 0.984),
  dark:  rgb(0.067, 0.094, 0.153),
  muted: rgb(0.294, 0.333, 0.388),
  black: rgb(0, 0, 0),
  orange: rgb(1, 0.588, 0),
};

function logoFile(n: string) { return path.join(process.cwd(), "public", "logos", n); }

async function embedLogos(doc: PDFDocument) {
  let v: PDFImage | null = null, q: PDFImage | null = null;
  try { if (fs.existsSync(logoFile("vista-logo.png")))    v = await doc.embedPng(fs.readFileSync(logoFile("vista-logo.png"))); } catch {}
  try { if (fs.existsSync(logoFile("qualitas-logo.png"))) q = await doc.embedPng(fs.readFileSync(logoFile("qualitas-logo.png"))); } catch {}
  return { v, q };
}

async function embedPhoto(doc: PDFDocument, query?: string): Promise<PDFImage | null> {
  if (!query) return null;
  try {
    const photo = await fetchPexelsPhoto(query);
    if (!photo) return null;
    const b64 = await downloadImageAsBase64(photo.url);
    if (!b64) return null;
    const buf = Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ""), "base64");
    return await doc.embedJpg(buf).catch(() => doc.embedPng(buf));
  } catch { return null; }
}

function footer(page: PDFPage, f: PDFFont, logos: {v:PDFImage|null;q:PDFImage|null}, dark=false) {
  const bg = dark ? col.navy : col.light;
  page.drawRectangle({ x:0, y:0, width:W, height:FOOTER_H, color:bg });
  page.drawLine({ start:{x:0,y:FOOTER_H}, end:{x:W,y:FOOTER_H}, thickness:2, color:col.blue });

  const lh=22, lw=110, ly=(FOOTER_H-lh)/2;
  const tc = dark ? col.white : col.navy;

  if (logos.v) {
    const d=logos.v.scale(1), s=Math.min(lw/d.width, lh/d.height);
    page.drawImage(logos.v, { x:16, y:ly, width:d.width*s, height:d.height*s });
  } else {
    page.drawText("VISTA eye specialist", { x:16, y:ly+5, size:10, font:f, color:tc });
  }
  if (logos.q) {
    const d=logos.q.scale(1), s=Math.min(lw/d.width, lh/d.height);
    page.drawImage(logos.q, { x:W-16-d.width*s, y:ly, width:d.width*s, height:d.height*s });
  } else {
    const t="QUALITAS health"; const tw=f.widthOfTextAtSize(t,10);
    page.drawText(t, { x:W-16-tw, y:ly+5, size:10, font:f, color:tc });
  }
}

function header(page: PDFPage, bold: PDFFont, title: string) {
  const hh = 80;
  page.drawRectangle({ x:0, y:H-hh, width:W, height:hh, color:col.navy });
  page.drawRectangle({ x:0, y:H-hh-5, width:W, height:5, color:col.green });
  page.drawRectangle({ x:0, y:H-hh, width:6, height:hh, color:col.blue });
  page.drawText(title, { x:22, y:H-58, size:30, font:bold, color:col.white, maxWidth:W-44 });
}

// ── Bar chart drawn manually ─────────────────────────────────────
function drawBarChart(
  page: PDFPage,
  reg: PDFFont,
  bold: PDFFont,
  dataset: { name: string; labels: string[]; values: number[] },
  x: number, y: number, cw: number, ch: number,
  barColors: RGB[]
) {
  const max = Math.max(...dataset.values, 1);
  const count = dataset.labels.length;
  const barW = Math.min((cw / (count * 1.6)), 80);
  const spacing = cw / count;
  const axisH = ch - 50;

  // Axis lines
  page.drawLine({ start:{ x: x, y: y }, end:{ x: x+cw, y: y }, thickness:1.5, color:col.muted });
  page.drawLine({ start:{ x: x, y: y }, end:{ x: x, y: y+axisH+10 }, thickness:1.5, color:col.muted });

  // Grid lines (4)
  for (let i = 1; i <= 4; i++) {
    const gy = y + (axisH / 4) * i;
    page.drawLine({ start:{ x: x, y: gy }, end:{ x: x+cw, y: gy }, thickness:0.5, color:rgb(0.85,0.85,0.85) });
    const lv = Math.round((max / 4) * i);
    page.drawText(String(lv), { x: x - 30, y: gy - 5, size: 10, font: reg, color: col.muted });
  }

  dataset.values.forEach((v, i) => {
    const bh = (v / max) * axisH;
    const bx = x + spacing * i + (spacing - barW) / 2;
    const color = barColors[i % barColors.length];
    page.drawRectangle({ x:bx, y, width:barW, height:bh, color });
    // Value label on top
    const vt = String(v);
    const vw = reg.widthOfTextAtSize(vt, 11);
    page.drawText(vt, { x: bx + (barW-vw)/2, y: y+bh+4, size:11, font:bold, color:col.dark });
    // X label
    const lt = dataset.labels[i];
    const lw = reg.widthOfTextAtSize(lt, 11);
    page.drawText(lt, { x: bx + (barW-lw)/2, y: y-18, size:11, font:reg, color:col.dark });
  });
}

function drawPieChart(
  page: PDFPage,
  reg: PDFFont,
  dataset: { name: string; labels: string[]; values: number[] },
  cx: number, cy: number, r: number,
  pieColors: RGB[]
) {
  const total = dataset.values.reduce((a,b) => a+b, 0);
  if (total === 0) return;

  // pdf-lib doesn't have arc — draw coloured rectangles as a legend+bar instead
  let legY = cy + r - 10;
  const segH = 22;

  dataset.values.forEach((v, i) => {
    const pct = ((v / total) * 100).toFixed(1);
    const color = pieColors[i % pieColors.length];
    const barW = ((v / total) * (r * 1.8));
    page.drawRectangle({ x: cx - r * 0.9, y: legY - segH * i - segH, width: barW, height: segH - 4, color });
    page.drawText(`${dataset.labels[i]}: ${v} (${pct}%)`, {
      x: cx - r * 0.9 + barW + 6, y: legY - segH * i - segH + 5,
      size: 12, font: reg, color: col.dark,
    });
  });
}

// ── Slide builders ───────────────────────────────────────────────

async function buildTitlePage(doc: PDFDocument, s: SlideContent, bold: PDFFont, reg: PDFFont, logos:{v:PDFImage|null;q:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  const ch = H - FOOTER_H;
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:ch, color:col.navy });

  const photo = await embedPhoto(doc, s.imageQuery);
  if (photo) {
    const d=photo.scale(1), sc=Math.max((W*0.58)/d.width, ch/d.height);
    page.drawImage(photo, { x:W*0.42, y:FOOTER_H, width:d.width*sc, height:d.height*sc, opacity:0.45 });
  }

  page.drawRectangle({ x:0, y:FOOTER_H, width:W*0.48, height:ch, color:col.navy });
  page.drawRectangle({ x:0, y:FOOTER_H, width:6, height:ch, color:col.blue });
  page.drawRectangle({ x:0, y:H-280, width:W*0.44, height:4, color:col.green });

  page.drawText(s.title, { x:30, y:H-200, size:42, font:bold, color:col.white, maxWidth:W*0.42 });
  if (s.subtitle) page.drawText(s.subtitle, { x:30, y:H-260, size:20, font:reg, color:rgb(0.65,0.80,0.92), maxWidth:W*0.42 });

  footer(page, bold, logos, true);
}

async function buildContentPage(doc: PDFDocument, s: SlideContent, bold: PDFFont, reg: PDFFont, logos:{v:PDFImage|null;q:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.white });
  header(page, bold, s.title);

  let y = H - 110;
  if (s.body) {
    page.drawText(s.body, { x:30, y, size:17, font:reg, color:col.muted, maxWidth:W-60, lineHeight:26 });
    y -= 55;
  }
  for (const b of s.bullets ?? []) {
    if (y < FOOTER_H + 20) break;
    page.drawCircle({ x:46, y:y+7, size:4, color:col.blue });
    page.drawText(b, { x:60, y, size:18, font:reg, color:col.dark, maxWidth:W-90, lineHeight:26 });
    y -= 44;
  }
  footer(page, bold, logos);
}

async function buildImagePage(doc: PDFDocument, s: SlideContent, bold: PDFFont, reg: PDFFont, logos:{v:PDFImage|null;q:PDFImage|null}, imgRight: boolean) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.white });

  const imgW = Math.floor(W * 0.44), ch = H - FOOTER_H;
  const imgX = imgRight ? W - imgW : 0;
  const txtX = imgRight ? 22 : imgW + 22;
  const txtW = W - imgW - 40;
  const hdrX = imgRight ? 0 : imgW + 6;

  const photo = await embedPhoto(doc, s.imageQuery);
  if (photo) {
    const d=photo.scale(1), sc=Math.max(imgW/d.width, ch/d.height);
    page.drawImage(photo, { x:imgX, y:FOOTER_H, width:d.width*sc, height:d.height*sc, opacity:0.88 });
    page.drawRectangle({ x:imgX, y:FOOTER_H, width:imgW, height:ch, color:col.black, opacity:0.18 });
  } else {
    page.drawRectangle({ x:imgX, y:FOOTER_H, width:imgW, height:ch, color:col.navy });
  }
  page.drawRectangle({ x: imgRight ? imgX-5 : imgX+imgW, y:FOOTER_H, width:5, height:ch, color:col.blue });

  page.drawRectangle({ x:hdrX, y:H-82, width:txtW+26, height:82, color:col.navy });
  page.drawRectangle({ x:hdrX, y:H-86, width:txtW+26, height:4, color:col.green });
  page.drawText(s.title, { x:txtX, y:H-62, size:26, font:bold, color:col.white, maxWidth:txtW });

  let y = H - 112;
  for (const b of s.bullets ?? []) {
    if (y < FOOTER_H + 20) break;
    page.drawCircle({ x:txtX+12, y:y+7, size:4, color:col.blue });
    page.drawText(b, { x:txtX+26, y, size:17, font:reg, color:col.dark, maxWidth:txtW-30, lineHeight:24 });
    y -= 42;
  }
  footer(page, bold, logos);
}

async function buildTwoColumnPage(doc: PDFDocument, s: SlideContent, bold: PDFFont, reg: PDFFont, logos:{v:PDFImage|null;q:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.white });
  header(page, bold, s.title);

  const cw=(W-48)/2, colH=H-FOOTER_H-100;
  page.drawRectangle({ x:16, y:FOOTER_H+8, width:cw, height:colH, color:col.light });
  page.drawRectangle({ x:26+cw, y:FOOTER_H+8, width:cw, height:colH, color:col.light });
  page.drawRectangle({ x:16, y:FOOTER_H+8+colH-5, width:cw, height:5, color:col.blue });
  page.drawRectangle({ x:26+cw, y:FOOTER_H+8+colH-5, width:cw, height:5, color:col.blue });

  let ly=H-108, ry=H-108;
  for (const b of s.leftColumn??[]) {
    if (ly < FOOTER_H+20) break;
    page.drawCircle({ x:34, y:ly+7, size:4, color:col.green });
    page.drawText(b, { x:48, y:ly, size:16, font:reg, color:col.dark, maxWidth:cw-36, lineHeight:22 });
    ly -= 38;
  }
  for (const b of s.rightColumn??[]) {
    if (ry < FOOTER_H+20) break;
    page.drawCircle({ x:44+cw, y:ry+7, size:4, color:col.green });
    page.drawText(b, { x:58+cw, y:ry, size:16, font:reg, color:col.dark, maxWidth:cw-36, lineHeight:22 });
    ry -= 38;
  }
  footer(page, bold, logos);
}

async function buildBigStatPage(doc: PDFDocument, s: SlideContent, bold: PDFFont, reg: PDFFont, logos:{v:PDFImage|null;q:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  const photo = await embedPhoto(doc, s.imageQuery);
  if (photo) {
    const d=photo.scale(1), sc=Math.max(W/d.width, (H-FOOTER_H)/d.height);
    page.drawImage(photo, { x:0, y:FOOTER_H, width:d.width*sc, height:d.height*sc, opacity:0.5 });
    page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.black, opacity:0.4 });
  } else {
    page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.navy });
  }

  const bx=240, bw=800, by=H-100, bh=540;
  page.drawRectangle({ x:bx, y:by-bh, width:bw, height:bh, color:col.black, opacity:0.48 });
  page.drawRectangle({ x:bx, y:by-4, width:bw, height:4, color:col.green });
  page.drawLine({ start:{x:bx,y:by-bh}, end:{x:bx+bw,y:by-bh}, thickness:2, color:col.blue });
  page.drawLine({ start:{x:bx,y:by}, end:{x:bx,y:by-bh}, thickness:2, color:col.blue });
  page.drawLine({ start:{x:bx+bw,y:by}, end:{x:bx+bw,y:by-bh}, thickness:2, color:col.blue });

  page.drawText(s.title, { x:bx+20, y:by-52, size:22, font:bold, color:col.white, maxWidth:bw-40 });

  const sv = s.stat ?? "", ssz = 100;
  const sw = bold.widthOfTextAtSize(sv, ssz);
  page.drawText(sv, { x:bx+(bw-sw)/2, y:by-195, size:ssz, font:bold, color:col.blue });

  if (s.statLabel) {
    const slw = bold.widthOfTextAtSize(s.statLabel, 24);
    page.drawText(s.statLabel, { x:bx+(bw-slw)/2, y:by-240, size:24, font:bold, color:col.green });
  }

  let y = by - 292;
  for (const b of s.bullets ?? []) {
    if (y < by-bh+20) break;
    page.drawText(`• ${b}`, { x:bx+24, y, size:14, font:reg, color:rgb(0.88,0.88,0.88), maxWidth:bw-48 });
    y -= 28;
  }
  footer(page, bold, logos, true);
}

async function buildChartPage(doc: PDFDocument, s: SlideContent, bold: PDFFont, reg: PDFFont, logos:{v:PDFImage|null;q:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.white });
  header(page, bold, s.title);

  const hasBullets = (s.bullets?.length ?? 0) > 0;
  const chartX = 40, chartY = FOOTER_H + 30;
  const chartW = hasBullets ? W - 340 : W - 80;
  const chartH = H - FOOTER_H - 110;

  const chartColors: RGB[] = [col.blue, col.green, col.navy, col.orange, rgb(0.608, 0.349, 0.714)];
  const dataset = s.chartData?.[0];

  if (dataset) {
    if (s.chartType === "pie") {
      drawPieChart(page, reg, dataset, chartX + chartW/2, chartY + chartH/2, Math.min(chartW, chartH) * 0.45, chartColors);
    } else {
      drawBarChart(page, reg, bold, dataset, chartX, chartY, chartW, chartH, chartColors);
    }
  }

  if (hasBullets) {
    const bx = chartX + chartW + 20, bw = W - bx - 20;
    page.drawRectangle({ x:bx, y:chartY, width:bw, height:chartH, color:col.light });
    page.drawRectangle({ x:bx, y:chartY+chartH-5, width:bw, height:5, color:col.green });
    page.drawText("Key Insights", { x:bx+12, y:chartY+chartH-36, size:16, font:bold, color:col.navy });
    let iy = chartY + chartH - 62;
    for (const b of s.bullets ?? []) {
      if (iy < chartY + 10) break;
      page.drawCircle({ x:bx+16, y:iy+6, size:4, color:col.blue });
      page.drawText(b, { x:bx+28, y:iy, size:14, font:reg, color:col.dark, maxWidth:bw-36, lineHeight:20 });
      iy -= 36;
    }
  }
  footer(page, bold, logos);
}

// ── Main export ──────────────────────────────────────────────────
export async function buildPdf(plan: PresentationPlan): Promise<Buffer> {
  const doc  = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);
  const logos = await embedLogos(doc);

  for (const s of plan.slides) {
    switch (s.layout) {
      case "title":       await buildTitlePage(doc, s, bold, reg, logos);           break;
      case "image-right": await buildImagePage(doc, s, bold, reg, logos, true);     break;
      case "image-left":  await buildImagePage(doc, s, bold, reg, logos, false);    break;
      case "two-column":  await buildTwoColumnPage(doc, s, bold, reg, logos);       break;
      case "big-stat":    await buildBigStatPage(doc, s, bold, reg, logos);         break;
      case "chart":       await buildChartPage(doc, s, bold, reg, logos);           break;
      default:            await buildContentPage(doc, s, bold, reg, logos);         break;
    }
  }

  return Buffer.from(await doc.save());
}
