import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/lib/generated/prisma/client";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { jobIds?: string[] };
    const jobIds = body.jobIds;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds array is required and must not be empty." },
        { status: 400 },
      );
    }

    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        status: { in: [JobStatus.BACKLOG, JobStatus.FAILED] },
      },
      include: { document: true },
    });

    if (jobs.length === 0) {
      return NextResponse.json(
        { error: "No backlog or failed jobs found for the given IDs." },
        { status: 400 },
      );
    }

    const results: { jobId: string; documentId: string; success: boolean; error?: string }[] = [];

    for (const job of jobs) {
      try {
        const formData = new FormData();
        formData.append("documentId", job.documentId);
        formData.append("version", job.document.version);
        formData.append(
          "file",
          new Blob([job.document.fileData], { type: DOCX_MIME }),
          job.document.fileName,
        );

        const res = await fetch(`${API_URL}/start-job`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          results.push({
            jobId: job.id,
            documentId: job.documentId,
            success: false,
            error: `Python backend returned ${res.status}: ${errText}`,
          });
          continue;
        }

        results.push({
          jobId: job.id,
          documentId: job.documentId,
          success: true,
        });
      } catch (err) {
        results.push({
          jobId: job.id,
          documentId: job.documentId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const allFailed = results.every((r) => !r.success);
    if (allFailed) {
      return NextResponse.json(
        {
          error: "All jobs failed to start.",
          results,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        message: "Jobs sent to Python backend.",
        results,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error in POST /api/jobs/start:", error);
    return NextResponse.json(
      { error: "Failed to start jobs." },
      { status: 500 },
    );
  }
}
