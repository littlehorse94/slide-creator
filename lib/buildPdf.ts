import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PDFImage } from "pdf-lib";
import { PresentationPlan, SlideContent } from "./generateSlides";
import { fetchPexelsPhoto, downloadImageAsBase64 } from "./pexels";
import fs from "fs";
import path from "path";

const W = 960, H = 540;
const FOOTER_H = 32;
const FOOTER_Y = FOOTER_H;

const col = {
  navy:   rgb(0.106, 0.227, 0.420),
  blue:   rgb(0.106, 0.608, 0.851),
  green:  rgb(0.553, 0.776, 0.247),
  white:  rgb(1, 1, 1),
  light:  rgb(0.953, 0.969, 0.988),
  dark:   rgb(0.067, 0.094, 0.153),
  gray:   rgb(0.420, 0.447, 0.502),
  black:  rgb(0, 0, 0),
};

function logoFile(name: string) { return path.join(process.cwd(), "public", "logos", name); }

async function embedLogos(doc: PDFDocument) {
  let vistaImg: PDFImage | null = null;
  let qualitasImg: PDFImage | null = null;
  try { if (fs.existsSync(logoFile("vista-logo.png")))   vistaImg   = await doc.embedPng(fs.readFileSync(logoFile("vista-logo.png"))); } catch {}
  try { if (fs.existsSync(logoFile("qualitas-logo.png"))) qualitasImg = await doc.embedPng(fs.readFileSync(logoFile("qualitas-logo.png"))); } catch {}
  return { vistaImg, qualitasImg };
}

async function embedPhotoForSlide(doc: PDFDocument, imageQuery?: string): Promise<PDFImage | null> {
  if (!imageQuery) return null;
  try {
    const photo = await fetchPexelsPhoto(imageQuery);
    if (!photo) return null;
    const b64 = await downloadImageAsBase64(photo.url);
    if (!b64) return null;
    const base64Data = b64.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64Data, "base64");
    return await doc.embedJpg(buf).catch(() => doc.embedPng(buf));
  } catch { return null; }
}

function drawFooter(page: PDFPage, fonts: {bold:PDFFont; reg:PDFFont}, logos: {vistaImg:PDFImage|null; qualitasImg:PDFImage|null}, dark=false) {
  const bg = dark ? col.navy : col.light;
  page.drawRectangle({ x:0, y:0, width:W, height:FOOTER_H, color:bg });
  page.drawLine({ start:{x:0,y:FOOTER_H}, end:{x:W,y:FOOTER_H}, thickness:1.5, color:col.blue });

  const logoH = 18, logoW = 80, ly = (FOOTER_H - logoH) / 2;
  const textCol = dark ? col.white : col.navy;

  if (logos.vistaImg) {
    const d = logos.vistaImg.scale(1);
    const s = Math.min(logoW/d.width, logoH/d.height);
    page.drawImage(logos.vistaImg, { x:14, y:ly, width:d.width*s, height:d.height*s });
  } else {
    page.drawText("VISTA eye specialist", { x:14, y:ly+4, size:7, font:fonts.bold, color:textCol });
  }
  if (logos.qualitasImg) {
    const d = logos.qualitasImg.scale(1);
    const s = Math.min(logoW/d.width, logoH/d.height);
    page.drawImage(logos.qualitasImg, { x:W-14-d.width*s, y:ly, width:d.width*s, height:d.height*s });
  } else {
    const t = "QUALITAS health";
    page.drawText(t, { x:W-14-fonts.bold.widthOfTextAtSize(t,7), y:ly+4, size:7, font:fonts.bold, color:textCol });
  }
}

async function buildTitlePage(doc: PDFDocument, slide: SlideContent, fonts:{bold:PDFFont;reg:PDFFont}, logos:{vistaImg:PDFImage|null;qualitasImg:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  const contentH = H - FOOTER_H;

  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:contentH, color:col.navy });

  // Photo right panel
  const photo = await embedPhotoForSlide(doc, slide.imageQuery);
  if (photo) {
    const d = photo.scale(1);
    const pw = W * 0.6, ph = contentH;
    const s = Math.max(pw/d.width, ph/d.height);
    page.drawImage(photo, { x:W-pw, y:FOOTER_H, width:d.width*s, height:d.height*s, opacity:0.4 });
  }

  // Left panel overlay
  page.drawRectangle({ x:0, y:FOOTER_H, width:W*0.46, height:contentH, color:col.navy });
  // Blue left edge
  page.drawRectangle({ x:0, y:FOOTER_H, width:5, height:contentH, color:col.blue });
  // Green accent
  page.drawRectangle({ x:0, y:H-220, width:W*0.4, height:4, color:col.green });

  page.drawText(slide.title, { x:40, y:H-175, size:34, font:fonts.bold, color:col.white, maxWidth:W*0.42 });
  if (slide.subtitle) {
    page.drawText(slide.subtitle, { x:40, y:H-225, size:16, font:fonts.reg, color:rgb(0.65,0.78,0.9), maxWidth:W*0.42 });
  }

  drawFooter(page, fonts, logos, true);
}

