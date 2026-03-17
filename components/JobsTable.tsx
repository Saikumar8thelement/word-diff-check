"use client";

import { useRef, useEffect } from "react";
import type { FC } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@/lib/types";

type JobsTableProps = {
  items: Job[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isSearchActive?: boolean;
};

export const JobsTable: FC<JobsTableProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isSearchActive = false,
}) => {
  const headerCheckRef = useRef<HTMLInputElement>(null);
  const allSelected =
    items.length > 0 && items.every((job) => selectedIds.has(job.id));
  const someSelected =
    items.length > 0 && items.some((job) => selectedIds.has(job.id));
  const indeterminate = someSelected && !allSelected;

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const router = useRouter();

  const emptyMessage = isSearchActive
    ? "No documents match your search. Try a different term."
    : "No documents found.";

  const complexityStyles: Record<string, string> = {
    LOW: "bg-green-50 text-green-800 border-green-200",
    MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
    HIGH: "bg-red-50 text-red-800 border-red-200",
  };

  const statusStyles: Record<string, string> = {
    backlog: "bg-gray-100 text-gray-600 border-gray-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="overflow-x-auto overflow-y-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="w-12 px-4 py-3.5 text-left">
              <input
                ref={headerCheckRef}
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label={allSelected ? "Deselect all" : "Select all"}
                className="h-4 w-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
              />
            </th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400 w-10">#</th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400">Policy name</th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400">File name</th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400">Source</th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400">Version</th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400">Status</th>
            <th className="px-4 py-3.5 text-left text-sm font-medium uppercase tracking-wider text-gray-400">Complexity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((job, index) => {
            const isSelected = selectedIds.has(job.id);
            return (
              <tr
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/jobs/${job.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/jobs/${job.id}`);
                  }
                }}
                className={`group cursor-pointer border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                  isSelected ? "bg-blue-50/80" : "bg-white"
                }`}
              >
                <td
                  className={`px-4 py-4 ${isSelected ? "bg-blue-50/80" : "bg-white group-hover:bg-gray-50"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(job.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${job.policyName}`}
                    className="h-4 w-4 rounded border-gray-300 accent-gray-900 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-4 text-gray-400">{index + 1}</td>
                <td className="px-4 py-4">
                  <a
                    href={`/jobs/${job.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-gray-900 hover:underline underline-offset-2"
                  >
                    {job.policyName}
                  </a>
                </td>
                <td className="px-4 py-4 font-mono text-sm text-gray-500">
                  {job.fileName}
                </td>
                <td className="px-4 py-4 text-gray-500">{job.source}</td>
                <td className="px-4 py-4 text-gray-500">{job.version}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${statusStyles[job.status] ?? statusStyles.backlog}`}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${complexityStyles[job.complexity] ?? complexityStyles.MEDIUM}`}
                  >
                    {job.complexity.charAt(0) + job.complexity.slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-12 text-center text-gray-400 text-base"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

