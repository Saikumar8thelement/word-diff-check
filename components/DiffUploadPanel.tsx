"use client";

import { useState } from "react";
import type { FC, FormEvent } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";

type DiffUploadPanelProps = {
  onLoaded?: (urls: { currentUrl: string; diffUrl: string }) => void;
  /** Compact inline layout for tabs row */
  inline?: boolean;
};

export const DiffUploadPanel: FC<DiffUploadPanelProps> = ({
  onLoaded,
  inline = false,
}) => {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    // reset per-attempt state

    if (!docxFile) {
      setError("Please select a .docx file.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("docx", docxFile);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Failed to store document.");
      }

      const data = (await response.json()) as {
        job: { currentUrl?: string };
        documentId: string;
      };

      const currentUrl = data.job?.currentUrl ?? `/api/documents/${data.documentId}`;
      onLoaded?.({ currentUrl, diffUrl: currentUrl });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
      // Clear the file after a successful upload so the panel is ready for the next one.
      clearFile();
    }
  };

  const clearFile = () => {
    setDocxFile(null);
    setError(null);
  };

  if (inline) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file?.name.endsWith(".docx")) {
            setDocxFile(file);
            setError(null);
          }
        }}
      >
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200/80 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700">
          <UploadCloud className="h-3.5 w-3.5" />
          {docxFile ? (
            <span className="max-w-[140px] truncate">{docxFile.name}</span>
          ) : (
            "Select or drop .docx"
          )}
          <input
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setDocxFile(file);
              setError(null);
            }}
          />
        </label>
        {docxFile && (
          <button
            type="button"
            onClick={clearFile}
            className="shrink-0 cursor-pointer rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
            aria-label="Remove file"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !docxFile}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <UploadCloud className="h-3.5 w-3.5" />
              Upload
            </>
          )}
        </button>
        {error && (
          <span className="max-w-[180px] truncate text-[11px] text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
      </form>
    );
  }

  return (
    <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          <UploadCloud className="h-3.5 w-3.5" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            Upload Document
          </h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          {docxFile ? (
            /* Selected file pill */
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-200">
                <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="truncate max-w-[160px]">{docxFile.name}</span>
              </span>
              <button
                type="button"
                onClick={clearFile}
                className="ml-2 shrink-0 cursor-pointer rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            /* Drop zone */
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 transition hover:border-blue-400 hover:bg-blue-50/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500 dark:hover:bg-zinc-900/60">
              <span className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                <span className="truncate">Select or drop a .docx file</span>
              </span>
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setDocxFile(file);
                  setError(null);
                }}
              />
            </label>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="flex items-start gap-1.5 text-[11px] text-red-600 dark:text-red-400">
            <X className="mt-0.5 h-3 w-3 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !docxFile}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <UploadCloud className="h-3.5 w-3.5" />
              Upload
            </>
          )}
        </button>
      </form>
    </section>
  );
};