async function buildContentPage(doc: PDFDocument, slide: SlideContent, fonts:{bold:PDFFont;reg:PDFFont}, logos:{vistaImg:PDFImage|null;qualitasImg:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.white });
  page.drawRectangle({ x:0, y:H-70, width:W, height:70, color:col.navy });
  page.drawRectangle({ x:0, y:H-74, width:W, height:4, color:col.green });
  page.drawRectangle({ x:0, y:H-70, width:5, height:70, color:col.blue });

  page.drawText(slide.title, { x:24, y:H-50, size:24, font:fonts.bold, color:col.white, maxWidth:W-48 });

  let y = H - 100;
  if (slide.body) {
    page.drawText(slide.body, { x:28, y, size:13, font:fonts.reg, color:col.dark, maxWidth:W-56, lineHeight:20 });
    y -= 50;
  }
  for (const b of slide.bullets ?? []) {
    if (y < FOOTER_H + 20) break;
    page.drawCircle({ x:42, y:y+5, size:3, color:col.blue });
    page.drawText(b, { x:54, y, size:14, font:fonts.reg, color:col.dark, maxWidth:W-80, lineHeight:20 });
    y -= 32;
  }
  drawFooter(page, fonts, logos);
}

async function buildImagePage(doc: PDFDocument, slide: SlideContent, fonts:{bold:PDFFont;reg:PDFFont}, logos:{vistaImg:PDFImage|null;qualitasImg:PDFImage|null}, imageOnRight: boolean) {
  const page = doc.addPage([W, H]);
  const contentH = H - FOOTER_H;
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:contentH, color:col.white });

  const imgW = Math.floor(W * 0.46);
  const textW = W - imgW - 10;
  const imgX = imageOnRight ? W - imgW : 0;
  const textX = imageOnRight ? 20 : imgW + 20;

  const photo = await embedPhotoForSlide(doc, slide.imageQuery);
  if (photo) {
    const d = photo.scale(1);
    const s = Math.max(imgW/d.width, contentH/d.height);
    page.drawImage(photo, { x:imgX, y:FOOTER_H, width:d.width*s, height:d.height*s, opacity:0.9 });
    // dim overlay
    page.drawRectangle({ x:imgX, y:FOOTER_H, width:imgW, height:contentH, color:col.black, opacity:0.18 });
  } else {
    page.drawRectangle({ x:imgX, y:FOOTER_H, width:imgW, height:contentH, color:col.navy });
  }

  // Accent bar
  const barX = imageOnRight ? imgX - 4 : imgX + imgW;
  page.drawRectangle({ x:barX, y:FOOTER_H, width:4, height:contentH, color:col.blue });

  // Header on text side
  page.drawRectangle({ x:imageOnRight?0:imgW+4, y:H-68, width:textW+6, height:68, color:col.navy });
  page.drawRectangle({ x:imageOnRight?0:imgW+4, y:H-72, width:textW+6, height:4, color:col.green });
  page.drawText(slide.title, { x:textX, y:H-50, size:20, font:fonts.bold, color:col.white, maxWidth:textW-10 });

  let y = H - 100;
  for (const b of slide.bullets ?? []) {
    if (y < FOOTER_H + 20) break;
    page.drawCircle({ x:textX+12, y:y+5, size:3, color:col.blue });
    page.drawText(b, { x:textX+24, y, size:13, font:fonts.reg, color:col.dark, maxWidth:textW-30, lineHeight:18 });
    y -= 30;
  }
  drawFooter(page, fonts, logos);
}

