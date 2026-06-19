"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface DropZoneProps {
  label: string;
  accept: Record<string, string[]>;
  hint: string;
  onFiles: (files: File[]) => void;
  files: File[];
  icon: React.ReactNode;
}

export default function DropZone({ label, accept, hint, onFiles, files, icon }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted.length > 0) onFiles([...files, ...accepted]); },
    [files, onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple: true });

  const removeFile = (idx: number) => onFiles(files.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-black" style={{ color: "#1B3A6B" }}>{label}</label>

      <div
        {...getRootProps()}
        className="relative cursor-pointer transition-all duration-150"
        style={{
          border: isDragActive ? "3px solid #1B9BD9" : files.length > 0 ? "3px solid #8DC63F" : "3px dashed #b8d4e8",
          borderBottom: isDragActive ? "5px solid #1482b8" : files.length > 0 ? "5px solid #75a832" : "5px dashed #9cbdd6",
          borderRadius: 18,
          padding: "20px 16px",
          background: isDragActive ? "#eef7ff" : files.length > 0 ? "#f0faed" : "#f8fbff",
          transform: isDragActive ? "scale(1.01)" : "scale(1)",
        }}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: files.length > 0 ? "#8DC63F" : isDragActive ? "#1B9BD9" : "#ddeeff",
              color: files.length > 0 || isDragActive ? "white" : "#1B9BD9",
              border: files.length > 0 ? "2px solid #75a832" : isDragActive ? "2px solid #1482b8" : "2px solid #b8d4e8",
            }}
          >
            {icon}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: isDragActive ? "#1B9BD9" : "#4a6a8a" }}>
              {isDragActive ? "Drop it! 🎯" : files.length > 0 ? "Drop more files to add" : "Drop files or click to browse"}
            </div>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">{hint}</div>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "#f0faed", border: "2px solid #c8e6b8" }}
            >
              <span className="text-base">{file.name.endsWith(".pdf") ? "📄" : file.type.startsWith("image") ? "🖼️" : "📊"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black truncate" style={{ color: "#1B3A6B" }}>{file.name}</div>
                <div className="text-xs font-semibold text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
                style={{ background: "#ffe0e0", color: "#cc3333", border: "2px solid #ffbdbd" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
