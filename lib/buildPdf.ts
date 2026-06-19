import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import { PresentationPlan, SlideContent } from "./generateSlides";
import fs from "fs";
import path from "path";

// Vista brand colors as 0-1 RGB
const DARK_BLUE = rgb(0.106, 0.227, 0.42);
const VISTA_BLUE = rgb(0.106, 0.608, 0.851);
const ACCENT_GREEN = rgb(0.553, 0.776, 0.247);
const WHITE = rgb(1, 1, 1);
const DARK_TEXT = rgb(0.13, 0.13, 0.13);
const GRAY_TEXT = rgb(0.95, 0.97, 0.98);

const W = 960;
const H = 540;

function logoFilePath(name: string) {
  return path.join(process.cwd(), "public", "logos", name);
}

async function embedLogos(doc: PDFDocument) {
  const vistaPath = logoFilePath("vista-logo.png");
  const qualitasPath = logoFilePath("qualitas-logo.png");
  let vistaImg = null;
  let qualitasImg = null;

  try {
    if (fs.existsSync(vistaPath)) {
      const bytes = fs.readFileSync(vistaPath);
      vistaImg = await doc.embedPng(bytes);
    }
  } catch {}
  try {
    if (fs.existsSync(qualitasPath)) {
      const bytes = fs.readFileSync(qualitasPath);
      qualitasImg = await doc.embedPng(bytes);
    }
  } catch {}

  return { vistaImg, qualitasImg };
}

function drawLogos(
  page: PDFPage,
  vistaImg: any,
  qualitasImg: any,
  font: PDFFont,
  darkBg = false
) {
  const logoH = 24;
  const logoW = 110;
  const logoY = 18;
  const padding = 14;
  const textColor = darkBg ? WHITE : DARK_BLUE;

  // Separator line
  page.drawLine({
    start: { x: padding, y: logoY + logoH + 4 },
    end: { x: W - padding, y: logoY + logoH + 4 },
    thickness: 0.5,
    color: darkBg ? WHITE : VISTA_BLUE,
  });

  if (vistaImg) {
    const dims = vistaImg.scale(1);
    const scale = Math.min(logoW / dims.width, logoH / dims.height);
    page.drawImage(vistaImg, {
      x: padding,
      y: logoY,
      width: dims.width * scale,
      height: dims.height * scale,
    });
  } else {
    page.drawText("VISTA eye specialist", {
      x: padding,
      y: logoY + 4,
      size: 8,
      font,
      color: textColor,
    });
  }

  if (qualitasImg) {
    const dims = qualitasImg.scale(1);
    const scale = Math.min(logoW / dims.width, logoH / dims.height);
    page.drawImage(qualitasImg, {
      x: W - padding - dims.width * scale,
      y: logoY,
      width: dims.width * scale,
      height: dims.height * scale,
    });
  } else {
    const text = "QUALITAS health";
    const textW = font.widthOfTextAtSize(text, 8);
    page.drawText(text, {
      x: W - padding - textW,
      y: logoY + 4,
      size: 8,
      font,
      color: textColor,
    });
  }
}

async function addTitleSlide(
  doc: PDFDocument,
  slide: SlideContent,
  fonts: { bold: PDFFont; regular: PDFFont },
  logos: { vistaImg: any; qualitasImg: any }
) {
  const page = doc.addPage([W, H]);

  // Dark blue background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: DARK_BLUE });
  // Vista blue bottom panel
  page.drawRectangle({ x: 0, y: 0, width: W, height: 160, color: VISTA_BLUE });
  // Accent stripe
  page.drawRectangle({ x: 0, y: 160, width: W, height: 5, color: ACCENT_GREEN });

  // Title
  const titleFontSize = 38;
  page.drawText(slide.title, {
    x: 60,
    y: H - 180,
    size: titleFontSize,
    font: fonts.bold,
    color: WHITE,
    maxWidth: W - 120,
  });

  if (slide.subtitle) {
    page.drawText(slide.subtitle, {
      x: 60,
      y: H - 230,
      size: 18,
      font: fonts.regular,
      color: GRAY_TEXT,
      maxWidth: W - 120,
    });
  }

  drawLogos(page, logos.vistaImg, logos.qualitasImg, fonts.regular, true);
}

