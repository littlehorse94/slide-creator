import satori from "satori";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import type { SlideContent, PresentationPlan } from "./generateSlides";
import { fetchPexelsPhoto } from "./pexels";

// ── dimensions ──────────────────────────────────────────────────────────────
const W = 1280;
const H = 720;

// ── brand ───────────────────────────────────────────────────────────────────
const NAVY  = "#1B3A6B";
const BLUE  = "#1B9BD9";
const GREEN = "#8DC63F";
const WHITE = "#FFFFFF";
const LIGHT = "#F4F6F9";

// ── logos ───────────────────────────────────────────────────────────────────
function logoDataUri(name: "vista" | "qualitas"): string {
  const p = path.join(process.cwd(), "public", "logos", `${name}-logo.png`);
  const b64 = fs.readFileSync(p).toString("base64");
  return `data:image/png;base64,${b64}`;
}

// ── font loading (Inter via Google Fonts fallback / local) ───────────────────
let fontData: ArrayBuffer | null = null;
let fontBoldData: ArrayBuffer | null = null;

async function getFonts() {
  if (fontData && fontBoldData) return { regular: fontData, bold: fontBoldData };
  // Try local next.js cache first, then fetch
  try {
    const [r, b] = await Promise.all([
      fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff").then(r => r.arrayBuffer()),
      fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff").then(r => r.arrayBuffer()),
    ]);
    fontData = r;
    fontBoldData = b;
  } catch {
    // If font fetch fails, satori will use system fallback
    fontData = new ArrayBuffer(0);
    fontBoldData = new ArrayBuffer(0);
  }
  return { regular: fontData, bold: fontBoldData };
}

// ── shared footer bar ────────────────────────────────────────────────────────
function footerBar(vistaUri: string, qualitasUri: string) {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute" as const,
        bottom: 0, left: 0, right: 0,
        height: 52,
        background: NAVY,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 36px",
      },
      children: [
        { type: "img", props: { src: vistaUri,    style: { height: 30, objectFit: "contain" as const } } },
        {
          type: "div",
          props: {
            style: { width: 1, height: 24, background: "rgba(255,255,255,0.3)" },
          },
        },
        { type: "img", props: { src: qualitasUri, style: { height: 26, objectFit: "contain" as const } } },
      ],
    },
  };
}

// ── accent line ──────────────────────────────────────────────────────────────
function accentLine(color = GREEN, width = 60) {
  return {
    type: "div",
    props: {
      style: { width, height: 4, background: color, borderRadius: 2, marginBottom: 16 },
    },
  };
}

