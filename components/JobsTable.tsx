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
    : "No documents in this list yet.";

  return (
    <div className="overflow-x-auto overflow-y-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-xs text-zinc-700 dark:text-zinc-200">
        <thead className="sticky top-0 z-20 bg-zinc-100 dark:bg-zinc-900">
          <tr className="border-b border-zinc-200 text-[11px] uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <th className="sticky left-0 z-30 bg-zinc-100 px-3 py-3 dark:bg-zinc-900">
              <input
                ref={headerCheckRef}
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                aria-label={allSelected ? "Deselect all" : "Select all"}
                className="cursor-pointer h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              />
            </th>
            <th className="px-3 py-3">#</th>
            <th className="px-3 py-3">Policy Name</th>
            <th className="px-3 py-3">File Name</th>
            <th className="px-3 py-3">Source</th>
            <th className="px-3 py-3">Version</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Complexity</th>
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
                className={`group cursor-pointer border-b border-zinc-200/80 text-xs transition-colors duration-150 dark:border-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-blue-950/40"
                    : "bg-white hover:bg-zinc-100/80 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                }`}
              >
                <td
                  className={`sticky left-0 z-0 px-3 py-3 ${
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40"
                      : "bg-white group-hover:bg-zinc-100/80 dark:bg-zinc-900 dark:group-hover:bg-zinc-800"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(job.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${job.policyName}`}
                    className="cursor-pointer h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-3 text-[11px] text-zinc-500">
                  {index + 1}
                </td>
                <td className="max-w-xs px-3 py-3 text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
                  <span className="truncate text-blue-600 dark:text-blue-400">
                    {job.policyName}
                  </span>
                </td>
                <td className="px-3 py-3 text-[12px] text-zinc-700 dark:text-zinc-200">
                  {job.fileName}
                </td>
                <td className="px-3 py-3 text-[12px] text-zinc-500 dark:text-zinc-400">
                  {job.source}
                </td>
                <td className="px-3 py-3 text-[12px] text-zinc-700 dark:text-zinc-200">
                  {job.version}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      job.status === "failed"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {job.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      job.complexity === "HIGH"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : job.complexity === "MEDIUM"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    {job.complexity}
                  </span>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-3 py-12 text-center text-xs text-zinc-500 dark:text-zinc-400"
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

