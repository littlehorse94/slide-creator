"use client";

import { PresentationPlan, SlideContent } from "@/lib/generateSlides";

interface SlidePreviewProps {
  plan: PresentationPlan;
  currentSlide: number;
  onSlideChange: (idx: number) => void;
}

function TitleSlidePreview({ slide, theme }: { slide: SlideContent; theme: PresentationPlan["theme"] }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#1B3A6B" }}>
      <div className="absolute bottom-0 left-0 right-0 h-[30%]" style={{ background: "#1B9BD9" }} />
      <div className="absolute" style={{ bottom: "30%", left: 0, right: 0, height: 4, background: "#8DC63F" }} />
      <div className="absolute inset-0 flex flex-col justify-center px-8 pb-12">
        <h1 className="text-2xl font-bold text-white leading-tight mb-3">{slide.title}</h1>
        {slide.subtitle && <p className="text-sm text-blue-100">{slide.subtitle}</p>}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-4">
        <div className="w-16 h-5 bg-white/20 rounded text-[6px] text-white flex items-center justify-center">VISTA</div>
        <div className="w-16 h-5 bg-white/20 rounded text-[6px] text-white flex items-center justify-center">QUALITAS</div>
      </div>
    </div>
  );
}

function ContentSlidePreview({ slide }: { slide: SlideContent }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 h-12" style={{ background: "#1B3A6B" }} />
      <div className="absolute top-12 left-0 right-0 h-1" style={{ background: "#8DC63F" }} />
      <h2 className="absolute top-2 left-4 right-4 text-sm font-bold text-white truncate">{slide.title}</h2>
      <div className="absolute top-14 left-4 right-4 bottom-10 overflow-hidden">
        {slide.body && <p className="text-xs text-gray-700 mb-2 line-clamp-2">{slide.body}</p>}
        <ul className="space-y-1">
          {(slide.bullets ?? []).slice(0, 6).map((b, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#1B9BD9" }} />
              <span className="text-xs text-gray-700 line-clamp-2">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-between px-3">
        <div className="w-12 h-3 bg-slate-100 rounded text-[5px] text-slate-500 flex items-center justify-center">VISTA</div>
        <div className="w-12 h-3 bg-slate-100 rounded text-[5px] text-slate-500 flex items-center justify-center">QUALITAS</div>
      </div>
    </div>
  );
}

function TwoColumnSlidePreview({ slide }: { slide: SlideContent }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      <div className="absolute top-0 left-0 right-0 h-12" style={{ background: "#1B3A6B" }} />
      <div className="absolute top-12 left-0 right-0 h-1" style={{ background: "#8DC63F" }} />
      <h2 className="absolute top-2 left-4 right-4 text-sm font-bold text-white truncate">{slide.title}</h2>
      <div className="absolute top-14 left-4 right-4 bottom-10 overflow-hidden flex gap-2">
        <div className="flex-1 overflow-hidden">
          <ul className="space-y-1">
            {(slide.leftColumn ?? []).slice(0, 5).map((b, i) => (
              <li key={i} className="text-xs text-gray-700 line-clamp-1">• {b}</li>
            ))}
          </ul>
        </div>
        <div className="w-px bg-blue-200" />
        <div className="flex-1 overflow-hidden">
          <ul className="space-y-1">
            {(slide.rightColumn ?? []).slice(0, 5).map((b, i) => (
              <li key={i} className="text-xs text-gray-700 line-clamp-1">• {b}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="absolute bottom-1 left-0 right-0 flex items-center justify-between px-3">
        <div className="w-12 h-3 bg-slate-100 rounded text-[5px] text-slate-500 flex items-center justify-center">VISTA</div>
        <div className="w-12 h-3 bg-slate-100 rounded text-[5px] text-slate-500 flex items-center justify-center">QUALITAS</div>
      </div>
    </div>
  );
}

export default function SlidePreview({ plan, currentSlide, onSlideChange }: SlidePreviewProps) {
  const slide = plan.slides[currentSlide];

  return (
    <div className="flex flex-col gap-4">
      {/* Main preview */}
      <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: "16/9" }}>
        <div className="absolute inset-2">
          {slide.layout === "title" ? (
            <TitleSlidePreview slide={slide} theme={plan.theme} />
          ) : slide.layout === "two-column" ? (
            <TwoColumnSlidePreview slide={slide} />
          ) : (
            <ContentSlidePreview slide={slide} />
          )}
        </div>
        {/* Slide counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentSlide + 1} / {plan.slides.length}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-medium transition-colors"
        >
          ← Prev
        </button>
        {/* Thumbnail strip */}
        <div className="flex-1 flex gap-1.5 overflow-x-auto py-1 px-1">
          {plan.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => onSlideChange(i)}
              className={`flex-shrink-0 w-16 h-9 rounded border-2 overflow-hidden transition-all ${
                i === currentSlide
                  ? "border-[#1B9BD9] shadow-md"
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              <div className="w-full h-full scale-[0.3] origin-top-left" style={{ width: "333%", height: "333%" }}>
                {s.layout === "title" ? (
                  <TitleSlidePreview slide={s} theme={plan.theme} />
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
          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
