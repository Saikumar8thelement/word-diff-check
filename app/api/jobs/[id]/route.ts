import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseName } from "@/lib/documentVersion";

async function hasPreviousVersion(
  fileName: string,
  version: string,
): Promise<boolean> {
  const currentVersion = parseInt(version, 10);
  if (Number.isNaN(currentVersion) || currentVersion <= 1) return false;
  const baseName = getBaseName(fileName);
  const prevVersion = String(currentVersion - 1);
  const prev = await prisma.document.findFirst({
    where: {
      version: prevVersion,
      OR: [
        { fileName: { startsWith: `${baseName}_v` } },
        { fileName: { startsWith: `${baseName}-v` } },
        { fileName: { startsWith: `${baseName}_` } },
        { fileName: { startsWith: `${baseName}-` } },
      ],
    },
  });
  return Boolean(prev);
}

function mapJobToUI(
  job: { id: string; documentId: string; status: string; createdAt: Date; analysis: unknown; document: { fileName: string; version: string } },
  hasPrevious: boolean,
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
    diffUrl: `/api/documents/${job.documentId}/diff`,
    hasPreviousVersion: hasPrevious,
    analysis: job.analysis ?? null,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { document: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const hasPrevious = await hasPreviousVersion(
    job.document.fileName,
    job.document.version,
  );
  return NextResponse.json({ job: mapJobToUI(job, hasPrevious) });
}
