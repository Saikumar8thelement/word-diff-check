import type { FC } from "react";
import { PolicyInsightItem } from "./PolicyInsightItem";
import type { AnalysisItem } from "@/lib/types";

type PolicyInsightsPanelProps = {
  analysis?: AnalysisItem[] | null;
  onChunkClick?: (chunkText: string, issueExist: boolean) => void;
};

export const PolicyInsightsPanel: FC<PolicyInsightsPanelProps> = ({
  analysis,
  onChunkClick,
}) => {
  const items = Array.isArray(analysis) ? analysis : [];
  const hasItems = items.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <div className="mb-1 flex items-center gap-2">
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-slate-400"
        >
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-xs font-medium text-slate-700">Issues</p>
      </div>
      <p className="mb-4 pl-5 text-xs text-slate-400">
        {hasItems ? `${items.length} issue${items.length === 1 ? "" : "s"} detected` : "No analysis yet"}
      </p>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <PolicyInsightItem
                key={item.issue_id ?? index}
                index={index + 1}
                item={item}
                onChunkClick={onChunkClick}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-center text-xs leading-relaxed text-slate-400">
              Process a document to see policy analysis insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};