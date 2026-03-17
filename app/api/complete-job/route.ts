import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/lib/generated/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      documentId?: string;
      status?: string;
      analysis?: unknown;
    };
    const { documentId, status, analysis } = body;

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "documentId is required." },
        { status: 400 },
      );
    }

    const job = await prisma.job.findFirst({
      where: {
        documentId,
        status: JobStatus.PROCESSING,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not in processing." },
        { status: 404 },
      );
    }

    const isFailed = status?.toLowerCase() === "failed";

    if (isFailed) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.FAILED },
      });
      return NextResponse.json({ failed: true }, { status: 200 });
    }

    if (!Array.isArray(analysis)) {
      return NextResponse.json(
        { error: "analysis must be an array when status is not failed." },
        { status: 400 },
      );
    }

    const analysisJson = analysis as Prisma.InputJsonValue;
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.COMPLETED,
        analysis: analysisJson,
      },
    });

    return NextResponse.json({ completed: true }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/complete-job:", error);
    return NextResponse.json(
      { error: "Failed to complete job." },
      { status: 500 },
    );
  }
}
