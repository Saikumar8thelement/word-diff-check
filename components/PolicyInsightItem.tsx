"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import type { AnalysisItem } from "@/lib/types";

interface PolicyInsightItemProps {
  index: number;
  item: AnalysisItem;
}

export const PolicyInsightItem: FC<PolicyInsightItemProps> = ({
  index,
  item,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = item.analysis?.summary;
  const issueExist = item.analysis?.issue_exist;
  const remedyText = item.analysis?.remedy_text;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setIsExpanded((p) => !p)}
        className="group flex w-full cursor-pointer items-start justify-between gap-2 px-4 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {index}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {item.issue ?? item.issue_id ?? "Issue"}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  issueExist
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                {issueExist ? "Found" : "Not found"}
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:text-blue-600" />
        )}
      </button>
      {isExpanded && (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <div className="space-y-3 text-sm">
            {summary && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Summary
                </p>
                <p className="text-zinc-700 dark:text-zinc-300">{summary}</p>
              </div>
            )}
            {remedyText && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Remedy
                </p>
                <p className="text-zinc-700 dark:text-zinc-300">{remedyText}</p>
              </div>
            )}
            {item.core_issues && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Core issues
                </p>
                <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {item.core_issues}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
