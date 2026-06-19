"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface DropZoneProps {
  label: string;
  accept: Record<string, string[]>;
  hint: string;
  onFile: (file: File | null) => void;
  file: File | null;
  icon: React.ReactNode;
}

export default function DropZone({ label, accept, hint, onFile, file, icon }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted.length > 0) onFile(accepted[0]); },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxFiles: 1 });

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-black" style={{ color: "#1B3A6B" }}>{label}</label>
      <div
        {...getRootProps()}
        className="relative cursor-pointer transition-all duration-150"
        style={{
          border: isDragActive
            ? "3px solid #1B9BD9"
            : file
            ? "3px solid #8DC63F"
            : "3px dashed #b8d4e8",
          borderBottom: isDragActive
            ? "5px solid #1482b8"
            : file
            ? "5px solid #75a832"
            : "5px dashed #9cbdd6",
          borderRadius: 18,
          padding: "24px 16px",
          background: isDragActive
            ? "#eef7ff"
            : file
            ? "#f0faed"
            : "#f8fbff",
          transform: isDragActive ? "scale(1.01)" : "scale(1)",
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: file ? "#8DC63F" : isDragActive ? "#1B9BD9" : "#ddeeff",
              color: file || isDragActive ? "white" : "#1B9BD9",
              border: file ? "2px solid #75a832" : isDragActive ? "2px solid #1482b8" : "2px solid #b8d4e8",
            }}
          >
            {icon}
          </div>

          {file ? (
            <div>
              <div className="font-black text-sm" style={{ color: "#1B3A6B" }}>{file.name}</div>
              <div className="text-xs font-semibold text-slate-400 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB · Ready ✓
              </div>
            </div>
          ) : (
            <div>
              <div className="font-bold text-sm" style={{ color: isDragActive ? "#1B9BD9" : "#4a6a8a" }}>
                {isDragActive ? "Drop it! 🎯" : "Drop file or click to browse"}
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-0.5">{hint}</div>
            </div>
          )}
        </div>

        {file && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
            style={{ background: "#ffe0e0", color: "#cc3333", border: "2px solid #ffbdbd" }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
