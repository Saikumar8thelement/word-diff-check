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
          activeItems.some((j) => j.id === id && j.status === "backlog"),
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
    <div className="flex min-h-screen bg-zinc-200/50 dark:bg-zinc-900">
      <main className="flex min-h-screen w-full flex-1 flex-row overflow-hidden px-4 py-4">
        <section className="flex w-full flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col">
            <div className="flex flex-1 items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50/50 px-4 pb-3 pt-2 dark:border-zinc-800 dark:bg-zinc-900/50">
              <JobsTabs
                active={activeStatus}
                counts={counts}
                onChange={(status) => setActiveStatus(status)}
                noBorder
              />
              <DiffUploadPanel
                inline
                onLoaded={() => handleUploadComplete()}
              />
            </div>

            <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by filename..."
                      aria-label="Search jobs by filename"
                      className="h-8 w-80 rounded-lg border border-zinc-300 bg-zinc-50 pl-9 pr-8 text-xs text-zinc-800 placeholder:text-zinc-500 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {activeItems.length > 0 && (
                    <span
                      className="text-[11px] text-zinc-500 dark:text-zinc-400"
                      aria-live="polite"
                    >
                      {activeItems.length} {activeItems.length === 1 ? "document" : "documents"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleProcessNow}
                    disabled={!hasSelection || isLoading}
                    aria-label={hasSelection ? `Process ${selectedBacklogIds.length} selected` : "Process now (select documents first)"}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400"
                  >
                    {isProcessingNow ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing…
                      </>
                    ) : (
                      <>
                        Process Now
                        {hasSelection && (
                          <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[11px]">
                            {selectedBacklogIds.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              {isLoading && (
                <div className="mx-4 mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Loading…
                </div>
              )}

            <div className="flex-1 overflow-hidden bg-zinc-50/30 px-4 pb-4 dark:bg-zinc-900/30">
              <JobsTable
                items={activeItems}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                isSearchActive={isSearchActive}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
