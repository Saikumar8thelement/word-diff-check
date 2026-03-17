"use server";

import { prisma } from "@/lib/prisma";
import { JobStatus as PrismaJobStatus } from "@/lib/generated/prisma/client";
import type { Job } from "@/lib/types";

const BACKLOG_STATUSES = [
  PrismaJobStatus.BACKLOG,
  PrismaJobStatus.FAILED,
] as const;

function mapJobToUI(
  job: {
    id: string;
    documentId: string;
    status: string;
    createdAt: Date;
    document: { fileName: string; version: string };
  },
): Job {
  const policyName =
    job.document.fileName
      .replace(/\.docx$/i, "")
      .replace(/[_\-]/g, " ")
      .trim() || "Untitled Policy";

  return {
    id: job.id,
    policyName,
    fileName: job.document.fileName,
    source: "Uploaded",
    version: job.document.version,
    status: job.status.toLowerCase() as Job["status"],
    complexity: "MEDIUM",
    createdAt: job.createdAt.toISOString(),
    currentUrl: `/api/documents/${job.documentId}`,
  };
}

export async function searchJobs(
  searchQuery: string,
  status: "backlog" | "processing" | "completed",
): Promise<Job[]> {
  const trimmed = searchQuery.trim().toLowerCase();
  const statusFilter =
    status === "backlog"
      ? { status: { in: [...BACKLOG_STATUSES] } }
      : { status: PrismaJobStatus[status.toUpperCase() as keyof typeof PrismaJobStatus] };

  const jobs = await prisma.job.findMany({
    where: {
      ...statusFilter,
      ...(trimmed
        ? {
            document: {
              fileName: {
                contains: trimmed,
                mode: "insensitive" as const,
              },
            },
          }
        : {}),
    },
    include: { document: true },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map(mapJobToUI);
}
