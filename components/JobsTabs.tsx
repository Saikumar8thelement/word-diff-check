"use client";

import { useCallback } from "react";
import type { FC } from "react";
import type { JobStatus } from "@/lib/types";

type JobsTabsProps = {
  active: JobStatus;
  counts: Record<JobStatus, number>;
  onChange: (status: JobStatus) => void;
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
      className="flex items-center gap-6"
    >
      {statuses.map((status) => {
        const isActive = status === active;
        const count = counts[status] ?? 0;
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
            className={`flex items-center gap-2 px-5 py-3 text-base font-medium border-b-2 transition-colors -mb-px cursor-pointer ${
              isActive
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded`}
          >
            {labels[status]}
            <span
              className={`text-sm rounded-full px-2.5 py-1 ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

