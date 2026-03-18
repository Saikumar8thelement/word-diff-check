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
  const [highlightState, setHighlightState] = useState<{
    text: string;
    issueExist: boolean;
  } | null>(null);

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
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 font-sans text-gray-900">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Document area — 66% */}
        <div className="flex min-h-0 min-w-0 flex-[0_0_66%] flex-col overflow-hidden border-r border-gray-200">
          <DocumentViewer
            currentUrl={job.currentUrl!}
            diffUrl={job.diffUrl}
            hasPreviousVersion={job.hasPreviousVersion ?? false}
            onBack={() => router.push("/")}
            policyName={job.policyName}
            highlightText={highlightState?.text ?? null}
            highlightIssueExist={highlightState?.issueExist ?? false}
          />
        </div>

        {/* Right sidebar — 34% */}
        <aside className="flex min-h-0 min-w-0 flex-[0_0_34%] flex-col overflow-hidden border-l border-gray-200 bg-white">
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
          <PolicyInsightsPanel
            analysis={job.analysis}
            onChunkClick={(text, issueExist) =>
              setHighlightState({ text, issueExist })
            }
          />
        </aside>
      </div>

    </div>
  );
}

