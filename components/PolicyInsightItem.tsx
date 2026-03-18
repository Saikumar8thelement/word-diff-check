"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import type { AnalysisItem } from "@/lib/types";

interface PolicyInsightItemProps {
  index: number;
  item: AnalysisItem;
  onChunkClick?: (chunkText: string, issueExist: boolean) => void;
}

const SectionHeader: FC<{ label: string }> = ({ label }) => (
  <h4 className="mb-2 border-l-2 border-slate-400 py-1 pl-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
    {label}
  </h4>
);

const SectionContent: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-md bg-gradient-to-r from-slate-100 via-slate-100/10 to-transparent p-3">
    {children}
  </div>
);

interface RelevantChunk {
  chunk_id?: number;
  text?: string;
  section?: string;
  similarity_score?: number;
}

function getRelevantChunks(chunks: unknown[] | undefined): RelevantChunk[] {
  if (!chunks?.length) return [];
  return chunks
    .filter((c): c is RelevantChunk => c != null && typeof c === "object" && "text" in c)
    .map((c) => ({
      chunk_id: (c as RelevantChunk).chunk_id,
      text: (c as RelevantChunk).text,
      section: (c as RelevantChunk).section,
      similarity_score: (c as RelevantChunk).similarity_score,
    }))
    .filter((c) => c.text);
}

function stripRelevantChunkText(
  text: string,
  chunks: unknown[] | undefined
): string {
  if (!text || !chunks?.length) return text ?? "";
  let result = text;
  for (const chunk of chunks) {
    const chunkText =
      chunk && typeof chunk === "object" && "text" in chunk
        ? String((chunk as { text?: string }).text ?? "")
        : "";
    if (chunkText) {
      result = result.replace(chunkText, "").replace(/\n{3,}/g, "\n\n").trim();
    }
  }
  return result;
}

export const PolicyInsightItem: FC<PolicyInsightItemProps> = ({
  index,
  item,
  onChunkClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = item.analysis?.summary;
  const issueExist = item.analysis?.issue_exist ?? false;
  const remedyText = item.analysis?.remedy_text;
  const coreIssues = stripRelevantChunkText(
    item.core_issues ?? "",
    item.analysis?.relevant_chunks
  );
  const relevantChunks = getRelevantChunks(item.analysis?.relevant_chunks);
  const header = item.issue ?? item.issue_id ?? "Issue";

  const statusColor = issueExist
    ? "bg-red-100 text-red-700"
    : "bg-emerald-100 text-emerald-700";

  const cardBg = issueExist ? "bg-red-50/40" : "bg-emerald-50/40";

  return (
    <div className={`rounded-lg border border-slate-200 shadow-sm ${cardBg}`}>
      <button
        type="button"
        onClick={() => setIsExpanded((p) => !p)}
        className="group flex w-full cursor-pointer items-start justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              issueExist ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {index}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-slate-900">{header}</p>
            
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-600" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-slate-200 px-4 py-3">
          <div className="space-y-4 text-sm">
            <div className="h-px w-full bg-gradient-to-r from-white via-slate-200/50 to-white" />
            {header && (
              <div data-issue={item.issue ?? undefined}>
                <SectionHeader label="Issue" />
                <SectionContent>
                  <p className="text-slate-700">{header}</p>
                </SectionContent>
              </div>
            )}
            {coreIssues.trim() && (
              <div>
                <SectionHeader label="Issue description" />
                <SectionContent>
                  <p className="whitespace-pre-wrap text-slate-700">
                    {coreIssues}
                  </p>
                </SectionContent>
              </div>
            )}
            {remedyText && (
              <div>
                <SectionHeader label="Remedy" />
                <SectionContent>
                  <p className="text-slate-700">{remedyText}</p>
                </SectionContent>
              </div>
            )}
            {summary && (
              <div>
                <SectionHeader label="Summary" />
                <SectionContent>
                  <p className="text-slate-700">{summary}</p>
                </SectionContent>
              </div>
            )}
            {relevantChunks.length > 0 && (
              <div>
                <SectionHeader label="Relevant chunks" />
                <div className="flex flex-wrap gap-2">
                  {relevantChunks.map((chunk, i) => (
                    <button
                      key={i}
                      type="button"
                      title={`Highlight in document: ${chunk.text ?? ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chunk.text && onChunkClick) {
                          onChunkClick(chunk.text, issueExist);
                        }
                      }}
                      className={`inline-block max-w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-3 py-1.5 text-left text-xs transition hover:opacity-90 ${
                        issueExist
                          ? "bg-red-100/80 text-red-800"
                          : "bg-emerald-100/80 text-emerald-800"
                      }`}
                    >
                      {chunk.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
