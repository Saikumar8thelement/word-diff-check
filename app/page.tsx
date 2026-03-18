"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Job, JobStatus } from "@/lib/types";
import { JobsTabs } from "@/components/JobsTabs";
import { JobsTable } from "@/components/JobsTable";
import { DiffUploadPanel } from "@/components/DiffUploadPanel";
import { searchJobs } from "@/app/actions/searchJobs";
import { Search, X } from "lucide-react";

type JobsByStatus = Record<JobStatus, Job[]>;

const emptyJobsByStatus: JobsByStatus = {
  backlog: [],
  processing: [],
  completed: [],
  failed: [],
};

export default function Home() {
  const [activeStatus, setActiveStatus] = useState<JobStatus>("backlog");
  const [jobsByStatus, setJobsByStatus] =
    useState<JobsByStatus>(emptyJobsByStatus);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingNow, setIsProcessingNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      backlog: jobsByStatus.backlog.length,
      processing: jobsByStatus.processing.length,
      completed: jobsByStatus.completed.length,
      failed: 0,
    }),
    [jobsByStatus],
  );

  const activeItems = jobsByStatus[activeStatus] ?? [];

  const fetchJobs = async (status?: JobStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status ? `/api/jobs?status=${status}` : "/api/jobs";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Failed to load jobs.");
      }
      const data = (await res.json()) as { jobs: Job[] };
      if (status) {
        setJobsByStatus((prev) => ({ ...prev, [status]: data.jobs }));
      } else {
        const grouped: JobsByStatus = {
          backlog: data.jobs.filter(
            (j) => j.status === "backlog" || j.status === "failed",
          ),
          processing: data.jobs.filter((j) => j.status === "processing"),
          completed: data.jobs.filter((j) => j.status === "completed"),
          failed: [],
        };
        setJobsByStatus(grouped);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeStatus]);

  const runSearch = useCallback(async () => {
    if (searchQuery.trim().length <= 2) {
      void fetchJobs();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const jobs = await searchJobs(
        searchQuery,
        activeStatus === "failed" ? "backlog" : activeStatus,
      );
      setJobsByStatus((prev) => ({
        ...prev,
        [activeStatus]: jobs,
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeStatus]);

  useEffect(() => {
    const t = setTimeout(runSearch, 500);
    return () => clearTimeout(t);
  }, [runSearch]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (activeItems.length === 0) return;
    if (selectedIds.size === activeItems.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(activeItems.map((job) => job.id)));
  };

  const handleUploadComplete = () => {
    void fetchJobs();
  };

  const selectedBacklogIds =
    activeStatus === "backlog"
      ? Array.from(selectedIds).filter((id) =>
          activeItems.some((j) => j.id === id && (j.status === "backlog" || j.status === "failed")),
        )
      : [];
  const hasSelection = selectedBacklogIds.length > 0;

  const handleProcessNow = async () => {
    if (!hasSelection) return;
    setIsProcessingNow(true);
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selectedBacklogIds }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; results?: { success: boolean; error?: string }[] }
        | null;
      if (!res.ok) {
        const msg =
          data?.error ??
          (data?.results?.some((r) => r.error)
            ? data.results?.find((r) => r.error)?.error
            : "Failed to start jobs.");
        throw new Error(msg);
      }
      setSelectedIds(new Set());
      await fetchJobs();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessingNow(false);
      setIsLoading(false);
    }
  };

  const isSearchActive = searchQuery.trim().length > 2;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="w-full">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <JobsTabs
            active={activeStatus}
            counts={counts}
            onChange={(status) => setActiveStatus(status)}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, filename, or source…"
              aria-label="Search jobs by name, filename, or source"
              className="w-full pl-9 pr-9 py-2.5 text-base border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <DiffUploadPanel
              inline
              onLoaded={() => handleUploadComplete()}
            />
            <button
              type="button"
              onClick={handleProcessNow}
              disabled={!hasSelection || isLoading}
              aria-label={hasSelection ? `Process ${selectedBacklogIds.length} selected` : "Process now (select documents first)"}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-base font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
            >
              {isProcessingNow ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing…
                </>
              ) : (
                "Process now"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mb-4 text-base text-gray-500">
            Loading…
          </div>
        )}

        {/* Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <JobsTable
            items={activeItems}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            isSearchActive={isSearchActive}
          />
        </div>
      </div>
    </div>
  );
}