async function addContentSlide(
  doc: PDFDocument,
  slide: SlideContent,
  fonts: { bold: PDFFont; regular: PDFFont },
  logos: { vistaImg: any; qualitasImg: any }
) {
  const page = doc.addPage([W, H]);

  // White background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  // Header bar
  page.drawRectangle({ x: 0, y: H - 72, width: W, height: 72, color: DARK_BLUE });
  // Accent stripe
  page.drawRectangle({ x: 0, y: H - 76, width: W, height: 4, color: ACCENT_GREEN });

  // Title
  page.drawText(slide.title, {
    x: 30,
    y: H - 52,
    size: 26,
    font: fonts.bold,
    color: WHITE,
    maxWidth: W - 60,
  });

  let currentY = H - 110;

  if (slide.body) {
    page.drawText(slide.body, {
      x: 30,
      y: currentY,
      size: 14,
      font: fonts.regular,
      color: DARK_TEXT,
      maxWidth: W - 60,
      lineHeight: 20,
    });
    currentY -= 60;
  }

  if (slide.bullets) {
    for (const bullet of slide.bullets) {
      if (currentY < 80) break;
      // Bullet dot
      page.drawCircle({ x: 46, y: currentY + 5, size: 3, color: VISTA_BLUE });
      page.drawText(bullet, {
        x: 58,
        y: currentY,
        size: 15,
        font: fonts.regular,
        color: DARK_TEXT,
        maxWidth: W - 90,
        lineHeight: 21,
      });
      currentY -= 34;
    }
  }

  drawLogos(page, logos.vistaImg, logos.qualitasImg, fonts.regular, false);
}

async function addTwoColumnSlide(
  doc: PDFDocument,
  slide: SlideContent,
  fonts: { bold: PDFFont; regular: PDFFont },
  logos: { vistaImg: any; qualitasImg: any }
) {
  const page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  page.drawRectangle({ x: 0, y: H - 72, width: W, height: 72, color: DARK_BLUE });
  page.drawRectangle({ x: 0, y: H - 76, width: W, height: 4, color: ACCENT_GREEN });

  page.drawText(slide.title, {
    x: 30, y: H - 52, size: 26, font: fonts.bold, color: WHITE, maxWidth: W - 60,
  });

  // Divider
  page.drawLine({
    start: { x: W / 2, y: H - 88 },
    end: { x: W / 2, y: 70 },
    thickness: 1,
    color: VISTA_BLUE,
  });

  const left = slide.leftColumn ?? [];
  const right = slide.rightColumn ?? [];
  let lyY = H - 108;
  let ryY = H - 108;

  for (const item of left) {
    if (lyY < 80) break;
    page.drawCircle({ x: 38, y: lyY + 5, size: 3, color: ACCENT_GREEN });
    page.drawText(item, { x: 48, y: lyY, size: 13, font: fonts.regular, color: DARK_TEXT, maxWidth: W / 2 - 60 });
    lyY -= 30;
  }

  for (const item of right) {
    if (ryY < 80) break;
    page.drawCircle({ x: W / 2 + 10, y: ryY + 5, size: 3, color: ACCENT_GREEN });
    page.drawText(item, { x: W / 2 + 20, y: ryY, size: 13, font: fonts.regular, color: DARK_TEXT, maxWidth: W / 2 - 60 });
    ryY -= 30;
  }

  drawLogos(page, logos.vistaImg, logos.qualitasImg, fonts.regular, false);
}

export async function buildPdf(plan: PresentationPlan): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const fonts = { bold: boldFont, regular: regularFont };
  const logos = await embedLogos(doc);

  for (const slide of plan.slides) {
    switch (slide.layout) {
      case "title":
        await addTitleSlide(doc, slide, fonts, logos);
        break;
      case "two-column":
        await addTwoColumnSlide(doc, slide, fonts, logos);
        break;
      default:
        await addContentSlide(doc, slide, fonts, logos);
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
