"use client";

import { useState, useRef, useCallback } from "react";

interface ResumeUploadProps {
  onUploaded: (url: string, filename: string) => void;
  required?: boolean;
}

export default function ResumeUpload({ onUploaded, required }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
  const MAX_SIZE_MB = 10;

  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Please upload a PDF, DOC, or DOCX file.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
        setUploading(false);
        return;
      }

      setUploadedFile({ name: file.name, url: data.url });
      onUploaded(data.url, file.name);
    } catch {
      setError("Network error. Please try again.");
    }

    setUploading(false);
  }, [onUploaded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    onUploaded("", "");
    if (inputRef.current) inputRef.current.value = "";
  };

  if (uploadedFile) {
    return (
      <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 rounded px-3 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-[var(--text)] truncate">{uploadedFile.name}</span>
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <button
          type="button"
          onClick={removeFile}
          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-xs shrink-0"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
        id="resume-upload"
      />
      <label
        htmlFor="resume-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          block border border-dashed rounded px-3 py-4 text-center cursor-pointer transition-colors
          ${dragOver
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] hover:border-[var(--border-hover)]"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-[var(--text-muted)] text-sm">Uploading...</span>
          </div>
        ) : (
          <>
            <p className="text-[var(--text-muted)] text-sm">
              Drop your resume here or click to upload
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-1">
              PDF, DOC, or DOCX · Max {MAX_SIZE_MB}MB
            </p>
          </>
        )}
      </label>
      {/* Hidden input for form validation when required */}
      {required && !uploadedFile && (
        <input
          type="text"
          required
          value=""
          onChange={() => {}}
          className="opacity-0 h-0 w-0 absolute"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
}
