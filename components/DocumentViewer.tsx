"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { FC } from "react";
import { renderAsync } from "docx-preview";
import {
  ArrowLeft,
  GitCompare,
  Maximize2,
  Minus,
  Plus,
  Search,
  Loader2,
  FileText,
} from "lucide-react";

type DocumentViewerProps = {
  currentUrl: string;
  diffUrl?: string;
  hasPreviousVersion?: boolean;
  onBack?: () => void;
};

type RenderState = "idle" | "loading" | "success" | "error" | "no-previous";

export const DocumentViewer: FC<DocumentViewerProps> = ({
  currentUrl,
  diffUrl,
  hasPreviousVersion = false,
  onBack,
}) => {
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>("idle");
  const [zoom, setZoom] = useState(100);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const renderDocx = useCallback(async () => {
    if (!previewContainerRef.current) return;

    // Use the diff URL only when diff mode is on AND a diff exists
    const urlToFetch = isDiffMode && diffUrl ? diffUrl : currentUrl;

    setRenderState("loading");

    try {
      const res = await fetch(urlToFetch);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as { hasPrevious?: boolean; message?: string };
        if (data.hasPrevious === false) {
          setRenderState("no-previous");
          return;
        }
      }

      const blob = await res.blob();

      if (!previewContainerRef.current) return;
      previewContainerRef.current.innerHTML = "";

      await renderAsync(blob, previewContainerRef.current, undefined, {
        className: "docx-preview",
        inWrapper: true,
        breakPages: true,
        // ✅ Key option: renders <w:ins>/<w:del> track-change markup natively
        // so additions appear green+underline, deletions appear red+strikethrough
        renderChanges: true,
        ignoreLastRenderedPageBreak: false,
      });

      setRenderState("success");
    } catch (err) {
      console.error("docx-preview render error:", err);
      setRenderState("error");
    }
  }, [currentUrl, diffUrl, isDiffMode]);

  useEffect(() => {
    void renderDocx();
    return () => {
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = "";
      }
    };
  }, [renderDocx]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 50));

  const canToggleDiff = Boolean(diffUrl && hasPreviousVersion);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900">
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
            onClick={() => onBack?.()}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {isDiffMode ? "Diff View" : "Sample Policy Document"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isDiffMode
                ? "Track-changes markup rendered inside document"
                : "Policy review workspace"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls — only in normal mode */}
          {!isDiffMode && (
            <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-700"
                aria-label="Zoom out"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="mx-1 w-12 text-center text-xs font-medium">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-700"
                aria-label="Zoom in"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Diff toggle — disabled until a diff document has been generated */}
          <button
            type="button"
            onClick={() => canToggleDiff && setIsDiffMode((prev) => !prev)}
            disabled={!canToggleDiff}
            title={
              canToggleDiff
                ? "Toggle diff view"
                : hasPreviousVersion === false && diffUrl
                  ? "Previous version is not available"
                  : "Upload a versioned document to generate a diff"
            }
            className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium shadow-sm transition-all
              ${
                isDiffMode
                  ? "cursor-pointer border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
                  : canToggleDiff
                  ? "cursor-pointer border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600"
              }`}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Text Diff
            <span
              className={`ml-0.5 inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                isDiffMode ? "bg-blue-400" : "bg-zinc-200 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  isDiffMode ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          {!isDiffMode && (
            <button
              type="button"
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              <Maximize2 className="h-3 w-3" />
              Fullscreen
            </button>
          )}
        </div>
      </header>

      {/* ── Toolbar: search + diff legend ── */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative w-80 max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-500">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="search"
            placeholder="Search in document..."
            className="h-8 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-900"
          />
        </div>

        {/* Diff legend */}
        {isDiffMode && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-red-200 dark:bg-red-900" />
              <span className="text-zinc-500 dark:text-zinc-400">Removed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900" />
              <span className="text-zinc-500 dark:text-zinc-400">Added</span>
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              Track-changes diff
            </span>
          </div>
        )}
      </div>

      {/* ── Document body ── */}
      <div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <div className="flex h-full items-center justify-center px-6 py-6">
          <div className="relative h-full w-full max-h-[calc(100vh-180px)] max-w-4xl overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

            {/* Loading overlay */}
            {renderState === "loading" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {isDiffMode ? "Rendering diff document…" : "Loading document…"}
                </p>
              </div>
            )}

            {/* No previous version */}
            {renderState === "no-previous" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white dark:bg-zinc-900">
                <FileText className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Previous version is not available.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDiffMode(false)}
                  className="mt-1 cursor-pointer rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  View current document
                </button>
              </div>
            )}

            {/* Error state */}
            {renderState === "error" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white dark:bg-zinc-900">
                <FileText className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Failed to render document.
                </p>
                <button
                  type="button"
                  onClick={() => void renderDocx()}
                  className="mt-1 cursor-pointer rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* docx-preview mount point */}
            <div
              ref={previewContainerRef}
              className="docx-container mx-auto max-w-full px-6 py-6"
              style={
                !isDiffMode
                  ? {
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                      transition: "transform 0.15s ease",
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
};