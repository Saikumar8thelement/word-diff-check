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

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs/${jobId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { job?: Job } | null) => {
        if (!cancelled && data?.job) setJob(data.job);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const currentUrl = job?.currentUrl ?? "/MyPolicy_v4.docx";
  const diffUrl = job?.diffUrl;
  const hasPreviousVersion = job?.hasPreviousVersion ?? false;

  return (
    <div className="flex min-h-screen bg-zinc-200/50 dark:bg-zinc-900">
      <main className="flex min-h-screen w-full flex-1 flex-row overflow-hidden px-4 py-4">
        <section className="flex w-full flex-1 flex-row gap-4 rounded-xl border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex min-w-0 basis-[70%] flex-col border-r border-zinc-200 dark:border-zinc-800">
            <DocumentViewer
              currentUrl={currentUrl}
              diffUrl={diffUrl}
              hasPreviousVersion={hasPreviousVersion}
              onBack={() => router.push("/")}
            />
          </div>
          <div className="flex min-w-0 basis-[30%] flex-col bg-zinc-50 dark:bg-zinc-950/60">
            <div className="flex h-full flex-col space-y-4 px-4 py-4">
              {job && (
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Document details
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium">Policy:</span> {job.policyName}
                    </div>
                    <div>
                      <span className="font-medium">File:</span> {job.fileName}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {job.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
              <PolicyInsightsPanel analysis={job?.analysis} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