// ── chart SVG ────────────────────────────────────────────────────────────────
function buildBarChartSvg(labels: string[], values: number[], w: number, h: number): string {
  const max = Math.max(...values, 1);
  const barW = Math.floor((w - 40) / values.length) - 8;
  const bars = values.map((v, i) => {
    const barH = Math.floor(((v / max) * (h - 60)));
    const x = 20 + i * (barW + 8);
    const y = h - 40 - barH;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${BLUE}" opacity="${0.7 + 0.3 * (i % 2)}" />
      <text x="${x + barW / 2}" y="${h - 22}" text-anchor="middle" font-size="11" fill="${NAVY}" font-family="Inter,sans-serif">${labels[i] ?? ""}</text>
      <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="bold" fill="${NAVY}" font-family="Inter,sans-serif">${v}</text>
    `;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bars}</svg>`;
}

function buildPieChartSvg(labels: string[], values: number[], size: number): string {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const colors = [BLUE, GREEN, NAVY, "#F59E0B", "#EF4444", "#8B5CF6"];
  const cx = size / 2, cy = size / 2, r = size / 2 - 20;
  let startAngle = -Math.PI / 2;
  const slices = values.map((v, i) => {
    const angle = (v / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + r * Math.cos(startAngle);
    const y2 = cy + r * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" opacity="0.85"/>`;
  });
  const legend = labels.map((l, i) => {
    const ly = size - 14 * (labels.length - i);
    return `<rect x="4" y="${ly - 9}" width="10" height="10" rx="2" fill="${colors[i % colors.length]}"/>
            <text x="18" y="${ly}" font-size="11" fill="${NAVY}" font-family="Inter,sans-serif">${l}: ${values[i]}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${slices.join("")}${legend.join("")}</svg>`;
}

// ── slide builders ──────────────────────────────────────────────────────────

function titleSlide(s: SlideContent, photo: string | null, vistaUri: string, qualitasUri: string) {
  return {
    type: "div",
    props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column" as const, position: "relative" as const, fontFamily: "Inter,sans-serif", background: LIGHT },
      children: [
        // Top: image half with navy overlay
        {
          type: "div",
          props: {
            style: {
              position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 52,
              display: "flex",
            },
            children: [
              // Left navy panel
              {
                type: "div",
                props: {
                  style: {
                    width: "55%", background: NAVY, display: "flex", flexDirection: "column" as const,
                    justifyContent: "center", padding: "48px 52px",
                  },
                  children: [
                    accentLine(GREEN, 72),
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 54, fontWeight: 800, color: WHITE, lineHeight: 1.1, marginBottom: 20 },
                        children: s.title,
                      },
                    },
                    s.subtitle ? {
                      type: "div",
                      props: {
                        style: { fontSize: 22, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 },
                        children: s.subtitle,
                      },
                    } : null,
                  ].filter(Boolean),
                },
              },
              // Right: photo
              photo ? {
                type: "div",
                props: {
                  style: { flex: 1, position: "relative" as const, overflow: "hidden" as const },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: photo,
                        style: { width: "100%", height: "100%", objectFit: "cover" as const },
                      },
                    },
                    // Gradient blend
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute" as const, inset: 0,
                          background: `linear-gradient(to right, ${NAVY} 0%, transparent 40%)`,
                        },
                      },
                    },
                  ],
                },
              } : {
                type: "div",
                props: { style: { flex: 1, background: BLUE } },
              },
            ],
          },
        },
        footerBar(vistaUri, qualitasUri),
      ],
    },
  };
}

function contentSlide(s: SlideContent, photo: string | null, vistaUri: string, qualitasUri: string) {
  const bullets = s.bullets ?? [];
  return {
    type: "div",
    props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column" as const, position: "relative" as const, fontFamily: "Inter,sans-serif", background: WHITE },
      children: [
        // Header bar
        {
          type: "div",
          props: {
            style: { height: 72, background: NAVY, display: "flex", alignItems: "center", padding: "0 40px", flexShrink: 0 },
            children: [
              {
                type: "div",
                props: {
                  style: { width: 5, height: 36, background: GREEN, borderRadius: 3, marginRight: 16 },
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: 28, fontWeight: 700, color: WHITE },
                  children: s.title,
                },
              },
            ],
          },
        },
        // Body
        {
          type: "div",
          props: {
            style: { flex: 1, display: "flex", padding: "24px 40px 0 40px", gap: 32 },
            children: [
              // Bullets
              {
                type: "div",
                props: {
                  style: { flex: 1, display: "flex", flexDirection: "column" as const, gap: 14 },
                  children: bullets.slice(0, 7).map((b) => ({
                    type: "div",
                    props: {
                      style: { display: "flex", alignItems: "flex-start", gap: 12 },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: { width: 8, height: 8, borderRadius: "50%", background: BLUE, marginTop: 8, flexShrink: 0 },
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { fontSize: 19, color: NAVY, lineHeight: 1.5 },
                            children: b,
                          },
                        },
                      ],
                    },
                  })),
                },
              },
              // Photo
              photo ? {
                type: "div",
                props: {
                  style: { width: 340, borderRadius: 12, overflow: "hidden" as const, flexShrink: 0 },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: photo,
                        style: { width: "100%", height: "100%", objectFit: "cover" as const },
                      },
                    },
                  ],
                },
              } : null,
            ].filter(Boolean),
          },
        },
        footerBar(vistaUri, qualitasUri),
      ],
    },
  };
}

