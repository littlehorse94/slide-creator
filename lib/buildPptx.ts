import PptxGenJS from "pptxgenjs";
import { PresentationPlan, SlideContent } from "./generateSlides";
import { fetchPexelsPhoto, downloadImageAsBase64 } from "./pexels";
import fs from "fs";
import path from "path";

const C = {
  navy:  "#1B3A6B",
  blue:  "#1B9BD9",
  green: "#8DC63F",
  white: "#FFFFFF",
  light: "#F4F8FC",
  dark:  "#111827",
  gray:  "#6B7280",
};

const W = 10, H = 7.5;
const FOOTER_H = 0.45;
const FOOTER_Y = H - FOOTER_H;
const LOGO_H = 0.28;
const LOGO_W = 1.1;

function logoPath(name: string) { return path.join(process.cwd(), "public", "logos", name); }
function logoExists(name: string) { return fs.existsSync(logoPath(name)); }

// ── Footer with logos ────────────────────────────────────────────
function addFooter(slide: PptxGenJS.Slide, dark = false) {
  const bg = dark ? C.navy : C.light;
  const lineColor = dark ? "#2a5298" : "#D1E3F0";

  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0, y: FOOTER_Y, w: W, h: FOOTER_H,
    fill: { color: bg.replace("#", "") },
  });
  slide.addShape("line" as PptxGenJS.ShapeType, {
    x: 0, y: FOOTER_Y, w: W, h: 0,
    line: { color: C.blue.replace("#", ""), width: 1.5 },
  });

  const ly = FOOTER_Y + (FOOTER_H - LOGO_H) / 2;

  if (logoExists("vista-logo.png")) {
    slide.addImage({ path: logoPath("vista-logo.png"), x: 0.18, y: ly, w: LOGO_W, h: LOGO_H, sizing: { type: "contain", w: LOGO_W, h: LOGO_H } });
  } else {
    slide.addText("VISTA eye specialist", { x: 0.18, y: ly, w: LOGO_W, h: LOGO_H, fontSize: 7, bold: true, color: dark ? C.white.replace("#","") : C.navy.replace("#","") });
  }
  if (logoExists("qualitas-logo.png")) {
    slide.addImage({ path: logoPath("qualitas-logo.png"), x: W - LOGO_W - 0.18, y: ly, w: LOGO_W, h: LOGO_H, sizing: { type: "contain", w: LOGO_W, h: LOGO_H } });
  } else {
    slide.addText("QUALITAS health", { x: W - LOGO_W - 0.18, y: ly, w: LOGO_W, h: LOGO_H, fontSize: 7, bold: true, color: dark ? C.white.replace("#","") : C.navy.replace("#",""), align: "right" });
  }
}

// ── Slide builders ───────────────────────────────────────────────

async function buildTitleSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();

  // Background
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:H, fill:{ color: C.navy.replace("#","") } });

  // Photo background (dimmed) on right 60%
  if (slide.imageQuery) {
    const photo = await fetchPexelsPhoto(slide.imageQuery);
    if (photo) {
      const b64 = await downloadImageAsBase64(photo.url);
      if (b64) {
        s.addImage({ data: b64, x: 3.5, y: 0, w: 6.5, h: H - FOOTER_H, sizing: { type: "cover", w: 6.5, h: H - FOOTER_H } });
        // Dark gradient overlay over photo
        s.addShape("rect" as PptxGenJS.ShapeType, { x:3.5, y:0, w:6.5, h: H - FOOTER_H, fill:{ color:"000000", transparency: 45 } });
      }
    }
  }

  // Diagonal accent stripe
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:4.2, h:H-FOOTER_H, fill:{ color: C.navy.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:0.08, h:H-FOOTER_H, fill:{ color: C.blue.replace("#","") } });

  // Green accent bar
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:2.2, w:3.8, h:0.06, fill:{ color: C.green.replace("#","") } });

  s.addText(slide.title, {
    x: 0.4, y: 1.2, w: 3.6, h: 1.6,
    fontSize: 30, bold: true, color: C.white.replace("#",""), fontFace: "Calibri", wrap: true, align: "left",
  });
  if (slide.subtitle) {
    s.addText(slide.subtitle, {
      x: 0.4, y: 2.4, w: 3.6, h: 1,
      fontSize: 15, color: "A8C8E8", fontFace: "Calibri", wrap: true,
    });
  }

  addFooter(s, true);
}