async function buildBigStatPage(doc: PDFDocument, slide: SlideContent, fonts:{bold:PDFFont;reg:PDFFont}, logos:{vistaImg:PDFImage|null;qualitasImg:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  const contentH = H - FOOTER_H;

  const photo = await embedPhotoForSlide(doc, slide.imageQuery);
  if (photo) {
    const d = photo.scale(1);
    const s = Math.max(W/d.width, contentH/d.height);
    page.drawImage(photo, { x:0, y:FOOTER_H, width:d.width*s, height:d.height*s, opacity:0.5 });
    page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:contentH, color:col.black, opacity:0.4 });
  } else {
    page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:contentH, color:col.navy });
  }

  // Stat box
  const bx=220, by=90, bw=520, bh=320;
  page.drawRectangle({ x:bx, y:H-by-bh, width:bw, height:bh, color:col.black, opacity:0.5 });
  page.drawRectangle({ x:bx, y:H-by-4, width:bw, height:4, color:col.green });
  page.drawLine({ start:{x:bx,y:H-by-bh}, end:{x:bx+bw,y:H-by-bh}, thickness:1.5, color:col.blue });
  page.drawLine({ start:{x:bx,y:H-by}, end:{x:bx,y:H-by-bh}, thickness:1.5, color:col.blue });
  page.drawLine({ start:{x:bx+bw,y:H-by}, end:{x:bx+bw,y:H-by-bh}, thickness:1.5, color:col.blue });

  page.drawText(slide.title, { x:bx+20, y:H-by-36, size:17, font:fonts.bold, color:col.white, maxWidth:bw-40 });

  // Big stat
  const stat = slide.stat ?? "";
  const statSize = 80;
  const statW = fonts.bold.widthOfTextAtSize(stat, statSize);
  page.drawText(stat, { x:bx+(bw-statW)/2, y:H-by-150, size:statSize, font:fonts.bold, color:col.blue });

  if (slide.statLabel) {
    const lw = fonts.bold.widthOfTextAtSize(slide.statLabel, 18);
    page.drawText(slide.statLabel, { x:bx+(bw-lw)/2, y:H-by-185, size:18, font:fonts.bold, color:col.green });
  }

  let y = H - by - 220;
  for (const b of slide.bullets ?? []) {
    if (y < FOOTER_H + 10) break;
    page.drawText(`• ${b}`, { x:bx+20, y, size:11, font:fonts.reg, color:rgb(0.85,0.85,0.85), maxWidth:bw-40 });
    y -= 22;
  }
  drawFooter(page, fonts, logos, true);
}

async function buildTwoColumnPage(doc: PDFDocument, slide: SlideContent, fonts:{bold:PDFFont;reg:PDFFont}, logos:{vistaImg:PDFImage|null;qualitasImg:PDFImage|null}) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x:0, y:FOOTER_H, width:W, height:H-FOOTER_H, color:col.white });
  page.drawRectangle({ x:0, y:H-70, width:W, height:70, color:col.navy });
  page.drawRectangle({ x:0, y:H-74, width:W, height:4, color:col.green });
  page.drawRectangle({ x:0, y:H-70, width:5, height:70, color:col.blue });
  page.drawText(slide.title, { x:24, y:H-50, size:24, font:fonts.bold, color:col.white, maxWidth:W-48 });

  const colW = (W-60)/2;
  // Column boxes
  page.drawRectangle({ x:14, y:FOOTER_H+10, width:colW, height:H-FOOTER_H-90, color:rgb(0.94,0.96,0.99) });
  page.drawRectangle({ x:14+colW+12, y:FOOTER_H+10, width:colW, height:H-FOOTER_H-90, color:rgb(0.94,0.96,0.99) });

  let ly = H - 105, ry = H - 105;
  for (const b of slide.leftColumn ?? []) {
    if (ly < FOOTER_H + 20) break;
    page.drawCircle({ x:28, y:ly+5, size:3, color:col.green });
    page.drawText(b, { x:40, y:ly, size:12, font:fonts.reg, color:col.dark, maxWidth:colW-30 });
    ly -= 28;
  }
  for (const b of slide.rightColumn ?? []) {
    if (ry < FOOTER_H + 20) break;
    page.drawCircle({ x:28+colW+12, y:ry+5, size:3, color:col.green });
    page.drawText(b, { x:40+colW+12, y:ry, size:12, font:fonts.reg, color:col.dark, maxWidth:colW-30 });
    ry -= 28;
  }
  drawFooter(page, fonts, logos);
}

// ── Main export ──────────────────────────────────────────────────
export async function buildPdf(plan: PresentationPlan): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg  = await doc.embedFont(StandardFonts.Helvetica);
  const fonts = { bold, reg };
  const logos = await embedLogos(doc);

  for (const slide of plan.slides) {
    switch (slide.layout) {
      case "title":       await buildTitlePage(doc, slide, fonts, logos);           break;
      case "image-right": await buildImagePage(doc, slide, fonts, logos, true);     break;
      case "image-left":  await buildImagePage(doc, slide, fonts, logos, false);    break;
      case "two-column":  await buildTwoColumnPage(doc, slide, fonts, logos);       break;
      case "big-stat":    await buildBigStatPage(doc, slide, fonts, logos);         break;
      default:            await buildContentPage(doc, slide, fonts, logos);         break;
    }
  }

  return Buffer.from(await doc.save());
}
