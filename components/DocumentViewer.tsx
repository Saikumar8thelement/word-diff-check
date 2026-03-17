"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { FC } from "react";
import { renderAsync } from "docx-preview";
import {
  ArrowLeft,
  GitCompare,
  Maximize2,
  Search,
  Loader2,
  FileText,
} from "lucide-react";

type DocumentViewerProps = {
  currentUrl: string;
  diffUrl?: string;
  hasPreviousVersion?: boolean;
  onBack?: () => void;
  policyName?: string;
};

type RenderState = "idle" | "loading" | "success" | "error" | "no-previous";

export const DocumentViewer: FC<DocumentViewerProps> = ({
  currentUrl,
  diffUrl,
  hasPreviousVersion = false,
  onBack,
  policyName,
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
    <section className="flex h-full min-h-0 flex-1 flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
            onClick={() => onBack?.()}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-medium leading-tight text-gray-900">
              {isDiffMode ? "Diff View" : policyName ?? "Sample Policy Document"}
            </p>
            <p className="text-xs text-gray-400">
              {isDiffMode
                ? "Track-changes markup rendered inside document"
                : "Policy review workspace"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom — only in normal mode */}
          {!isDiffMode && (
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1 py-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="flex h-6 w-6 items-center justify-center rounded text-base leading-none text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="w-10 tabular-nums text-center text-xs font-medium text-gray-700">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="flex h-6 w-6 items-center justify-center rounded text-base leading-none text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          )}

          {/* Text Diff toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
            <GitCompare className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs text-gray-600">Text Diff</span>
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
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                isDiffMode ? "bg-gray-900" : "bg-gray-200"
              } ${canToggleDiff ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                  isDiffMode ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Fullscreen */}
          {!isDiffMode && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Maximize2 className="h-3 w-3" />
              Fullscreen
            </button>
          )}
        </div>
      </header>

      {/* Search bar */}
      <div className="border-b border-gray-100 bg-white px-5 py-2.5">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search in document…"
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-gray-400"
          />
        </div>
      </div>

      {/* Document body */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <div className="flex h-full items-center justify-center overflow-y-auto p-6">
          <div className="relative h-full w-full max-h-[calc(100vh-180px)] max-w-4xl overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Loading overlay */}
            {renderState === "loading" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-600">
                  {isDiffMode ? "Rendering diff document…" : "Loading document…"}
                </p>
              </div>
            )}

            {/* No previous version */}
            {renderState === "no-previous" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  Previous version is not available.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDiffMode(false)}
                  className="mt-1 cursor-pointer rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                >
                  View current document
                </button>
              </div>
            )}

            {/* Error state */}
            {renderState === "error" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white">
                <FileText className="h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">
                  Failed to render document.
                </p>
                <button
                  type="button"
                  onClick={() => void renderDocx()}
                  className="mt-1 cursor-pointer rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
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