"use client";

import { useState } from "react";
import type { FC, FormEvent } from "react";
import { toast } from "sonner";
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!docxFile) {
      toast.error("Please select a .docx file.");
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

      const data = (await response.json().catch(() => null)) as
        | { error?: string; job?: { currentUrl?: string }; documentId?: string }
        | null;

      if (!response.ok) {
        toast.error(data?.error ?? "Failed to store document.");
        return;
      }

      const currentUrl = data!.job?.currentUrl ?? `/api/documents/${data!.documentId}`;
      onLoaded?.({ currentUrl, diffUrl: currentUrl });
      toast.success("Document uploaded successfully.");
      setDocxFile(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFile = () => {
    setDocxFile(null);
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
          }
        }}
      >
        <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-base font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {docxFile ? (
            <span className="max-w-[140px] truncate">{docxFile.name}</span>
          ) : (
            "Select .docx"
          )}
          <input
            type="file"
            accept=".docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setDocxFile(file);
            }}
          />
        </label>
        {docxFile && (
          <button
            type="button"
            onClick={clearFile}
            className="shrink-0 cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Remove file"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !docxFile}
          className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 text-base font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v8M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Upload
            </>
          )}
        </button>
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
                }}
              />
            </label>
          )}
        </div>

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