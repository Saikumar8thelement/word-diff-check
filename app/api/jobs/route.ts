import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus as PrismaJobStatus } from "@/lib/generated/prisma/client";

const STATUS_MAP: Record<string, PrismaJobStatus> = {
  backlog: PrismaJobStatus.BACKLOG,
  processing: PrismaJobStatus.PROCESSING,
  completed: PrismaJobStatus.COMPLETED,
  failed: PrismaJobStatus.FAILED,
};

/** Backlog tab shows both BACKLOG and FAILED jobs */
const BACKLOG_STATUSES = [
  PrismaJobStatus.BACKLOG,
  PrismaJobStatus.FAILED,
] as const;

function mapJobToUI(
  job: { id: string; documentId: string; status: string; createdAt: Date; document: { fileName: string; version: string } },
) {
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
    status: job.status.toLowerCase(),
    complexity: "MEDIUM" as const,
    createdAt: job.createdAt.toISOString(),
    currentUrl: `/api/documents/${job.documentId}`,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status")?.toLowerCase();

    const statusFilter =
      statusParam === "backlog"
        ? { status: { in: [...BACKLOG_STATUSES] } }
        : statusParam && statusParam in STATUS_MAP
          ? { status: STATUS_MAP[statusParam] }
          : undefined;

    const jobs = await prisma.job.findMany({
      where: statusFilter,
      include: { document: true },
      orderBy: { createdAt: "desc" },
    });

    const mappedJobs = jobs.map(mapJobToUI);

    return NextResponse.json({ jobs: mappedJobs });
  } catch (error) {
    console.error("Error in GET /api/jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs." },
      { status: 500 },
    );
  }
}
