import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/logos");
mkdirSync(OUT, { recursive: true });

// Vista logo SVG
const vistaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <rect width="320" height="80" fill="white"/>
  <!-- Eye icon -->
  <g transform="translate(10,12)">
    <path d="M28 28 C14 14 0 28 0 28 C0 28 14 42 28 42 C42 42 56 28 56 28 C56 28 42 14 28 14 Z" fill="none" stroke="#1B9BD9" stroke-width="3.5"/>
    <circle cx="28" cy="28" r="10" fill="#1B9BD9"/>
    <circle cx="28" cy="28" r="5" fill="white"/>
    <!-- Leaf accent -->
    <path d="M44 16 Q56 8 60 20 Q48 24 44 16Z" fill="#8DC63F"/>
  </g>
  <!-- Text -->
  <text x="78" y="35" font-family="Arial,sans-serif" font-weight="900" font-size="26" fill="#1B9BD9" letter-spacing="-0.5">VISTA</text>
  <text x="78" y="52" font-family="Arial,sans-serif" font-weight="400" font-size="13" fill="#1B3A6B" letter-spacing="2">eye specialist</text>
  <text x="78" y="67" font-family="Arial,sans-serif" font-weight="400" font-size="12" fill="#1B9BD9">眼科</text>
</svg>`;

// Qualitas logo SVG
const qualitasSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
  <rect width="320" height="80" fill="white"/>
  <!-- Globe icon -->
  <g transform="translate(6,8)">
    <circle cx="32" cy="32" r="28" fill="none" stroke="#1B3A6B" stroke-width="3"/>
    <ellipse cx="32" cy="32" rx="14" ry="28" fill="none" stroke="#1B3A6B" stroke-width="2"/>
    <line x1="6" y1="20" x2="58" y2="20" stroke="#1B3A6B" stroke-width="2"/>
    <line x1="4" y1="32" x2="60" y2="32" stroke="#1B3A6B" stroke-width="2"/>
    <line x1="6" y1="44" x2="58" y2="44" stroke="#1B3A6B" stroke-width="2"/>
    <!-- Green top accent -->
    <path d="M20 8 Q32 2 44 8 Q38 16 32 16 Q26 16 20 8Z" fill="#8DC63F"/>
  </g>
  <!-- Text -->
  <text x="76" y="30" font-family="Georgia,serif" font-weight="700" font-size="22" fill="#1B3A6B" letter-spacing="1">QUALITAS</text>
  <text x="76" y="54" font-family="Arial,sans-serif" font-weight="700" font-size="22" fill="#8DC63F">health</text>
</svg>`;

async function svgToPng(svg, outPath, w, h) {
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(outPath);
  console.log("Created", outPath);
}

await svgToPng(vistaSvg,   join(OUT, "vista-logo.png"),   320, 80);
await svgToPng(qualitasSvg, join(OUT, "qualitas-logo.png"), 320, 80);
console.log("Logos generated!");
