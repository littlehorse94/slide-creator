"use client";

import { useState, useRef } from "react";
import DropZone from "@/components/DropZone";
import SlidePreview from "@/components/SlidePreview";
import { PresentationPlan } from "@/lib/generateSlides";

const STEPS = [
  { id: 1, label: "Upload Files" },
  { id: 2, label: "Describe Slides" },
  { id: 3, label: "Preview & Download" },
];

export default function Home() {
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState<"pptx" | "pdf">("pptx");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PresentationPlan | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [step, setStep] = useState(1);
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
      if (referenceFile) body.append("reference", referenceFile);
      if (sourceFile) body.append("source", sourceFile);

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
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const contentDisposition = res.headers.get("Content-Disposition") || "";
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      setDownloadFilename(match?.[1] ?? `slides.${outputFormat}`);

      setStep(3);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => doGenerate();

  const handleReset = () => {
    setReferenceFile(null);
    setSourceFile(null);
    setPrompt("");
    setPlan(null);
    setDownloadUrl(null);
    setError(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 50%, #f5fdf0 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: "#1B9BD9" }}>
              V
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: "#1B3A6B" }}>Vista Slide Creator</h1>
              <p className="text-xs text-slate-500">AI-Powered Presentation Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={step >= s.id ? { background: "#1B9BD9", color: "white" } : { background: "#f1f5f9", color: "#94a3b8" }}
                >
                  {step > s.id ? "✓" : s.id}
                </div>
                <span
                  className="text-sm hidden sm:block"
                  style={step >= s.id ? { color: "#1B3A6B", fontWeight: 600 } : { color: "#94a3b8" }}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-px ml-1 hidden sm:block" style={{ background: step > s.id ? "#8DC63F" : "#e2e8f0" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Upload + Prompt Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-bold mb-1" style={{ color: "#1B3A6B" }}>Create Your Presentation</h2>
          <p className="text-sm text-slate-500 mb-6">
            Upload your files and describe what you need — AI will generate a professional slide deck with Vista and Qualitas branding.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <DropZone
              label="Reference Slide / Image (Optional)"
              hint="PDF or image — used to match the design style"
              accept={{
                "application/pdf": [".pdf"],
                "image/png": [".png"],
                "image/jpeg": [".jpg", ".jpeg"],
                "image/webp": [".webp"],
              }}
              file={referenceFile}
              onFile={(f) => { setReferenceFile(f); if (f) setStep(Math.max(step, 1)); }}
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <DropZone
              label="Data Source (Optional)"
              hint="Excel, CSV, or PDF — content data for your slides"
              accept={{
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                "application/vnd.ms-excel": [".xls"],
                "text/csv": [".csv"],
                "application/pdf": [".pdf"],
              }}
              file={sourceFile}
              onFile={(f) => { setSourceFile(f); if (f) setStep(Math.max(step, 1)); }}
              icon={
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">
              What would you like to create?
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); if (e.target.value) setStep(Math.max(step, 2)); }}
              placeholder="E.g. Create a quarterly performance report for Vista Eye Specialist Q3 2024, including patient statistics, revenue breakdown, and department highlights. Use a professional corporate style."
              rows={4}
              className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-400">Be specific about the topic, number of slides, audience, and key points to include.</p>
          </div>

          {/* Format + Generate */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">Output Format:</span>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(["pptx", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={format === f ? { background: "#1B9BD9", color: "white" } : { background: "white", color: "#475569" }}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="sm:ml-auto flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ background: loading ? "#94a3b8" : "linear-gradient(135deg, #1B9BD9, #1B3A6B)" }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Slides
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <span className="text-red-400 mt-0.5">⚠</span>
              {error}
            </div>
          )}
        </section>

        {/* Loading state */}
        {loading && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B9BD9, #1B3A6B)" }}>
                <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "#1B3A6B" }}>Generating your presentation…</h3>
                <p className="text-sm text-slate-500 mt-1">AI is crafting your slides. This may take 30–60 seconds.</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#1B9BD9", animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Result section */}
        {plan && downloadUrl && (
          <section ref={resultRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#8DC63F" }}>✓</div>
                  <h2 className="text-xl font-bold" style={{ color: "#1B3A6B" }}>{plan.title}</h2>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{plan.slides.length} slides generated successfully</p>
              </div>
              <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 underline transition-colors">
                Start over
              </button>
            </div>

            <SlidePreview plan={plan} currentSlide={currentSlide} onSlideChange={setCurrentSlide} />

            {/* Download area */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Download Your Presentation</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #1B9BD9, #1B3A6B)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download {format.toUpperCase()}
                </a>
                <button
                  onClick={() => { const alt = format === "pptx" ? "pdf" : "pptx"; setFormat(alt); doGenerate(alt); }}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Also generate as {format === "pptx" ? "PDF" : "PPTX"}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-16 py-8 border-t border-slate-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-slate-400">
          <span>Vista Eye Specialist — Internal Tool</span>
          <span>Powered by Claude AI · Qualitas Health Group</span>
        </div>
      </footer>
    </div>
  );
}