async function buildContentSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:H, fill:{ color: C.white.replace("#","") } });

  // Header
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:1.05, fill:{ color: C.navy.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:1.05, w:W, h:0.05, fill:{ color: C.green.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:0.07, h:1.05, fill:{ color: C.blue.replace("#","") } });

  s.addText(slide.title, { x:0.3, y:0.1, w:9.4, h:0.85, fontSize:22, bold:true, color:C.white.replace("#",""), fontFace:"Calibri" });

  let y = 1.3;
  if (slide.body) {
    s.addText(slide.body, { x:0.4, y, w:9.2, h:0.6, fontSize:13, color:C.dark.replace("#",""), fontFace:"Calibri", wrap:true });
    y += 0.7;
  }
  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map(b => ({ text: b, options: { bullet: { type: "bullet" as const }, fontSize: 15, color: C.dark.replace("#",""), fontFace: "Calibri", paraSpaceAfter: 8 } })),
      { x:0.5, y, w:9.0, h: FOOTER_Y - y - 0.1, valign:"top", wrap:true }
    );
  }
  addFooter(s);
}

async function buildImageSlide(pptx: PptxGenJS, slide: SlideContent, imageOnRight: boolean) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:H, fill:{ color: C.white.replace("#","") } });

  const imgW = 4.6;
  const textW = W - imgW - 0.1;
  const imgX = imageOnRight ? W - imgW : 0;
  const textX = imageOnRight ? 0.3 : imgW + 0.3;

  // Photo panel
  if (slide.imageQuery) {
    const photo = await fetchPexelsPhoto(slide.imageQuery);
    if (photo) {
      const b64 = await downloadImageAsBase64(photo.url);
      if (b64) {
        s.addImage({ data: b64, x: imgX, y: 0, w: imgW, h: H - FOOTER_H, sizing: { type:"cover", w: imgW, h: H - FOOTER_H } });
        // subtle dark overlay
        s.addShape("rect" as PptxGenJS.ShapeType, { x: imgX, y:0, w: imgW, h: H-FOOTER_H, fill:{ color:"000000", transparency:60 } });
        // Photographer credit
        s.addText(`Photo: ${photo.photographer}`, {
          x: imgX + 0.05, y: H - FOOTER_H - 0.2, w: imgW - 0.1, h: 0.18,
          fontSize: 5, color: "CCCCCC", italic: true,
        });
      } else {
        s.addShape("rect" as PptxGenJS.ShapeType, { x:imgX, y:0, w:imgW, h:H-FOOTER_H, fill:{ color: C.navy.replace("#","") } });
      }
    } else {
      s.addShape("rect" as PptxGenJS.ShapeType, { x:imgX, y:0, w:imgW, h:H-FOOTER_H, fill:{ color: C.navy.replace("#","") } });
    }
  }

  // Accent bar beside image
  const barX = imageOnRight ? imgX - 0.06 : imgX + imgW;
  s.addShape("rect" as PptxGenJS.ShapeType, { x:barX, y:0, w:0.06, h:H-FOOTER_H, fill:{ color: C.blue.replace("#","") } });

  // Title bar on text side
  s.addShape("rect" as PptxGenJS.ShapeType, { x: textX - 0.2, y:0, w: textW + 0.2, h:1.0, fill:{ color: C.navy.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x: textX - 0.2, y:1.0, w: textW + 0.2, h:0.05, fill:{ color: C.green.replace("#","") } });
  s.addText(slide.title, { x: textX, y:0.1, w: textW, h:0.8, fontSize:18, bold:true, color:C.white.replace("#",""), fontFace:"Calibri", wrap:true });

  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map(b => ({ text: b, options: { bullet:{type:"bullet" as const}, fontSize:14, color:C.dark.replace("#",""), fontFace:"Calibri", paraSpaceAfter:10 } })),
      { x: textX, y:1.2, w: textW, h: FOOTER_Y - 1.3, valign:"top", wrap:true }
    );
  }
  addFooter(s);
}

