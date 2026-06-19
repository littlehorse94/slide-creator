"use client";

import { useState, useRef } from "react";
import DropZone from "@/components/DropZone";
import SlidePreview from "@/components/SlidePreview";
import { PresentationPlan } from "@/lib/generateSlides";

export default function Home() {
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<"pptx" | "pdf">("pptx");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PresentationPlan | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const doGenerate = async (overrideFormat?: "pptx" | "pdf") => {
    const outputFormat = overrideFormat ?? format;
    if (!prompt.trim()) {
      setError("Please describe what slides you want to create.");
      return;
    }
    setError(null);
    setLoading(true);
    setPlan(null);
    setDownloadUrl(null);

    try {
      const body = new FormData();
      body.append("prompt", prompt);
      body.append("format", outputFormat);
      for (const f of referenceFiles) body.append("reference", f);
      for (const f of sourceFiles) body.append("source", f);

      const res = await fetch("/api/generate", { method: "POST", body });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Server error ${res.status}`);
      }

      const planHeader = res.headers.get("X-Slide-Plan");
      if (planHeader) {
        const parsed = JSON.parse(decodeURIComponent(planHeader));
        setPlan(parsed);
        setCurrentSlide(0);
      }

      const blob = await res.blob();
      setDownloadUrl(URL.createObjectURL(blob));
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="?([^"]+)"?/);
      setDownloadFilename(match?.[1] ?? `slides.${outputFormat}`);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReferenceFiles([]);
    setSourceFiles([]);
    setPrompt("");
    setPlan(null);
    setDownloadUrl(null);
    setError(null);
  };

  const completedSteps = [
    referenceFiles.length > 0 || sourceFiles.length > 0,
    prompt.trim().length > 0,
    !!plan,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #e8f4fd 0%, #dff0ff 40%, #e6faf0 100%)" }}>

      {/* ── HEADER ── */}
      <header style={{ background: "#1B9BD9", borderBottom: "4px solid #1482b8" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md"
              style={{ background: "white", color: "#1B9BD9", border: "3px solid rgba(255,255,255,0.5)" }}
            >
              V
            </div>
            <div>
              <div className="text-white font-black text-lg leading-tight tracking-tight">Vista Slide Creator</div>
              <div className="text-blue-100 text-xs font-semibold">Powered by AI ✨</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mr-2"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "2px solid rgba(255,255,255,0.25)" }}
            >
              ✨ Gemini · 📸 Pexels
            </div>
            {["Upload", "Describe", "Create"].map((label, i) => {
              const done = completedSteps > i;
              const active = completedSteps === i;
              return (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: done ? "#8DC63F" : active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                    color: done || active ? "white" : "rgba(255,255,255,0.6)",
                    border: done ? "2px solid #75a832" : "2px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {done ? "✓" : i + 1} {label}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* ── HERO ── */}
        <div
          className="rounded-3xl p-8 flex items-center justify-between overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #1B3A6B 0%, #1B9BD9 100%)", border: "3px solid #1B3A6B", borderBottom: "6px solid #132b52" }}
        >
          <div className="relative z-10">
            <h1 className="text-white font-black text-3xl leading-tight mb-1">Build slides in seconds 🚀</h1>
            <p className="text-blue-200 font-semibold text-sm max-w-md">
              Drop your data, describe your vision, and let AI craft a branded presentation — complete with Vista &amp; Qualitas logos.
            </p>
          </div>
          <div className="text-8xl select-none opacity-30 absolute right-8 top-1/2 -translate-y-1/2">📊</div>
        </div>

        {/* ── STEP 1: UPLOADS ── */}
        <div className="card-duo bg-white p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: "#1B9BD9", border: "2px solid #1482b8" }}>1</div>
            <div>
              <div className="font-black text-lg" style={{ color: "#1B3A6B" }}>Upload your files</div>
              <div className="text-slate-500 text-xs font-semibold">Add as many files as you need — both zones support multiple files</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <DropZone
              label="📸 Reference Slides or Images"
              hint="PDF or images — AI will copy this design style"
              accept={{
                "application/pdf": [".pdf"],
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
              }}
              files={referenceFiles}
              onFiles={setReferenceFiles}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <DropZone
              label="📊 Data Sources"
              hint="Excel, CSV, or PDF — AI extracts content from all files"
              accept={{
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                "application/vnd.ms-excel": [".xls"],
                "text/csv": [".csv"],
                "application/pdf": [".pdf"],
              }}
              files={sourceFiles}
              onFiles={setSourceFiles}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* ── STEP 2: PROMPT ── */}
        <div className="card-duo bg-white p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: "#8DC63F", border: "2px solid #75a832" }}>2</div>
            <div>
              <div className="font-black text-lg" style={{ color: "#1B3A6B" }}>Describe your slides</div>
              <div className="text-slate-500 text-xs font-semibold">Tell AI what to create — be as detailed as you like</div>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a Q3 2024 quarterly report for Vista Eye Specialist with patient volume stats, revenue by clinic, and a highlight on the new Petaling Jaya branch opening. Keep it professional and concise — 8 slides max."
            rows={5}
            className="w-full rounded-2xl p-4 text-sm font-semibold placeholder-slate-400 resize-none focus:outline-none transition-all"
            style={{ border: "2px solid #e0e9f5", borderBottom: "4px solid #c8d8ea", color: "#1B3A6B", background: "#f8fbff" }}
            onFocus={(e) => { e.target.style.borderColor = "#1B9BD9"; e.target.style.borderBottomColor = "#1482b8"; e.target.style.background = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e0e9f5"; e.target.style.borderBottomColor = "#c8d8ea"; e.target.style.background = "#f8fbff"; }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400 font-semibold">
              {prompt.length > 0 ? `${prompt.length} characters` : "Try to be specific for better results!"}
            </span>
            {prompt.length > 20 && <span className="text-xs font-bold" style={{ color: "#8DC63F" }}>✓ Looks good!</span>}
          </div>
        </div>

        {/* ── STEP 3: FORMAT + GENERATE ── */}
        <div className="card-duo bg-white p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: "#FF9600", border: "2px solid #cc7800" }}>3</div>
            <div>
              <div className="font-black text-lg" style={{ color: "#1B3A6B" }}>Choose format &amp; generate</div>
              <div className="text-slate-500 text-xs font-semibold">Pick your output format, then hit Create!</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-3">
              {(["pptx", "pdf"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className="px-5 py-3 rounded-2xl font-black text-sm transition-all"
                  style={
                    format === f
                      ? { background: "#1B9BD9", color: "white", border: "2px solid #1482b8", borderBottom: "4px solid #1482b8" }
                      : { background: "#f0f8ff", color: "#1B9BD9", border: "2px solid #c8dff5", borderBottom: "4px solid #b0cce8" }
                  }
                >
                  {f === "pptx" ? "📑 PPTX" : "📄 PDF"}
                </button>
              ))}
            </div>

            <button
              onClick={() => doGenerate()}
              disabled={loading || !prompt.trim()}
              className="sm:ml-auto flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-base transition-all btn-chunky disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: loading ? "#94a3b8" : "linear-gradient(135deg, #1B9BD9 0%, #1B3A6B 100%)",
                border: "2px solid rgba(0,0,0,0.1)",
                borderBottom: loading ? "2px solid rgba(0,0,0,0.1)" : "4px solid rgba(0,0,0,0.2)",
                minWidth: 180,
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <><span className="text-xl">⚡</span> Create Slides!</>
              )}
            </button>
          </div>

          {error && (
            <div
              className="mt-4 p-4 rounded-2xl text-sm font-bold flex items-center gap-2"
              style={{ background: "#fff0f0", border: "2px solid #ffd0d0", color: "#cc3333" }}
            >
              <span className="text-xl">😬</span>
              {error}
            </div>
          )}
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="card-duo bg-white p-12 text-center">
            <div className="flex flex-col items-center gap-5">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl animate-bounce shadow-lg"
                style={{ background: "linear-gradient(135deg, #1B9BD9, #1B3A6B)", border: "3px solid #1482b8" }}
              >
                🤖
              </div>
              <div>
                <div className="font-black text-xl" style={{ color: "#1B3A6B" }}>AI is generating your slides…</div>
                <div className="text-slate-500 font-semibold text-sm mt-1">Writing content with Gemini · fetching Pexels photos · building your deck</div>
              </div>
              <div className="w-64 h-4 rounded-full overflow-hidden" style={{ background: "#e0e9f5", border: "2px solid #c8d8ea" }}>
                <div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #1B9BD9, #8DC63F)", animation: "loading-bar 2s ease-in-out infinite" }}
                />
              </div>
              <style>{`@keyframes loading-bar { 0%{width:10%} 50%{width:80%} 100%{width:10%} }`}</style>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {plan && downloadUrl && (
          <div ref={resultRef} className="space-y-5">
            <div
              className="rounded-3xl p-6 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #8DC63F, #5fa82a)", border: "3px solid #75a832", borderBottom: "6px solid #5a8424" }}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎉</div>
                <div>
                  <div className="text-white font-black text-xl">Slides ready!</div>
                  <div className="text-green-100 font-semibold text-sm">{plan.slides.length} slides · {plan.title}</div>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.25)", color: "white", border: "2px solid rgba(255,255,255,0.4)" }}
              >
                Start over
              </button>
            </div>

            <div className="card-duo bg-white p-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">👁️</span>
                <div className="font-black text-lg" style={{ color: "#1B3A6B" }}>Preview</div>
                <div className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {currentSlide + 1} of {plan.slides.length}
                </div>
              </div>
              <SlidePreview plan={plan} currentSlide={currentSlide} onSlideChange={setCurrentSlide} />
            </div>

            <div className="card-duo bg-white p-7">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">📥</span>
                <div className="font-black text-lg" style={{ color: "#1B3A6B" }}>Download</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-white font-black text-sm btn-chunky"
                  style={{ background: "linear-gradient(135deg, #1B9BD9, #1B3A6B)", border: "2px solid #1482b8", borderBottom: "4px solid #132b52" }}
                >
                  <span className="text-xl">{format === "pptx" ? "📑" : "📄"}</span>
                  Download {format.toUpperCase()}
                </a>
                <button
                  onClick={() => { const alt = format === "pptx" ? "pdf" : "pptx"; setFormat(alt); doGenerate(alt); }}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm btn-chunky disabled:opacity-50"
                  style={{ background: "#f0f8ff", color: "#1B9BD9", border: "2px solid #c8dff5", borderBottom: "4px solid #b0cce8" }}
                >
                  <span className="text-xl">{format === "pptx" ? "📄" : "📑"}</span>
                  Also get as {format === "pptx" ? "PDF" : "PPTX"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 py-6" style={{ borderTop: "3px solid #d0e8f5", background: "rgba(255,255,255,0.5)" }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-xs font-bold text-slate-400">
          <span>Vista Eye Specialist · Internal Tool</span>
          <span>✨ Gemini · 📸 Pexels · Qualitas Health</span>
        </div>
      </footer>
    </div>
  );
}
