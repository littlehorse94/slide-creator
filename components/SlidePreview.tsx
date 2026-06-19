"use client";

import { PresentationPlan, SlideContent } from "@/lib/generateSlides";

// ── Mini slide renderers ─────────────────────────────────────────

function TitleMini({ s }: { s: SlideContent }) {
  return (
    <div className="w-full h-full flex" style={{ background: "#1B3A6B" }}>
      <div className="flex flex-col justify-center px-4 py-3 z-10" style={{ width: "52%", background: "#1B3A6B", borderRight: "3px solid #1B9BD9" }}>
        <div className="w-8 h-0.5 mb-2" style={{ background: "#8DC63F" }} />
        <div className="font-black text-white leading-tight mb-1" style={{ fontSize: 11 }}>{s.title}</div>
        {s.subtitle && <div className="font-semibold" style={{ fontSize: 8, color: "#A8C8E8" }}>{s.subtitle}</div>}
      </div>
      <div className="flex-1" style={{ background: "linear-gradient(135deg, #1B3A6B, #1B9BD9)", opacity: 0.7 }} />
    </div>
  );
}

function ContentMini({ s }: { s: SlideContent }) {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "white" }}>
      <div className="px-3 py-1.5 flex items-center" style={{ background: "#1B3A6B", minHeight: 28 }}>
        <span className="font-black text-white truncate" style={{ fontSize: 9 }}>{s.title}</span>
      </div>
      <div className="w-full h-0.5" style={{ background: "#8DC63F" }} />
      <div className="flex-1 px-3 py-2 overflow-hidden">
        {(s.bullets ?? []).slice(0, 5).map((b, i) => (
          <div key={i} className="flex items-start gap-1 mb-1">
            <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: "#1B9BD9" }} />
            <span className="leading-tight" style={{ fontSize: 7, color: "#111827" }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageMini({ s, imgRight }: { s: SlideContent; imgRight: boolean }) {
  const photo = <div className="h-full" style={{ background: "linear-gradient(135deg, #1B3A6B, #1B9BD9)", minWidth: "40%" }} />;
  const text = (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-2 py-1.5" style={{ background: "#1B3A6B" }}>
        <span className="font-black text-white" style={{ fontSize: 8 }}>{s.title}</span>
      </div>
      <div className="px-2 py-1.5 flex-1 overflow-hidden">
        {(s.bullets ?? []).slice(0, 4).map((b, i) => (
          <div key={i} className="flex items-start gap-1 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: "#1B9BD9" }} />
            <span style={{ fontSize: 7, color: "#111827", lineHeight: 1.3 }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="w-full h-full flex" style={{ background: "white" }}>
      {imgRight ? <>{text}{photo}</> : <>{photo}{text}</>}
    </div>
  );
}

function ChartMini({ s }: { s: SlideContent }) {
  const data = s.chartData?.[0];
  const max  = data ? Math.max(...data.values, 1) : 1;
  const barColors = ["#1B9BD9", "#8DC63F", "#1B3A6B", "#FF9600", "#9B59B6"];
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "white" }}>
      <div className="px-3 py-1.5" style={{ background: "#1B3A6B", minHeight: 26 }}>
        <span className="font-black text-white truncate" style={{ fontSize: 9 }}>{s.title}</span>
      </div>
      <div className="w-full h-0.5" style={{ background: "#8DC63F" }} />
      <div className="flex-1 flex items-end gap-1 px-3 pb-2 pt-1 overflow-hidden">
        {data ? data.values.slice(0, 8).map((v, i) => (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-full rounded-sm" style={{ height: `${(v / max) * 52}px`, background: barColors[i % barColors.length], minHeight: 3 }} />
            <span className="truncate w-full text-center mt-0.5" style={{ fontSize: 5.5, color: "#4B5563" }}>{data.labels[i]}</span>
          </div>
        )) : <span style={{ fontSize: 8, color: "#9CA3AF" }}>Chart</span>}
      </div>
    </div>
  );
}

function BigStatMini({ s }: { s: SlideContent }) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#1B3A6B" }}>
      <div className="text-center px-3">
        <div className="font-black" style={{ fontSize: 8, color: "white", marginBottom: 2 }}>{s.title}</div>
        <div className="font-black" style={{ fontSize: 28, color: "#1B9BD9", lineHeight: 1 }}>{s.stat}</div>
        {s.statLabel && <div className="font-bold" style={{ fontSize: 7.5, color: "#8DC63F" }}>{s.statLabel}</div>}
      </div>
    </div>
  );
}

function TwoColMini({ s }: { s: SlideContent }) {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: "white" }}>
      <div className="px-3 py-1.5" style={{ background: "#1B3A6B", minHeight: 26 }}>
        <span className="font-black text-white" style={{ fontSize: 9 }}>{s.title}</span>
      </div>
      <div className="w-full h-0.5" style={{ background: "#8DC63F" }} />
      <div className="flex-1 flex gap-1 px-2 py-1.5 overflow-hidden">
        {[s.leftColumn, s.rightColumn].map((col, ci) => (
          <div key={ci} className="flex-1 overflow-hidden rounded px-1.5 py-1" style={{ background: "#F0F6FB" }}>
            {(col ?? []).slice(0, 4).map((b, i) => (
              <div key={i} className="flex items-start gap-1 mb-0.5">
                <div className="w-1 h-1 rounded-full mt-0.5 flex-shrink-0" style={{ background: "#8DC63F" }} />
                <span style={{ fontSize: 6.5, color: "#111827", lineHeight: 1.3 }}>{b}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterBar({ dark }: { dark?: boolean }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2"
      style={{ height: 14, background: dark ? "#1B3A6B" : "#F0F6FB", borderTop: "1.5px solid #1B9BD9" }}>
      <span className="font-black" style={{ fontSize: 5.5, color: dark ? "white" : "#1B3A6B" }}>VISTA</span>
      <span className="font-black" style={{ fontSize: 5.5, color: dark ? "white" : "#1B3A6B" }}>QUALITAS</span>
    </div>
  );
}

function SlideThumb({ s }: { s: SlideContent }) {
  const dark = s.layout === "title" || s.layout === "big-stat";
  return (
    <div className="relative w-full h-full overflow-hidden">
      {s.layout === "title"       && <TitleMini s={s} />}
      {s.layout === "chart"       && <ChartMini s={s} />}
      {s.layout === "big-stat"    && <BigStatMini s={s} />}
      {s.layout === "two-column"  && <TwoColMini s={s} />}
      {s.layout === "image-right" && <ImageMini s={s} imgRight />}
      {s.layout === "image-left"  && <ImageMini s={s} imgRight={false} />}
      {(!s.layout || s.layout === "content") && <ContentMini s={s} />}
      <FooterBar dark={dark} />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function SlidePreview({ plan, currentSlide, onSlideChange }: {
  plan: PresentationPlan;
  currentSlide: number;
  onSlideChange: (i: number) => void;
}) {
  const slide = plan.slides[currentSlide];
  const dark = slide.layout === "title" || slide.layout === "big-stat";

  return (
    <div className="flex flex-col gap-4">

      {/* Main preview ─ 16:9 */}
      <div className="relative overflow-hidden shadow-xl"
        style={{ aspectRatio: "16/9", borderRadius: 14,
          border: "3px solid #c8dff5", borderBottom: "5px solid #a0c4e0" }}>
        <SlideThumb s={slide} />
      </div>

      {/* Layout badge + slide title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-black px-2 py-1 rounded-lg uppercase tracking-wide"
          style={{ background: "#eef5ff", color: "#1B9BD9", border: "2px solid #c8dff5" }}>
          {slide.layout ?? "content"}
        </span>
        <span className="text-sm font-black truncate" style={{ color: "#1B3A6B" }}>{slide.title}</span>
      </div>

      {/* Prev / thumbnail strip / Next */}
      <div className="flex items-center gap-2">
        <button onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-3 py-2 rounded-xl font-black text-sm btn-chunky disabled:opacity-40 flex-shrink-0"
          style={{ background: "#eef5ff", color: "#1B9BD9", border: "2px solid #c8dff5", borderBottom: "4px solid #b0cce8" }}>
          ←
        </button>

        <div className="flex-1 flex gap-2 overflow-x-auto py-1">
          {plan.slides.map((s, i) => (
            <button key={i} onClick={() => onSlideChange(i)}
              className="flex-shrink-0 overflow-hidden transition-all"
              style={{ width: 80, height: 45, borderRadius: 8,
                border: i === currentSlide ? "3px solid #1B9BD9" : "2px solid #d0e4f5",
                borderBottom: i === currentSlide ? "4px solid #1482b8" : "3px solid #b8cfe0" }}>
              <SlideThumb s={s} />
            </button>
          ))}
        </div>

        <button onClick={() => onSlideChange(Math.min(plan.slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === plan.slides.length - 1}
          className="px-3 py-2 rounded-xl font-black text-sm btn-chunky disabled:opacity-40 flex-shrink-0"
          style={{ background: "#eef5ff", color: "#1B9BD9", border: "2px solid #c8dff5", borderBottom: "4px solid #b0cce8" }}>
          →
        </button>
      </div>
    </div>
  );
}