function bigStatSlide(s: SlideContent, photo: string | null, vistaUri: string, qualitasUri: string) {
  const bullets = s.bullets ?? [];
  return {
    type: "div",
    props: {
      style: { width: W, height: H, display: "flex", position: "relative" as const, fontFamily: "Inter,sans-serif" },
      children: [
        // Left: navy with big stat
        {
          type: "div",
          props: {
            style: {
              width: "45%", background: NAVY, display: "flex", flexDirection: "column" as const,
              justifyContent: "center", alignItems: "center", padding: "40px 36px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: { fontSize: 96, fontWeight: 900, color: WHITE, lineHeight: 1 },
                  children: s.stat ?? "",
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: 20, color: GREEN, fontWeight: 600, marginTop: 8, textAlign: "center" as const },
                  children: s.statLabel ?? "",
                },
              },
              accentLine(GREEN, 80),
              {
                type: "div",
                props: {
                  style: { fontSize: 22, fontWeight: 700, color: WHITE, textAlign: "center" as const },
                  children: s.title,
                },
              },
            ],
          },
        },
        // Right: photo + bullets
        {
          type: "div",
          props: {
            style: {
              flex: 1, display: "flex", flexDirection: "column" as const,
              background: LIGHT, padding: "40px 36px 56px 36px", gap: 14,
            },
            children: [
              photo ? {
                type: "img",
                props: {
                  src: photo,
                  style: { width: "100%", height: 200, objectFit: "cover" as const, borderRadius: 10, marginBottom: 8 },
                },
              } : null,
              ...bullets.slice(0, 4).map((b) => ({
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "flex-start", gap: 10 },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: 28, height: 28, borderRadius: "50%", background: BLUE,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, color: WHITE, fontSize: 14, fontWeight: 700,
                        },
                        children: "✓",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { fontSize: 18, color: NAVY, lineHeight: 1.5 },
                        children: b,
                      },
                    },
                  ],
                },
              })),
            ].filter(Boolean),
          },
        },
        footerBar(vistaUri, qualitasUri),
      ],
    },
  };
}

