"use client";

import { PresentationPlan, SlideContent } from "@/lib/generateSlides";

function TitleSlidePreview({ slide }: { slide: SlideContent }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#1B3A6B" }}>
      <div className="absolute bottom-0 left-0 right-0 h-[30%]" style={{ background: "#1B9BD9" }} />
      <div className="absolute" style={{ bottom: "30%", left: 0, right: 0, height: 4, background: "#8DC63F" }} />
      <div className="absolute inset-0 flex flex-col justify-center px-8 pb-12">
        <h1 className="text-2xl font-black text-white leading-tight mb-2">{slide.title}</h1>
        {slide.subtitle && <p className="text-sm font-semibold text-blue-200">{slide.subtitle}</p>}
      </div>
      <div className="absolute bottom-1.5 left-0 right-0 flex items-center justify-between px-4">
        <div className="px-2 py-0.5 rounded text-white font-black" style={{ background: "rgba(255,255,255,0.15)", fontSize: 6 }}>VISTA</div>
        <div className="px-2 py-0.5 rounded text-white font-black" style={{ background: "rgba(255,255,255,0.15)", fontSize: 6 }}>QUALITAS</div>
      </div>
    </div>
  );
}

function ContentSlidePreview({ slide }: { slide: SlideContent }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 h-11" style={{ background: "#1B3A6B" }} />
      <div className="absolute top-11 left-0 right-0 h-1" style={{ background: "#8DC63F" }} />
      <div className="absolute top-2 left-3 right-3 font-black text-white truncate" style={{ fontSize: 10 }}>{slide.title}</div>
      <div className="absolute top-14 left-3 right-3 bottom-8 overflow-hidden">
        {slide.body && <p className="mb-1 text-gray-700 line-clamp-2" style={{ fontSize: 8 }}>{slide.body}</p>}
        <ul className="space-y-1">
          {(slide.bullets ?? []).slice(0, 6).map((b, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="mt-0.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#1B9BD9", marginTop: 3 }} />
              <span className="text-gray-700 line-clamp-1" style={{ fontSize: 8 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-between px-3">
        <div className="px-1.5 py-0.5 rounded font-black text-slate-400" style={{ background: "#f5f7fa", fontSize: 5 }}>VISTA</div>
        <div className="px-1.5 py-0.5 rounded font-black text-slate-400" style={{ background: "#f5f7fa", fontSize: 5 }}>QUALITAS</div>
      </div>
    </div>
  );
}

export default function SlidePreview({ plan, currentSlide, onSlideChange }: {
  plan: PresentationPlan;
  currentSlide: number;
  onSlideChange: (idx: number) => void;
}) {
  const slide = plan.slides[currentSlide];

  return (
    <div className="flex flex-col gap-4">
      {/* Main preview */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "16/9",
          borderRadius: 16,
          border: "3px solid #d0e4f5",
          borderBottom: "5px solid #b8d0e8",
          background: "#1B3A6B",
        }}
      >
        <div className="absolute inset-0">
          {slide.layout === "title" ? (
            <TitleSlidePreview slide={slide} />
          ) : (
            <ContentSlidePreview slide={slide} />
          )}
        </div>
      </div>

      {/* Nav row */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-4 py-2 rounded-xl font-black text-sm transition-all btn-chunky disabled:opacity-40"
          style={{ background: "#eef5ff", color: "#1B9BD9", border: "2px solid #c8dff5", borderBottom: "4px solid #b0cce8" }}
        >
          ← Prev
        </button>

        {/* Thumbnails */}
        <div className="flex-1 flex gap-2 overflow-x-auto py-1 px-1">
          {plan.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => onSlideChange(i)}
              className="flex-shrink-0 overflow-hidden transition-all"
              style={{
                width: 64,
                height: 36,
                borderRadius: 8,
                border: i === currentSlide ? "3px solid #1B9BD9" : "2px solid #d0e4f5",
                borderBottom: i === currentSlide ? "4px solid #1482b8" : "3px solid #b8cfe0",
              }}
            >
              <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
                {s.layout === "title" ? (
                  <TitleSlidePreview slide={s} />
                ) : (
                  <ContentSlidePreview slide={s} />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSlideChange(Math.min(plan.slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === plan.slides.length - 1}
          className="px-4 py-2 rounded-xl font-black text-sm transition-all btn-chunky disabled:opacity-40"
          style={{ background: "#eef5ff", color: "#1B9BD9", border: "2px solid #c8dff5", borderBottom: "4px solid #b0cce8" }}
        >
          Next →
        </button>
      </div>

      {/* Slide title */}
      <div className="text-center">
        <div className="font-black text-sm" style={{ color: "#1B3A6B" }}>{slide.title}</div>
        {slide.layout && (
          <div className="text-xs font-semibold text-slate-400 capitalize">{slide.layout} slide</div>
        )}
      </div>
    </div>
  );
}
