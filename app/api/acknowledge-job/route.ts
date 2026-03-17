import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@/lib/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { documentId?: string };
    const documentId = body.documentId;

    if (!documentId || typeof documentId !== "string") {
      return NextResponse.json(
        { error: "documentId is required." },
        { status: 400 },
      );
    }

    const job = await prisma.job.findFirst({
      where: {
        documentId,
        status: JobStatus.BACKLOG,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not in backlog." },
        { status: 404 },
      );
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: JobStatus.PROCESSING },
    });

    return NextResponse.json({ acknowledged: true }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/acknowledge-job:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge job." },
      { status: 500 },
    );
  }
}