function chartSlide(s: SlideContent, vistaUri: string, qualitasUri: string) {
  const dataset = s.chartData?.[0];
  const labels  = dataset?.labels  ?? [];
  const values  = dataset?.values  ?? [];
  const bullets = s.bullets ?? [];

  const chartSvg = s.chartType === "pie"
    ? buildPieChartSvg(labels, values, 300)
    : buildBarChartSvg(labels, values, 560, 300);

  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(chartSvg).toString("base64")}`;

  return {
    type: "div",
    props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column" as const, position: "relative" as const, fontFamily: "Inter,sans-serif", background: WHITE },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: { height: 72, background: NAVY, display: "flex", alignItems: "center", padding: "0 40px", flexShrink: 0 },
            children: [
              { type: "div", props: { style: { width: 5, height: 36, background: GREEN, borderRadius: 3, marginRight: 16 } } },
              { type: "div", props: { style: { fontSize: 28, fontWeight: 700, color: WHITE }, children: s.title } },
            ],
          },
        },
        // Body
        {
          type: "div",
          props: {
            style: { flex: 1, display: "flex", padding: "20px 40px 12px 40px", gap: 32 },
            children: [
              // Chart
              {
                type: "div",
                props: {
                  style: {
                    flex: 1, background: LIGHT, borderRadius: 12, display: "flex",
                    alignItems: "center", justifyContent: "center", padding: 16,
                  },
                  children: [
                    { type: "img", props: { src: svgDataUri, style: { maxWidth: "100%", maxHeight: "100%" } } },
                  ],
                },
              },
              // Insight panel
              {
                type: "div",
                props: {
                  style: {
                    width: 280, background: NAVY, borderRadius: 12, padding: 24,
                    display: "flex", flexDirection: "column" as const, gap: 14,
                  },
                  children: [
                    { type: "div", props: { style: { fontSize: 14, fontWeight: 700, color: GREEN, letterSpacing: 1 }, children: "KEY INSIGHTS" } },
                    accentLine(GREEN, 40),
                    ...bullets.slice(0, 4).map((b) => ({
                      type: "div",
                      props: {
                        style: { fontSize: 15, color: WHITE, lineHeight: 1.5, paddingLeft: 12, borderLeft: `3px solid ${BLUE}` },
                        children: b,
                      },
                    })),
                  ],
                },
              },
            ],
          },
        },
        footerBar(vistaUri, qualitasUri),
      ],
    },
  };
}

function twoColumnSlide(s: SlideContent, vistaUri: string, qualitasUri: string) {
  const left  = s.leftColumn  ?? [];
  const right = s.rightColumn ?? [];
  return {
    type: "div",
    props: {
      style: { width: W, height: H, display: "flex", flexDirection: "column" as const, position: "relative" as const, fontFamily: "Inter,sans-serif", background: WHITE },
      children: [
        // Header
        {
          type: "div",
          props: {
            style: { height: 72, background: NAVY, display: "flex", alignItems: "center", padding: "0 40px", flexShrink: 0 },
            children: [
              { type: "div", props: { style: { width: 5, height: 36, background: GREEN, borderRadius: 3, marginRight: 16 } } },
              { type: "div", props: { style: { fontSize: 28, fontWeight: 700, color: WHITE }, children: s.title } },
            ],
          },
        },
        // Two columns
        {
          type: "div",
          props: {
            style: { flex: 1, display: "flex", padding: "28px 40px 60px 40px", gap: 24 },
            children: [left, right].map((col, ci) => ({
              type: "div",
              props: {
                style: {
                  flex: 1, background: ci === 0 ? LIGHT : `${NAVY}10`,
                  borderRadius: 12, padding: 24, display: "flex", flexDirection: "column" as const, gap: 12,
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: { fontSize: 13, fontWeight: 700, color: ci === 0 ? BLUE : NAVY, letterSpacing: 1, marginBottom: 4 },
                      children: ci === 0 ? "▶  COLUMN A" : "▶  COLUMN B",
                    },
                  },
                  ...col.map((item) => ({
                    type: "div",
                    props: {
                      style: {
                        background: WHITE, borderRadius: 8, padding: "10px 16px",
                        fontSize: 17, color: NAVY, borderLeft: `4px solid ${ci === 0 ? BLUE : GREEN}`,
                      },
                      children: item,
                    },
                  })),
                ],
              },
            })),
          },
        },
        footerBar(vistaUri, qualitasUri),
      ],
    },
  };
}

// ── render one slide to PNG buffer ───────────────────────────────────────────
async function renderSlide(element: object): Promise<Buffer> {
  const { regular, bold } = await getFonts();
  const fonts = [];
  if (regular.byteLength > 0) {
    fonts.push({ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const });
  }
  if (bold.byteLength > 0) {
    fonts.push({ name: "Inter", data: bold, weight: 700 as const, style: "normal" as const });
  }

  const svg = await satori(element as Parameters<typeof satori>[0], {
    width: W,
    height: H,
    fonts: fonts.length > 0 ? fonts : [{ name: "sans-serif", data: regular.byteLength > 0 ? regular : new ArrayBuffer(0), weight: 400, style: "normal" }],
  });

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// ── main export ──────────────────────────────────────────────────────────────
export async function buildInfographicPdf(plan: PresentationPlan): Promise<Buffer> {
  const vistaUri    = logoDataUri("vista");
  const qualitasUri = logoDataUri("qualitas");

  const pngBuffers: Buffer[] = [];

  for (const slide of plan.slides) {
    // Fetch photo for layouts that use one
    let photo: string | null = null;
    if (slide.imageQuery && slide.layout !== "chart" && slide.layout !== "two-column") {
      try {
        const { downloadImageAsBase64 } = await import("./pexels");
        const result = await fetchPexelsPhoto(slide.imageQuery);
        if (result) photo = await downloadImageAsBase64(result.url);
      } catch { /* skip photo on error */ }
    }

    let element: object;
    switch (slide.layout) {
      case "title":
        element = titleSlide(slide, photo, vistaUri, qualitasUri);
        break;
      case "chart":
        element = chartSlide(slide, vistaUri, qualitasUri);
        break;
      case "big-stat":
        element = bigStatSlide(slide, photo, vistaUri, qualitasUri);
        break;
      case "two-column":
        element = twoColumnSlide(slide, vistaUri, qualitasUri);
        break;
      default:
        element = contentSlide(slide, photo, vistaUri, qualitasUri);
    }

    const png = await renderSlide(element);
    pngBuffers.push(png);
  }

  // Combine PNGs into a single PDF
  const pdfDoc = await PDFDocument.create();
  for (const png of pngBuffers) {
    const img  = await pdfDoc.embedPng(png);
    const page = pdfDoc.addPage([W, H]);
    page.drawImage(img, { x: 0, y: 0, width: W, height: H });
  }

  return Buffer.from(await pdfDoc.save());
}
