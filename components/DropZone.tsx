"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface DropZoneProps {
  label: string;
  accept: Record<string, string[]>;
  hint: string;
  onFile: (file: File | null) => void;
  file: File | null;
  icon: React.ReactNode;
}

export default function DropZone({
  label,
  accept,
  hint,
  onFile,
  file,
  icon,
}: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-[#1B9BD9] bg-blue-50 scale-[1.01]"
            : file
            ? "border-[#8DC63F] bg-green-50"
            : "border-slate-300 bg-slate-50 hover:border-[#1B9BD9] hover:bg-blue-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div
            className={`text-3xl transition-colors ${
              file ? "text-[#8DC63F]" : "text-slate-400"
            }`}
          >
            {icon}
          </div>
          {file ? (
            <div>
              <p className="text-sm font-medium text-[#1B3A6B]">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-600">
                {isDragActive ? "Drop here…" : "Drop file or click to browse"}
              </p>
              <p className="text-xs text-slate-400 mt-1">{hint}</p>
            </div>
          )}
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-500 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
