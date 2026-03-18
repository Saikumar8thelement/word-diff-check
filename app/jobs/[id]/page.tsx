"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@/lib/types";
import { DocumentViewer } from "@/components/DocumentViewer";
import { PolicyInsightsPanel } from "@/components/PolicyInsightsPanel";

type JobViewerPageProps = {
  params: Promise<{ id: string }>;
};

export default function JobViewerPage({ params }: JobViewerPageProps) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/jobs/${jobId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { job?: Job } | null) => {
        if (!cancelled) {
          setJob(data?.job ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setJob(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const issues = Array.isArray(job?.analysis) ? job.analysis : [];
  const issueCount = issues.length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 font-sans text-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <p className="mt-4 text-sm text-gray-500">Loading document…</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 text-sm font-medium text-gray-600 underline hover:text-gray-900"
        >
          Back to queue
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 font-sans text-gray-900">
        <p className="text-base font-medium text-gray-700">Job not found</p>
        <p className="mt-2 text-sm text-gray-500">
          This job may have been removed or the link is invalid.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Back to queue
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900">
      <div className="flex flex-1 overflow-hidden">
        {/* Document area */}
        <div className="flex min-w-0 flex-1 flex-col border-r border-gray-200">
          <DocumentViewer
            currentUrl={job.currentUrl!}
            diffUrl={job.diffUrl}
            hasPreviousVersion={job.hasPreviousVersion ?? false}
            onBack={() => router.push("/")}
            policyName={job.policyName}
          />
        </div>

        {/* Right sidebar */}
        <aside className="flex w-64 shrink-0 flex-col border-l border-gray-200 bg-white">
          {/* Document details */}
          <div className="border-b border-gray-100 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Document details
              </p>
              <div className="space-y-1.5">
                {[
                  { label: "Policy", value: job.policyName },
                  { label: "File", value: job.fileName },
                  { label: "Status", value: job.status },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2">
                    <span className="shrink-0 text-xs text-gray-400">{label}</span>
                    <span className="text-right text-xs font-medium text-gray-700">
                      {label === "Status" ? (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          {/* Policy insights */}
          <PolicyInsightsPanel analysis={job.analysis} />
        </aside>
      </div>

      {/* Bottom issue bar */}
      {issueCount > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {issueCount}
            </span>
            {issueCount === 1 ? "1 Issue" : `${issueCount} Issues`}
            <button
              type="button"
              className="ml-1 leading-none text-gray-400 transition-colors hover:text-white"
              onClick={() => {}}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

