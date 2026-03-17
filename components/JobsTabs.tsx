"use client";

import { useCallback } from "react";
import type { FC } from "react";
import type { JobStatus } from "@/lib/types";

type JobsTabsProps = {
  active: JobStatus;
  counts: Record<JobStatus, number>;
  onChange: (status: JobStatus) => void;
  /** Omit bottom border when used inline with other controls */
  noBorder?: boolean;
};

const labels: Record<JobStatus, string> = {
  backlog: "Backlog",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

const statuses: JobStatus[] = ["backlog", "processing", "completed"];

export const JobsTabs: FC<JobsTabsProps> = ({
  active,
  counts,
  onChange,
  noBorder = false,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, status: JobStatus) => {
      const idx = statuses.indexOf(status);
      if (e.key === "ArrowRight" && idx < statuses.length - 1) {
        e.preventDefault();
        onChange(statuses[idx + 1]!);
      } else if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        onChange(statuses[idx - 1]!);
      } else if (e.key === "Home") {
        e.preventDefault();
        onChange(statuses[0]!);
      } else if (e.key === "End") {
        e.preventDefault();
        onChange(statuses[statuses.length - 1]!);
      }
    },
    [onChange],
  );

  return (
    <div
      role="tablist"
      aria-label="Job status tabs"
      className={`flex items-center gap-6 px-4 pt-2 text-sm font-medium transition-colors ${
        noBorder ? "" : "border-b border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {statuses.map((status, index) => {
        const isActive = status === active;
        return (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${status}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(status)}
            onKeyDown={(e) => handleKeyDown(e, status)}
            className={`cursor-pointer relative pb-3 pt-2 text-xs uppercase tracking-wide transition-colors duration-150 ${
              isActive
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded`}
          >
            <span>{labels[status]}</span>
            <span className="ml-1 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 transition-colors dark:bg-zinc-800 dark:text-zinc-200">
              {counts[status] ?? 0}
            </span>
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-500 transition-all duration-150" />
            )}
          </button>
        );
      })}
    </div>
  );
};