async function buildTwoColumnSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:H, fill:{ color: C.white.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:1.05, fill:{ color: C.navy.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:1.05, w:W, h:0.05, fill:{ color: C.green.replace("#","") } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:0.07, h:1.05, fill:{ color: C.blue.replace("#","") } });
  s.addText(slide.title, { x:0.3, y:0.12, w:9.4, h:0.8, fontSize:22, bold:true, color:C.white.replace("#",""), fontFace:"Calibri" });

  // Column backgrounds
  s.addShape("rect" as PptxGenJS.ShapeType, { x:0.2, y:1.2, w:4.6, h: FOOTER_Y-1.3, fill:{ color:"EEF5FB" }, line:{ color:"D1E3F0", width:1 } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:5.2, y:1.2, w:4.6, h: FOOTER_Y-1.3, fill:{ color:"EEF5FB" }, line:{ color:"D1E3F0", width:1 } });

  if (slide.leftColumn?.length) {
    s.addText(
      slide.leftColumn.map(b => ({ text:b, options:{ bullet:{type:"bullet" as const}, fontSize:13, color:C.dark.replace("#",""), fontFace:"Calibri", paraSpaceAfter:8 } })),
      { x:0.35, y:1.3, w:4.4, h: FOOTER_Y-1.4, valign:"top", wrap:true }
    );
  }
  if (slide.rightColumn?.length) {
    s.addText(
      slide.rightColumn.map(b => ({ text:b, options:{ bullet:{type:"bullet" as const}, fontSize:13, color:C.dark.replace("#",""), fontFace:"Calibri", paraSpaceAfter:8 } })),
      { x:5.35, y:1.3, w:4.4, h: FOOTER_Y-1.4, valign:"top", wrap:true }
    );
  }
  addFooter(s);
}

async function buildBigStatSlide(pptx: PptxGenJS, slide: SlideContent) {
  const s = pptx.addSlide();

  // Background image
  if (slide.imageQuery) {
    const photo = await fetchPexelsPhoto(slide.imageQuery);
    if (photo) {
      const b64 = await downloadImageAsBase64(photo.url);
      if (b64) {
        s.addImage({ data: b64, x:0, y:0, w:W, h:H-FOOTER_H, sizing:{type:"cover",w:W,h:H-FOOTER_H} });
        s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:H-FOOTER_H, fill:{ color:"000000", transparency:40 } });
        s.addText(`Photo: ${photo.photographer}`, { x:0.1, y:H-FOOTER_H-0.2, w:5, h:0.18, fontSize:5, color:"CCCCCC", italic:true });
      }
    }
  } else {
    s.addShape("rect" as PptxGenJS.ShapeType, { x:0, y:0, w:W, h:H-FOOTER_H, fill:{ color: C.navy.replace("#","") } });
  }

  // Stat box
  s.addShape("rect" as PptxGenJS.ShapeType, { x:2.5, y:0.8, w:5, h:4.8, fill:{ color:"000000", transparency:45 }, line:{ color: C.blue.replace("#",""), width:2 } });
  s.addShape("rect" as PptxGenJS.ShapeType, { x:2.5, y:0.8, w:5, h:0.06, fill:{ color: C.green.replace("#","") } });

  s.addText(slide.title, { x:2.6, y:0.95, w:4.8, h:0.7, fontSize:16, bold:true, color:C.white.replace("#",""), align:"center", fontFace:"Calibri" });
  s.addText(slide.stat ?? "", { x:2.5, y:1.7, w:5, h:1.8, fontSize:72, bold:true, color:C.blue.replace("#",""), align:"center", fontFace:"Calibri" });
  if (slide.statLabel) {
    s.addText(slide.statLabel, { x:2.5, y:3.5, w:5, h:0.5, fontSize:16, color:C.green.replace("#",""), align:"center", bold:true, fontFace:"Calibri" });
  }
  if (slide.bullets?.length) {
    s.addText(
      slide.bullets.map(b => ({ text:b, options:{ bullet:{type:"bullet" as const}, fontSize:12, color:"E0E0E0", fontFace:"Calibri", paraSpaceAfter:4 } })),
      { x:2.7, y:4.1, w:4.6, h:0.9, valign:"top", wrap:true }
    );
  }

  addFooter(s, true);
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
      case "title":       await buildTitleSlide(pptx, slide);           break;
      case "image-right": await buildImageSlide(pptx, slide, true);     break;
      case "image-left":  await buildImageSlide(pptx, slide, false);    break;
      case "two-column":  await buildTwoColumnSlide(pptx, slide);       break;
      case "big-stat":    await buildBigStatSlide(pptx, slide);         break;
      default:            await buildContentSlide(pptx, slide);         break;
    }
  }

  const result = await pptx.write({ outputType: "nodebuffer" });
  return result as Buffer;
}
